import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { awardXp } from '@/lib/services/gamification';
import { updateUserDailyStreak } from '@/lib/services/streaks';

// GET /api/mins/[id] - Get single MIN
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user
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
      .from('mins')
      .select(`
        *,
        impact_projects:power_goals (
          id,
          title,
          category,
          visions (id, title, color)
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'MIN not found' }, { status: 404 });
    }

    return NextResponse.json({ min: data });
  } catch (error) {
    console.error('GET /api/mins/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch MIN' }, { status: 500 });
  }
}

// PUT /api/mins/[id] - Update MIN (including status changes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user
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

    // Check if this is a completion action
    const isCompleting = body.status === 'completed';
    const wasAlreadyCompleted = body._wasCompleted; // Frontend can pass this

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map camelCase to snake_case
    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      scheduledDate: 'scheduled_date',
      scheduledTime: 'scheduled_time',
      durationMinutes: 'duration_minutes',
      priority: 'priority',
      timeScope: 'time_scope',
      weekStartDate: 'week_start_date',
      weekEndDate: 'week_end_date',
      valueQuadrant: 'drip_quadrant',
      makesMoneyScore: 'makes_money_score',
      energyScore: 'energy_score',
      impactProjectId: 'power_goal_id',
      status: 'status',
      isRecurring: 'is_recurring',
      recurrenceRule: 'recurrence_rule',
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) {
        updateData[snake] = body[camel];
      }
    }

    // Set completed_at timestamp
    if (isCompleting) {
      updateData.completed_at = new Date().toISOString();
    } else if (body.status === 'pending') {
      updateData.completed_at = null;
    }

    const { data, error } = await supabase
      .from('mins')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        impact_projects:power_goals (
          id,
          title,
          category,
          visions (id, title, color)
        )
      `)
      .single();

    if (error) {
      console.error('Error updating MIN:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Award XP and update streak if completing (and wasn't already completed)
    let gamificationResult = null;
    if (isCompleting && !wasAlreadyCompleted) {
      try {
        gamificationResult = await awardXp(userId, 'KPI_COMPLETED');
        // Update daily streak
        await updateUserDailyStreak(userId);
      } catch (xpError) {
        console.error('Failed to award XP or update streak:', xpError);
        // Don't fail the request for XP/streak errors
      }
    }

    return NextResponse.json({
      min: data,
      gamification: gamificationResult,
    });
  } catch (error) {
    console.error('PUT /api/mins/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update MIN' }, { status: 500 });
  }
}

// DELETE /api/mins/[id] - Delete MIN
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { error } = await supabase
      .from('mins')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting MIN:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/mins/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete MIN' }, { status: 500 });
  }
}
