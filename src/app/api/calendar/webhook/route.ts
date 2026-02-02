import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncFromGoogle } from '@/lib/calendar/sync-from-google';

// POST: Handle Google Calendar webhook notifications
export async function POST(request: NextRequest) {
  try {
    // Verify the webhook is from Google
    const channelId = request.headers.get('X-Goog-Channel-ID');
    const resourceId = request.headers.get('X-Goog-Resource-ID');
    const resourceState = request.headers.get('X-Goog-Resource-State');
    const channelToken = request.headers.get('X-Goog-Channel-Token');

    if (!channelId || !resourceId) {
      return NextResponse.json({ error: 'Invalid webhook request' }, { status: 400 });
    }

    // For sync state, just acknowledge
    if (resourceState === 'sync') {
      return NextResponse.json({ status: 'acknowledged' });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Verify channel exists and is active
    const { data: channel, error: channelError } = await supabase
      .from('calendar_webhook_channels')
      .select('*')
      .eq('channel_id', channelId)
      .eq('is_active', true)
      .single();

    if (channelError || !channel) {
      console.log('Unknown or inactive webhook channel:', channelId);
      return NextResponse.json({ status: 'ignored' });
    }

    // Verify token if set
    if (channel.token && channelToken !== channel.token) {
      console.log('Invalid webhook token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if two-way sync is enabled for this user
    const { data: settings } = await supabase
      .from('calendar_sync_settings')
      .select('two_way_sync_enabled, conflict_resolution')
      .eq('user_id', channel.user_id)
      .single();

    if (!settings?.two_way_sync_enabled) {
      return NextResponse.json({ status: 'two_way_sync_disabled' });
    }

    // Queue the sync for background processing
    // For now, we'll process inline but this should be moved to a job queue
    if (resourceState === 'exists' || resourceState === 'updated') {
      await processCalendarChange(supabase, channel.user_id, resourceState, settings.conflict_resolution);
    }

    return NextResponse.json({ status: 'processed' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processCalendarChange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  changeType: string,
  conflictResolution: string
) {
  if (!supabase) return;

  try {
    // Get all synced events for this user
    const { data: syncRecords } = await supabase
      .from('calendar_sync_records')
      .select('*')
      .eq('user_id', userId)
      .eq('sync_status', 'synced');

    if (!syncRecords || syncRecords.length === 0) {
      return;
    }

    // Note: In production, you would:
    // 1. Use the sync token to get incremental changes
    // 2. Check each changed event against sync records
    // 3. Update local entities based on calendar changes
    // 4. Handle conflict resolution based on settings

    // Mark records for resync check
    for (const record of syncRecords) {
      await supabase
        .from('calendar_sync_records')
        .update({
          sync_status: 'needs_check',
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);
    }

    console.log(`Marked ${syncRecords.length} records for sync check`);

    // Auto-sync from Google Calendar
    console.log('[Webhook] Triggering auto-sync from Google Calendar for user:', userId);
    const syncResult = await syncFromGoogle(userId);
    console.log('[Webhook] Auto-sync complete:', {
      synced: syncResult.synced,
      deleted: syncResult.deleted,
      errors: syncResult.errors.length,
    });
  } catch (error) {
    console.error('Error processing calendar change:', error);
  }
}

// GET: Health check for webhook endpoint
export async function GET() {
  return NextResponse.json({ status: 'webhook endpoint active' });
}
