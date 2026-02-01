// Enhanced Streak Service (V2) with multiple streak types and recovery
import { createClient } from '@/lib/supabase/server';

export type StreakType = 'daily_execution' | 'check_in' | 'production' | 'project';

export interface UpdateStreakOptions {
  projectId?: string | null;
  isProduction?: boolean;
}

/**
 * Update streaks based on activity type
 * Returns array of streak types that were updated
 */
export async function updateStreakV2(
  userId: string,
  activityType: 'task_completed' | 'checkin_completed' | 'time_logged',
  options: UpdateStreakOptions = {}
): Promise<StreakType[]> {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error('Database connection failed');
  }

  const today = new Date().toISOString().split('T')[0];
  const updatedStreaks: StreakType[] = [];

  // Determine which streaks to update based on activity
  const streaksToUpdate: Array<{ type: StreakType; projectId: string | null }> = [];

  if (activityType === 'task_completed') {
    // Update daily execution streak (global)
    streaksToUpdate.push({ type: 'daily_execution', projectId: null });

    // Update project-specific streak if applicable
    if (options.projectId) {
      streaksToUpdate.push({ type: 'project', projectId: options.projectId });
    }
  }

  if (activityType === 'checkin_completed') {
    // Update check-in streak (global)
    streaksToUpdate.push({ type: 'check_in', projectId: null });
  }

  if (activityType === 'time_logged' && options.isProduction) {
    // Check if user has logged 4+ hours of production time today
    const productionHours = await getProductionHoursToday(supabase, userId);
    if (productionHours >= 4) {
      streaksToUpdate.push({ type: 'production', projectId: null });
    }
  }

  // Update each streak
  for (const { type, projectId } of streaksToUpdate) {
    const updated = await updateSingleStreak(supabase, userId, type, projectId, today);
    if (updated) {
      updatedStreaks.push(type);
    }
  }

  return updatedStreaks;
}

/**
 * Update a single streak record
 */
async function updateSingleStreak(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  streakType: StreakType,
  projectId: string | null,
  today: string
): Promise<boolean> {
  if (!supabase) return false;

  // Get or create streak record
  let query = supabase
    .from('streaks_v2')
    .select('*')
    .eq('user_id', userId)
    .eq('streak_type', streakType);

  if (projectId) {
    query = query.eq('project_id', projectId);
  } else {
    query = query.is('project_id', null);
  }

  const { data: existingStreak } = await query.single();

  if (!existingStreak) {
    // Create new streak record
    const { error } = await supabase
      .from('streaks_v2')
      .insert({
        user_id: userId,
        project_id: projectId,
        streak_type: streakType,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
        streak_start_date: today,
        recovery_used_this_week: false,
      });

    if (error) {
      console.error('Error creating streak:', error);
      return false;
    }
    return true;
  }

  // Check if already updated today
  if (existingStreak.last_activity_date === today) {
    return false; // Already counted for today
  }

  // Calculate if streak continues or resets
  const lastActivity = existingStreak.last_activity_date
    ? new Date(existingStreak.last_activity_date)
    : null;
  const todayDate = new Date(today);

  let newStreak = 1;
  let streakStart = today;
  let resetRecovery = false;

  if (lastActivity) {
    const daysSinceLastActivity = Math.floor(
      (todayDate.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastActivity === 1) {
      // Consecutive day - continue streak
      newStreak = existingStreak.current_streak + 1;
      streakStart = existingStreak.streak_start_date;
    } else if (daysSinceLastActivity > 1) {
      // Streak broken - reset
      newStreak = 1;
      streakStart = today;
    }
  }

  // Check if we need to reset weekly recovery flag (Monday)
  const dayOfWeek = todayDate.getDay();
  if (dayOfWeek === 1) { // Monday
    resetRecovery = true;
  }

  // Update streak
  const newLongestStreak = Math.max(existingStreak.longest_streak, newStreak);

  const updateData: Record<string, unknown> = {
    current_streak: newStreak,
    longest_streak: newLongestStreak,
    last_activity_date: today,
    streak_start_date: streakStart,
    updated_at: new Date().toISOString(),
  };

  if (resetRecovery) {
    updateData.recovery_used_this_week = false;
  }

  const { error } = await supabase
    .from('streaks_v2')
    .update(updateData)
    .eq('id', existingStreak.id);

  if (error) {
    console.error('Error updating streak:', error);
    return false;
  }

  return true;
}

/**
 * Get production hours logged today
 */
async function getProductionHoursToday(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  if (!supabase) return 0;

  const today = new Date().toISOString().split('T')[0];

  const { data: timeBlocks, error } = await supabase
    .from('time_blocks')
    .select('duration_minutes')
    .eq('user_id', userId)
    .eq('date', today)
    .eq('drip_quadrant', 'P'); // Production quadrant

  if (error || !timeBlocks) {
    return 0;
  }

  const totalMinutes = timeBlocks.reduce((sum, block) => sum + (block.duration_minutes || 0), 0);
  return totalMinutes / 60;
}

/**
 * Get all streaks for a user
 */
export async function getUserStreaks(userId: string): Promise<Array<{
  type: StreakType;
  current: number;
  longest: number;
  projectId: string | null;
  lastActivity: string | null;
}>> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: streaks, error } = await supabase
    .from('streaks_v2')
    .select('*')
    .eq('user_id', userId);

  if (error || !streaks) {
    return [];
  }

  return streaks.map(s => ({
    type: s.streak_type as StreakType,
    current: s.current_streak,
    longest: s.longest_streak,
    projectId: s.project_id,
    lastActivity: s.last_activity_date,
  }));
}

/**
 * Check if a streak is at risk (will break tomorrow if no activity)
 */
export async function getStreaksAtRisk(userId: string): Promise<StreakType[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const today = new Date().toISOString().split('T')[0];

  const { data: streaks, error } = await supabase
    .from('streaks_v2')
    .select('streak_type, last_activity_date, current_streak')
    .eq('user_id', userId)
    .neq('last_activity_date', today)
    .gt('current_streak', 0);

  if (error || !streaks) {
    return [];
  }

  // Check which streaks haven't been maintained today
  return streaks
    .filter(s => s.last_activity_date !== today && s.current_streak > 0)
    .map(s => s.streak_type as StreakType);
}
