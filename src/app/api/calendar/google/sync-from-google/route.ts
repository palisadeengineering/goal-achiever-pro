import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

interface SyncResult {
  synced: number;
  deleted: number;
  conflicts: number;
  errors: string[];
  details: {
    blockId: string;
    action: 'updated' | 'deleted' | 'skipped' | 'error';
    reason?: string;
    oldDate?: string;
    newDate?: string;
  }[];
}

// Refresh access token if expired
async function refreshTokenIfNeeded(
  tokens: {
    access_token: string;
    refresh_token: string;
    token_expiry: string;
  },
  userId: string
): Promise<{ access_token: string } | null> {
  const expiryTime = new Date(tokens.token_expiry).getTime();

  if (!tokens.refresh_token) {
    console.error('[Reverse Sync] No refresh token available');
    return null;
  }

  if (Date.now() < expiryTime - 60000) {
    return { access_token: tokens.access_token };
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('[Reverse Sync] Missing Google OAuth credentials');
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const newTokens = await response.json();

    if (!response.ok) {
      console.error('[Reverse Sync] Token refresh failed:', newTokens);
      return null;
    }

    const newExpiry = new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString();

    // Update tokens in database
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

    return { access_token: newTokens.access_token };
  } catch (error) {
    console.error('[Reverse Sync] Token refresh error:', error);
    return null;
  }
}

