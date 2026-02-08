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
      isIgnored?: boolean;
    }> = Array.isArray(body.categorizations) ? body.categorizations : [body];

    if (items.length === 0) {
      return NextResponse.json({ error: 'No categorizations provided' }, { status: 400 });
    }

    if (items.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 categorizations per request' }, { status: 400 });
    }

    // Validate all items
    for (const item of items) {
      if (!item.externalEventId || !item.eventName) {
        return NextResponse.json(
          { error: 'externalEventId and eventName are required' },
          { status: 400 }
        );
      }
    }

    const rows = items.map((item) => ({
      user_id: userId,
      external_event_id: item.externalEventId,
      event_name: item.eventName,
      value_quadrant: item.valueQuadrant || null,
      energy_rating: item.energyRating || null,
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
      console.error('Error upserting event categorizations:', error);
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
