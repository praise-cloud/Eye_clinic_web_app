/**
 * Rate limiting utilities for security
 * Prevents brute force attacks and API abuse
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs: number; // How long to block after exceeding limit
}

class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if an action is allowed for a given identifier
   * @param identifier - Unique identifier (email, IP, etc.)
   * @returns { allowed: boolean, resetTime?: number }
   */
  checkLimit(identifier: string): { allowed: boolean; resetTime?: number; remaining?: number } {
    const now = Date.now();
    const entry = this.storage.get(identifier);

    if (!entry) {
      // First attempt
      this.storage.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return { allowed: true, remaining: this.config.maxAttempts - 1 };
    }

    // Check if we're still in the block period
    const timeSinceLastAttempt = now - entry.lastAttempt;
    if (timeSinceLastAttempt < this.config.blockDurationMs && entry.count >= this.config.maxAttempts) {
      const blockEndTime = entry.lastAttempt + this.config.blockDurationMs;
      return { 
        allowed: false, 
        resetTime: blockEndTime,
        remaining: 0 
      };
    }

    // Check if we should reset the window
    const timeSinceFirstAttempt = now - entry.firstAttempt;
    if (timeSinceFirstAttempt > this.config.windowMs) {
      // Reset the window
      this.storage.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return { allowed: true, remaining: this.config.maxAttempts - 1 };
    }

    // Increment counter
    entry.count++;
    entry.lastAttempt = now;
    this.storage.set(identifier, entry);

    const remaining = Math.max(0, this.config.maxAttempts - entry.count);
    const allowed = entry.count <= this.config.maxAttempts;

    if (!allowed) {
      const blockEndTime = now + this.config.blockDurationMs;
      return { 
        allowed: false, 
        resetTime: blockEndTime,
        remaining: 0 
      };
    }

    return { allowed: true, remaining };
  }

  /**
   * Reset rate limit for a specific identifier
   */
  reset(identifier: string): void {
    this.storage.delete(identifier);
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now - entry.lastAttempt > this.config.windowMs + this.config.blockDurationMs) {
        this.storage.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters for different use cases
export const loginRateLimiter = new RateLimiter({
  maxAttempts: 10,          // 10 attempts allowed
  windowMs: 15 * 60 * 1000, // Within 15 minutes
  blockDurationMs: 15 * 60 * 1000 // Block for 15 minutes after exceeding
});

export const registrationRateLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  blockDurationMs: 60 * 60 * 1000 // 1 hour block
});

export const passwordResetRateLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  blockDurationMs: 60 * 60 * 1000 // 1 hour block
});

export const generalApiRateLimiter = new RateLimiter({
  maxAttempts: 100,
  windowMs: 60 * 1000, // 1 minute
  blockDurationMs: 5 * 60 * 1000 // 5 minutes block
});

// Clean up old entries every 5 minutes
setInterval(() => {
  loginRateLimiter.cleanup();
  registrationRateLimiter.cleanup();
  passwordResetRateLimiter.cleanup();
  generalApiRateLimiter.cleanup();
}, 5 * 60 * 1000);

/**
 * Format remaining time for display
 */
export function formatTimeRemaining(ms: number): string {
  const minutes = Math.ceil(ms / (1000 * 60));
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

/**
 * Create a rate-limited version of an async function
 */
export function withRateLimit<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  limiter: RateLimiter,
  getIdentifier: (...args: T) => string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const identifier = getIdentifier(...args);
    const result = limiter.checkLimit(identifier);
    
    if (!result.allowed) {
      const resetTime = result.resetTime ? result.resetTime - Date.now() : 0;
      const timeRemaining = formatTimeRemaining(resetTime);
      throw new Error(`Rate limit exceeded. Please try again in ${timeRemaining}.`);
    }
    
    return fn(...args);
  };
}
