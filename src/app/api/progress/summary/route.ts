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

    // Get all visions with their KPIs
    const { data: visions, error: visionsError } = await supabase
      .from('visions')
      .select(`
        id,
        title,
        color,
        vision_kpis (
          id,
          level,
          title,
          description,
          target_value,
          unit,
          numeric_target,
          tracking_method
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (visionsError) {
      console.error('Error fetching visions:', visionsError);
      return NextResponse.json({ error: 'Failed to fetch visions' }, { status: 500 });
    }

    // Get today's KPI logs
    const { data: todayLogs, error: logsError } = await supabase
      .from('vision_kpi_logs')
      .select('kpi_id, is_completed, value')
      .eq('user_id', userId)
      .eq('log_date', today);

    if (logsError) {
      console.error('Error fetching logs:', logsError);
    }

    const todayLogsMap = new Map(todayLogs?.map(l => [l.kpi_id, l]) || []);

    // Get streak data for all KPIs
    const allKpiIds = visions?.flatMap(v => v.vision_kpis?.map(k => k.id) || []) || [];

    const { data: streakData } = await supabase
      .from('vision_kpi_streaks')
      .select('kpi_id, current_streak, longest_streak, last_completed_date')
      .eq('user_id', userId)
      .in('kpi_id', allKpiIds);

    const streaksMap = new Map(streakData?.map(s => [s.kpi_id, s]) || []);

    // Calculate summary stats
    let totalKpis = 0;
    let completedToday = 0;
    let dailyKpisCount = 0;
    let maxStreak = 0;
    let totalStreaks = 0;

    const kpisByVision = visions?.map(vision => {
      const kpis = vision.vision_kpis || [];
      const dailyKpis = kpis.filter(k => k.level === 'daily');
      const weeklyKpis = kpis.filter(k => k.level === 'weekly');
      const monthlyKpis = kpis.filter(k => k.level === 'monthly');
      const quarterlyKpis = kpis.filter(k => k.level === 'quarterly');

      totalKpis += kpis.length;
      dailyKpisCount += dailyKpis.length;

      const completedDailyKpis = dailyKpis.filter(k => todayLogsMap.get(k.id)?.is_completed);
      completedToday += completedDailyKpis.length;

      // Get streaks for this vision
      const visionStreaks = kpis.map(k => {
        const streak = streaksMap.get(k.id);
        if (streak) {
          maxStreak = Math.max(maxStreak, streak.current_streak);
          totalStreaks += streak.current_streak;
        }
        return {
          kpiId: k.id,
          kpiTitle: k.title,
          currentStreak: streak?.current_streak || 0,
          longestStreak: streak?.longest_streak || 0,
        };
      }).filter(s => s.currentStreak > 0);

      return {
        visionId: vision.id,
        visionTitle: vision.title,
        visionColor: vision.color || '#6366f1',
        totalKpis: kpis.length,
        dailyKpis: dailyKpis.length,
        weeklyKpis: weeklyKpis.length,
        monthlyKpis: monthlyKpis.length,
        quarterlyKpis: quarterlyKpis.length,
        completedToday: completedDailyKpis.length,
        streaks: visionStreaks,
        kpis: kpis.map(k => ({
          id: k.id,
          title: k.title,
          level: k.level,
          targetValue: k.target_value,
          unit: k.unit,
          isCompletedToday: todayLogsMap.get(k.id)?.is_completed || false,
          currentStreak: streaksMap.get(k.id)?.current_streak || 0,
        })),
      };
    }) || [];

    // Get top streaks across all visions
    const allStreaks = kpisByVision
      .flatMap(v => v.streaks.map(s => ({
        ...s,
        visionTitle: v.visionTitle,
        visionColor: v.visionColor,
      })))
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, 10);

    // Get daily action completion stats
    const { data: dailyActionsStats } = await supabase
      .from('daily_actions')
      .select('status')
      .eq('user_id', userId)
      .eq('action_date', today);

    const actionsCompleted = dailyActionsStats?.filter(a => a.status === 'completed').length || 0;
    const actionsTotal = dailyActionsStats?.length || 0;

    return NextResponse.json({
      summary: {
        totalKpis,
        dailyKpisCount,
        completedToday,
        completionRate: dailyKpisCount > 0 ? Math.round((completedToday / dailyKpisCount) * 100) : 0,
        maxStreak,
        averageStreak: allKpiIds.length > 0 ? Math.round(totalStreaks / allKpiIds.length) : 0,
        actionsCompleted,
        actionsTotal,
        actionsCompletionRate: actionsTotal > 0 ? Math.round((actionsCompleted / actionsTotal) * 100) : 0,
      },
      kpisByVision,
      streakLeaderboard: allStreaks,
      date: today,
    });
  } catch (error) {
    console.error('Progress summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress summary' },
      { status: 500 }
    );
  }
}
