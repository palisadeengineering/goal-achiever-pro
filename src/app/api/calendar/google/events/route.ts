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

// Helper to get refreshed tokens from cookie
async function getTokensFromCookie(): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
} | null> {
  const cookieStore = await cookies();
  const tokensCookie = cookieStore.get('google_calendar_tokens');

  if (!tokensCookie) {
    return null;
  }

  try {
    const tokens = JSON.parse(tokensCookie.value);
    return await refreshTokenIfNeeded(tokens);
  } catch {
    return null;
  }
}

// POST: Create a new calendar event
export async function POST(request: NextRequest) {
  const tokens = await getTokensFromCookie();

  if (!tokens) {
    return NextResponse.json(
      { error: 'Not connected to Google Calendar' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { summary, description, start, end, timeZone } = body;

    if (!summary || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required fields: summary, start, end' },
        { status: 400 }
      );
    }

    // Format event for Google Calendar API
    const event = {
      summary,
      description: description || '',
      start: {
        dateTime: start,
        timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: end,
        timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Calendar create error:', error);
      return NextResponse.json(
        { error: 'Failed to create calendar event' },
        { status: response.status }
      );
    }

    const createdEvent = await response.json();

    return NextResponse.json({
      success: true,
      event: {
        id: `gcal_${createdEvent.id}`,
        googleEventId: createdEvent.id,
        summary: createdEvent.summary,
        start: createdEvent.start,
        end: createdEvent.end,
        htmlLink: createdEvent.htmlLink,
      },
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}

// PATCH: Update an existing calendar event
export async function PATCH(request: NextRequest) {
  const tokens = await getTokensFromCookie();

  if (!tokens) {
    return NextResponse.json(
      { error: 'Not connected to Google Calendar' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { eventId, summary, description, start, end, timeZone } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing required field: eventId' },
        { status: 400 }
      );
    }

    // Extract Google event ID (remove gcal_ prefix if present)
    const googleEventId = eventId.startsWith('gcal_') ? eventId.slice(5) : eventId;

    // Build update payload with only provided fields
    const updatePayload: Record<string, unknown> = {};

    if (summary !== undefined) {
      updatePayload.summary = summary;
    }
    if (description !== undefined) {
      updatePayload.description = description;
    }
    if (start !== undefined) {
      updatePayload.start = {
        dateTime: start,
        timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
    if (end !== undefined) {
      updatePayload.end = {
        dateTime: end,
        timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Calendar update error:', error);
      return NextResponse.json(
        { error: 'Failed to update calendar event' },
        { status: response.status }
      );
    }

    const updatedEvent = await response.json();

    return NextResponse.json({
      success: true,
      event: {
        id: `gcal_${updatedEvent.id}`,
        googleEventId: updatedEvent.id,
        summary: updatedEvent.summary,
        start: updatedEvent.start,
        end: updatedEvent.end,
        htmlLink: updatedEvent.htmlLink,
      },
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a calendar event
export async function DELETE(request: NextRequest) {
  const tokens = await getTokensFromCookie();

  if (!tokens) {
    return NextResponse.json(
      { error: 'Not connected to Google Calendar' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing required parameter: eventId' },
        { status: 400 }
      );
    }

    // Extract Google event ID (remove gcal_ prefix if present)
    const googleEventId = eventId.startsWith('gcal_') ? eventId.slice(5) : eventId;

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    // Google returns 204 No Content on successful deletion
    if (!response.ok && response.status !== 204) {
      const error = await response.json().catch(() => ({}));
      console.error('Google Calendar delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete calendar event' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      deletedEventId: eventId,
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}
