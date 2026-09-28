import { NextResponse } from "next/server";
import { z } from "zod";
import { executeRequest } from "@/lib/server/execute";
import { clientKey, consumeToken } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

const DEFAULT_MAX_BYTES = 2_000_000;
const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 60_000;

const headerMap = z.record(z.string().min(1), z.string());

const specSchema = z.object({
  apiType: z.enum(["rest", "graphql"]),
  url: z.string().min(1),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  headers: headerMap.default({}),
  queryParams: headerMap.default({}),
  body: z.string().nullable().default(null),
  graphqlQuery: z.string().nullable().default(null),
  graphqlVariables: z.string().nullable().default(null),
  timeoutMs: z.number().int().min(MIN_TIMEOUT_MS).max(MAX_TIMEOUT_MS),
});

function maxResponseBytes() {
  const configured = Number(process.env.FETCHBOARD_MAX_RESPONSE_BYTES);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_MAX_BYTES;
}

/**
 * The app's own origin is allowlisted so the bundled demo endpoints work while
 * every other target still goes through the SSRF guard. Setting
 * FETCHBOARD_ALLOW_PRIVATE_HOSTS additionally trusts localhost during local
 * development.
 */
function allowedHosts(request: Request): string[] {
  const hosts: string[] = [];
  const host = request.headers.get("host");
  if (host) hosts.push(host);
  if (process.env.FETCHBOARD_ALLOW_PRIVATE_HOSTS === "true") {
    hosts.push("localhost", "127.0.0.1");
    if (host) {
      const port = host.split(":")[1];
      if (port) hosts.push(`localhost:${port}`, `127.0.0.1:${port}`);
    }
  }
  return hosts;
}

export async function POST(request: Request) {
  const limit = consumeToken(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Slow down and try again shortly." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const parsed = specSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "The request configuration is incomplete or invalid." },
      { status: 400 },
    );
  }

  const outcome = await executeRequest(parsed.data, {
    allowedHosts: allowedHosts(request),
    maxBytes: maxResponseBytes(),
  });

  // Nothing about the request is logged: headers and bodies carry credentials.
  return NextResponse.json(outcome, {
    status: 200,
    headers: { "cache-control": "no-store" },
  });
}
