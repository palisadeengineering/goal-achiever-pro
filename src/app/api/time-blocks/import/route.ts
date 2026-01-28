import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

interface ImportTimeBlock {
  date: string;
  startTime: string;
  endTime: string;
  activityName: string;
  activityCategory?: string;
  notes?: string;
  energyRating: string;
  valueQuadrant: string;
  source: string;
  externalEventId?: string;
}

// POST: Bulk import time blocks (e.g., from Google Calendar)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);
    const body = await request.json();

    const { timeBlocks, skipDuplicates = true } = body as {
      timeBlocks: ImportTimeBlock[];
      skipDuplicates?: boolean;
    };

    if (!timeBlocks || !Array.isArray(timeBlocks) || timeBlocks.length === 0) {
      return NextResponse.json(
        { error: 'timeBlocks array is required' },
        { status: 400 }
      );
    }

    // Get existing external event IDs to avoid duplicates
    let existingEventIds: Set<string> = new Set();
    if (skipDuplicates) {
      const externalIds = timeBlocks
        .map(b => b.externalEventId)
        .filter((id): id is string => !!id);

      if (externalIds.length > 0) {
        const { data: existing } = await supabase
          .from('time_blocks')
          .select('external_event_id')
          .eq('user_id', userId)
          .in('external_event_id', externalIds);

        existingEventIds = new Set(
          (existing || []).map(e => e.external_event_id).filter(Boolean)
        );
      }
    }

    // Prepare blocks for insertion
    const blocksToInsert = timeBlocks
      .filter(block => {
        // Skip if already imported
        if (skipDuplicates && block.externalEventId && existingEventIds.has(block.externalEventId)) {
          return false;
        }
        // Validate required fields
        return block.date && block.startTime && block.endTime && block.activityName;
      })
      .map(block => {
        // Calculate duration
        const [startHour, startMin] = block.startTime.split(':').map(Number);
        const [endHour, endMin] = block.endTime.split(':').map(Number);
        const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

        return {
          user_id: userId,
          block_date: block.date,
          start_time: block.startTime,
          end_time: block.endTime,
          duration_minutes: durationMinutes > 0 ? durationMinutes : 0,
          activity_name: block.activityName,
          activity_category: block.activityCategory || null,
          notes: block.notes || null,
          energy_rating: block.energyRating || 'yellow',
          drip_quadrant: block.valueQuadrant || 'production',
          source: block.source || 'calendar_sync',
          external_event_id: block.externalEventId || null,
        };
      });

    if (blocksToInsert.length === 0) {
      return NextResponse.json({
        imported: 0,
        skipped: timeBlocks.length,
        message: 'All events were already imported or invalid',
      });
    }

    const { data: inserted, error } = await supabase
      .from('time_blocks')
      .insert(blocksToInsert)
      .select();

    if (error) {
      console.error('Error importing time blocks:', error);
      return NextResponse.json(
        { error: 'Failed to import time blocks' },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const transformed = (inserted || []).map(block => ({
      id: block.id,
      userId: block.user_id,
      date: block.block_date,
      startTime: block.start_time,
      endTime: block.end_time,
      durationMinutes: block.duration_minutes,
      activityName: block.activity_name,
      activityCategory: block.activity_category,
      notes: block.notes,
      energyRating: block.energy_rating,
      valueQuadrant: block.drip_quadrant,
      source: block.source,
      externalEventId: block.external_event_id,
      createdAt: block.created_at,
    }));

    return NextResponse.json({
      imported: transformed.length,
      skipped: timeBlocks.length - blocksToInsert.length,
      timeBlocks: transformed,
    });
  } catch (error) {
    console.error('Import time blocks error:', error);
    return NextResponse.json(
      { error: 'Failed to import time blocks' },
      { status: 500 }
    );
  }
}
