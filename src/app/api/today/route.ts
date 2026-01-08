import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);
    const today = new Date().toISOString().split('T')[0];

    // Fetch today's daily actions with their full hierarchy
    const { data: dailyActions, error: actionsError } = await supabase
      .from('daily_actions')
      .select(`
        *,
        weekly_targets (
          id,
          title,
          monthly_targets (
            id,
            title,
            power_goals (
              id,
              title,
              category,
              visions (
                id,
                title,
                color
              )
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('action_date', today)
      .order('sort_order', { ascending: true });

    if (actionsError) {
      console.error('Error fetching daily actions:', actionsError);
      return NextResponse.json(
        { error: 'Failed to fetch today\'s actions' },
        { status: 500 }
      );
    }

    // Group actions by vision
    const actionsByVision: Record<string, {
      visionId: string;
      visionTitle: string;
      visionColor: string;
      actions: typeof dailyActions;
      completedCount: number;
      totalCount: number;
    }> = {};

    for (const action of dailyActions || []) {
      const vision = action.weekly_targets?.monthly_targets?.power_goals?.visions;
      const visionId = vision?.id || 'unassigned';
      const visionTitle = vision?.title || 'Unassigned';
      const visionColor = vision?.color || '#6366f1';

      if (!actionsByVision[visionId]) {
        actionsByVision[visionId] = {
          visionId,
          visionTitle,
          visionColor,
          actions: [],
          completedCount: 0,
          totalCount: 0,
        };
      }

      actionsByVision[visionId].actions.push(action);
      actionsByVision[visionId].totalCount++;
      if (action.status === 'completed') {
        actionsByVision[visionId].completedCount++;
      }
    }

    // Calculate totals
    const totalActions = dailyActions?.length || 0;
    const completedActions = dailyActions?.filter(a => a.status === 'completed').length || 0;

    // Fetch upcoming deadlines (weekly targets ending this week, monthly targets this month)
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const { data: upcomingWeekly } = await supabase
      .from('weekly_targets')
      .select(`
        id,
        title,
        week_end_date,
        status,
        monthly_targets (
          power_goals (
            visions (
              title,
              color
            )
          )
        )
      `)
      .eq('user_id', userId)
      .neq('status', 'completed')
      .lte('week_end_date', weekEndStr)
      .gte('week_end_date', today)
      .order('week_end_date', { ascending: true })
      .limit(5);

    const monthEnd = new Date();
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const { data: upcomingMonthly } = await supabase
      .from('monthly_targets')
      .select(`
        id,
        title,
        target_month,
        target_year,
        status,
        power_goals (
          visions (
            title,
            color
          )
        )
      `)
      .eq('user_id', userId)
      .neq('status', 'completed')
      .eq('target_month', currentMonth)
      .eq('target_year', currentYear)
      .limit(5);

    // Format upcoming deadlines
     
    const upcomingDeadlines = [
      ...(upcomingWeekly || []).map((w: any) => ({
        type: 'weekly' as const,
        id: w.id,
        title: w.title,
        dueDate: w.week_end_date,
        daysRemaining: Math.ceil((new Date(w.week_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        visionTitle: w.monthly_targets?.power_goals?.visions?.title || 'Unassigned',
        visionColor: w.monthly_targets?.power_goals?.visions?.color || '#6366f1',
      })),
      ...(upcomingMonthly || []).map((m: any) => ({
        type: 'monthly' as const,
        id: m.id,
        title: m.title,
        dueDate: `${m.target_year}-${String(m.target_month).padStart(2, '0')}-${new Date(m.target_year, m.target_month, 0).getDate()}`,
        daysRemaining: Math.ceil((new Date(m.target_year, m.target_month, 0).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        visionTitle: m.power_goals?.visions?.title || 'Unassigned',
        visionColor: m.power_goals?.visions?.color || '#6366f1',
      })),
    ].sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Calculate total estimated time for today
    const totalEstimatedMinutes = dailyActions?.reduce((sum, a) => sum + (a.estimated_minutes || 0), 0) || 0;

    return NextResponse.json({
      date: today,
      totalActions,
      completedActions,
      totalEstimatedMinutes,
      completionPercentage: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0,
      actionsByVision: Object.values(actionsByVision),
      upcomingDeadlines: upcomingDeadlines.slice(0, 10),
    });
  } catch (error) {
    console.error('Get today\'s actions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today\'s actions' },
      { status: 500 }
    );
  }
}
