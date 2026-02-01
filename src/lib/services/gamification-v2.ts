// Enhanced Gamification Service (V2) with XP combos and multipliers
import { createClient } from '@/lib/supabase/server';

// XP rewards for V2 actions
export const XP_REWARDS_V2 = {
  TASK_COMPLETE: 10,
  TASK_HIGH_PRIORITY_BONUS: 0.5, // +50%
  TASK_BEFORE_DEADLINE_BONUS: 0.25, // +25%
  TIME_BLOCK_LOGGED: 5,
  TIME_BLOCK_PRODUCTION_BONUS: 0.25, // +25%
  DAILY_CHECKIN: 15,
  STREAK_DAY_BONUS: 0.1, // +10% per day, caps at 100%
  STREAK_MAX_BONUS: 1.0, // Cap at +100%
  KEY_RESULT_PROGRESS: 50,
  MILESTONE_UNLOCK_BONUS: 1.0, // +100%
  MILESTONE_COMPLETE: 200,
  KR_IMPROVED_BONUS: 0.25, // +25% per KR improved
  PERFECT_300_BONUS: 0.5, // +50%
} as const;

// Level thresholds
export const LEVEL_THRESHOLDS_V2 = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  450,    // Level 4
  700,    // Level 5
  1000,   // Level 6 - Custom themes unlock
  1400,   // Level 7
  1900,   // Level 8
  2500,   // Level 9
  3200,   // Level 10 - Advanced analytics unlock
  4000,   // Level 11 - AI scheduling priority
  5000,   // Level 12
  6200,   // Level 13
  7600,   // Level 14
  9200,   // Level 15
  11000,  // Level 16
  13000,  // Level 17
  15200,  // Level 18
  17600,  // Level 19
  20200,  // Level 20
  23000,  // Level 21+ - Prestige badges
] as const;

export type XpActionType =
  | 'TASK_COMPLETE'
  | 'TIME_BLOCK_LOGGED'
  | 'DAILY_CHECKIN'
  | 'KEY_RESULT_PROGRESS'
  | 'MILESTONE_COMPLETE';

export interface XpAwardOptions {
  // Task-specific
  isHighPriority?: boolean;
  beforeDeadline?: boolean;
  isProduction?: boolean;

  // Streak bonus
  currentStreak?: number;

  // Check-in specific
  isPerfect300?: boolean;

  // Key Result specific
  milestoneUnlocked?: boolean;

  // Milestone specific
  improvedKRCount?: number;

  // General
  projectId?: string | null;
}

export interface XpAwardResult {
  baseXp: number;
  multipliers: Array<{ name: string; value: number }>;
  totalXp: number;
  newTotalXp: number;
  leveledUp: boolean;
  newLevel: number;
  comboName: string | null;
}

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS_V2.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS_V2[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Get XP needed for next level
 */
export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS_V2.length) {
    // After max level, each level is +3000 XP
    return LEVEL_THRESHOLDS_V2[LEVEL_THRESHOLDS_V2.length - 1] + (currentLevel - LEVEL_THRESHOLDS_V2.length + 1) * 3000;
  }
  return LEVEL_THRESHOLDS_V2[currentLevel];
}

/**
 * Get progress percentage to next level
 */
export function getLevelProgress(totalXp: number): number {
  const currentLevel = calculateLevel(totalXp);
  const currentLevelXp = currentLevel > 1 ? LEVEL_THRESHOLDS_V2[currentLevel - 1] : 0;
  const nextLevelXp = getXpForNextLevel(currentLevel);
  const xpInCurrentLevel = totalXp - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  return Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100));
}

/**
 * Award XP with multipliers and combos
 */
