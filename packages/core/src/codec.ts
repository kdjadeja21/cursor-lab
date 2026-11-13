import { deflateSync, inflateSync } from "node:zlib";
import { canonicalJson } from "./canonical.js";
import { SeedlayerError } from "./errors.js";
import { parseConfig, type SeedlayerConfig } from "./schema.js";

const PREFIX = "sl1.";

export function encodeConfig(config: SeedlayerConfig): string {
  const parsed = parseConfig(config);
  const compressed = deflateSync(Buffer.from(canonicalJson(parsed), "utf8"));
  return `${PREFIX}${compressed.toString("base64url")}`;
}

export function decodeConfig(code: string): SeedlayerConfig {
  const trimmed = code.trim();
  if (!trimmed.startsWith(PREFIX)) {
    throw new SeedlayerError("Config code must start with sl1.");
  }
  let json: string;
  try {
    json = inflateSync(Buffer.from(trimmed.slice(PREFIX.length), "base64url")).toString("utf8");
  } catch {
    throw new SeedlayerError("Config code is not valid compressed JSON.");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(json) as unknown;
  } catch {
    throw new SeedlayerError("Config code did not contain JSON.");
  }
  return parseConfig(raw);
}
