import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// Get tokens from database
async function getTokensFromDatabase(): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  integrationId: string;
} | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const userId = await getUserId(supabase);

  const { data: integration, error } = await supabase
    .from('user_integrations')
    .select('id, access_token, refresh_token, token_expiry')
    .eq('user_id', userId)
    .eq('provider', 'google_calendar')
    .eq('is_active', true)
    .single();

  if (error || !integration || !integration.access_token || !integration.refresh_token) {
    return null;
  }

  return {
    access_token: integration.access_token,
    refresh_token: integration.refresh_token,
    expiry_date: integration.token_expiry ? new Date(integration.token_expiry).getTime() : 0,
    integrationId: integration.id,
  };
}

// Update tokens in database after refresh
async function updateTokensInDatabase(integrationId: string, tokens: {
  access_token: string;
  expiry_date: number;
}): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;

  await supabase
    .from('user_integrations')
    .update({
      access_token: tokens.access_token,
      token_expiry: new Date(tokens.expiry_date).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', integrationId);
}

// Refresh access token if expired
async function refreshTokenIfNeeded(tokens: {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  integrationId: string;
}): Promise<{ access_token: string; refresh_token: string; expiry_date: number; integrationId: string } | null> {
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
      console.error('Token refresh failed:', newTokens);
      return null;
    }

    const refreshedTokens = {
      access_token: newTokens.access_token,
      refresh_token: tokens.refresh_token, // Keep existing refresh token
      expiry_date: Date.now() + (newTokens.expires_in * 1000),
      integrationId: tokens.integrationId,
    };

    // Update tokens in database
    await updateTokensInDatabase(tokens.integrationId, {
      access_token: refreshedTokens.access_token,
      expiry_date: refreshedTokens.expiry_date,
    });

    return refreshedTokens;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

// GET: Fetch calendar events
export async function GET(request: NextRequest) {
  const tokens = await getTokensFromDatabase();

  if (!tokens) {
    return NextResponse.json(
      { error: 'Not connected to Google Calendar' },
      { status: 401 }
    );
  }

  try {
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

    return NextResponse.json({ events: timeBlocks });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

// POST: Create a new calendar event
export async function POST(request: NextRequest) {
  const dbTokens = await getTokensFromDatabase();
  const tokens = dbTokens ? await refreshTokenIfNeeded(dbTokens) : null;

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
  const dbTokens = await getTokensFromDatabase();
  const tokens = dbTokens ? await refreshTokenIfNeeded(dbTokens) : null;

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
  const dbTokens = await getTokensFromDatabase();
  const tokens = dbTokens ? await refreshTokenIfNeeded(dbTokens) : null;

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