export async function awardXpV2(
  userId: string,
  action: XpActionType,
  options: XpAwardOptions = {}
): Promise<XpAwardResult> {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error('Database connection failed');
  }

  // Get base XP for action
  let baseXp = 0;
  switch (action) {
    case 'TASK_COMPLETE':
      baseXp = XP_REWARDS_V2.TASK_COMPLETE;
      break;
    case 'TIME_BLOCK_LOGGED':
      baseXp = XP_REWARDS_V2.TIME_BLOCK_LOGGED;
      break;
    case 'DAILY_CHECKIN':
      baseXp = XP_REWARDS_V2.DAILY_CHECKIN;
      break;
    case 'KEY_RESULT_PROGRESS':
      baseXp = XP_REWARDS_V2.KEY_RESULT_PROGRESS;
      break;
    case 'MILESTONE_COMPLETE':
      baseXp = XP_REWARDS_V2.MILESTONE_COMPLETE;
      break;
  }

  // Calculate multipliers
  const multipliers: Array<{ name: string; value: number }> = [];
  let totalMultiplier = 1.0;

  // Task-specific multipliers
  if (action === 'TASK_COMPLETE') {
    if (options.isHighPriority) {
      multipliers.push({ name: 'High Priority', value: XP_REWARDS_V2.TASK_HIGH_PRIORITY_BONUS });
      totalMultiplier += XP_REWARDS_V2.TASK_HIGH_PRIORITY_BONUS;
    }
    if (options.beforeDeadline) {
      multipliers.push({ name: 'Before Deadline', value: XP_REWARDS_V2.TASK_BEFORE_DEADLINE_BONUS });
      totalMultiplier += XP_REWARDS_V2.TASK_BEFORE_DEADLINE_BONUS;
    }
    if (options.isProduction) {
      multipliers.push({ name: 'Production Time', value: XP_REWARDS_V2.TIME_BLOCK_PRODUCTION_BONUS });
      totalMultiplier += XP_REWARDS_V2.TIME_BLOCK_PRODUCTION_BONUS;
    }
  }

  // Time block multipliers
  if (action === 'TIME_BLOCK_LOGGED' && options.isProduction) {
    multipliers.push({ name: 'Production Quadrant', value: XP_REWARDS_V2.TIME_BLOCK_PRODUCTION_BONUS });
    totalMultiplier += XP_REWARDS_V2.TIME_BLOCK_PRODUCTION_BONUS;
  }

  // Streak bonus (applies to all actions)
  if (options.currentStreak && options.currentStreak > 0) {
    const streakBonus = Math.min(
      options.currentStreak * XP_REWARDS_V2.STREAK_DAY_BONUS,
      XP_REWARDS_V2.STREAK_MAX_BONUS
    );
    multipliers.push({ name: `${options.currentStreak}-Day Streak`, value: streakBonus });
    totalMultiplier += streakBonus;
  }

  // Check-in specific multipliers
  if (action === 'DAILY_CHECKIN' && options.isPerfect300) {
    multipliers.push({ name: 'Perfect 300', value: XP_REWARDS_V2.PERFECT_300_BONUS });
    totalMultiplier += XP_REWARDS_V2.PERFECT_300_BONUS;
  }

  // Key Result specific multipliers
  if (action === 'KEY_RESULT_PROGRESS' && options.milestoneUnlocked) {
    multipliers.push({ name: 'Milestone Unlocked', value: XP_REWARDS_V2.MILESTONE_UNLOCK_BONUS });
    totalMultiplier += XP_REWARDS_V2.MILESTONE_UNLOCK_BONUS;
  }

  // Milestone specific multipliers
  if (action === 'MILESTONE_COMPLETE' && options.improvedKRCount && options.improvedKRCount > 0) {
    const krBonus = options.improvedKRCount * XP_REWARDS_V2.KR_IMPROVED_BONUS;
    multipliers.push({ name: `${options.improvedKRCount} KRs Improved`, value: krBonus });
    totalMultiplier += krBonus;
  }

  // Calculate total XP
  const totalXp = Math.round(baseXp * totalMultiplier);

  // Determine combo name based on multiplier count
  let comboName: string | null = null;
  if (multipliers.length >= 4) {
    comboName = 'LEGENDARY COMBO!';
  } else if (multipliers.length >= 3) {
    comboName = 'MEGA COMBO!';
  } else if (multipliers.length >= 2) {
    comboName = 'COMBO!';
  }

  // Get current user XP
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('total_xp, current_level')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    throw new Error('Failed to fetch user profile');
  }

  const currentTotalXp = profile?.total_xp || 0;
  const newTotalXp = currentTotalXp + totalXp;
  const currentLevel = profile?.current_level || calculateLevel(currentTotalXp);
  const newLevel = calculateLevel(newTotalXp);
  const leveledUp = newLevel > currentLevel;

  // Update user XP
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      total_xp: newTotalXp,
      current_level: newLevel,
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating user XP:', updateError);
    throw new Error('Failed to update user XP');
  }

  return {
    baseXp,
    multipliers,
    totalXp,
    newTotalXp,
    leveledUp,
    newLevel,
    comboName,
  };
}
