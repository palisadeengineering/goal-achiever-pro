import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// GET: Check if Google Calendar is connected
export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    // In demo mode, always return connected
    if (IS_DEMO_MODE) {
      return NextResponse.json({
        connected: true,
        email: 'demo@example.com',
        demo: true,
      });
    }
    return NextResponse.json({ connected: false });
  }

  const userId = await getUserId(supabase);

  // In demo mode with demo user, always return connected
  if (IS_DEMO_MODE && userId === DEMO_USER_ID) {
    return NextResponse.json({
      connected: true,
      email: 'demo@example.com',
      demo: true,
    });
  }

  try {
    const { data: integration, error } = await supabase
      .from('user_integrations')
      .select('access_token, refresh_token, token_expiry, provider_email, is_active')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .single();

    if (error || !integration) {
      return NextResponse.json({ connected: false });
    }

    // Check if we have required tokens and integration is active
    if (integration.access_token && integration.refresh_token && integration.is_active) {
      return NextResponse.json({
        connected: true,
        email: integration.provider_email,
        expiresAt: integration.token_expiry,
      });
    }

    return NextResponse.json({ connected: false });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
