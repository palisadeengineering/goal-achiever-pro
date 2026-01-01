import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect') || '/dashboard';

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

        // If no profile or onboarding not completed, redirect to onboarding
        if (!profile || !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/welcome`);
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
