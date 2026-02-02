// Secure OAuth state management with HMAC signing
// Prevents state parameter forgery attacks

import { createHmac, randomBytes } from 'crypto';

// Use a secret for signing - falls back to service role key if not explicitly set
const STATE_SECRET = process.env.OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

interface OAuthStatePayload {
  userId: string;
  timestamp: number;
  nonce: string;
}

/**
 * Creates a cryptographically signed OAuth state parameter.
 * The state contains the userId and timestamp, signed with HMAC-SHA256.
 *
 * Format: base64url(payload).base64url(signature)
 */
export function createSecureOAuthState(userId: string): string {
  if (!STATE_SECRET) {
    throw new Error('OAuth state secret is not configured');
  }

  const payload: OAuthStatePayload = {
    userId,
    timestamp: Date.now(),
    nonce: randomBytes(16).toString('hex'),
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', STATE_SECRET)
    .update(payloadStr)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

/**
 * Verifies and decodes a signed OAuth state parameter.
 * Returns the payload if valid, or null if invalid/expired.
 *
 * @param state - The state parameter from the OAuth callback
 * @param maxAgeMs - Maximum age in milliseconds (default: 10 minutes)
 */
export function verifyOAuthState(
  state: string,
  maxAgeMs: number = 10 * 60 * 1000
): OAuthStatePayload | null {
  if (!STATE_SECRET) {
    console.error('OAuth state secret is not configured');
    return null;
  }

  const parts = state.split('.');
  if (parts.length !== 2) {
    console.error('Invalid OAuth state format: missing signature');
    return null;
  }

  const [payloadStr, signature] = parts;

  // Verify signature using constant-time comparison
  const expectedSignature = createHmac('sha256', STATE_SECRET)
    .update(payloadStr)
    .digest('base64url');

  if (!timingSafeEqual(signature, expectedSignature)) {
    console.error('Invalid OAuth state: signature mismatch');
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString()
    ) as OAuthStatePayload;

    // Verify timestamp
    if (Date.now() - payload.timestamp > maxAgeMs) {
      console.error('OAuth state expired');
      return null;
    }

    // Validate required fields
    if (!payload.userId || typeof payload.userId !== 'string') {
      console.error('Invalid OAuth state: missing userId');
      return null;
    }

    return payload;
  } catch (e) {
    console.error('Failed to parse OAuth state payload:', e);
    return null;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
