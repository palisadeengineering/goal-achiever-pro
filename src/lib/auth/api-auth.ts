// Secure API authentication utilities
// Use these functions in API routes instead of manually checking auth

import { createClient } from '@/lib/supabase/server';

export interface AuthResult {
  userId: string;
  isAuthenticated: true;
}

export interface AuthError {
  userId: null;
  isAuthenticated: false;
  error: string;
  status: number;
}

export type AuthCheck = AuthResult | AuthError;

/**
 * Securely get the authenticated user ID from a request.
 *
 * SECURITY: This function does NOT fall back to a demo user in production.
 * If no user is authenticated, it returns an error that should be sent to the client.
 *
 * Usage:
 * ```typescript
 * const auth = await getAuthenticatedUser();
 * if (!auth.isAuthenticated) {
 *   return NextResponse.json({ error: auth.error }, { status: auth.status });
 * }
 * const userId = auth.userId;
 * ```
 */
export async function getAuthenticatedUser(): Promise<AuthCheck> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      userId: null,
      isAuthenticated: false,
      error: 'Database connection failed',
      status: 500,
    };
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.error('Auth getUser failed:', {
      error: error?.message,
      errorCode: error?.code,
      hasUser: !!user,
    });

    return {
      userId: null,
      isAuthenticated: false,
      error: error?.message || 'Authentication required',
      status: 401,
    };
  }

  return { userId: user.id, isAuthenticated: true };
}

/**
 * Get the authenticated user ID, or null if not authenticated.
 * Use this ONLY for optional authentication scenarios.
 * For protected routes, use getAuthenticatedUser() instead.
 */
export async function getOptionalUserId(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

/**
 * Check if the authenticated user has admin privileges.
 * Returns the user ID and admin status.
 */
export async function getAuthenticatedAdmin(): Promise<AuthCheck & { isAdmin?: boolean }> {
  const auth = await getAuthenticatedUser();

  if (!auth.isAuthenticated) {
    return auth;
  }

  const supabase = await createClient();
  if (!supabase) {
    return {
      userId: null,
      isAuthenticated: false,
      error: 'Database connection failed',
      status: 500,
    };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', auth.userId)
    .single();

  if (error || !profile?.is_admin) {
    return {
      userId: null,
      isAuthenticated: false,
      error: 'Admin access required',
      status: 403,
    };
  }

  return { ...auth, isAdmin: true };
}
