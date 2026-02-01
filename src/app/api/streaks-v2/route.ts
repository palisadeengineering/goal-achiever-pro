import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET /api/streaks-v2 - Get all streaks for user
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
    const projectId = searchParams.get('projectId');
    const streakType = searchParams.get('type'); // 'daily_execution', 'check_in', 'production', 'project'

    let query = supabase
      .from('streaks_v2')
      .select(`
        *,
        projects (
          id,
          title,
          color
        )
      `)
      .eq('user_id', userId)
      .order('streak_type', { ascending: true });

    if (projectId) {
      query = query.eq('project_id', projectId);
    } else if (projectId === null) {
      query = query.is('project_id', null);
    }

    if (streakType) {
      query = query.eq('streak_type', streakType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching streaks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ streaks: data });
  } catch (error) {
    console.error('GET /api/streaks-v2 error:', error);
    return NextResponse.json({ error: 'Failed to fetch streaks' }, { status: 500 });
  }
}

// POST /api/streaks-v2/recover - Use streak recovery (once per week)
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
    const { streakType, projectId } = body;

    if (!streakType) {
      return NextResponse.json({ error: 'Streak type is required' }, { status: 400 });
    }

    // Get the streak
    let query = supabase
      .from('streaks_v2')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_type', streakType);

    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      query = query.is('project_id', null);
    }

    const { data: streak, error: streakError } = await query.single();

    if (streakError || !streak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 });
    }

    // Check if recovery was already used this week
    if (streak.recovery_used_this_week) {
      return NextResponse.json(
        { error: 'Streak recovery already used this week', success: false },
        { status: 400 }
      );
    }

    // Check if streak is actually broken (last activity more than 1 day ago)
    const today = new Date();
    const lastActivity = streak.last_activity_date ? new Date(streak.last_activity_date) : null;

    if (lastActivity) {
      const daysSinceLastActivity = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastActivity <= 1) {
        return NextResponse.json(
          { error: 'Streak is not broken', success: false },
          { status: 400 }
        );
      }
    }

    // Recovery requirements: Complete 3 tasks today
    const todayStr = today.toISOString().split('T')[0];
    const { data: todayTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', `${todayStr}T00:00:00`)
      .lte('completed_at', `${todayStr}T23:59:59`);

    if (tasksError) {
      console.error('Error checking tasks:', tasksError);
      return NextResponse.json({ error: 'Failed to verify recovery requirements' }, { status: 500 });
    }

    if (!todayTasks || todayTasks.length < 3) {
      return NextResponse.json({
        error: `Complete ${3 - (todayTasks?.length || 0)} more tasks today to recover streak`,
        success: false,
        tasksCompleted: todayTasks?.length || 0,
        tasksRequired: 3,
      }, { status: 400 });
    }

    // Restore the streak
    const { data: updatedStreak, error: updateError } = await supabase
      .from('streaks_v2')
      .update({
        last_activity_date: todayStr,
        recovery_used_this_week: true,
        last_recovery_date: todayStr,
        updated_at: new Date().toISOString(),
      })
      .eq('id', streak.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating streak:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      streak: updatedStreak,
      message: `${streakType.replace('_', ' ')} streak recovered! You can use recovery again next week.`,
    });
  } catch (error) {
    console.error('POST /api/streaks-v2/recover error:', error);
    return NextResponse.json({ error: 'Failed to recover streak' }, { status: 500 });
  }
}
