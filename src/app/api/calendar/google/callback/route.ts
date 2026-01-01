'use server';

import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calendar/google/callback`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

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

    // In a real implementation, you would:
    // 1. Get the user from the session
    // 2. Store tokens securely in the database (encrypted)
    // 3. Associate with the user's account

    // For demo purposes, we'll store in a cookie (NOT recommended for production)
    // In production, use Supabase or another secure storage
    const response = NextResponse.redirect(
      new URL(`/settings?success=google_connected`, request.url)
    );

    // Store tokens in HTTP-only cookie for demo (production: use database)
    response.cookies.set('google_calendar_tokens', JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: Date.now() + (tokens.expires_in * 1000),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/settings?error=callback_failed`, request.url)
    );
  }
}
