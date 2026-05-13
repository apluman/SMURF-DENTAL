import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback for local dev (no Upstash env vars)
const localStore = new Map<string, { count: number; resetAt: number }>();

function checkLocal(
  key: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = localStore.get(key);
  if (!entry || now > entry.resetAt) {
    localStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxAttempts) return false;
  entry.count++;
  return true;
}

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "smurf-dental",
  });
  return ratelimit;
}

export async function checkRateLimit(
  key: string,
  { maxAttempts = 5, windowMs = 15 * 60 * 1000 } = {}
): Promise<{ allowed: boolean }> {
  const rl = getRatelimit();

  if (!rl) {
    return { allowed: checkLocal(key, maxAttempts, windowMs) };
  }

  const { success } = await rl.limit(key);
  return { allowed: success };
}
