import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET: Fetch time blocks for a date range
export async function GET(request: NextRequest) {
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('time_blocks')
      .select('*')
      .eq('user_id', userId)
      .order('block_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (startDate) {
      query = query.gte('block_date', startDate);
    }
    if (endDate) {
      query = query.lte('block_date', endDate);
    }

    const { data: timeBlocks, error } = await query;

    if (error) {
      console.error('Error fetching time blocks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch time blocks' },
        { status: 500 }
      );
    }

    // Fetch tag assignments for all time blocks
    const blockIds = (timeBlocks || []).map(b => b.id);
    let tagAssignments: { time_block_id: string; tag_id: string }[] = [];

    if (blockIds.length > 0) {
      const { data: assignments } = await supabase
        .from('time_block_tag_assignments')
        .select('time_block_id, tag_id')
        .in('time_block_id', blockIds);
      tagAssignments = assignments || [];
    }

    // Group tag IDs by time block
    const tagsByBlock = tagAssignments.reduce((acc, a) => {
      if (!acc[a.time_block_id]) acc[a.time_block_id] = [];
      acc[a.time_block_id].push(a.tag_id);
      return acc;
    }, {} as Record<string, string[]>);

    // Transform to camelCase for frontend
    const transformed = (timeBlocks || []).map(block => ({
      id: block.id,
      userId: block.user_id,
      minId: block.min_id,
      date: block.block_date,
      startTime: block.start_time,
      endTime: block.end_time,
      durationMinutes: block.duration_minutes,
      activityName: block.activity_name,
      activityCategory: block.activity_category,
      notes: block.notes,
      energyRating: block.energy_rating,
      energyScore: block.energy_score,
      valueQuadrant: block.drip_quadrant || 'na',
      makesMoneyScore: block.makes_money_score,
      lightsUpScore: block.lights_up_score,
      leverageType: block.leverage_type,
      source: block.source,
      externalEventId: block.external_event_id,
      // Recurring event fields
      isRecurring: block.is_recurring,
      recurrenceRule: block.recurrence_rule,
      recurrenceEndDate: block.recurrence_end_date,
      parentBlockId: block.parent_block_id,
      isRecurrenceException: block.is_recurrence_exception,
      originalDate: block.original_date,
      tagIds: tagsByBlock[block.id] || [],
      createdAt: block.created_at,
      updatedAt: block.updated_at,
    }));

    return NextResponse.json({ timeBlocks: transformed });
  } catch (error) {
    console.error('Get time blocks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time blocks' },
      { status: 500 }
    );
  }
}

