import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET /api/milestones/[id]/targets - Get all targets for a milestone
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: milestoneId } = await params;

    if (!milestoneId) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    // Verify the milestone belongs to the user
    const { data: milestone } = await supabase
      .from('power_goals')
      .select('id')
      .eq('id', milestoneId)
      .eq('user_id', userId)
      .single();

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Get monthly targets with nested weekly targets and daily actions
    const { data: monthlyTargets, error } = await supabase
      .from('monthly_targets')
      .select(`
        *,
        weekly_targets(
          *,
          daily_actions(*)
        )
      `)
      .eq('power_goal_id', milestoneId)
      .eq('user_id', userId)
      .order('target_month', { ascending: true });

    if (error) {
      console.error('Error fetching targets:', error);
      return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 });
    }

    // Calculate progress statistics
    let totalDailyActions = 0;
    let completedDailyActions = 0;
    let totalWeeklyTargets = 0;
    let completedWeeklyTargets = 0;
    const totalMonthlyTargets = monthlyTargets?.length || 0;
    let completedMonthlyTargets = 0;

    for (const monthly of monthlyTargets || []) {
      if (monthly.status === 'completed') completedMonthlyTargets++;

      for (const weekly of monthly.weekly_targets || []) {
        totalWeeklyTargets++;
        if (weekly.status === 'completed') completedWeeklyTargets++;

        for (const daily of weekly.daily_actions || []) {
          totalDailyActions++;
          if (daily.status === 'completed') completedDailyActions++;
        }
      }
    }

    // Calculate progress percentage based on daily actions
    const progressPercentage = totalDailyActions > 0
      ? Math.round((completedDailyActions / totalDailyActions) * 100)
      : 0;

    return NextResponse.json({
      targets: monthlyTargets || [],
      progress: {
        percentage: progressPercentage,
        daily: { completed: completedDailyActions, total: totalDailyActions },
        weekly: { completed: completedWeeklyTargets, total: totalWeeklyTargets },
        monthly: { completed: completedMonthlyTargets, total: totalMonthlyTargets },
      }
    });
  } catch (error) {
    console.error('Get targets error:', error);
    return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 });
  }
}

// POST /api/milestones/[id]/targets - Create a target at any level
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: milestoneId } = await params;
    const body = await request.json();
    const { level, ...targetData } = body;

    if (!milestoneId) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    if (!level || !['monthly', 'weekly', 'daily'].includes(level)) {
      return NextResponse.json({ error: 'Valid level (monthly, weekly, daily) is required' }, { status: 400 });
    }

    // Verify the milestone belongs to the user
    const { data: milestone } = await supabase
      .from('power_goals')
      .select('id')
      .eq('id', milestoneId)
      .eq('user_id', userId)
      .single();

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    let result;

    if (level === 'monthly') {
      const { data, error } = await supabase
        .from('monthly_targets')
        .insert({
          user_id: userId,
          power_goal_id: milestoneId,
          title: targetData.title,
          description: targetData.description || null,
          target_month: targetData.targetMonth,
          target_year: targetData.targetYear || new Date().getFullYear(),
          key_metric: targetData.keyMetric || null,
          target_value: targetData.targetValue || null,
          assignee_id: targetData.assigneeId || null,
          assignee_name: targetData.assigneeName || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      result = { monthly: data };
    } else if (level === 'weekly') {
      if (!targetData.monthlyTargetId) {
        return NextResponse.json({ error: 'Monthly target ID is required for weekly targets' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('weekly_targets')
        .insert({
          user_id: userId,
          monthly_target_id: targetData.monthlyTargetId,
          title: targetData.title,
          description: targetData.description || null,
          week_number: targetData.weekNumber,
          week_start_date: targetData.weekStartDate,
          week_end_date: targetData.weekEndDate,
          key_metric: targetData.keyMetric || null,
          target_value: targetData.targetValue || null,
          assignee_id: targetData.assigneeId || null,
          assignee_name: targetData.assigneeName || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      result = { weekly: data };
    } else if (level === 'daily') {
      if (!targetData.weeklyTargetId) {
        return NextResponse.json({ error: 'Weekly target ID is required for daily actions' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('daily_actions')
        .insert({
          user_id: userId,
          weekly_target_id: targetData.weeklyTargetId,
          title: targetData.title,
          description: targetData.description || null,
          action_date: targetData.actionDate,
          estimated_minutes: targetData.estimatedMinutes || 30,
          key_metric: targetData.keyMetric || null,
          target_value: targetData.targetValue || null,
          assignee_id: targetData.assigneeId || null,
          assignee_name: targetData.assigneeName || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      result = { daily: data };
    }

    return NextResponse.json({ success: true, target: result });
  } catch (error) {
    console.error('Create target error:', error);
    return NextResponse.json({ error: 'Failed to create target' }, { status: 500 });
  }
}
