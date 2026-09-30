import { lookup as dnsLookup } from "node:dns";
import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";
import {
  assertSafeUrl,
  isAddressAllowed,
  UnsafeUrlError,
} from "./ssrf.ts";

export const MAX_REDIRECTS = 3;

export interface ExecuteSpec {
  apiType: "rest" | "graphql";
  url: string;
  method: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string | null;
  graphqlQuery: string | null;
  graphqlVariables: string | null;
  timeoutMs: number;
}

export interface ExecuteOptions {
  allowedHosts: string[];
  maxBytes: number;
}

export interface ExecuteOutcome {
  ok: boolean;
  status: number | null;
  statusText: string | null;
  durationMs: number;
  sizeBytes: number | null;
  contentType: string | null;
  data: unknown;
  error: string | null;
}

interface HopResult {
  status: number;
  statusText: string;
  location: string | null;
  contentType: string | null;
  bytes: number;
  text: string;
}

class ExecutionError extends Error {}

/**
 * Resolves through the same guard the pre-flight check uses, so the address the
 * socket actually connects to is verified rather than merely the one we looked
 * up a moment earlier.
 */
const pinnedLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
    if (error) {
      callback(error, "", 0);
      return;
    }
    const safe = addresses.filter((entry) => isAddressAllowed(entry.address));
    if (safe.length === 0) {
      callback(
        new UnsafeUrlError(
          `Host ${hostname} resolves only to blocked addresses.`,
        ),
        "",
        0,
      );
      return;
    }
    if (options.all) {
      (callback as unknown as (err: null, addresses: typeof safe) => void)(
        null,
        safe,
      );
      return;
    }
    callback(null, safe[0].address, safe[0].family);
  });
};

function requestOnce(
  url: URL,
  method: string,
  headers: Record<string, string>,
  body: string | null,
  timeoutMs: number,
  maxBytes: number,
  pinLookup: boolean,
): Promise<HopResult> {
  const transport = url.protocol === "https:" ? https : http;

  return new Promise<HopResult>((resolve, reject) => {
    const request = transport.request(
      url,
      {
        method,
        headers,
        lookup: pinLookup ? pinnedLookup : undefined,
      },
      (response) => {
        const chunks: Buffer[] = [];
        let bytes = 0;
        let aborted = false;

        response.on("data", (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > maxBytes) {
            aborted = true;
            response.destroy();
            request.destroy();
            reject(
              new ExecutionError(
                `Response exceeded the ${Math.round(maxBytes / 1000)} kB limit. Narrow the request or paginate the endpoint.`,
              ),
            );
            return;
          }
          chunks.push(chunk);
        });

        response.on("end", () => {
          if (aborted) return;
          const location = response.headers.location;
          resolve({
            status: response.statusCode ?? 0,
            statusText: response.statusMessage ?? "",
            location: typeof location === "string" ? location : null,
            contentType: response.headers["content-type"] ?? null,
            bytes,
            text: Buffer.concat(chunks).toString("utf8"),
          });
        });

        response.on("error", (error: Error) => {
          if (!aborted) reject(error);
        });
      },
    );

    request.setTimeout(timeoutMs, () => {
      request.destroy(
        new ExecutionError(`Request timed out after ${timeoutMs} ms.`),
      );
    });

    request.on("error", (error: Error) => reject(error));

    if (body !== null) request.write(body);
    request.end();
  });
}

