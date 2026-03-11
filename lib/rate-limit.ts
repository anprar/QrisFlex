import { kv } from "@vercel/kv";

import { featureFlags } from "@/lib/env";

type Bucket = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __qrisflexRateLimit?: Map<string, Bucket>;
};

const memoryBuckets = globalForRateLimit.__qrisflexRateLimit ??= new Map();

export async function consumeRateLimit(options: {
  key: string;
  limit?: number;
  windowMs?: number;
  plan?: "free" | "pro";
}) {
  const limit = options.plan === "pro" ? Number.POSITIVE_INFINITY : options.limit ?? 100;
  const windowMs = options.windowMs ?? 60_000;

  if (limit === Number.POSITIVE_INFINITY) {
    return {
      allowed: true,
      remaining: "unlimited",
      resetAt: Date.now() + windowMs,
    };
  }

  const bucketId = `rate:${options.key}:${Math.floor(Date.now() / windowMs)}`;

  if (featureFlags.kv) {
    const current = await kv.incr(bucketId);

    if (current === 1) {
      await kv.expire(bucketId, Math.ceil(windowMs / 1000));
    }

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetAt: (Math.floor(Date.now() / windowMs) + 1) * windowMs,
    };
  }

  const existing = memoryBuckets.get(bucketId);
  const now = Date.now();

  if (!existing || existing.resetAt < now) {
    memoryBuckets.set(bucketId, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  existing.count += 1;
  memoryBuckets.set(bucketId, existing);

  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}
