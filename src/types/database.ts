// Database types for Goal Achiever Pro

export type SubscriptionTier = 'free' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export type DripQuadrant = 'delegation' | 'replacement' | 'investment' | 'production';
export type EnergyRating = 'green' | 'yellow' | 'red';

export type GoalStatus = 'active' | 'completed' | 'abandoned' | 'archived';
export type GoalCategory = 'health' | 'wealth' | 'relationships' | 'personal_growth' | 'career' | 'other';

export type MinStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'delegated';
export type RoutineType = 'morning' | 'evening' | 'midday' | 'custom';
export type ReviewType = 'morning' | 'midday' | 'evening';

export type LeverageType = 'code' | 'content' | 'capital' | 'collaboration';
export type ActionType = 'automate' | 'delegate' | 'duplicate';

export type EnergyImpact = 'energizing' | 'neutral' | 'draining';
export type ConnectionFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

// User Profile
export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  timezone: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: Date | null;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Vision (SMART Goal)
export interface Vision {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  specific: string | null;
  measurable: string | null;
  attainable: string | null;
  realistic: string | null;
  timeBound: Date | null;
  clarityScore: number;
  beliefScore: number;
  consistencyScore: number;
  isActive: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Power Goal (12 annual projects)
export interface PowerGoal {
  id: string;
  userId: string;
  visionId: string | null;
  title: string;
  description: string | null;
  targetDate: Date | null;
  year: number;
  quarter: number | null;
  category: GoalCategory | null;
  progressPercentage: number;
  status: GoalStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Target Status
export type TargetStatus = 'pending' | 'in_progress' | 'completed';

// Monthly Target (Links to Power Goals)
export interface MonthlyTarget {
  id: string;
  userId: string;
  powerGoalId: string;
  title: string;
  description: string | null;
  targetMonth: number; // 1-12
  targetYear: number;
  keyMetric: string | null;
  targetValue: number | null;
  currentValue: number;
  status: TargetStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Weekly Target (Links to Monthly Targets)
export interface WeeklyTarget {
  id: string;
  userId: string;
  monthlyTargetId: string;
  title: string;
  description: string | null;
  weekNumber: number; // 1-5 within month
  weekStartDate: Date;
  weekEndDate: Date;
  keyMetric: string | null;
  targetValue: number | null;
  currentValue: number;
  status: TargetStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Daily Action (Links to Weekly Targets)
export interface DailyAction {
  id: string;
  userId: string;
  weeklyTargetId: string;
  title: string;
  description: string | null;
  actionDate: Date;
  estimatedMinutes: number;
  keyMetric: string | null;
  targetValue: number | null;
  currentValue: number;
  status: TargetStatus;
  completedAt: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// MINS (Most Important Next Steps)
export interface Min {
  id: string;
  userId: string;
  powerGoalId: string | null;
  title: string;
  description: string | null;
  scheduledDate: Date;
  scheduledTime: string | null;
  durationMinutes: number;
  priority: number;
  dripQuadrant: DripQuadrant | null;
  makesMoneyScore: number | null;
  energyScore: number | null;
  status: MinStatus;
  completedAt: Date | null;
  isRecurring: boolean;
  recurrenceRule: string | null;
  parentMinId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Time Block (15-minute increments)
export interface TimeBlock {
  id: string;
  userId: string;
  minId: string | null;
  blockDate: Date;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  activityName: string;
  activityCategory: string | null;
  notes: string | null;
  energyRating: EnergyRating;
  energyScore: number | null;
  dripQuadrant: DripQuadrant | null;
  makesMoneyScore: number | null;
  lightsUpScore: number | null;
  source: 'manual' | 'calendar_sync' | 'ai_suggested';
  externalEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Activity Category
export interface ActivityCategory {
  id: string;
  userId: string | null;
  name: string;
  color: string;
  icon: string | null;
  defaultDripQuadrant: DripQuadrant | null;
  defaultMakesMoneyScore: number | null;
  defaultEnergyScore: number | null;
  isSystemDefault: boolean;
  createdAt: Date;
}

// Audit Snapshot (weekly aggregation)
export interface AuditSnapshot {
  id: string;
  userId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  totalMinutes: number;
  delegationMinutes: number;
  replacementMinutes: number;
  investmentMinutes: number;
  productionMinutes: number;
  greenEnergyMinutes: number;
  yellowEnergyMinutes: number;
  redEnergyMinutes: number;
  productionRatio: number | null;
  energyBalanceScore: number | null;
  reflectionNotes: string | null;
  insights: Record<string, unknown> | null;
  createdAt: Date;
}

// Routine
export interface Routine {
  id: string;
  userId: string;
  name: string;
  type: RoutineType;
  description: string | null;
  targetDurationMinutes: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Routine Step
export interface RoutineStep {
  id: string;
  routineId: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  sortOrder: number;
  isOptional: boolean;
  createdAt: Date;
}

// Daily Review
export interface DailyReview {
  id: string;
  userId: string;
  reviewDate: Date;
  reviewType: ReviewType;
  wins: string[];
  challenges: string[];
  lessonsLearned: string | null;
  gratitude: string[];
  tomorrowFocus: string | null;
  productivityScore: number | null;
  energyLevel: number | null;
  moodScore: number | null;
  clarityToday: number | null;
  beliefToday: number | null;
  consistencyToday: number | null;
  createdAt: Date;
}

// Leverage Item (4 C's)
export interface LeverageItem {
  id: string;
  userId: string;
  powerGoalId: string | null;
  leverageType: LeverageType;
  actionType: ActionType;
  title: string;
  description: string | null;
  status: 'idea' | 'planning' | 'implementing' | 'active' | 'archived';
  implementationNotes: string | null;
  estimatedHoursSavedWeekly: number | null;
  actualHoursSavedWeekly: number | null;
  delegatedTo: string | null;
  delegationCostMonthly: number | null;
  resourceUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Friend Inventory
export interface FriendInventory {
  id: string;
  userId: string;
  name: string;
  relationshipType: string | null;
  energyImpact: EnergyImpact | null;
  energyScore: number | null;
  connectionFrequency: ConnectionFrequency | null;
  lastContactDate: Date | null;
  nextPlannedContact: Date | null;
  boundariesNotes: string | null;
  timeLimitWeeklyMinutes: number | null;
  notes: string | null;
  tags: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// North Star Metric
export interface NorthStarMetric {
  id: string;
  userId: string;
  visionId: string | null;
  name: string;
  description: string | null;
  unit: string;
  targetValue: number;
  currentValue: number;
  trackingFrequency: 'daily' | 'weekly' | 'monthly';
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Weekly Scorecard
export interface WeeklyScorecard {
  id: string;
  userId: string;
  weekStartDate: Date;
  weekEndDate: Date;
  overallScore: number | null;
  goalsProgressScore: number | null;
  minsCompletionRate: number | null;
  routineCompletionRate: number | null;
  timeInProductionRate: number | null;
  energyBalanceScore: number | null;
  avgClarity: number | null;
  avgBelief: number | null;
  avgConsistency: number | null;
  biggestWin: string | null;
  biggestChallenge: string | null;
  nextWeekFocus: string | null;
  createdAt: Date;
}
