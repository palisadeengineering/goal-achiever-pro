import { NextRequest, NextResponse } from 'next/server';

// Google Calendar OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calendar/google/callback`;

// Generate OAuth URL for Google Calendar
export async function GET(request: NextRequest) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Google Calendar integration is not configured' },
      { status: 500 }
    );
  }

  // Get the authenticated user to include in state
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(
      { error: 'Please sign up or log in to connect Google Calendar. Demo accounts cannot use calendar sync.' },
      { status: 401 }
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Please sign up or log in to connect Google Calendar. Demo accounts cannot use calendar sync.' },
      { status: 401 }
    );
  }

  // Full calendar access for two-way sync (read/write events)
  // Note: Users who previously connected with readonly scopes will need to re-authenticate
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ].join(' ');

  // Create state with user ID for callback verification
  const state = Buffer.from(JSON.stringify({ userId: user.id, timestamp: Date.now() })).toString('base64');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);

  return NextResponse.json({ authUrl: authUrl.toString() });
}

// Disconnect Google Calendar
export async function DELETE(request: NextRequest) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Get the integration to revoke the token
  const { data: integration } = await supabase
    .from('user_integrations')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', 'google_calendar')
    .single();

  // Revoke the token with Google (best effort)
  if (integration?.access_token) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${integration.access_token}`, {
        method: 'POST',
      });
    } catch (e) {
      console.error('Failed to revoke Google token:', e);
    }
  }

  // Delete the integration from database
  const { error } = await supabase
    .from('user_integrations')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', 'google_calendar');

  if (error) {
    console.error('Failed to delete integration:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: 'Google Calendar disconnected' });
}
