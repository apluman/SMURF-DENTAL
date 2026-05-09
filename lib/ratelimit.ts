// WARNING: This in-memory store resets on every cold start in serverless environments (Vercel).
// For production, replace with Upstash Redis + @upstash/ratelimit.
const store = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  { maxAttempts = 5, windowMs = 15 * 60 * 1000 } = {}
): { allowed: boolean } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false };
  }

  entry.count++;
  return { allowed: true };
}
