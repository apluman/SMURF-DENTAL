import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback for local dev or if Upstash is unavailable
const localStore = new Map<string, { count: number; resetAt: number }>();

function checkLocal(key: string, maxAttempts: number, windowMs: number): boolean {
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

function buildRatelimit(): Ratelimit | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    return new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "smurf-dental",
    });
  } catch {
    return null;
  }
}

export async function checkRateLimit(
  key: string,
  { maxAttempts = 5, windowMs = 15 * 60 * 1000 } = {}
): Promise<{ allowed: boolean }> {
  // Build fresh each call so KV-loaded env vars are always picked up
  const rl = buildRatelimit();

  if (!rl) {
    return { allowed: checkLocal(key, maxAttempts, windowMs) };
  }

  try {
    const { success } = await rl.limit(key);
    return { allowed: success };
  } catch (err) {
    console.warn("[ratelimit] Upstash error, falling back to in-memory:", err);
    return { allowed: checkLocal(key, maxAttempts, windowMs) };
  }
}
