import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    // Fetch the backtrack plan with full hierarchy
    const { data: plan, error: planError } = await supabase
      .from('backtrack_plans')
      .select(`
        *,
        visions (
          id,
          title,
          description,
          specific,
          measurable,
          attainable,
          realistic,
          time_bound,
          clarity_score,
          belief_score,
          consistency_score,
          color
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Backtrack plan not found' },
        { status: 404 }
      );
    }

    // Fetch quarterly targets for this plan
    const { data: quarterlyTargets } = await supabase
      .from('quarterly_targets')
      .select('*')
      .eq('backtrack_plan_id', id)
      .eq('user_id', userId)
      .order('quarter', { ascending: true });

    // Fetch power goals for this plan
    const { data: powerGoals } = await supabase
      .from('power_goals')
      .select('*')
      .eq('backtrack_plan_id', id)
      .eq('user_id', userId)
      .order('quarter', { ascending: true })
      .order('sort_order', { ascending: true });

    // Fetch monthly targets linked to these power goals
    const powerGoalIds = powerGoals?.map(g => g.id) || [];
    const { data: monthlyTargets } = await supabase
      .from('monthly_targets')
      .select('*')
      .in('power_goal_id', powerGoalIds.length > 0 ? powerGoalIds : ['none'])
      .eq('user_id', userId)
      .order('target_year', { ascending: true })
      .order('target_month', { ascending: true });

    // Fetch weekly targets linked to monthly targets
    const monthlyTargetIds = monthlyTargets?.map(m => m.id) || [];
    const { data: weeklyTargets } = await supabase
      .from('weekly_targets')
      .select('*')
      .in('monthly_target_id', monthlyTargetIds.length > 0 ? monthlyTargetIds : ['none'])
      .eq('user_id', userId)
      .order('week_start_date', { ascending: true });

    // Fetch daily actions linked to weekly targets
    const weeklyTargetIds = weeklyTargets?.map(w => w.id) || [];
    const { data: dailyActions } = await supabase
      .from('daily_actions')
      .select('*')
      .in('weekly_target_id', weeklyTargetIds.length > 0 ? weeklyTargetIds : ['none'])
      .eq('user_id', userId)
      .order('action_date', { ascending: true });

    return NextResponse.json({
      plan,
      quarterlyTargets: quarterlyTargets || [],
      powerGoals: powerGoals || [],
      monthlyTargets: monthlyTargets || [],
      weeklyTargets: weeklyTargets || [],
      dailyActions: dailyActions || [],
    });
  } catch (error) {
    console.error('Get backtrack plan error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backtrack plan' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    const body = await request.json();
    const {
      availableHoursPerWeek,
      startDate,
      endDate,
      status,
      aiGeneratedAt,
    } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (availableHoursPerWeek !== undefined) {
      updateData.available_hours_per_week = availableHoursPerWeek;
    }
    if (startDate !== undefined) {
      updateData.start_date = startDate;
    }
    if (endDate !== undefined) {
      updateData.end_date = endDate;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (aiGeneratedAt !== undefined) {
      updateData.ai_generated_at = aiGeneratedAt;
    }

    const { data: plan, error } = await supabase
      .from('backtrack_plans')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        visions (
          id,
          title,
          description,
          specific,
          measurable,
          attainable,
          realistic,
          time_bound
        )
      `)
      .single();

    if (error) {
      console.error('Error updating backtrack plan:', error);
      return NextResponse.json(
        { error: 'Failed to update backtrack plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Update backtrack plan error:', error);
    return NextResponse.json(
      { error: 'Failed to update backtrack plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    // Delete the backtrack plan (cascades to quarterly targets and power goals via FK)
    const { error } = await supabase
      .from('backtrack_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting backtrack plan:', error);
      return NextResponse.json(
        { error: 'Failed to delete backtrack plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete backtrack plan error:', error);
    return NextResponse.json(
      { error: 'Failed to delete backtrack plan' },
      { status: 500 }
    );
  }
}
