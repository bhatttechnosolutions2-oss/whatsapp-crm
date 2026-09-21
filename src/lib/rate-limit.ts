/**
 * Lightweight in-memory rate limiter with sliding window for API route handlers.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Check if an identifier exceeds the rate limit.
 * @param identifier Unique key (e.g., IP address or IP + endpoint)
 * @param limit Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns { success: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60 * 1000
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = rateLimitStore.get(identifier);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}
