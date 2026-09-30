import dns from "node:dns/promises";
import net from "node:net";

export const ALLOWED_PROTOCOLS = ["http:", "https:"];

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

interface Ipv4Range {
  /** Dotted-quad network address. */
  network: string;
  bits: number;
  reason: string;
}

const BLOCKED_IPV4: Ipv4Range[] = [
  { network: "0.0.0.0", bits: 8, reason: "unspecified range" },
  { network: "10.0.0.0", bits: 8, reason: "private network" },
  { network: "100.64.0.0", bits: 10, reason: "carrier-grade NAT range" },
  { network: "127.0.0.0", bits: 8, reason: "loopback" },
  { network: "169.254.0.0", bits: 16, reason: "link-local or cloud metadata" },
  { network: "172.16.0.0", bits: 12, reason: "private network" },
  { network: "192.0.0.0", bits: 24, reason: "IETF protocol assignments" },
  { network: "192.0.2.0", bits: 24, reason: "documentation range" },
  { network: "192.88.99.0", bits: 24, reason: "6to4 relay anycast" },
  { network: "192.168.0.0", bits: 16, reason: "private network" },
  { network: "198.18.0.0", bits: 15, reason: "benchmarking range" },
  { network: "198.51.100.0", bits: 24, reason: "documentation range" },
  { network: "203.0.113.0", bits: 24, reason: "documentation range" },
  { network: "224.0.0.0", bits: 4, reason: "multicast range" },
  { network: "240.0.0.0", bits: 4, reason: "reserved range" },
];

function ipv4ToInt(address: string): number | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value;
}

function blockedIpv4Reason(address: string): string | null {
  const value = ipv4ToInt(address);
  if (value === null) return "malformed IPv4 address";
  if (value === 0xffffffff) return "broadcast address";
  for (const range of BLOCKED_IPV4) {
    const base = ipv4ToInt(range.network);
    if (base === null) continue;
    const mask = range.bits === 0 ? 0 : (-1 << (32 - range.bits)) >>> 0;
    if ((value & mask) === (base & mask)) return range.reason;
  }
  return null;
}

function expandIpv6(address: string): number[] | null {
  const zoneless = address.split("%")[0].toLowerCase();
  const [head, tail] = zoneless.split("::");
  const parseGroups = (segment: string): number[] | null => {
    if (!segment) return [];
    const groups: number[] = [];
    for (const part of segment.split(":")) {
      if (part.includes(".")) {
        const value = ipv4ToInt(part);
        if (value === null) return null;
        groups.push((value >>> 16) & 0xffff, value & 0xffff);
        continue;
      }
      if (!/^[0-9a-f]{1,4}$/.test(part)) return null;
      groups.push(Number.parseInt(part, 16));
    }
    return groups;
  };

  const headGroups = parseGroups(head ?? "");
  if (headGroups === null) return null;
  if (tail === undefined) return headGroups.length === 8 ? headGroups : null;
  const tailGroups = parseGroups(tail);
  if (tailGroups === null) return null;
  const fill = 8 - headGroups.length - tailGroups.length;
  if (fill < 0) return null;
  return [...headGroups, ...Array<number>(fill).fill(0), ...tailGroups];
}

function blockedIpv6Reason(address: string): string | null {
  const groups = expandIpv6(address);
  if (!groups) return "malformed IPv6 address";

  // IPv4-mapped and IPv4-translated addresses are checked against IPv4 rules.
  const isMapped =
    groups.slice(0, 5).every((group) => group === 0) &&
    (groups[5] === 0xffff || groups[5] === 0);
  if (isMapped && (groups[6] !== 0 || groups[7] !== 0)) {
    const embedded = [
      (groups[6] >>> 8) & 0xff,
      groups[6] & 0xff,
      (groups[7] >>> 8) & 0xff,
      groups[7] & 0xff,
    ].join(".");
    return blockedIpv4Reason(embedded);
  }

  if (groups.every((group) => group === 0)) return "unspecified address";
  if (groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1) {
    return "loopback";
  }
  if ((groups[0] & 0xfe00) === 0xfc00) return "unique local address";
  if ((groups[0] & 0xffc0) === 0xfe80) return "link-local address";
  if ((groups[0] & 0xff00) === 0xff00) return "multicast range";
  if (groups[0] === 0x64 && groups[1] === 0xff9b) return "NAT64 range";
  if (groups[0] === 0x2002) return "6to4 range";
  return null;
}

/** Returns a human-readable reason when the address must not be contacted. */
export function blockedAddressReason(address: string): string | null {
  if (net.isIPv4(address)) return blockedIpv4Reason(address);
  if (net.isIPv6(address)) return blockedIpv6Reason(address);
  return "unrecognized IP address";
}

export interface GuardOptions {
  /**
   * Hosts that bypass the private-address checks. The app passes its own origin
   * so the bundled demo endpoints remain reachable.
   */
  allowedHosts?: string[];
}

function hostIsAllowlisted(url: URL, options: GuardOptions) {
  const allowed = options.allowedHosts ?? [];
  return allowed.some((host) => host.toLowerCase() === url.host.toLowerCase());
}

export function parseTargetUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("Enter a valid absolute URL.");
  }
  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    throw new UnsafeUrlError(
      `Only http and https URLs are supported (received ${url.protocol}).`,
    );
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError(
      "Credentials in the URL are not supported. Use the authentication options instead.",
    );
  }
  return url;
}

/**
 * Resolves the hostname and rejects the request unless every resolved address
 * is publicly routable. Called again for each redirect hop, and again from the
 * pinned socket lookup, so a rebinding DNS answer cannot slip through.
 */
export async function assertSafeUrl(
  rawUrl: string,
  options: GuardOptions = {},
): Promise<{ url: URL; addresses: string[] }> {
  const url = parseTargetUrl(rawUrl);

  if (hostIsAllowlisted(url, options)) {
    return { url, addresses: [] };
  }

  const literal = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(literal)) {
    const reason = blockedAddressReason(literal);
    if (reason) {
      throw new UnsafeUrlError(`Requests to ${literal} are blocked (${reason}).`);
    }
    return { url, addresses: [literal] };
  }

  let resolved: { address: string }[];
  try {
    resolved = await dns.lookup(url.hostname, { all: true, verbatim: true });
  } catch {
    throw new UnsafeUrlError(`Could not resolve host ${url.hostname}.`);
  }
  if (resolved.length === 0) {
    throw new UnsafeUrlError(`Host ${url.hostname} did not resolve.`);
  }

  for (const entry of resolved) {
    const reason = blockedAddressReason(entry.address);
    if (reason) {
      throw new UnsafeUrlError(
        `Host ${url.hostname} resolves to a blocked address (${reason}).`,
      );
    }
  }

  return { url, addresses: resolved.map((entry) => entry.address) };
}

export function isAddressAllowed(address: string) {
  return blockedAddressReason(address) === null;
}
