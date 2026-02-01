import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { awardXpV2 } from '@/lib/services/gamification-v2';
import { updateStreakV2 } from '@/lib/services/streaks-v2';

// GET /api/tasks-v2/[id] - Get single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects (
          id,
          title,
          color
        ),
        milestones_v2 (
          id,
          title
        ),
        project_key_results (
          id,
          name
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('GET /api/tasks-v2/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

// PUT /api/tasks-v2/[id] - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Get current task for comparison
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map camelCase to snake_case
    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      projectId: 'project_id',
      milestoneId: 'milestone_id',
      keyResultId: 'key_result_id',
      estimatedMinutes: 'estimated_minutes',
      actualMinutes: 'actual_minutes',
      scheduledDate: 'scheduled_date',
      scheduledStartTime: 'scheduled_start_time',
      scheduledEndTime: 'scheduled_end_time',
      dueDate: 'due_date',
      priority: 'priority',
      valueQuadrant: 'value_quadrant',
      fourCsTag: 'four_cs_tag',
      recurrence: 'recurrence',
      recurrenceRule: 'recurrence_rule',
      googleCalendarEventId: 'google_calendar_event_id',
      calendarSyncStatus: 'calendar_sync_status',
      status: 'status',
      sortOrder: 'sort_order',
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) {
        updateData[snake] = body[camel];
      }
    }

    // Handle completion
    const wasCompleted = currentTask.status === 'completed';
    const isNowCompleted = body.status === 'completed';

    if (isNowCompleted && !wasCompleted) {
      updateData.completed_at = new Date().toISOString();
    } else if (body.status === 'pending' && wasCompleted) {
      updateData.completed_at = null;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        projects (
          id,
          title,
          color
        )
      `)
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Handle gamification for task completion
    let gamificationResult = null;
    let streaksUpdated: string[] = [];

    if (isNowCompleted && !wasCompleted) {
      try {
        // Check if task was completed before deadline
        const beforeDeadline = data.due_date
          ? new Date() < new Date(data.due_date)
          : false;

        // Check if it's a high priority task
        const isHighPriority = data.priority === 'high' || data.priority === 'urgent';

        // Check if task is in Production quadrant
        const isProduction = data.value_quadrant === 'P';

        // Get current streak for bonus
        const { data: streakData } = await supabase
          .from('streaks_v2')
          .select('current_streak')
          .eq('user_id', userId)
          .eq('streak_type', 'daily_execution')
          .single();

        const currentStreak = streakData?.current_streak || 0;

        gamificationResult = await awardXpV2(userId, 'TASK_COMPLETE', {
          isHighPriority,
          beforeDeadline,
          isProduction,
          currentStreak,
          projectId: data.project_id,
        });

        // Update XP awarded on task
        await supabase
          .from('tasks')
          .update({ xp_awarded: gamificationResult.totalXp })
          .eq('id', id);

        // Update streaks
        streaksUpdated = await updateStreakV2(userId, 'task_completed', {
          projectId: data.project_id,
          isProduction,
        });
      } catch (xpError) {
        console.error('Failed to award XP or update streak:', xpError);
      }
    }

    return NextResponse.json({
      task: data,
      gamification: gamificationResult,
      streaksUpdated,
    });
  } catch (error) {
    console.error('PUT /api/tasks-v2/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks-v2/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/tasks-v2/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
