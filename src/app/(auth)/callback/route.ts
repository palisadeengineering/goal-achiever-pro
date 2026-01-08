import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Validate redirect path to prevent open redirect attacks
function getSafeRedirect(redirectParam: string | null): string {
  const defaultRedirect = '/dashboard';

  if (!redirectParam) {
    return defaultRedirect;
  }

  // Must start with a single forward slash (not //)
  // Must not contain protocol indicators
  if (
    !redirectParam.startsWith('/') ||
    redirectParam.startsWith('//') ||
    redirectParam.includes('://') ||
    redirectParam.includes('\\')
  ) {
    return defaultRedirect;
  }

  return redirectParam;
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
      // Check if user needs onboarding
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if profile exists and onboarding is complete
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        // If no profile or onboarding not completed, redirect to dashboard
        // (onboarding can be handled within the dashboard)
        if (!profile || !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
