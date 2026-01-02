import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Refresh access token if expired
async function refreshTokenIfNeeded(tokens: {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}): Promise<{ access_token: string; refresh_token: string; expiry_date: number } | null> {
  if (Date.now() < tokens.expiry_date - 60000) {
    // Token still valid (with 1 minute buffer)
    return tokens;
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const newTokens = await response.json();

    if (!response.ok) {
      return null;
    }

    return {
      access_token: newTokens.access_token,
      refresh_token: tokens.refresh_token, // Keep existing refresh token
      expiry_date: Date.now() + (newTokens.expires_in * 1000),
    };
  } catch {
    return null;
  }
}

// GET: Fetch calendar events
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const tokensCookie = cookieStore.get('google_calendar_tokens');

  if (!tokensCookie) {
    return NextResponse.json(
      { error: 'Not connected to Google Calendar' },
      { status: 401 }
    );
  }

  try {
    const tokens = JSON.parse(tokensCookie.value);
    const refreshedTokens = await refreshTokenIfNeeded(tokens);

    if (!refreshedTokens) {
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 401 }
      );
    }

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const timeMin = searchParams.get('timeMin') || new Date().toISOString();
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch events from Google Calendar
    const calendarUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    calendarUrl.searchParams.set('timeMin', timeMin);
    calendarUrl.searchParams.set('timeMax', timeMax);
    calendarUrl.searchParams.set('singleEvents', 'true');
    calendarUrl.searchParams.set('orderBy', 'startTime');

    const eventsResponse = await fetch(calendarUrl.toString(), {
      headers: {
        Authorization: `Bearer ${refreshedTokens.access_token}`,
      },
    });

    if (!eventsResponse.ok) {
      const error = await eventsResponse.json();
      console.error('Google Calendar API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch calendar events' },
        { status: eventsResponse.status }
      );
    }

    const data = await eventsResponse.json();

    // Transform events to our TimeBlock format
    const timeBlocks = data.items?.map((event: {
      id: string;
      summary?: string;
      description?: string;
      start: { dateTime?: string; date?: string };
      end: { dateTime?: string; date?: string };
    }) => {
      const start = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date || '');
      const end = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date || '');

      return {
        id: `gcal_${event.id}`,
        date: start.toISOString().split('T')[0],
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5),
        activityName: event.summary || 'Untitled Event',
        description: event.description || '',
        source: 'google_calendar',
        // Include full datetime info for display
        start: {
          dateTime: event.start.dateTime || start.toISOString(),
          date: event.start.date,
        },
        end: {
          dateTime: event.end.dateTime || end.toISOString(),
          date: event.end.date,
        },
      };
    }) || [];

    // Update cookie with refreshed tokens if needed
    const response = NextResponse.json({ events: timeBlocks });

    if (refreshedTokens !== tokens) {
      response.cookies.set('google_calendar_tokens', JSON.stringify(refreshedTokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
