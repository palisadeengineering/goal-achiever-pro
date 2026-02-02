import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { syncFromGoogle, SyncFromGoogleResult } from '@/lib/calendar/sync-from-google';

// POST: Sync changes FROM Google Calendar TO local database
export async function POST() {
  const auth = await getAuthenticatedUser();
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  console.log('[Sync API] Starting sync from Google Calendar for user:', auth.userId);

  const result = await syncFromGoogle(auth.userId);

  return NextResponse.json({
    success: result.success,
    synced: result.synced,
    deleted: result.deleted,
    conflicts: result.conflicts,
    errors: result.errors,
    details: result.details,
  });
}

// GET: Check sync status
export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Use dynamic import to avoid issues with createClient
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  // Count linked time blocks
  const { count: linkedCount } = await adminClient
    .from('time_blocks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', auth.userId)
    .not('external_event_id', 'is', null);

  // Count records needing check
  const { count: needsCheckCount } = await adminClient
    .from('calendar_sync_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', auth.userId)
    .eq('sync_status', 'needs_check');

  return NextResponse.json({
    linkedTimeBlocks: linkedCount || 0,
    recordsNeedingCheck: needsCheckCount || 0,
  });
}

// Re-export the type for consumers
export type { SyncFromGoogleResult };
