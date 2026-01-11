import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';

// Demo user ID for development
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
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const last7Days = format(subDays(today, 7), 'yyyy-MM-dd');
    const currentYear = today.getFullYear();

    // Fetch all data in parallel
    const [
      visionsResult,
      powerGoalsResult,
      minsResult,
      timeBlocksResult,
      reviewsResult,
      routineCompletionsResult,
    ] = await Promise.all([
      // Count visions
      supabase
        .from('visions')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .is('archived_at', null),

      // Count power goals
      supabase
        .from('power_goals')
        .select('id, status, progress_percentage')
        .eq('user_id', userId)
        .eq('year', currentYear),

      // Count MINS (today and week)
      supabase
        .from('mins')
        .select('id, status, scheduled_date')
        .eq('user_id', userId)
        .gte('scheduled_date', weekStart)
        .lte('scheduled_date', weekEnd),

      // Time blocks for DRIP distribution (last 7 days)
      supabase
        .from('time_blocks')
        .select('id, drip_quadrant, duration_minutes')
        .eq('user_id', userId)
        .gte('block_date', last7Days)
        .lte('block_date', todayStr),

      // Daily reviews (last 7 days for 300% rule)
      supabase
        .from('daily_reviews')
        .select('id, clarity_today, belief_today, consistency_today, review_date')
        .eq('user_id', userId)
        .gte('review_date', last7Days)
        .lte('review_date', todayStr),

      // Routine completions (today)
      supabase
        .from('routine_completions')
        .select('id, completion_percentage')
        .eq('user_id', userId)
        .eq('completion_date', todayStr),
    ]);

    // Process visions
    const visionCount = visionsResult.count || 0;

    // Process power goals
    const powerGoals = powerGoalsResult.data || [];
    const totalPowerGoals = powerGoals.length;
    const activePowerGoals = powerGoals.filter(g => g.status === 'active').length;
    const completedPowerGoals = powerGoals.filter(g => g.status === 'completed').length;
    const avgPowerGoalProgress = totalPowerGoals > 0
      ? Math.round(powerGoals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / totalPowerGoals)
      : 0;

    // Process MINS
    const allMins = minsResult.data || [];
    const todayMins = allMins.filter(m => m.scheduled_date === todayStr);
    const todayMinsTotal = todayMins.length;
    const todayMinsCompleted = todayMins.filter(m => m.status === 'completed').length;
    const weekMinsTotal = allMins.length;
    const weekMinsCompleted = allMins.filter(m => m.status === 'completed').length;
    const minsCompletionRate = todayMinsTotal > 0
      ? Math.round((todayMinsCompleted / todayMinsTotal) * 100)
      : 0;

    // Process time blocks for DRIP distribution
    const timeBlocks = timeBlocksResult.data || [];
    const dripDistribution: Record<string, number> = {
      delegation: 0,
      replacement: 0,
      investment: 0,
      production: 0,
    };
    let totalTimeMinutes = 0;

    timeBlocks.forEach(block => {
      const minutes = block.duration_minutes || 15;
      totalTimeMinutes += minutes;

      const quadrant = (block.drip_quadrant || 'production').toLowerCase();
      if (quadrant in dripDistribution) {
        dripDistribution[quadrant] += minutes;
      } else {
        dripDistribution.production += minutes;
      }
    });

    // Calculate DRIP percentages
    const dripPercentages = {
      delegation: totalTimeMinutes > 0 ? Math.round((dripDistribution.delegation / totalTimeMinutes) * 100) : 0,
      replacement: totalTimeMinutes > 0 ? Math.round((dripDistribution.replacement / totalTimeMinutes) * 100) : 0,
      investment: totalTimeMinutes > 0 ? Math.round((dripDistribution.investment / totalTimeMinutes) * 100) : 0,
      production: totalTimeMinutes > 0 ? Math.round((dripDistribution.production / totalTimeMinutes) * 100) : 0,
    };

    // Process daily reviews for 300% rule
    const reviews = reviewsResult.data || [];
    let avgClarity = 0;
    let avgBelief = 0;
    let avgConsistency = 0;

    if (reviews.length > 0) {
      const reviewsWithScores = reviews.filter(r =>
        r.clarity_today !== null && r.belief_today !== null && r.consistency_today !== null
      );

      if (reviewsWithScores.length > 0) {
        avgClarity = Math.round(
          reviewsWithScores.reduce((sum, r) => sum + (r.clarity_today || 0), 0) / reviewsWithScores.length
        );
        avgBelief = Math.round(
          reviewsWithScores.reduce((sum, r) => sum + (r.belief_today || 0), 0) / reviewsWithScores.length
        );
        avgConsistency = Math.round(
          reviewsWithScores.reduce((sum, r) => sum + (r.consistency_today || 0), 0) / reviewsWithScores.length
        );
      }
    }

    const threeHundredPercent = avgClarity + avgBelief + avgConsistency;

    // Process routine completions
    const routineCompletions = routineCompletionsResult.data || [];
    const avgRoutineCompletion = routineCompletions.length > 0
      ? Math.round(
          routineCompletions.reduce((sum, c) => sum + (c.completion_percentage || 0), 0) / routineCompletions.length
        )
      : 0;

    // Check today's reviews
    const todayReviews = reviews.filter(r => r.review_date === todayStr);
    const morningReviewDone = todayReviews.some(r => r.review_date === todayStr);
    const reviewsToday = todayReviews.length;

    return NextResponse.json({
      // Vision stats
      visionCount,

      // Power Goals stats
      powerGoals: {
        total: totalPowerGoals,
        active: activePowerGoals,
        completed: completedPowerGoals,
        avgProgress: avgPowerGoalProgress,
      },

      // MINS stats
      mins: {
        todayTotal: todayMinsTotal,
        todayCompleted: todayMinsCompleted,
        weekTotal: weekMinsTotal,
        weekCompleted: weekMinsCompleted,
        completionRate: minsCompletionRate,
      },

      // DRIP distribution
      drip: {
        distribution: dripPercentages,
        totalMinutes: totalTimeMinutes,
        totalHours: Math.round(totalTimeMinutes / 60 * 10) / 10,
      },

      // 300% Rule
      threeHundredRule: {
        clarity: avgClarity,
        belief: avgBelief,
        consistency: avgConsistency,
        total: threeHundredPercent,
      },

      // Routines
      routines: {
        todayCompletion: avgRoutineCompletion,
      },

      // Reviews
      reviews: {
        todayCount: reviewsToday,
        morningDone: morningReviewDone,
      },

      // Metadata
      date: todayStr,
      weekRange: {
        start: weekStart,
        end: weekEnd,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
