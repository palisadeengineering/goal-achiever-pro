import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Generate demo events for the requested date range
function generateDemoEvents(startDate: Date, endDate: Date) {
  const events = [];
  const demoEventTemplates = [
    { summary: 'Team Standup', duration: 30, hour: 9 },
    { summary: 'Client Meeting', duration: 60, hour: 10 },
    { summary: 'Lunch Break', duration: 60, hour: 12 },
    { summary: 'Project Review', duration: 45, hour: 14 },
    { summary: 'Email & Admin', duration: 60, hour: 15 },
    { summary: 'Strategy Session', duration: 90, hour: 16 },
  ];

  const currentDate = new Date(startDate);
  let eventId = 1;

  while (currentDate <= endDate) {
    // Skip weekends for demo events
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Add 2-4 random events per day
      const numEvents = 2 + Math.floor(Math.random() * 3);
      const shuffled = [...demoEventTemplates].sort(() => Math.random() - 0.5);
      const dayEvents = shuffled.slice(0, numEvents);

      for (const template of dayEvents) {
        const eventStart = new Date(currentDate);
        eventStart.setHours(template.hour, 0, 0, 0);

        const eventEnd = new Date(eventStart);
        eventEnd.setMinutes(eventEnd.getMinutes() + template.duration);

        events.push({
          id: `gcal_demo_${eventId++}`,
          date: currentDate.toISOString().split('T')[0],
          startTime: eventStart.toTimeString().slice(0, 5),
          endTime: eventEnd.toTimeString().slice(0, 5),
          activityName: template.summary,
          description: 'Demo event for testing',
          source: 'google_calendar',
          start: {
            dateTime: eventStart.toISOString(),
          },
          end: {
            dateTime: eventEnd.toISOString(),
          },
        });
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return events;
}

// Refresh access token if expired and update in database
async function refreshTokenIfNeeded(
  tokens: {
    access_token: string;
    refresh_token: string;
    token_expiry: string;
  },
  userId: string
): Promise<{ access_token: string; refresh_token: string; token_expiry: string; needsReconnect?: boolean } | null> {
  const expiryTime = new Date(tokens.token_expiry).getTime();

  // Check if we have a valid refresh token
  if (!tokens.refresh_token) {
    console.error('No refresh token available - user needs to reconnect');
    await markIntegrationInactive(userId, 'No refresh token');
    return null;
  }

  if (Date.now() < expiryTime - 60000) {
    // Token still valid (with 1 minute buffer)
    return tokens;
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('Missing Google OAuth credentials');
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

      // If refresh token is invalid/revoked, mark integration as inactive
      if (newTokens.error === 'invalid_grant' || newTokens.error === 'invalid_token') {
        console.error('Refresh token revoked or expired - marking integration as inactive');
        await markIntegrationInactive(userId, newTokens.error_description || newTokens.error);
      }

      return null;
    }

    const newExpiry = new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString();

    // Update tokens in database using service role client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey);
      await adminClient
        .from('user_integrations')
        .update({
          access_token: newTokens.access_token,
          token_expiry: newExpiry,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('provider', 'google_calendar');
    }

    return {
      access_token: newTokens.access_token,
      refresh_token: tokens.refresh_token, // Keep existing refresh token
      token_expiry: newExpiry,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

// Mark integration as inactive when tokens are invalid
async function markIntegrationInactive(userId: string, reason: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseServiceKey) {
    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    await adminClient
      .from('user_integrations')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
        // Store the reason in a metadata field if available, otherwise just log it
      })
      .eq('user_id', userId)
      .eq('provider', 'google_calendar');

    console.log(`Marked Google Calendar integration as inactive for user ${userId}: ${reason}`);
  }
}

// GET: Fetch calendar events
export async function GET(request: NextRequest) {
  // Debug info object
  const debug: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  const auth = await getAuthenticatedUser();
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const userId = auth.userId;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  debug.userId = userId;

  // Check for Google Calendar integration FIRST before falling back to demo mode
  // Authenticated users with real Google connections should ALWAYS get real data
  const { data: integration, error: integrationError } = await supabase
    .from('user_integrations')
    .select('access_token, refresh_token, token_expiry, is_active')
    .eq('user_id', userId)
    .eq('provider', 'google_calendar')
    .single();

  debug.integrationFound = !!integration;
  debug.integrationError = integrationError?.message || null;
  debug.integrationActive = integration?.is_active ?? false;
  debug.tokenExpiry = integration?.token_expiry || null;

  // Only return demo events if:
  // 1. User has NO valid Google Calendar integration, AND
  // 2. Demo mode is enabled
  const hasValidIntegration = !integrationError && integration && integration.is_active;
  debug.hasValidIntegration = hasValidIntegration;

  if (!hasValidIntegration) {
    debug.reason = 'No valid integration';
    return NextResponse.json(
      { error: 'Not connected to Google Calendar', debug },
      { status: 401 }
    );
  }

  debug.source = 'google_calendar';

  try {
    const refreshedTokens = await refreshTokenIfNeeded(
      {
        access_token: integration.access_token,
        refresh_token: integration.refresh_token,
        token_expiry: integration.token_expiry,
      },
      userId
    );

    if (!refreshedTokens) {
      debug.error = 'Token refresh failed';
      return NextResponse.json(
        { error: 'Failed to refresh token. Please reconnect Google Calendar.', debug },
        { status: 401 }
      );
    }

    debug.tokenRefreshed = true;

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const timeMin = searchParams.get('timeMin') || new Date().toISOString();
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    debug.dateRange = { timeMin, timeMax };

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
      debug.googleApiError = error;

      // If unauthorized, the token might be invalid
      if (eventsResponse.status === 401) {
        return NextResponse.json(
          { error: 'Google Calendar session expired. Please reconnect.', debug },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch calendar events', debug },
        { status: eventsResponse.status }
      );
    }

    const data = await eventsResponse.json();
    debug.rawEventCount = data.items?.length || 0;

    // Transform events to our TimeBlock format
    const timeBlocks = data.items?.map((event: {
      id: string;
      summary?: string;
      description?: string;
      start: { dateTime?: string; date?: string };
      end: { dateTime?: string; date?: string };
      recurringEventId?: string;
      recurrence?: string[];
    }) => {
      const start = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date || '');
      const end = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date || '');

      // Check if this is a recurring event instance
      // When singleEvents=true, recurring events have a recurringEventId
      const isRecurringInstance = !!event.recurringEventId;

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
        // Recurring event info
        recurringEventId: event.recurringEventId ? `gcal_${event.recurringEventId}` : undefined,
        isRecurringInstance,
      };
    }) || [];

    debug.transformedEventCount = timeBlocks.length;
    return NextResponse.json({ events: timeBlocks, debug });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    debug.catchError = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch calendar events', debug },
      { status: 500 }
    );
  }
}