// POST: Create a new time block
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

    const {
      date,
      startTime,
      endTime,
      activityName,
      activityCategory,
      notes,
      energyRating,
      valueQuadrant,
      leverageType,
      source,
      externalEventId,
      minId,
      tagIds,
      // Recurring event fields
      isRecurring,
      recurrenceRule,
      recurrenceEndDate,
      parentBlockId,
      isRecurrenceException,
      originalDate,
    } = body;

    if (!date || !startTime || !endTime || !activityName) {
      return NextResponse.json(
        { error: 'Missing required fields: date, startTime, endTime, activityName' },
        { status: 400 }
      );
    }

    // Calculate duration in minutes
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    const { data: timeBlock, error } = await supabase
      .from('time_blocks')
      .insert({
        user_id: userId,
        block_date: date,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        activity_name: activityName,
        activity_category: activityCategory || null,
        notes: notes || null,
        energy_rating: energyRating || 'yellow',
        drip_quadrant: valueQuadrant || 'production',
        leverage_type: leverageType || null,
        source: source || 'manual',
        external_event_id: externalEventId || null,
        min_id: minId || null,
        // Recurring event fields
        is_recurring: isRecurring || false,
        recurrence_rule: recurrenceRule || null,
        recurrence_end_date: recurrenceEndDate || null,
        parent_block_id: parentBlockId || null,
        is_recurrence_exception: isRecurrenceException || false,
        original_date: originalDate || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating time block:', error);
      return NextResponse.json(
        { error: 'Failed to create time block' },
        { status: 500 }
      );
    }

    // Create tag assignments if tagIds provided
    let assignedTagIds: string[] = [];
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      const tagAssignments = tagIds.map((tagId: string) => ({
        time_block_id: timeBlock.id,
        tag_id: tagId,
      }));

      const { error: tagError } = await supabase
        .from('time_block_tag_assignments')
        .insert(tagAssignments);

      if (tagError) {
        console.error('Error creating tag assignments:', tagError);
      } else {
        assignedTagIds = tagIds;
      }
    }

    // Transform to camelCase
    const transformed = {
      id: timeBlock.id,
      userId: timeBlock.user_id,
      date: timeBlock.block_date,
      startTime: timeBlock.start_time,
      endTime: timeBlock.end_time,
      durationMinutes: timeBlock.duration_minutes,
      activityName: timeBlock.activity_name,
      activityCategory: timeBlock.activity_category,
      notes: timeBlock.notes,
      energyRating: timeBlock.energy_rating,
      valueQuadrant: timeBlock.drip_quadrant || 'na',
      leverageType: timeBlock.leverage_type,
      source: timeBlock.source,
      externalEventId: timeBlock.external_event_id,
      // Recurring event fields
      isRecurring: timeBlock.is_recurring,
      recurrenceRule: timeBlock.recurrence_rule,
      recurrenceEndDate: timeBlock.recurrence_end_date,
      parentBlockId: timeBlock.parent_block_id,
      isRecurrenceException: timeBlock.is_recurrence_exception,
      originalDate: timeBlock.original_date,
      tagIds: assignedTagIds,
      createdAt: timeBlock.created_at,
    };

    return NextResponse.json({ timeBlock: transformed });
  } catch (error) {
    console.error('Create time block error:', error);
    return NextResponse.json(
      { error: 'Failed to create time block' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing time block
export async function PUT(request: NextRequest) {
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

    const {
      id,
      date,
      startTime,
      endTime,
      activityName,
      activityCategory,
      notes,
      energyRating,
      valueQuadrant,
      leverageType,
      tagIds,
      // Recurring event fields
      isRecurring,
      recurrenceRule,
      recurrenceEndDate,
      parentBlockId,
      isRecurrenceException,
      originalDate,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Time block ID is required' },
        { status: 400 }
      );
    }

    // Calculate duration if times provided
    let durationMinutes: number | undefined;
    if (startTime && endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (date !== undefined) updateData.block_date = date;
    if (startTime !== undefined) updateData.start_time = startTime;
    if (endTime !== undefined) updateData.end_time = endTime;
    if (durationMinutes !== undefined) updateData.duration_minutes = durationMinutes;
    if (activityName !== undefined) updateData.activity_name = activityName;
    if (activityCategory !== undefined) updateData.activity_category = activityCategory;
    if (notes !== undefined) updateData.notes = notes;
    if (energyRating !== undefined) updateData.energy_rating = energyRating;
    if (valueQuadrant !== undefined) updateData.drip_quadrant = valueQuadrant;
    if (leverageType !== undefined) updateData.leverage_type = leverageType;
    // Recurring event fields
    if (isRecurring !== undefined) updateData.is_recurring = isRecurring;
    if (recurrenceRule !== undefined) updateData.recurrence_rule = recurrenceRule;
    if (recurrenceEndDate !== undefined) updateData.recurrence_end_date = recurrenceEndDate;
    if (parentBlockId !== undefined) updateData.parent_block_id = parentBlockId;
    if (isRecurrenceException !== undefined) updateData.is_recurrence_exception = isRecurrenceException;
    if (originalDate !== undefined) updateData.original_date = originalDate;

    const { data: timeBlock, error } = await supabase
      .from('time_blocks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating time block:', error);
      return NextResponse.json(
        { error: 'Failed to update time block' },
        { status: 500 }
      );
    }

    // Update tag assignments if tagIds provided
    let updatedTagIds: string[] = [];
    if (tagIds !== undefined && Array.isArray(tagIds)) {
      // Delete existing tag assignments
      await supabase
        .from('time_block_tag_assignments')
        .delete()
        .eq('time_block_id', id);

      // Create new tag assignments
      if (tagIds.length > 0) {
        const tagAssignments = tagIds.map((tagId: string) => ({
          time_block_id: id,
          tag_id: tagId,
        }));

        const { error: tagError } = await supabase
          .from('time_block_tag_assignments')
          .insert(tagAssignments);

        if (tagError) {
          console.error('Error updating tag assignments:', tagError);
        } else {
          updatedTagIds = tagIds;
        }
      }
    } else {
      // Fetch existing tag assignments if not updating
      const { data: existingAssignments } = await supabase
        .from('time_block_tag_assignments')
        .select('tag_id')
        .eq('time_block_id', id);
      updatedTagIds = (existingAssignments || []).map(a => a.tag_id);
    }

    // Transform to camelCase
    const transformed = {
      id: timeBlock.id,
      userId: timeBlock.user_id,
      date: timeBlock.block_date,
      startTime: timeBlock.start_time,
      endTime: timeBlock.end_time,
      durationMinutes: timeBlock.duration_minutes,
      activityName: timeBlock.activity_name,
      activityCategory: timeBlock.activity_category,
      notes: timeBlock.notes,
      energyRating: timeBlock.energy_rating,
      valueQuadrant: timeBlock.drip_quadrant || 'na',
      leverageType: timeBlock.leverage_type,
      source: timeBlock.source,
      externalEventId: timeBlock.external_event_id,
      // Recurring event fields
      isRecurring: timeBlock.is_recurring,
      recurrenceRule: timeBlock.recurrence_rule,
      recurrenceEndDate: timeBlock.recurrence_end_date,
      parentBlockId: timeBlock.parent_block_id,
      isRecurrenceException: timeBlock.is_recurrence_exception,
      originalDate: timeBlock.original_date,
      tagIds: updatedTagIds,
      createdAt: timeBlock.created_at,
      updatedAt: timeBlock.updated_at,
    };

    return NextResponse.json({ timeBlock: transformed });
  } catch (error) {
    console.error('Update time block error:', error);
    return NextResponse.json(
      { error: 'Failed to update time block' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a time block or all time blocks
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
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';
    const clearSource = searchParams.get('clearSource'); // e.g., 'calendar_sync' or 'google_calendar'

    // Handle clear by source (e.g., clear all Google Calendar synced blocks)
    if (clearSource) {
      // Count blocks to be deleted first
      const { count: beforeCount } = await supabase
        .from('time_blocks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .or(`source.eq.${clearSource},source.eq.calendar_sync,external_event_id.not.is.null`);

      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('user_id', userId)
        .or(`source.eq.${clearSource},source.eq.calendar_sync,external_event_id.not.is.null`);

      if (error) {
        console.error('Error clearing time blocks by source:', error);
        return NextResponse.json(
          { error: 'Failed to clear time blocks by source' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        cleared: true,
        source: clearSource,
        deletedCount: beforeCount || 0
      });
    }

    // Handle clear all time blocks
    if (clearAll) {
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing all time blocks:', error);
        return NextResponse.json(
          { error: 'Failed to clear all time blocks' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, cleared: true });
    }

    // Handle single delete
    if (!id) {
      return NextResponse.json(
        { error: 'Time block ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('time_blocks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting time block:', error);
      return NextResponse.json(
        { error: 'Failed to delete time block' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete time block error:', error);
    return NextResponse.json(
      { error: 'Failed to delete time block' },
      { status: 500 }
    );
  }
}
