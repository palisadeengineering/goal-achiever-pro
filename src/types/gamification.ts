// Gamification Types for Goal Achiever Pro

export type AchievementCategory = 'milestone' | 'streak' | 'exploration' | 'mastery';

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  category: AchievementCategory;
  iconName: string | null;
  xpReward: number;
  requiredValue: number | null;
  isSecret: boolean;
  createdAt: Date;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  progressValue: number | null;
  achievement?: Achievement; // Joined data
}

export interface UserGamification {
  id: string;
  userId: string;
  totalXp: number;
  currentLevel: number;
  kpisCompleted: number;
  visionsCreated: number;
  longestStreak: number;
  currentStreak: number;
  lastActivityDate: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Level thresholds (XP required for each level)
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2100,   // Level 7
  2800,   // Level 8
  3600,   // Level 9
  4500,   // Level 10
  5500,   // Level 11+
] as const;

// XP rewards for actions
export const XP_REWARDS = {
  KPI_COMPLETED: 10,
  VISION_CREATED: 50,
  STREAK_DAY: 5,
  ACHIEVEMENT_BONUS: 25,
} as const;

// Helper function to calculate level from XP
export function calculateLevelFromXp(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

// Helper function to get XP needed for next level
export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    // Beyond defined levels, use linear progression
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (currentLevel - LEVEL_THRESHOLDS.length + 1) * 1000;
  }
  return LEVEL_THRESHOLDS[currentLevel];
}

// Helper function to get progress percentage to next level
export function getLevelProgress(totalXp: number): number {
  const currentLevel = calculateLevelFromXp(totalXp);
  const currentLevelXp = currentLevel <= LEVEL_THRESHOLDS.length
    ? LEVEL_THRESHOLDS[currentLevel - 1]
    : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (currentLevel - LEVEL_THRESHOLDS.length) * 1000;
  const nextLevelXp = getXpForNextLevel(currentLevel);

  const xpIntoLevel = totalXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;

  return Math.min(100, Math.floor((xpIntoLevel / xpNeeded) * 100));
}
