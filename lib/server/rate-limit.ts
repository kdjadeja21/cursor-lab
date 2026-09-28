interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();
const CAPACITY = 30;
const REFILL_PER_SECOND = 0.5;
const SWEEP_AFTER_MS = 10 * 60 * 1000;

/**
 * Token bucket keyed by caller so the proxy cannot be driven as an open relay.
 * In-memory only, which is enough while a single process serves the app.
 */
export function consumeToken(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: CAPACITY, updatedAt: now };
  const elapsedSeconds = (now - bucket.updatedAt) / 1000;
  const tokens = Math.min(
    CAPACITY,
    bucket.tokens + elapsedSeconds * REFILL_PER_SECOND,
  );

  if (tokens < 1) {
    buckets.set(key, { tokens, updatedAt: now });
    return {
      allowed: false,
      retryAfter: Math.ceil((1 - tokens) / REFILL_PER_SECOND),
    };
  }

  buckets.set(key, { tokens: tokens - 1, updatedAt: now });

  if (buckets.size > 1000) {
    for (const [existingKey, existing] of buckets) {
      if (now - existing.updatedAt > SWEEP_AFTER_MS) buckets.delete(existingKey);
    }
  }

  return { allowed: true, retryAfter: 0 };
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}
