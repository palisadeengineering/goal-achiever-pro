'use server';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any, 'public', any>;

export interface SyncFromGoogleResult {
  success: boolean;
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
  userId: string,
  adminClient: AdminClient
): Promise<{ access_token: string } | null> {
  const expiryTime = new Date(tokens.token_expiry).getTime();

  if (!tokens.refresh_token) {
    console.error('[Sync From Google] No refresh token available');
    return null;
  }

  if (Date.now() < expiryTime - 60000) {
    return { access_token: tokens.access_token };
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('[Sync From Google] Missing Google OAuth credentials');
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
      console.error('[Sync From Google] Token refresh failed:', newTokens);
      return null;
    }

    const newExpiry = new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString();

    // Update tokens in database
    await adminClient
      .from('user_integrations')
      .update({
        access_token: newTokens.access_token,
        token_expiry: newExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', 'google_calendar');

    return { access_token: newTokens.access_token };
  } catch (error) {
    console.error('[Sync From Google] Token refresh error:', error);
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
      console.log(`[Sync From Google] Event ${googleEventId} not found (deleted in Google)`);
      return null;
    }

    if (!response.ok) {
      console.error(`[Sync From Google] Failed to fetch event ${googleEventId}:`, response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[Sync From Google] Error fetching event ${eventId}:`, error);
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

/**
 * Sync changes FROM Google Calendar TO local database
 * Can be called from API route (with user auth) or webhook (with userId directly)
 */
export async function syncFromGoogle(userId: string): Promise<SyncFromGoogleResult> {
  const defaultResult: SyncFromGoogleResult = {
    success: false,
    synced: 0,
    deleted: 0,
    conflicts: 0,
    errors: [],
    details: [],
  };

  console.log('[Sync From Google] Starting sync for user:', userId);

  // Create admin client for database operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Sync From Google] Missing Supabase credentials');
    return { ...defaultResult, errors: ['Database configuration error'] };
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  // Get Google Calendar tokens
  const { data: integration, error: integrationError } = await adminClient
    .from('user_integrations')
    .select('access_token, refresh_token, token_expiry, is_active')
    .eq('user_id', userId)
    .eq('provider', 'google_calendar')
    .single();

  if (integrationError || !integration || !integration.is_active) {
    console.log('[Sync From Google] No active Google Calendar integration');
    return { ...defaultResult, errors: ['Not connected to Google Calendar'] };
  }

  // Refresh token if needed
  const refreshedTokens = await refreshTokenIfNeeded(
    {
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      token_expiry: integration.token_expiry,
    },
    userId,
    adminClient
  );

  if (!refreshedTokens) {
    return { ...defaultResult, errors: ['Failed to refresh token'] };
  }

  // Get sync settings for conflict resolution
  const { data: syncSettings } = await adminClient
    .from('calendar_sync_settings')
    .select('conflict_resolution')
    .eq('user_id', userId)
    .single();

  const conflictResolution = syncSettings?.conflict_resolution || 'calendar_wins';
  console.log('[Sync From Google] Conflict resolution policy:', conflictResolution);

  const result: SyncFromGoogleResult = {
    success: true,
    synced: 0,
    deleted: 0,
    conflicts: 0,
    errors: [],
    details: [],
  };

  // Get time_blocks with externalEventId (direct sync)
  const { data: linkedTimeBlocks } = await adminClient
    .from('time_blocks')
    .select('*')
    .eq('user_id', userId)
    .not('external_event_id', 'is', null);

  console.log('[Sync From Google] Found linked time blocks:', linkedTimeBlocks?.length || 0);

  // Process linked time blocks directly
  if (linkedTimeBlocks && linkedTimeBlocks.length > 0) {
    for (const block of linkedTimeBlocks) {
      const googleEventId = block.external_event_id;
      if (!googleEventId) continue;

      console.log(`[Sync From Google] Checking block ${block.id} linked to Google event ${googleEventId}`);

      // Fetch current state from Google Calendar
      const googleEvent = await fetchGoogleEvent(googleEventId, refreshedTokens.access_token);

      if (!googleEvent) {
        // Event deleted in Google Calendar - unlink the block
        console.log(`[Sync From Google] Event deleted in Google, unlinking block ${block.id}`);

        await adminClient
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
        console.log(`[Sync From Google] Event cancelled in Google, unlinking block ${block.id}`);

        await adminClient
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
        console.log(`[Sync From Google] Could not extract date/time from Google event for block ${block.id}`);
        result.errors.push(`Could not parse date/time for block ${block.id}`);
        continue;
      }

      // Compare with local block
      const localDate = block.block_date;
      const localStartTime = block.start_time?.slice(0, 5);
      const localEndTime = block.end_time?.slice(0, 5);

      const dateChanged = googleDateTime.date !== localDate;
      const startTimeChanged = googleDateTime.startTime !== localStartTime;
      const endTimeChanged = googleDateTime.endTime !== localEndTime;
      const summaryChanged = googleEvent.summary !== block.activity_name;

      if (!dateChanged && !startTimeChanged && !endTimeChanged && !summaryChanged) {
        result.details.push({
          blockId: block.id,
          action: 'skipped',
          reason: 'Already in sync',
        });
        continue;
      }

      console.log(`[Sync From Google] Changes detected for block ${block.id}:`);
      console.log(`  Date: ${localDate} -> ${googleDateTime.date} (changed: ${dateChanged})`);
      console.log(`  Start: ${localStartTime} -> ${googleDateTime.startTime} (changed: ${startTimeChanged})`);
      console.log(`  End: ${localEndTime} -> ${googleDateTime.endTime} (changed: ${endTimeChanged})`);
      console.log(`  Summary: ${block.activity_name} -> ${googleEvent.summary} (changed: ${summaryChanged})`);

      // Apply conflict resolution
      if (conflictResolution === 'app_wins') {
        console.log(`[Sync From Google] Conflict resolution: app_wins - skipping update`);
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

      // calendar_wins or ask - update the local time block
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

      console.log(`[Sync From Google] Updating block ${block.id} with:`, updateData);

      const { error: updateError } = await adminClient
        .from('time_blocks')
        .update(updateData)
        .eq('id', block.id);

      if (updateError) {
        console.error(`[Sync From Google] Failed to update block ${block.id}:`, updateError);
        result.errors.push(`Failed to update block ${block.id}: ${updateError.message}`);
        result.details.push({
          blockId: block.id,
          action: 'error',
          reason: updateError.message,
        });
      } else {
        console.log(`[Sync From Google] Successfully updated block ${block.id}`);
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

  // Also update any calendar_sync_records that were marked as needs_check
  const { data: needsCheckRecords } = await adminClient
    .from('calendar_sync_records')
    .select('id')
    .eq('user_id', userId)
    .eq('sync_status', 'needs_check');

  if (needsCheckRecords && needsCheckRecords.length > 0) {
    for (const record of needsCheckRecords) {
      await adminClient
        .from('calendar_sync_records')
        .update({
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);
    }
    console.log(`[Sync From Google] Marked ${needsCheckRecords.length} sync records as synced`);
  }

  console.log('[Sync From Google] Complete. Updated:', result.synced, 'Deleted:', result.deleted, 'Errors:', result.errors.length);

  return result;
}
