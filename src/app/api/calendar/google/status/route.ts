import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Check if Google Calendar is connected
export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ connected: false });
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ connected: false });
  }

  try {
    const { data: integration, error } = await supabase
      .from('user_integrations')
      .select('access_token, refresh_token, token_expiry, provider_email, is_active')
      .eq('user_id', user.id)
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
