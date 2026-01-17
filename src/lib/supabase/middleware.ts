// Supabase middleware for session management

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, skip auth checks and allow all requests
  // WARNING: This should only happen during build time or when env vars are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    // In production, log a warning if Supabase is not configured
    if (process.env.NODE_ENV === 'production') {
      console.error('SECURITY WARNING: Supabase not configured in production!');
    }
    return NextResponse.next({ request });
  }

  // SECURITY: Demo mode is controlled ONLY by a server-side env var (not NEXT_PUBLIC_)
  // This ensures it cannot be enabled by client-side manipulation
  // NEVER enable demo mode in production - it bypasses all authentication
  const isDemoMode = process.env.DEMO_MODE_ENABLED === 'true' && process.env.NODE_ENV !== 'production';
  if (isDemoMode) {
    console.warn('SECURITY WARNING: Demo mode is enabled - authentication bypassed');
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedPaths = [
    '/dashboard',
    '/vision',
    '/goals',
    '/mins',
    '/time-audit',
    '/drip',
    '/routines',
    '/pomodoro',
    '/reviews',
    '/leverage',
    '/network',
    '/metrics',
    '/analytics',
    '/accountability',
    '/settings',
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages (except reset-password which needs session)
  const authPaths = ['/login', '/signup', '/forgot-password'];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isAuthPath && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
