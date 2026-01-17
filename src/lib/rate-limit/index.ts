/**
 * Rate Limiting Utility for API Endpoints
 *
 * This provides in-memory rate limiting using a sliding window algorithm.
 * For production with serverless/multiple instances, upgrade to Upstash Redis:
 *
 * npm install @upstash/ratelimit @upstash/redis
 *
 * Then replace the in-memory implementation with:
 * import { Ratelimit } from '@upstash/ratelimit';
 * import { Redis } from '@upstash/redis';
 */

import { NextResponse } from 'next/server';

// In-memory storage for rate limits
// Key format: `${identifier}:${windowKey}`
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
  /** Identifier prefix for different rate limit types */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the limit resets
  retryAfter?: number; // Seconds until they can retry (only if rate limited)
}

/**
 * Check rate limit for a given identifier (usually user ID or IP)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const { limit, windowSeconds, prefix = 'default' } = config;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowKey = Math.floor(now / windowMs);
  const key = `${prefix}:${identifier}:${windowKey}`;
  const resetAt = (windowKey + 1) * windowMs;

  const current = rateLimitStore.get(key);

  if (!current) {
    // First request in this window
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.floor(resetAt / 1000),
    };
  }

  if (current.count >= limit) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((resetAt - now) / 1000);
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.floor(resetAt / 1000),
      retryAfter,
    };
  }

  // Increment count
  current.count++;
  rateLimitStore.set(key, current);

  return {
    success: true,
    limit,
    remaining: limit - current.count,
    reset: Math.floor(resetAt / 1000),
  };
}

/**
 * Create rate limit headers for the response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests. Please try again later.',
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    }
  );
}

// Predefined rate limit configurations for different use cases
export const RateLimits = {
  // AI endpoints - expensive operations
  ai: {
    // Standard AI generation (SMART goals, power goals, etc.)
    standard: {
      limit: 10,
      windowSeconds: 60, // 10 requests per minute
      prefix: 'ai:standard',
    } as RateLimitConfig,

    // Heavy AI generation (backtrack plans, strategic discovery)
    heavy: {
      limit: 5,
      windowSeconds: 60, // 5 requests per minute
      prefix: 'ai:heavy',
    } as RateLimitConfig,

    // Suggestions and quick AI calls
    light: {
      limit: 20,
      windowSeconds: 60, // 20 requests per minute
      prefix: 'ai:light',
    } as RateLimitConfig,

    // Daily limit for AI (prevent abuse)
    daily: {
      limit: 100,
      windowSeconds: 86400, // 100 requests per day
      prefix: 'ai:daily',
    } as RateLimitConfig,
  },

  // Auth endpoints
  auth: {
    login: {
      limit: 5,
      windowSeconds: 60, // 5 attempts per minute
      prefix: 'auth:login',
    } as RateLimitConfig,

    signup: {
      limit: 3,
      windowSeconds: 60, // 3 attempts per minute
      prefix: 'auth:signup',
    } as RateLimitConfig,

    passwordReset: {
      limit: 3,
      windowSeconds: 300, // 3 attempts per 5 minutes
      prefix: 'auth:reset',
    } as RateLimitConfig,
  },

  // General API endpoints
  api: {
    standard: {
      limit: 60,
      windowSeconds: 60, // 60 requests per minute
      prefix: 'api:standard',
    } as RateLimitConfig,

    write: {
      limit: 30,
      windowSeconds: 60, // 30 write operations per minute
      prefix: 'api:write',
    } as RateLimitConfig,
  },
} as const;

/**
 * Helper function to apply rate limiting in an API route
 *
 * Usage:
 * ```typescript
 * const rateLimitResult = await applyRateLimit(userId, RateLimits.ai.standard);
 * if (!rateLimitResult.success) {
 *   return rateLimitExceededResponse(rateLimitResult);
 * }
 * // ... rest of the handler
 * ```
 */
export function applyRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  return checkRateLimit(identifier, config);
}

/**
 * Apply multiple rate limits (e.g., per-minute AND daily limit)
 * Returns the most restrictive result
 */
export function applyMultipleRateLimits(
  identifier: string,
  configs: RateLimitConfig[]
): RateLimitResult {
  let mostRestrictive: RateLimitResult | null = null;

  for (const config of configs) {
    const result = checkRateLimit(identifier, config);

    if (!result.success) {
      // If any limit is exceeded, return immediately
      return result;
    }

    // Track the most restrictive (lowest remaining)
    if (!mostRestrictive || result.remaining < mostRestrictive.remaining) {
      mostRestrictive = result;
    }
  }

  return mostRestrictive!;
}
