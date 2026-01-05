import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calendar/google/callback`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?error=google_auth_denied`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/settings?error=no_code`, request.url)
    );
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL(`/settings?error=not_configured`, request.url)
    );
  }

  // Get user ID from state parameter (passed during OAuth initiation)
  let userId: string | null = null;
  if (state) {
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
      // Verify state isn't too old (max 10 minutes)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        return NextResponse.redirect(
          new URL(`/settings?error=state_expired`, request.url)
        );
      }
    } catch (e) {
      console.error('Failed to parse state:', e);
    }
  }

  if (!userId) {
    return NextResponse.redirect(
      new URL(`/settings?error=invalid_state`, request.url)
    );
  }

  // Use service role client to store tokens (bypasses RLS)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.redirect(
      new URL(`/settings?error=server_config`, request.url)
    );
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokens);
      return NextResponse.redirect(
        new URL(`/settings?error=token_exchange_failed`, request.url)
      );
    }

    // Get user info from Google to store email
    let googleEmail = null;
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        googleEmail = userInfo.email;
      }
    } catch (e) {
      console.error('Failed to get Google user info:', e);
    }

    // Store tokens in database
    const tokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000));

    const { error: upsertError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: userId,
        provider: 'google_calendar',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokenExpiry.toISOString(),
        scopes: tokens.scope?.split(' ') || [],
        provider_email: googleEmail,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      });

    if (upsertError) {
      console.error('Failed to store tokens:', upsertError);
      return NextResponse.redirect(
        new URL(`/settings?error=token_storage_failed`, request.url)
      );
    }

    return NextResponse.redirect(
      new URL(`/settings?success=google_connected`, request.url)
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/settings?error=callback_failed`, request.url)
    );
  }
}
