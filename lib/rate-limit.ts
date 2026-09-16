// In-memory sliding-window rate limiter for sensitive vault operations (login, registration)

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks and increments rate limit for a specific key (e.g. IP + action or userId).
 * @param key Unique key to rate limit (e.g. "login:127.0.0.1")
 * @param maxAttempts Maximum allowed attempts within the window (default 5)
 * @param windowSeconds Duration of window in seconds (default 60s)
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // New or expired window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowSeconds * 1000,
    });

    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetInSeconds: windowSeconds,
    };
  }

  // Active window
  record.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

  if (record.count > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetInSeconds,
  };
}

/**
 * Resets rate limit for a specific key upon successful login
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
