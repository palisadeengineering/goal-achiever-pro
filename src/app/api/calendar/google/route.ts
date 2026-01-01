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

  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly',
  ].join(' ');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  return NextResponse.json({ authUrl: authUrl.toString() });
}

// Disconnect Google Calendar
export async function DELETE(request: NextRequest) {
  // In a real implementation, this would:
  // 1. Get the user from the session
  // 2. Revoke the Google OAuth token
  // 3. Delete the stored tokens from the database

  return NextResponse.json({ success: true, message: 'Google Calendar disconnected' });
}
