import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// GET /api/targets/daily/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { id } = await params;

    const { data: action, error } = await supabase
      .from('daily_actions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching daily action:', error);
      return NextResponse.json({ error: 'Failed to fetch action' }, { status: 500 });
    }

    return NextResponse.json({ action });
  } catch (error) {
    console.error('Get daily action error:', error);
    return NextResponse.json({ error: 'Failed to fetch action' }, { status: 500 });
  }
}

// PUT /api/targets/daily/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.actionDate !== undefined) updateData.action_date = body.actionDate;
    if (body.estimatedMinutes !== undefined) updateData.estimated_minutes = body.estimatedMinutes;
    if (body.keyMetric !== undefined) updateData.key_metric = body.keyMetric;
    if (body.targetValue !== undefined) updateData.target_value = body.targetValue;
    if (body.currentValue !== undefined) updateData.current_value = body.currentValue;
    if (body.status !== undefined) {
      updateData.status = body.status;
      // Set completed_at when marking as completed
      if (body.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }
    }
    if (body.assigneeId !== undefined) updateData.assignee_id = body.assigneeId;
    if (body.assigneeName !== undefined) updateData.assignee_name = body.assigneeName;

    const { data: action, error } = await supabase
      .from('daily_actions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        weekly_target:weekly_targets(
          id,
          monthly_target:monthly_targets(
            id,
            power_goal_id
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error updating daily action:', error);
      return NextResponse.json({ error: 'Failed to update action' }, { status: 500 });
    }

    // If status was updated, recalculate cascade progress up the hierarchy
    if (body.status !== undefined && action?.weekly_target) {
      const weeklyTargetId = action.weekly_target.id;
      const monthlyTargetId = action.weekly_target.monthly_target?.id;
      const powerGoalId = action.weekly_target.monthly_target?.power_goal_id;

      // 1. Update Weekly Target progress
      const { data: weeklyActions } = await supabase
        .from('daily_actions')
        .select('id, status')
        .eq('weekly_target_id', weeklyTargetId)
        .eq('user_id', userId);

      const weeklyTotal = weeklyActions?.length || 0;
      const weeklyCompleted = weeklyActions?.filter(a => a.status === 'completed').length || 0;
      const weeklyStatus = weeklyCompleted === weeklyTotal && weeklyTotal > 0 ? 'completed' :
        weeklyCompleted > 0 ? 'in_progress' : 'pending';

      await supabase
        .from('weekly_targets')
        .update({
          status: weeklyStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', weeklyTargetId)
        .eq('user_id', userId);

      // 2. Update Monthly Target progress (average of weekly targets)
      if (monthlyTargetId) {
        const { data: weeklyTargets } = await supabase
          .from('weekly_targets')
          .select('id, status')
          .eq('monthly_target_id', monthlyTargetId)
          .eq('user_id', userId);

        const monthlyTotal = weeklyTargets?.length || 0;
        const monthlyCompleted = weeklyTargets?.filter(w => w.status === 'completed').length || 0;
        const monthlyStatus = monthlyCompleted === monthlyTotal && monthlyTotal > 0 ? 'completed' :
          monthlyCompleted > 0 ? 'in_progress' : 'pending';

        await supabase
          .from('monthly_targets')
          .update({
            status: monthlyStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', monthlyTargetId)
          .eq('user_id', userId);
      }

      // 3. Update Power Goal progress (from all daily actions)
      if (powerGoalId) {
        const { data: monthlyTargets } = await supabase
          .from('monthly_targets')
          .select(`
            id,
            weekly_targets(
              id,
              daily_actions(id, status)
            )
          `)
          .eq('power_goal_id', powerGoalId)
          .eq('user_id', userId);

        // Count total and completed daily actions
        let totalDailyActions = 0;
        let completedDailyActions = 0;

        for (const monthly of monthlyTargets || []) {
          for (const weekly of monthly.weekly_targets || []) {
            for (const daily of weekly.daily_actions || []) {
              totalDailyActions++;
              if (daily.status === 'completed') completedDailyActions++;
            }
          }
        }

        // Calculate and update progress percentage
        const progressPercentage = totalDailyActions > 0
          ? Math.round((completedDailyActions / totalDailyActions) * 100)
          : 0;
        const goalStatus = progressPercentage === 100 ? 'completed' :
          progressPercentage > 0 ? 'active' : 'pending';

        await supabase
          .from('power_goals')
          .update({
            progress_percentage: progressPercentage,
            status: goalStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', powerGoalId)
          .eq('user_id', userId);

        // 4. Update Quarterly Target if linked
        const { data: powerGoal } = await supabase
          .from('power_goals')
          .select('quarterly_target_id')
          .eq('id', powerGoalId)
          .single();

        if (powerGoal?.quarterly_target_id) {
          // Get all power goals for this quarterly target
          const { data: quarterlyGoals } = await supabase
            .from('power_goals')
            .select('id, progress_percentage')
            .eq('quarterly_target_id', powerGoal.quarterly_target_id)
            .eq('user_id', userId);

          const avgProgress = quarterlyGoals && quarterlyGoals.length > 0
            ? Math.round(quarterlyGoals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / quarterlyGoals.length)
            : 0;

          const quarterlyStatus = avgProgress === 100 ? 'completed' :
            avgProgress > 0 ? 'in_progress' : 'pending';

          await supabase
            .from('quarterly_targets')
            .update({
              progress_percentage: avgProgress,
              status: quarterlyStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', powerGoal.quarterly_target_id)
            .eq('user_id', userId);
        }
      }
    }

    return NextResponse.json({ action });
  } catch (error) {
    console.error('Update daily action error:', error);
    return NextResponse.json({ error: 'Failed to update action' }, { status: 500 });
  }
}

// DELETE /api/targets/daily/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { id } = await params;

    const { error } = await supabase
      .from('daily_actions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting daily action:', error);
      return NextResponse.json({ error: 'Failed to delete action' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete daily action error:', error);
    return NextResponse.json({ error: 'Failed to delete action' }, { status: 500 });
  }
}