// Helper to get refreshed tokens from database
async function getTokensFromDatabase(userId: string): Promise<{
  access_token: string;
  refresh_token: string;
  token_expiry: string;
} | null> {
  const supabase = await createClient();

  if (!supabase) return null;

  const { data: integration, error } = await supabase
    .from('user_integrations')
    .select('access_token, refresh_token, token_expiry, is_active')
    .eq('user_id', userId)
    .eq('provider', 'google_calendar')
    .single();

  if (error || !integration || !integration.is_active) {
    return null;
  }

  return await refreshTokenIfNeeded(
    {
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      token_expiry: integration.token_expiry,
    },
    userId
  );
}

// POST: Create a new calendar event
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const userId = auth.userId;
  const tokens = await getTokensFromDatabase(userId);

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

// PATCH: Update an existing calendar event (including recurring event instances)
export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const userId = auth.userId;
  const tokens = await getTokensFromDatabase(userId);

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
    // For recurring event instances, this will include the instance timestamp (e.g., abc123_20260111T090000Z)
    const googleEventId = eventId.startsWith('gcal_') ? eventId.slice(5) : eventId;

    console.log(`[Google Calendar PATCH] Updating event: ${googleEventId}`);

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
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`,
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
      console.error('Google Calendar update error:', { eventId: googleEventId, error });

      // Provide more specific error messages
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Event not found. It may have been deleted in Google Calendar.' },
          { status: 404 }
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'You do not have permission to edit this event. It may belong to a shared calendar.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: error.error?.message || 'Failed to update calendar event' },
        { status: response.status }
      );
    }

    const updatedEvent = await response.json();
    console.log(`[Google Calendar PATCH] Successfully updated event: ${updatedEvent.id}`);

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
  const auth = await getAuthenticatedUser();
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const userId = auth.userId;
  const tokens = await getTokensFromDatabase(userId);

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
