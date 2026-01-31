import { createAdminClient } from '@/lib/supabase/admin';

export interface DailyStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  isActiveToday: boolean;
}

export interface SuccessRate {
  totalDays: number;
  activeDays: number;
  rate: number; // percentage
  period: 'week' | 'month' | 'quarter' | 'year';
}

/**
 * Calculate daily streak from activity dates
 * A streak continues if user completed at least one action on consecutive days
 */
export function calculateDailyStreak(activityDates: string[]): { current: number; longest: number } {
  if (activityDates.length === 0) return { current: 0, longest: 0 };

  // Sort dates in descending order (most recent first)
  const sortedDates = [...new Set(activityDates)].sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  // Check if most recent activity was today or yesterday
  const lastDate = new Date(sortedDates[0]);
  lastDate.setHours(0, 0, 0, 0);
  const daysSinceLastActivity = Math.floor(
    (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Current streak only counts if activity was today or yesterday
  if (daysSinceLastActivity <= 1) {
    currentStreak = 1;
    const expectedDate = new Date(lastDate);

    for (let i = 1; i < sortedDates.length; i++) {
      expectedDate.setDate(expectedDate.getDate() - 1);
      const currentDate = new Date(sortedDates[i]);
      currentDate.setHours(0, 0, 0, 0);

      if (currentDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak (historical)
  let prevDate: Date | null = null;
  for (const dateStr of sortedDates) {
    const currentDate = new Date(dateStr);
    currentDate.setHours(0, 0, 0, 0);

    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const daysDiff = Math.floor(
        (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    prevDate = currentDate;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
}

/**
 * Get all dates where user had any completion activity
 */
export async function getUserActivityDates(userId: string, startDate: string, endDate: string): Promise<string[]> {
  const adminClient = createAdminClient();
  if (!adminClient) return [];

  // Gather activity dates from multiple sources
  const [kpiLogs, minsCompleted, dailyActions, nonNegotiables] = await Promise.all([
    // KPI completions
    adminClient
      .from('kpi_logs')
      .select('log_date')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .gte('log_date', startDate)
      .lte('log_date', endDate),

    // MINS completions
    adminClient
      .from('mins')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('completed_at', 'is', null),

    // Daily actions completed
    adminClient
      .from('daily_actions')
      .select('completed_at, action_date')
      .eq('user_id', userId)
      .eq('status', 'completed'),

    // Non-negotiable completions
    adminClient
      .from('non_negotiable_completions')
      .select('completion_date')
      .eq('user_id', userId)
      .gte('completion_date', startDate)
      .lte('completion_date', endDate),
  ]);

  const dates = new Set<string>();

  // Add KPI log dates
  kpiLogs.data?.forEach((row) => dates.add(row.log_date));

  // Add MINS completion dates
  minsCompleted.data?.forEach((row) => {
    if (row.completed_at) {
      dates.add(new Date(row.completed_at).toISOString().split('T')[0]);
    }
  });

  // Add daily action completion dates
  dailyActions.data?.forEach((row) => {
    const date = row.completed_at
      ? new Date(row.completed_at).toISOString().split('T')[0]
      : row.action_date;
    if (date >= startDate && date <= endDate) {
      dates.add(date);
    }
  });

  // Add non-negotiable completion dates
  nonNegotiables.data?.forEach((row) => dates.add(row.completion_date));

  return Array.from(dates).sort();
}

/**
 * Update user's daily streak in gamification table
 * Call this after any completion action
 */
export async function updateUserDailyStreak(userId: string): Promise<DailyStreak> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    throw new Error('Failed to create admin client');
  }

  // Get activity dates for last 400 days (covers full year + buffer)
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 400);
  const startDateStr = startDate.toISOString().split('T')[0];

  const activityDates = await getUserActivityDates(userId, startDateStr, endDate);
  const { current, longest } = calculateDailyStreak(activityDates);

  const today = endDate;
  const isActiveToday = activityDates.includes(today);

  // Update user_gamification with new streak values
  const { error } = await adminClient
    .from('user_gamification')
    .update({
      current_streak: current,
      longest_streak: Math.max(current, longest),
      last_activity_date: activityDates[activityDates.length - 1] || null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to update user streak:', error);
  }

  return {
    currentStreak: current,
    longestStreak: Math.max(current, longest),
    lastActivityDate: activityDates[activityDates.length - 1] || null,
    isActiveToday,
  };
}

/**
 * Calculate success rate for a given period
 */
export async function calculateSuccessRate(
  userId: string,
  period: 'week' | 'month' | 'quarter' | 'year'
): Promise<SuccessRate> {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'week':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'month':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case 'quarter':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case 'year':
      startDate.setDate(endDate.getDate() - 365);
      break;
  }

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const activityDates = await getUserActivityDates(userId, startDateStr, endDateStr);

  // Calculate total days in period
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const activeDays = activityDates.length;
  const rate = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;

  return { totalDays, activeDays, rate, period };
}
