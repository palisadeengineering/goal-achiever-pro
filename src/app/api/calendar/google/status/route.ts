import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET: Check if Google Calendar is connected
export async function GET() {
  const cookieStore = await cookies();
  const tokensCookie = cookieStore.get('google_calendar_tokens');

  if (!tokensCookie) {
    return NextResponse.json({ connected: false });
  }

  try {
    const tokens = JSON.parse(tokensCookie.value);

    // Check if we have both required tokens
    if (tokens.access_token && tokens.refresh_token) {
      return NextResponse.json({
        connected: true,
        expiresAt: tokens.expiry_date,
      });
    }

    return NextResponse.json({ connected: false });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
