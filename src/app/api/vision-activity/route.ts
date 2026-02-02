import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

interface DayActivity {
  date: string;
  score: number;
  affirmations: number;
  nonNegotiables: number;
  kpiLogs: number;
  reviews: number;
  goalsCompleted: number;
  clarity?: number;
  belief?: number;
  consistency?: number;
}

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
    const visionId = searchParams.get('visionId');

    // Calculate date range (last 365 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 364);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch all activity data in parallel
    const [
      affirmationsResult,
      nonNegotiablesResult,
      kpiLogsResult,
      reviewsResult,
      dailyActionsResult
    ] = await Promise.all([
      // Daily affirmation completions
      supabase
        .from('daily_affirmation_completions')
        .select('completion_date, vision_id')
        .eq('user_id', userId)
        .gte('completion_date', startDateStr)
        .lte('completion_date', endDateStr)
        .then(res => {
          if (visionId && res.data) {
            return { ...res, data: res.data.filter(d => d.vision_id === visionId) };
          }
          return res;
        }),

      // Non-negotiable completions (need to join with non_negotiables to filter by vision)
      visionId
        ? supabase
            .from('non_negotiable_completions')
            .select(`
              completion_date,
              completion_count,
              non_negotiables!inner(vision_id)
            `)
            .eq('user_id', userId)
            .eq('non_negotiables.vision_id', visionId)
            .gte('completion_date', startDateStr)
            .lte('completion_date', endDateStr)
        : supabase
            .from('non_negotiable_completions')
            .select('completion_date, completion_count')
            .eq('user_id', userId)
            .gte('completion_date', startDateStr)
            .lte('completion_date', endDateStr),

      // KPI logs (need to join with vision_kpis to filter by vision)
      visionId
        ? supabase
            .from('kpi_logs')
            .select(`
              log_date,
              is_completed,
              completion_count,
              vision_kpis!inner(vision_id)
            `)
            .eq('user_id', userId)
            .eq('vision_kpis.vision_id', visionId)
            .gte('log_date', startDateStr)
            .lte('log_date', endDateStr)
        : supabase
            .from('kpi_logs')
            .select('log_date, is_completed, completion_count')
            .eq('user_id', userId)
            .gte('log_date', startDateStr)
            .lte('log_date', endDateStr),

      // Daily reviews with 300% scores
      supabase
        .from('daily_reviews')
        .select('review_date, clarity_today, belief_today, consistency_today')
        .eq('user_id', userId)
        .gte('review_date', startDateStr)
        .lte('review_date', endDateStr),

      // Completed daily actions (goals) - use completed_at date for when it was actually done
      supabase
        .from('daily_actions')
        .select('completed_at, action_date, status')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
    ]);

    // Build activity map by date
    const activityMap = new Map<string, DayActivity>();

    // Initialize all dates with zero values
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      activityMap.set(dateStr, {
        date: dateStr,
        score: 0,
        affirmations: 0,
        nonNegotiables: 0,
        kpiLogs: 0,
        reviews: 0,
        goalsCompleted: 0
      });
    }

    // Process affirmation completions
    if (affirmationsResult.data) {
      for (const item of affirmationsResult.data) {
        const entry = activityMap.get(item.completion_date);
        if (entry) {
          entry.affirmations++;
        }
      }
    }

    // Process non-negotiable completions
    if (nonNegotiablesResult.data) {
      for (const item of nonNegotiablesResult.data) {
        const entry = activityMap.get(item.completion_date);
        if (entry) {
          entry.nonNegotiables += item.completion_count || 1;
        }
      }
    }

    // Process KPI logs
    if (kpiLogsResult.data) {
      for (const item of kpiLogsResult.data) {
        const entry = activityMap.get(item.log_date);
        if (entry) {
          if (item.is_completed || (item.completion_count && item.completion_count > 0)) {
            entry.kpiLogs++;
          }
        }
      }
    }

    // Process daily reviews and 300% scores
    if (reviewsResult.data) {
      // Group reviews by date (might have morning, midday, evening)
      const reviewsByDate = new Map<string, { count: number; clarity: number[]; belief: number[]; consistency: number[] }>();

      for (const item of reviewsResult.data) {
        if (!reviewsByDate.has(item.review_date)) {
          reviewsByDate.set(item.review_date, { count: 0, clarity: [], belief: [], consistency: [] });
        }
        const dateData = reviewsByDate.get(item.review_date)!;
        dateData.count++;
        if (item.clarity_today != null) dateData.clarity.push(item.clarity_today);
        if (item.belief_today != null) dateData.belief.push(item.belief_today);
        if (item.consistency_today != null) dateData.consistency.push(item.consistency_today);
      }

      for (const [date, data] of reviewsByDate) {
        const entry = activityMap.get(date);
        if (entry) {
          entry.reviews = data.count;
          if (data.clarity.length > 0) {
            entry.clarity = Math.round(data.clarity.reduce((a, b) => a + b, 0) / data.clarity.length);
          }
          if (data.belief.length > 0) {
            entry.belief = Math.round(data.belief.reduce((a, b) => a + b, 0) / data.belief.length);
          }
          if (data.consistency.length > 0) {
            entry.consistency = Math.round(data.consistency.reduce((a, b) => a + b, 0) / data.consistency.length);
          }
        }
      }
    }

    // Process completed daily actions (goals)
    if (dailyActionsResult.data) {
      for (const item of dailyActionsResult.data) {
        // Use the completed_at date (when actually completed) or fall back to action_date
        const completedDate = item.completed_at
          ? new Date(item.completed_at).toISOString().split('T')[0]
          : item.action_date;
        const entry = activityMap.get(completedDate);
        if (entry) {
          entry.goalsCompleted++;
        }
      }
    }

    // Calculate composite score for each day (0-100)
    // Weighted scoring:
    // - Goals completed: 20 points each (max 60)
    // - Affirmations: 15 points each (max 15)
    // - Non-negotiables: 10 points each (max 30)
    // - KPI logs: 15 points each (max 15)
    // - Reviews: 10 points each (max 30, for 3 reviews)
    // - 300% score average: 0-100 bonus if available, scaled to max 20
    // Total max: 170 points, normalized to 100
    for (const [, entry] of activityMap) {
      let score = 0;

      // Goals completed (max 60) - highest weight for actual goal progress
      score += Math.min(entry.goalsCompleted * 20, 60);

      // Affirmations (max 15)
      score += Math.min(entry.affirmations * 15, 15);

      // Non-negotiables (max 30)
      score += Math.min(entry.nonNegotiables * 10, 30);

      // KPI logs (max 15)
      score += Math.min(entry.kpiLogs * 15, 15);

      // Reviews (max 30)
      score += Math.min(entry.reviews * 10, 30);

      // 300% score bonus (if available, scale to 0-20)
      if (entry.clarity !== undefined && entry.belief !== undefined && entry.consistency !== undefined) {
        const avg300 = (entry.clarity + entry.belief + entry.consistency) / 3;
        score += Math.round((avg300 / 100) * 20);
      }

      // Normalize to 0-100
      entry.score = Math.min(Math.round(score * 100 / 170), 100);
    }

    // Convert to array and sort by date
    const activity = Array.from(activityMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Get vision activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vision activity' },
      { status: 500 }
    );
  }
}
