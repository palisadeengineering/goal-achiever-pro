import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// POST: Bulk update multiple time blocks with the same changes
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

    const { blockIds, updates } = body;

    if (!blockIds || !Array.isArray(blockIds) || blockIds.length === 0) {
      return NextResponse.json(
        { error: 'blockIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'updates object is required' },
        { status: 400 }
      );
    }

    const { dripQuadrant, energyRating } = updates;

    // Ensure at least one field is being updated
    if (dripQuadrant === undefined && energyRating === undefined) {
      return NextResponse.json(
        { error: 'At least one update field (dripQuadrant or energyRating) is required' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dripQuadrant !== undefined) {
      updateData.drip_quadrant = dripQuadrant;
    }

    if (energyRating !== undefined) {
      updateData.energy_rating = energyRating;
    }

    // Verify all blocks belong to the user before updating
    const { data: existingBlocks, error: verifyError } = await supabase
      .from('time_blocks')
      .select('id')
      .eq('user_id', userId)
      .in('id', blockIds);

    if (verifyError) {
      console.error('Error verifying time blocks:', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify time blocks' },
        { status: 500 }
      );
    }

    // Filter to only IDs that exist and belong to the user
    const validIds = (existingBlocks || []).map(b => b.id);

    if (validIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid time blocks found to update' },
        { status: 404 }
      );
    }

    // Perform bulk update
    const { data: updatedBlocks, error: updateError } = await supabase
      .from('time_blocks')
      .update(updateData)
      .eq('user_id', userId)
      .in('id', validIds)
      .select();

    if (updateError) {
      console.error('Error bulk updating time blocks:', updateError);
      return NextResponse.json(
        { error: 'Failed to update time blocks' },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const transformed = (updatedBlocks || []).map(block => ({
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
      dripQuadrant: block.drip_quadrant,
      source: block.source,
      externalEventId: block.external_event_id,
      createdAt: block.created_at,
      updatedAt: block.updated_at,
    }));

    return NextResponse.json({
      success: true,
      updated: transformed.length,
      skipped: blockIds.length - validIds.length,
      timeBlocks: transformed,
    });
  } catch (error) {
    console.error('Bulk update time blocks error:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update time blocks' },
      { status: 500 }
    );
  }
}