function buildUrl(spec: ExecuteSpec): string {
  const url = new URL(spec.url);
  for (const [key, value] of Object.entries(spec.queryParams)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function buildBody(spec: ExecuteSpec): { body: string | null; json: boolean } {
  if (spec.apiType === "graphql") {
    let variables: unknown = undefined;
    if (spec.graphqlVariables) {
      try {
        variables = JSON.parse(spec.graphqlVariables);
      } catch {
        throw new ExecutionError("GraphQL variables must be valid JSON.");
      }
    }
    return {
      body: JSON.stringify({
        query: spec.graphqlQuery ?? "",
        ...(variables === undefined ? {} : { variables }),
      }),
      json: true,
    };
  }
  if (spec.body === null) return { body: null, json: false };
  return { body: spec.body, json: true };
}

function headerKeyEquals(headers: Record<string, string>, name: string) {
  return Object.keys(headers).some(
    (key) => key.toLowerCase() === name.toLowerCase(),
  );
}

function parseJsonBody(
  text: string,
  contentType: string | null,
): { data: unknown; error: string | null } {
  if (text.trim().length === 0) {
    return { data: null, error: null };
  }
  try {
    return { data: JSON.parse(text), error: null };
  } catch {
    const kind = contentType?.split(";")[0] ?? "an unknown content type";
    return {
      data: null,
      error: `The endpoint returned ${kind} rather than JSON, so Fetchboard cannot build widgets from it.`,
    };
  }
}

/**
 * Executes a user-supplied request server-side: guards the target, pins the
 * connection, follows a bounded number of re-validated redirects, and caps the
 * response size.
 */
export async function executeRequest(
  spec: ExecuteSpec,
  options: ExecuteOptions,
): Promise<ExecuteOutcome> {
  const startedAt = Date.now();
  const deadline = startedAt + spec.timeoutMs;

  try {
    const { body, json } = buildBody(spec);
    const headers: Record<string, string> = { ...spec.headers };
    if (json && !headerKeyEquals(headers, "content-type")) {
      headers["content-type"] = "application/json";
    }
    if (!headerKeyEquals(headers, "accept")) {
      headers.accept = "application/json, */*;q=0.8";
    }
    headers["accept-encoding"] = "identity";
    headers["user-agent"] = "Fetchboard/1.0";

    let currentUrl = buildUrl(spec);
    let currentMethod = spec.apiType === "graphql" ? "POST" : spec.method;
    let currentBody = body;
    let currentHeaders = headers;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      const { url } = await assertSafeUrl(currentUrl, {
        allowedHosts: options.allowedHosts,
      });
      const isAllowlisted = options.allowedHosts.some(
        (host) => host.toLowerCase() === url.host.toLowerCase(),
      );

      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        throw new ExecutionError(
          `Request timed out after ${spec.timeoutMs} ms.`,
        );
      }

      if (currentBody !== null) {
        currentHeaders = {
          ...currentHeaders,
          "content-length": String(Buffer.byteLength(currentBody)),
        };
      }

      const hopResult = await requestOnce(
        url,
        currentMethod,
        currentHeaders,
        currentBody,
        remaining,
        options.maxBytes,
        !isAllowlisted,
      );

      const isRedirect =
        hopResult.status >= 300 &&
        hopResult.status < 400 &&
        hopResult.location !== null;

      if (isRedirect) {
        if (hop === MAX_REDIRECTS) {
          throw new ExecutionError(
            `Too many redirects (limit ${MAX_REDIRECTS}).`,
          );
        }
        const nextUrl = new URL(hopResult.location as string, url);
        if (nextUrl.host.toLowerCase() !== url.host.toLowerCase()) {
          // Never forward credentials to a host the user did not configure.
          currentHeaders = Object.fromEntries(
            Object.entries(currentHeaders).filter(
              ([key]) =>
                !["authorization", "cookie"].includes(key.toLowerCase()),
            ),
          );
        }
        if (hopResult.status !== 307 && hopResult.status !== 308) {
          currentMethod = "GET";
          currentBody = null;
          currentHeaders = Object.fromEntries(
            Object.entries(currentHeaders).filter(
              ([key]) => key.toLowerCase() !== "content-length",
            ),
          );
        }
        currentUrl = nextUrl.toString();
        continue;
      }

      const parsed = parseJsonBody(hopResult.text, hopResult.contentType);
      const httpOk = hopResult.status >= 200 && hopResult.status < 300;
      const errorMessage = !httpOk
        ? `The endpoint responded with ${hopResult.status} ${hopResult.statusText}.`.trim()
        : parsed.error;

      return {
        ok: httpOk && parsed.error === null,
        status: hopResult.status,
        statusText: hopResult.statusText,
        durationMs: Date.now() - startedAt,
        sizeBytes: hopResult.bytes,
        contentType: hopResult.contentType,
        data: parsed.data,
        error: errorMessage,
      };
    }

    throw new ExecutionError("Request could not be completed.");
  } catch (error) {
    return {
      ok: false,
      status: null,
      statusText: null,
      durationMs: Date.now() - startedAt,
      sizeBytes: null,
      contentType: null,
      data: null,
      error: describeError(error),
    };
  }
}

function describeError(error: unknown): string {
  if (error instanceof UnsafeUrlError || error instanceof ExecutionError) {
    return error.message;
  }
  if (error instanceof Error) {
    const code = (error as NodeJS.ErrnoException).code;
    switch (code) {
      case "ENOTFOUND":
      case "EAI_AGAIN":
        return "The host could not be resolved. Check the URL.";
      case "ECONNREFUSED":
        return "The connection was refused by the endpoint.";
      case "ECONNRESET":
        return "The connection was reset before a response arrived.";
      case "CERT_HAS_EXPIRED":
      case "ERR_TLS_CERT_ALTNAME_INVALID":
      case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
        return `The endpoint's TLS certificate could not be verified (${code}).`;
      default:
        return error.message || "The request failed.";
    }
  }
  return "The request failed for an unknown reason.";
}
