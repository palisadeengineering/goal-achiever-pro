import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Get filter params
    const { searchParams } = new URL(request.url);
    const assigneeFilter = searchParams.get('assignee'); // 'all', 'me', or a team member ID

    // Build query for today's daily actions with their full hierarchy
    let query = supabase
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

    // Apply assignee filter
    if (assigneeFilter === 'me') {
      // Show only tasks assigned to current user or unassigned
      query = query.or(`assignee_id.eq.${userId},assignee_id.is.null`);
    } else if (assigneeFilter && assigneeFilter !== 'all') {
      // Filter by specific team member ID
      query = query.eq('assignee_id', assigneeFilter);
    }
    // 'all' or no filter shows everything

    const { data: dailyActions, error: actionsError } = await query;

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(upcomingWeekly || []).map((w: any) => ({
        type: 'weekly' as const,
        id: w.id,
        title: w.title,
        dueDate: w.week_end_date,
        daysRemaining: Math.ceil((new Date(w.week_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        visionTitle: w.monthly_targets?.power_goals?.visions?.title || 'Unassigned',
        visionColor: w.monthly_targets?.power_goals?.visions?.color || '#6366f1',
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// PUT: Bulk complete/uncomplete today's actions
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { action, actionIds } = body;

    if (!action || !['complete', 'uncomplete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "complete" or "uncomplete"' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const newStatus = action === 'complete' ? 'completed' : 'pending';

    // Build query
    let query = supabase
      .from('daily_actions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('action_date', today);

    // If specific action IDs provided, filter to those
    if (actionIds && Array.isArray(actionIds) && actionIds.length > 0) {
      query = query.in('id', actionIds);
    } else {
      // Only complete pending or uncomplete completed
      query = query.eq('status', action === 'complete' ? 'pending' : 'completed');
    }

    const { data, error } = await query.select('id');

    if (error) {
      console.error('Error bulk updating actions:', error);
      return NextResponse.json(
        { error: 'Failed to update actions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      action,
      message: `${data?.length || 0} actions ${action === 'complete' ? 'completed' : 'marked as pending'}`,
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update actions' },
      { status: 500 }
    );
  }
}

// POST: Bulk sync today's actions to calendar
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { actionIds } = body;
    const today = new Date().toISOString().split('T')[0];

    // Get actions to sync
    let query = supabase
      .from('daily_actions')
      .select('id, title, description, action_date, estimated_minutes, scheduled_start_time')
      .eq('user_id', userId)
      .eq('action_date', today)
      .is('calendar_event_id', null)
      .neq('status', 'completed');

    if (actionIds && Array.isArray(actionIds) && actionIds.length > 0) {
      query = query.in('id', actionIds);
    }

    const { data: actions, error } = await query;

    if (error) {
      console.error('Error fetching actions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch actions for sync' },
        { status: 500 }
      );
    }

    if (!actions || actions.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'No actions to sync',
      });
    }

    // Return the action IDs that need syncing - actual sync is done by calendar endpoint
    return NextResponse.json({
      success: true,
      needsSync: actions.length,
      actionIds: actions.map(a => a.id),
      message: `${actions.length} actions ready for calendar sync`,
    });
  } catch (error) {
    console.error('Prepare sync error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare actions for sync' },
      { status: 500 }
    );
  }
}
