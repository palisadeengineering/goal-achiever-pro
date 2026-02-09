import { createClient } from '@/lib/supabase/server';
import { ensureProfile } from '@/lib/auth/ensure-profile';
import { NextResponse } from 'next/server';

// Validate redirect path using whitelist to prevent open redirect attacks
const SAFE_REDIRECT_PREFIXES = [
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
  '/analytics',
  '/settings',
  '/today',
];

function getSafeRedirect(redirectParam: string | null): string {
  const defaultRedirect = '/dashboard';

  if (!redirectParam) {
    return defaultRedirect;
  }

  // Whitelist approach: only allow known dashboard paths
  if (SAFE_REDIRECT_PREFIXES.some(prefix => redirectParam === prefix || redirectParam.startsWith(prefix + '/'))) {
    return redirectParam;
  }

  return defaultRedirect;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = getSafeRedirect(searchParams.get('redirect'));

  if (code) {
    const supabase = await createClient();

    // If Supabase is not configured, redirect to dashboard (demo mode)
    if (!supabase) {
      return NextResponse.redirect(`${origin}${redirect}`);
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Ensure profile row exists for this user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await ensureProfile(user.id, user.email, user.user_metadata?.full_name);
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
