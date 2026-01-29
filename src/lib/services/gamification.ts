import { createAdminClient } from '@/lib/supabase/admin';
import { LEVEL_THRESHOLDS, XP_REWARDS, type Achievement, type UserGamification } from '@/types/gamification';

export interface GamificationResult {
  xpAwarded: number;
  newLevel: number | null; // Only set if leveled up
  unlockedAchievements: Achievement[];
  currentXp: number;
  currentLevel: number;
}

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  // Handle levels beyond defined thresholds
  if (totalXp >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]) {
    const beyondXp = totalXp - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    level = LEVEL_THRESHOLDS.length + Math.floor(beyondXp / 1000);
  }
  return level;
}

/**
 * Get or create user gamification record
 */
export async function getOrCreateUserGamification(userId: string): Promise<UserGamification> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    throw new Error('Failed to create admin client');
  }

  const { data: existing } = await adminClient
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    return transformGamification(existing);
  }

  // Create new record
  const { data: created, error } = await adminClient
    .from('user_gamification')
    .insert({ user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return transformGamification(created);
}

/**
 * Award XP for an action and check for achievements
 */
export async function awardXp(
  userId: string,
  action: keyof typeof XP_REWARDS,
  metadata?: { kpiId?: string; streakCount?: number }
): Promise<GamificationResult> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    throw new Error('Failed to create admin client');
  }

  const xpAmount = XP_REWARDS[action];
  const gamification = await getOrCreateUserGamification(userId);

  const newTotalXp = gamification.totalXp + xpAmount;
  const previousLevel = gamification.currentLevel;
  const newLevel = calculateLevel(newTotalXp);
  const leveledUp = newLevel > previousLevel;

  // Update counters based on action
  const updates: Record<string, unknown> = {
    total_xp: newTotalXp,
    current_level: newLevel,
    updated_at: new Date().toISOString(),
    last_activity_date: new Date().toISOString().split('T')[0],
  };

  if (action === 'KPI_COMPLETED') {
    updates.kpis_completed = gamification.kpisCompleted + 1;
  } else if (action === 'VISION_CREATED') {
    updates.visions_created = gamification.visionsCreated + 1;
  }

  // Update streak if provided
  if (metadata?.streakCount !== undefined) {
    updates.current_streak = metadata.streakCount;
    if (metadata.streakCount > gamification.longestStreak) {
      updates.longest_streak = metadata.streakCount;
    }
  }

  await adminClient
    .from('user_gamification')
    .update(updates)
    .eq('user_id', userId);

  // Check for new achievements
  const unlockedAchievements = await checkAndUnlockAchievements(userId, {
    ...gamification,
    totalXp: newTotalXp,
    currentLevel: newLevel,
    kpisCompleted: (updates.kpis_completed as number) ?? gamification.kpisCompleted,
    visionsCreated: (updates.visions_created as number) ?? gamification.visionsCreated,
    currentStreak: (updates.current_streak as number) ?? gamification.currentStreak,
    longestStreak: (updates.longest_streak as number) ?? gamification.longestStreak,
  });

  // Award bonus XP for achievements
  let bonusXp = 0;
  for (const achievement of unlockedAchievements) {
    bonusXp += achievement.xpReward;
  }

  if (bonusXp > 0) {
    await adminClient
      .from('user_gamification')
      .update({
        total_xp: newTotalXp + bonusXp,
        current_level: calculateLevel(newTotalXp + bonusXp),
      })
      .eq('user_id', userId);
  }

  return {
    xpAwarded: xpAmount + bonusXp,
    newLevel: leveledUp ? newLevel : null,
    unlockedAchievements,
    currentXp: newTotalXp + bonusXp,
    currentLevel: calculateLevel(newTotalXp + bonusXp),
  };
}

/**
 * Check achievement conditions and unlock any earned
 */
async function checkAndUnlockAchievements(
  userId: string,
  stats: UserGamification
): Promise<Achievement[]> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return [];
  }

  // Get all achievements and user's unlocked ones
  const [{ data: allAchievements }, { data: userAchievements }] = await Promise.all([
    adminClient.from('achievements').select('*'),
    adminClient.from('user_achievements').select('achievement_id').eq('user_id', userId),
  ]);

  const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of allAchievements || []) {
    if (unlockedIds.has(achievement.id)) continue;

    const shouldUnlock = checkAchievementCondition(achievement, stats);
    if (shouldUnlock) {
      await adminClient.from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievement.id,
      });
      newlyUnlocked.push(transformAchievement(achievement));
    }
  }

  return newlyUnlocked;
}

/**
 * Check if achievement condition is met
 */
function checkAchievementCondition(
  achievement: { key: string; required_value: number | null },
  stats: UserGamification
): boolean {
  const required = achievement.required_value || 0;

  switch (achievement.key) {
    // Exploration
    case 'first_vision':
      return stats.visionsCreated >= 1;
    case 'first_kpi':
      return stats.kpisCompleted >= 1;

    // Milestones
    case 'kpi_10':
      return stats.kpisCompleted >= 10;
    case 'kpi_50':
      return stats.kpisCompleted >= 50;
    case 'kpi_100':
      return stats.kpisCompleted >= 100;
    case 'kpi_500':
      return stats.kpisCompleted >= 500;

    // Streaks
    case 'streak_7':
      return stats.longestStreak >= 7;
    case 'streak_30':
      return stats.longestStreak >= 30;
    case 'streak_100':
      return stats.longestStreak >= 100;

    // Mastery (levels)
    case 'level_5':
      return stats.currentLevel >= 5;
    case 'level_10':
      return stats.currentLevel >= 10;

    default:
      // Generic check for any achievement with required_value
      return false;
  }
}

// Transform database row to TypeScript type
function transformGamification(row: Record<string, unknown>): UserGamification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    totalXp: row.total_xp as number,
    currentLevel: row.current_level as number,
    kpisCompleted: row.kpis_completed as number,
    visionsCreated: row.visions_created as number,
    longestStreak: row.longest_streak as number,
    currentStreak: row.current_streak as number,
    lastActivityDate: row.last_activity_date as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function transformAchievement(row: Record<string, unknown>): Achievement {
  return {
    id: row.id as string,
    key: row.key as string,
    name: row.name as string,
    description: row.description as string,
    category: row.category as Achievement['category'],
    iconName: row.icon_name as string | null,
    xpReward: row.xp_reward as number,
    requiredValue: row.required_value as number | null,
    isSecret: row.is_secret as boolean,
    createdAt: new Date(row.created_at as string),
  };
}