// Fetch a single event from Google Calendar
async function fetchGoogleEvent(
  eventId: string,
  accessToken: string
): Promise<{
  id: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status: string;
  updated: string;
  etag: string;
} | null> {
  try {
    // Remove gcal_ prefix if present
    const googleEventId = eventId.startsWith('gcal_') ? eventId.slice(5) : eventId;

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (response.status === 404) {
      console.log(`[Reverse Sync] Event ${googleEventId} not found (deleted in Google)`);
      return null;
    }

    if (!response.ok) {
      console.error(`[Reverse Sync] Failed to fetch event ${googleEventId}:`, response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[Reverse Sync] Error fetching event ${eventId}:`, error);
    return null;
  }
}

// Extract date and time from Google Calendar event
function extractDateTimeFromGoogleEvent(event: {
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}): { date: string; startTime: string; endTime: string } | null {
  try {
    let startDate: Date;
    let endDate: Date;

    if (event.start.dateTime) {
      startDate = new Date(event.start.dateTime);
      endDate = new Date(event.end.dateTime || event.start.dateTime);
    } else if (event.start.date) {
      // All-day event
      startDate = new Date(event.start.date + 'T00:00:00');
      endDate = new Date((event.end.date || event.start.date) + 'T23:59:00');
    } else {
      return null;
    }

    const date = startDate.toISOString().split('T')[0];
    const startTime = startDate.toTimeString().slice(0, 5);
    const endTime = endDate.toTimeString().slice(0, 5);

    return { date, startTime, endTime };
  } catch {
    return null;
  }
}

// POST: Sync changes FROM Google Calendar TO local database
export async function POST(request: NextRequest) {
  const debug: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  console.log('[Reverse Sync] Starting sync from Google Calendar');

  const auth = await getAuthenticatedUser();
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const userId = auth.userId;
  debug.userId = userId;

  console.log('[Reverse Sync] Starting sync for user:', userId);

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  // Get Google Calendar tokens
  const { data: integration, error: integrationError } = await supabase
    .from('user_integrations')
    .select('access_token, refresh_token, token_expiry, is_active')
    .eq('user_id', userId)
    .eq('provider', 'google_calendar')
    .single();

  if (integrationError || !integration || !integration.is_active) {
    console.log('[Reverse Sync] No active Google Calendar integration');
    return NextResponse.json(
      { error: 'Not connected to Google Calendar', debug },
      { status: 401 }
    );
  }

  // Refresh token if needed
  const refreshedTokens = await refreshTokenIfNeeded(
    {
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      token_expiry: integration.token_expiry,
    },
    userId
  );

  if (!refreshedTokens) {
    return NextResponse.json(
      { error: 'Failed to refresh token. Please reconnect Google Calendar.', debug },
      { status: 401 }
    );
  }

  // Get sync settings for conflict resolution
  const { data: syncSettings } = await supabase
    .from('calendar_sync_settings')
    .select('conflict_resolution')
    .eq('user_id', userId)
    .single();

  const conflictResolution = syncSettings?.conflict_resolution || 'calendar_wins';
  debug.conflictResolution = conflictResolution;

  console.log('[Reverse Sync] Conflict resolution policy:', conflictResolution);

  const result: SyncResult = {
    synced: 0,
    deleted: 0,
    conflicts: 0,
    errors: [],
    details: [],
  };

  // Strategy 1: Check calendar_sync_records with 'needs_check' status
  const { data: needsCheckRecords } = await supabase
    .from('calendar_sync_records')
    .select('*')
    .eq('user_id', userId)
    .eq('sync_status', 'needs_check');

  console.log('[Reverse Sync] Found records needing check:', needsCheckRecords?.length || 0);

  // Strategy 2: Also check time_blocks with externalEventId (direct sync)
  const { data: linkedTimeBlocks } = await supabase
    .from('time_blocks')
    .select('*')
    .eq('user_id', userId)
    .not('external_event_id', 'is', null);

  console.log('[Reverse Sync] Found linked time blocks:', linkedTimeBlocks?.length || 0);

  // Process linked time blocks directly
  if (linkedTimeBlocks && linkedTimeBlocks.length > 0) {
    for (const block of linkedTimeBlocks) {
      const googleEventId = block.external_event_id;
      if (!googleEventId) continue;

      console.log(`[Reverse Sync] Checking block ${block.id} linked to Google event ${googleEventId}`);

      // Fetch current state from Google Calendar
      const googleEvent = await fetchGoogleEvent(googleEventId, refreshedTokens.access_token);

      if (!googleEvent) {
        // Event deleted in Google Calendar
        console.log(`[Reverse Sync] Event deleted in Google, removing link from block ${block.id}`);

        // Option: Clear the external_event_id to "unlink" the block
        // We don't delete the local block, just unlink it
        await supabase
          .from('time_blocks')
          .update({
            external_event_id: null,
            source: 'manual',
            updated_at: new Date().toISOString(),
          })
          .eq('id', block.id);

        result.deleted++;
        result.details.push({
          blockId: block.id,
          action: 'deleted',
          reason: 'Event deleted in Google Calendar',
        });
        continue;
      }

      // Check if event was cancelled
      if (googleEvent.status === 'cancelled') {
        console.log(`[Reverse Sync] Event cancelled in Google, unlinking block ${block.id}`);

        await supabase
          .from('time_blocks')
          .update({
            external_event_id: null,
            source: 'manual',
            updated_at: new Date().toISOString(),
          })
          .eq('id', block.id);

        result.deleted++;
        result.details.push({
          blockId: block.id,
          action: 'deleted',
          reason: 'Event cancelled in Google Calendar',
        });
        continue;
      }

      // Extract date/time from Google event
      const googleDateTime = extractDateTimeFromGoogleEvent(googleEvent);
      if (!googleDateTime) {
        console.log(`[Reverse Sync] Could not extract date/time from Google event for block ${block.id}`);
        result.errors.push(`Could not parse date/time for block ${block.id}`);
        continue;
      }

      // Compare with local block
      const localDate = block.block_date;
      const localStartTime = block.start_time?.slice(0, 5); // Ensure HH:mm format
      const localEndTime = block.end_time?.slice(0, 5);

      const dateChanged = googleDateTime.date !== localDate;
      const startTimeChanged = googleDateTime.startTime !== localStartTime;
      const endTimeChanged = googleDateTime.endTime !== localEndTime;
      const summaryChanged = googleEvent.summary !== block.activity_name;

      if (!dateChanged && !startTimeChanged && !endTimeChanged && !summaryChanged) {
        console.log(`[Reverse Sync] Block ${block.id} is in sync, skipping`);
        result.details.push({
          blockId: block.id,
          action: 'skipped',
          reason: 'Already in sync',
        });
        continue;
      }

      console.log(`[Reverse Sync] Changes detected for block ${block.id}:`);
      console.log(`  Date: ${localDate} -> ${googleDateTime.date} (changed: ${dateChanged})`);
      console.log(`  Start: ${localStartTime} -> ${googleDateTime.startTime} (changed: ${startTimeChanged})`);
      console.log(`  End: ${localEndTime} -> ${googleDateTime.endTime} (changed: ${endTimeChanged})`);
      console.log(`  Summary: ${block.activity_name} -> ${googleEvent.summary} (changed: ${summaryChanged})`);

      // Apply conflict resolution
      if (conflictResolution === 'app_wins') {
        // Don't update local - app takes precedence
        // But we should push our local changes back to Google
        console.log(`[Reverse Sync] Conflict resolution: app_wins - skipping update`);
        result.conflicts++;
        result.details.push({
          blockId: block.id,
          action: 'skipped',
          reason: 'Conflict resolution: app_wins',
          oldDate: localDate,
          newDate: googleDateTime.date,
        });
        continue;
      }

      // calendar_wins or ask (for now, treat 'ask' as calendar_wins)
      // Update the local time block with Google Calendar data
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (dateChanged) updateData.block_date = googleDateTime.date;
      if (startTimeChanged) updateData.start_time = googleDateTime.startTime;
      if (endTimeChanged) updateData.end_time = googleDateTime.endTime;
      if (summaryChanged && googleEvent.summary) updateData.activity_name = googleEvent.summary;

      // Recalculate duration if times changed
      if (startTimeChanged || endTimeChanged) {
        const [startHour, startMin] = googleDateTime.startTime.split(':').map(Number);
        const [endHour, endMin] = googleDateTime.endTime.split(':').map(Number);
        updateData.duration_minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      }

      console.log(`[Reverse Sync] Updating block ${block.id} with:`, updateData);

      const { error: updateError } = await supabase
        .from('time_blocks')
        .update(updateData)
        .eq('id', block.id);

      if (updateError) {
        console.error(`[Reverse Sync] Failed to update block ${block.id}:`, updateError);
        result.errors.push(`Failed to update block ${block.id}: ${updateError.message}`);
        result.details.push({
          blockId: block.id,
          action: 'error',
          reason: updateError.message,
        });
      } else {
        console.log(`[Reverse Sync] Successfully updated block ${block.id}`);
        result.synced++;
        result.details.push({
          blockId: block.id,
          action: 'updated',
          oldDate: localDate,
          newDate: googleDateTime.date,
        });
      }
    }
  }

  // Also process any calendar_sync_records (for other entity types)
  if (needsCheckRecords && needsCheckRecords.length > 0) {
    for (const record of needsCheckRecords) {
      // Mark as synced after processing
      await supabase
        .from('calendar_sync_records')
        .update({
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);
    }
  }

  debug.result = result;
  console.log('[Reverse Sync] Complete. Updated:', result.synced, 'Deleted:', result.deleted, 'Errors:', result.errors.length);

  return NextResponse.json({
    success: true,
    ...result,
    debug,
  });
}

// GET: Check sync status
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const userId = auth.userId;

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  // Count linked time blocks
  const { count: linkedCount } = await supabase
    .from('time_blocks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('external_event_id', 'is', null);

  // Count records needing check
  const { count: needsCheckCount } = await supabase
    .from('calendar_sync_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('sync_status', 'needs_check');

  return NextResponse.json({
    linkedTimeBlocks: linkedCount || 0,
    recordsNeedingCheck: needsCheckCount || 0,
  });
}
