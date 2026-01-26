import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const today = new Date().toISOString().split('T')[0];

    // Get start and end of current week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekStart = startOfWeek.toISOString().split('T')[0];
    const weekEnd = new Date(startOfWeek);
    weekEnd.setDate(startOfWeek.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // Get current month and quarter
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentQuarter = Math.ceil(currentMonth / 3);

    // 1. Fetch all daily KPIs for the user with vision info
    const { data: dailyKpisRaw, error: dailyError } = await supabase
      .from('vision_kpis')
      .select(`
        id,
        title,
        description,
        target_value,
        unit,
        tracking_method,
        best_time,
        time_required,
        why_it_matters,
        vision_id,
        visions (
          id,
          title,
          color
        )
      `)
      .eq('user_id', userId)
      .eq('level', 'daily')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (dailyError) {
      console.error('Error fetching daily KPIs:', dailyError);
      return NextResponse.json({ error: 'Failed to fetch daily KPIs' }, { status: 500 });
    }

    // 2. For each daily KPI, get today's log and streak
    const dailyKpis = await Promise.all(
      (dailyKpisRaw || []).map(async (kpi) => {
        // Get today's log
        const { data: todayLog } = await supabase
          .from('kpi_logs')
          .select('is_completed, value')
          .eq('kpi_id', kpi.id)
          .eq('log_date', today)
          .single();

        // Get streak
        const { data: streak } = await supabase
          .from('kpi_streaks')
          .select('current_streak, longest_streak, last_completed_date')
          .eq('kpi_id', kpi.id)
          .single();

        return {
          id: kpi.id,
          title: kpi.title,
          description: kpi.description,
          target_value: kpi.target_value,
          unit: kpi.unit,
          tracking_method: kpi.tracking_method || 'checkbox',
          best_time: kpi.best_time,
          time_required: kpi.time_required,
          why_it_matters: kpi.why_it_matters,
          vision_id: kpi.vision_id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          vision_title: (kpi.visions as any)?.title,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          vision_color: (kpi.visions as any)?.color,
          is_completed_today: todayLog?.is_completed || false,
          today_value: todayLog?.value || null,
          streak: streak || { current_streak: 0, longest_streak: 0, last_completed_date: null },
        };
      })
    );

    // 3. Fetch weekly KPIs with this week's progress
    const { data: weeklyKpisRaw, error: weeklyError } = await supabase
      .from('vision_kpis')
      .select('id, title, description, target_value, unit, category, numeric_target')
      .eq('user_id', userId)
      .eq('level', 'weekly')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (weeklyError) {
      console.error('Error fetching weekly KPIs:', weeklyError);
    }

    // Get logs for this week for each weekly KPI
    const weeklyKpis = await Promise.all(
      (weeklyKpisRaw || []).map(async (kpi) => {
        const { data: weekLogs } = await supabase
          .from('kpi_logs')
          .select('value, is_completed')
          .eq('kpi_id', kpi.id)
          .gte('log_date', weekStart)
          .lte('log_date', weekEndStr);

        const currentWeekValue = weekLogs?.reduce((sum, log) => {
          return sum + (log.value || (log.is_completed ? 1 : 0));
        }, 0) || 0;

        return {
          id: kpi.id,
          title: kpi.title,
          target_value: kpi.target_value,
          unit: kpi.unit,
          category: kpi.category,
          numeric_target: kpi.numeric_target,
          current_week_value: currentWeekValue,
        };
      })
    );

    // 4. Fetch monthly KPIs with this month's progress
    const { data: monthlyKpisRaw } = await supabase
      .from('vision_kpis')
      .select('id, title, target_value, unit, numeric_target')
      .eq('user_id', userId)
      .eq('level', 'monthly')
      .eq('month', currentMonth)
      .eq('is_active', true);

    // Get logs for this month for each monthly KPI
    const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const monthEnd = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    const monthlyKpis = await Promise.all(
      (monthlyKpisRaw || []).map(async (kpi) => {
        const { data: monthLogs } = await supabase
          .from('kpi_logs')
          .select('value, is_completed')
          .eq('kpi_id', kpi.id)
          .gte('log_date', monthStart)
          .lte('log_date', monthEnd);

        const currentMonthValue = monthLogs?.reduce((sum, log) => {
          return sum + (log.value || (log.is_completed ? 1 : 0));
        }, 0) || 0;

        return {
          id: kpi.id,
          title: kpi.title,
          target_value: kpi.target_value,
          unit: kpi.unit,
          numeric_target: kpi.numeric_target,
          current_month_value: currentMonthValue,
        };
      })
    );

    // 5. Fetch quarterly KPIs with progress from cache
    const { data: quarterlyKpisRaw } = await supabase
      .from('vision_kpis')
      .select(`
        id,
        title,
        progress,
        kpi_progress_cache (
          progress_percentage
        )
      `)
      .eq('user_id', userId)
      .eq('level', 'quarterly')
      .eq('quarter', currentQuarter)
      .eq('is_active', true);

    // 6. Calculate summary stats
    const completedToday = dailyKpis.filter((k) => k.is_completed_today).length;
    const bestStreak = Math.max(0, ...dailyKpis.map((k) => k.streak?.longest_streak || 0));
    const totalStreakDays = dailyKpis.reduce((sum, k) => sum + (k.streak?.current_streak || 0), 0);

    // Calculate weekly progress (average of all weekly KPIs)
    const weeklyProgress = weeklyKpis.length > 0
      ? Math.round(
          weeklyKpis.reduce((sum, k) => {
            const target = k.numeric_target || parseFloat(k.target_value || '1') || 1;
            return sum + (k.current_week_value / target) * 100;
          }, 0) / weeklyKpis.length
        )
      : 0;

    // Calculate monthly progress
    const monthlyProgress = monthlyKpis.length > 0
      ? Math.round(
          monthlyKpis.reduce((sum, k) => {
            const target = k.numeric_target || parseFloat(k.target_value || '1') || 1;
            return sum + (k.current_month_value / target) * 100;
          }, 0) / monthlyKpis.length
        )
      : 0;

    // Calculate quarterly progress from cached progress or KPI progress field
    const quarterlyProgress = quarterlyKpisRaw && quarterlyKpisRaw.length > 0
      ? Math.round(
          quarterlyKpisRaw.reduce((sum, k) => {
            // Use cached progress if available, otherwise use progress field
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cached = (k.kpi_progress_cache as any)?.[0]?.progress_percentage;
            const progress = cached ?? k.progress ?? 0;
            return sum + progress;
          }, 0) / quarterlyKpisRaw.length
        )
      : 0;

    return NextResponse.json({
      dailyKpis,
      weeklyKpis,
      monthlyKpis,
      summary: {
        totalDailyKpis: dailyKpis.length,
        completedToday,
        bestStreak,
        totalStreakDays,
        weeklyProgress: Math.min(100, weeklyProgress),
        monthlyProgress: Math.min(100, monthlyProgress),
        quarterlyProgress: Math.min(100, quarterlyProgress),
      },
    });
  } catch (error) {
    console.error('KPI Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPI dashboard' },
      { status: 500 }
    );
  }
}
