// Simple in-memory rate limiting utility
// For production, consider using Redis or Upstash

import { NextResponse } from 'next/server';
import type { SubscriptionTier } from '@/types/database';

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitConfig {
  /** Unique identifier for this rate limit */
  name: string;
  /** Maximum requests allowed in window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
  /** Results from each applied rate limit (for multiple limits) */
  limits?: Array<{
    name: string;
    remaining: number;
    resetIn: number;
  }>;
}

/**
 * Check and apply rate limit for a given key
 * @param key - Unique identifier (e.g., IP address, user ID)
 * @param options - Rate limit configuration
 */
export function rateLimit(
  key: string,
  options: RateLimitOptions = { limit: 60, windowMs: 60000 }
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // Start new window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      success: true,
      remaining: options.limit - 1,
      resetIn: options.windowMs,
    };
  }

  if (record.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      resetIn: record.resetTime - now,
    };
  }

  record.count++;
  return {
    success: true,
    remaining: options.limit - record.count,
    resetIn: record.resetTime - now,
  };
}

/**
 * Apply multiple rate limits and return combined result
 * All limits must pass for the request to succeed
 */
export function applyMultipleRateLimits(
  key: string,
  configs: RateLimitConfig[]
): RateLimitResult {
  const limitResults: Array<{ name: string; remaining: number; resetIn: number }> = [];
  let overallSuccess = true;
  let minRemaining = Infinity;
  let maxResetIn = 0;

  for (const config of configs) {
    const limitKey = `${key}:${config.name}`;
    const result = rateLimit(limitKey, { limit: config.limit, windowMs: config.windowMs });

    limitResults.push({
      name: config.name,
      remaining: result.remaining,
      resetIn: result.resetIn,
    });

    if (!result.success) {
      overallSuccess = false;
    }

    minRemaining = Math.min(minRemaining, result.remaining);
    maxResetIn = Math.max(maxResetIn, result.resetIn);
  }

  return {
    success: overallSuccess,
    remaining: minRemaining === Infinity ? 0 : minRemaining,
    resetIn: maxResetIn,
    limits: limitResults,
  };
}

/**
 * Create a 429 Too Many Requests response
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const resetInSeconds = Math.ceil(result.resetIn / 1000);

  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${resetInSeconds} seconds.`,
      retryAfter: resetInSeconds,
    },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    }
  );
}

/**
 * Generate rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000)),
    'Retry-After': String(Math.ceil(result.resetIn / 1000)),
  };
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0]?.trim() || realIp || 'anonymous';
}

/**
 * Rate limit presets for different use cases
 */
export const RateLimitPresets = {
  // Standard API: 60 requests per minute
  standard: { limit: 60, windowMs: 60000 },
  // Auth endpoints: 10 requests per minute
  auth: { limit: 10, windowMs: 60000 },
  // AI endpoints: 20 requests per minute
  ai: { limit: 20, windowMs: 60000 },
  // Strict: 5 requests per minute
  strict: { limit: 5, windowMs: 60000 },
} as const;

/**
 * Rate limit configurations for different use cases
 * Used with applyMultipleRateLimits()
 */
export const RateLimits = {
  ai: {
    /** Light AI limit: 30 requests per minute (for quick suggestions) */
    light: { name: 'ai-light', limit: 30, windowMs: 60000 } as RateLimitConfig,
    /** Standard AI limit: 20 requests per minute */
    standard: { name: 'ai-standard', limit: 20, windowMs: 60000 } as RateLimitConfig,
    /** Heavy AI limit: 10 requests per minute (for complex generation) */
    heavy: { name: 'ai-heavy', limit: 10, windowMs: 60000 } as RateLimitConfig,
    /** Daily AI limit: 100 requests per day */
    daily: { name: 'ai-daily', limit: 100, windowMs: 24 * 60 * 60 * 1000 } as RateLimitConfig,
    /** Burst AI limit: 5 requests per 10 seconds */
    burst: { name: 'ai-burst', limit: 5, windowMs: 10000 } as RateLimitConfig,
  },
  auth: {
    /** Auth standard: 10 requests per minute */
    standard: { name: 'auth-standard', limit: 10, windowMs: 60000 } as RateLimitConfig,
    /** Auth strict: 3 requests per minute (for password resets, etc.) */
    strict: { name: 'auth-strict', limit: 3, windowMs: 60000 } as RateLimitConfig,
  },
  api: {
    /** General API: 60 requests per minute */
    standard: { name: 'api-standard', limit: 60, windowMs: 60000 } as RateLimitConfig,
    /** Heavy operations: 10 requests per minute */
    heavy: { name: 'api-heavy', limit: 10, windowMs: 60000 } as RateLimitConfig,
  },
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Tier-based daily AI limits. Distinct names so upgrading mid-day gives fresh quota. */
export const TierDailyLimits: Record<SubscriptionTier, RateLimitConfig> = {
  free: { name: 'ai-daily-free', limit: 10, windowMs: DAY_MS },
  pro: { name: 'ai-daily-pro', limit: 100, windowMs: DAY_MS },
  elite: { name: 'ai-daily-elite', limit: 500, windowMs: DAY_MS },
  founding_member: { name: 'ai-daily-founding', limit: 500, windowMs: DAY_MS },
};

/**
 * Get rate limit configs for an AI endpoint based on subscription tier.
 * Returns the per-minute weight limit + the tier-appropriate daily limit.
 */
export function getAIRateLimits(
  tier: SubscriptionTier,
  weight: 'light' | 'standard' | 'heavy'
): RateLimitConfig[] {
  return [
    RateLimits.ai[weight],
    TierDailyLimits[tier],
  ];
}
