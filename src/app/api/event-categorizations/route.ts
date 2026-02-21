import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET: Fetch all event categorizations for the user (for cross-device sync)
export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('event_categorizations')
      .select('*')
      .eq('user_id', userId)
      .order('categorized_at', { ascending: false });

    if (error) {
      console.error('Error fetching event categorizations:', error);
      return NextResponse.json({ error: 'Failed to fetch categorizations' }, { status: 500 });
    }

    // Transform to camelCase
    const categorizations = (data || []).map((row) => ({
      id: row.id,
      externalEventId: row.external_event_id,
      eventName: row.event_name,
      valueQuadrant: row.value_quadrant,
      energyRating: row.energy_rating,
      activityType: row.activity_type || null,
      activityCategory: row.activity_category || null,
      leverageType: row.leverage_type || null,
      detectedProjectId: row.detected_project_id || null,
      detectedProjectName: row.detected_project_name || null,
      dayMarker: row.day_marker || null,
      isIgnored: row.is_ignored,
      categorizedAt: row.categorized_at,
    }));

    return NextResponse.json({ categorizations });
  } catch (error) {
    console.error('Get event categorizations error:', error);
    return NextResponse.json({ error: 'Failed to fetch categorizations' }, { status: 500 });
  }
}

// POST: Upsert event categorizations (batch support)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const body = await request.json();

    // Support single or batch
    const items: Array<{
      externalEventId: string;
      eventName: string;
      valueQuadrant?: string;
      energyRating?: string;
      activityType?: string;
      activityCategory?: string;
      leverageType?: string;
      detectedProjectId?: string;
      detectedProjectName?: string;
      dayMarker?: string;
      isIgnored?: boolean;
    }> = Array.isArray(body) ? body : Array.isArray(body.categorizations) ? body.categorizations : [body];

    if (items.length === 0) {
      return NextResponse.json({ error: 'No categorizations provided' }, { status: 400 });
    }

    if (items.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 categorizations per request' }, { status: 400 });
    }

    // Validate all items — filter out invalid ones instead of rejecting the whole batch
    const validItems = items.filter((item) => item.externalEventId && item.eventName);
    if (validItems.length === 0) {
      return NextResponse.json(
        { error: 'No valid categorizations provided (externalEventId and eventName are required)' },
        { status: 400 }
      );
    }

    // Deduplicate by externalEventId (last-write-wins) to prevent
    // upsert failures when the same event appears multiple times in a batch
    const deduped = new Map<string, typeof validItems[number]>();
    for (const item of validItems) {
      deduped.set(item.externalEventId, item);
    }

    const rows = Array.from(deduped.values()).map((item) => ({
      user_id: userId,
      external_event_id: item.externalEventId,
      event_name: item.eventName,
      value_quadrant: item.valueQuadrant || null,
      energy_rating: item.energyRating || null,
      activity_type: item.activityType || null,
      activity_category: item.activityCategory || null,
      leverage_type: item.leverageType || null,
      detected_project_id: item.detectedProjectId || null,
      detected_project_name: item.detectedProjectName || null,
      day_marker: item.dayMarker || null,
      is_ignored: item.isIgnored ?? false,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('event_categorizations')
      .upsert(rows, {
        onConflict: 'user_id,external_event_id',
      })
      .select();

    if (error) {
      console.error('Error upserting event categorizations:', error, { rowCount: rows.length });
      return NextResponse.json({ error: 'Failed to save categorizations' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      saved: (data || []).length,
    });
  } catch (error) {
    console.error('Save event categorizations error:', error);
    return NextResponse.json({ error: 'Failed to save categorizations' }, { status: 500 });
  }
}

// DELETE: Remove a categorization by external event ID, or all categorizations if no ID provided
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const externalEventId = searchParams.get('externalEventId');
    const eventIdsParam = searchParams.get('eventIds');

    if (externalEventId) {
      // Delete a single categorization by external event ID
      const { error } = await supabase
        .from('event_categorizations')
        .delete()
        .eq('user_id', userId)
        .eq('external_event_id', externalEventId);

      if (error) {
        console.error('Error deleting event categorization:', error);
        return NextResponse.json({ error: 'Failed to delete categorization' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } else if (eventIdsParam) {
      // Delete categorizations for a specific set of event IDs (comma-separated)
      const eventIds = eventIdsParam.split(',').map(id => id.trim()).filter(Boolean);
      if (eventIds.length === 0) {
        return NextResponse.json({ error: 'No valid event IDs provided' }, { status: 400 });
      }
      if (eventIds.length > 500) {
        return NextResponse.json({ error: 'Maximum 500 event IDs per request' }, { status: 400 });
      }

      const { count, error } = await supabase
        .from('event_categorizations')
        .delete({ count: 'exact' })
        .eq('user_id', userId)
        .in('external_event_id', eventIds);

      if (error) {
        console.error('Error deleting event categorizations by IDs:', error);
        return NextResponse.json({ error: 'Failed to delete categorizations' }, { status: 500 });
      }

      return NextResponse.json({ success: true, deleted: count ?? 0 });
    } else {
      // Delete ALL categorizations for the authenticated user
      const { count, error } = await supabase
        .from('event_categorizations')
        .delete({ count: 'exact' })
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting all event categorizations:', error);
        return NextResponse.json({ error: 'Failed to delete categorizations' }, { status: 500 });
      }

      return NextResponse.json({ success: true, deleted: count ?? 0 });
    }
  } catch (error) {
    console.error('Delete event categorization error:', error);
    return NextResponse.json({ error: 'Failed to delete categorization' }, { status: 500 });
  }
}
