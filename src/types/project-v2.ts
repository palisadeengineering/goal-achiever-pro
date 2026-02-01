// Project System V2 Types for Goal Achiever Pro
// Unified project management with SMART goals, 300% Rule, and gamification

// =============================================
// ENUMS
// =============================================

export type RewardTriggerType = 'milestone' | 'key_result' | 'xp_threshold';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';
export type FourCsType = 'code' | 'content' | 'capital' | 'collaboration';
export type StreakType = 'daily_execution' | 'check_in' | 'production' | 'project';
export type ValueQuadrant = 'D' | 'R' | 'I' | 'P'; // Delegation, Replacement, Investment, Production

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';
export type KeyResultStatus = 'not_started' | 'in_progress' | 'at_risk' | 'on_track' | 'completed';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type RewardStatus = 'locked' | 'unlocked' | 'claimed';
export type CalendarSyncStatus = 'not_synced' | 'synced' | 'pending' | 'error';
export type UnitType = 'number' | 'currency' | 'percentage' | 'boolean';

// =============================================
// REVENUE MATH (Hormozi-style calculations)
// =============================================

export interface RevenueMath {
  currentRevenue?: number;
  targetRevenue?: number;
  avgDealValue?: number;
  dealsPerYear?: number;
  closeRate?: number; // 0-100
  dealsNeeded?: number;
  proposalsNeeded?: number;
  leadsNeeded?: number;
  leadSources?: string[];
}

// =============================================
// PROJECT (replaces Vision)
// =============================================

export interface Project {
  id: string;
  userId: string;

  // Basic Info
  title: string;
  description: string | null;
  color: string;

  // SMART Goal Components
  specific: string | null;
  measurable: string | null;
  attainable: string | null;
  realistic: string | null;
  timeBound: string | null; // Date string

  // Timeline
  startDate: string | null;
  targetDate: string | null;

  // 300% Rule Scores (latest values)
  clarityScore: number;
  beliefScore: number;
  consistencyScore: number;

  // Revenue Math (for money goals)
  revenueMath: RevenueMath;

  // Focus & Priority
  isFocused: boolean;
  priority: number;

  // Progress
  progressPercentage: number;

  // Vision Board
  coverImageUrl: string | null;
  affirmationText: string | null;

  // Status
  status: ProjectStatus;
  completedAt: Date | null;
  archivedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  // Relations (when joined)
  keyResults?: ProjectKeyResult[];
  milestones?: MilestoneV2[];
  tasks?: Task[];
  dailyCheckins?: DailyCheckIn[];
  streaks?: StreakV2[];
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  color?: string;
  specific?: string;
  measurable?: string;
  attainable?: string;
  realistic?: string;
  timeBound?: string;
  startDate?: string;
  targetDate?: string;
  revenueMath?: RevenueMath;
  isFocused?: boolean;
  priority?: number;
  coverImageUrl?: string;
  affirmationText?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  clarityScore?: number;
  beliefScore?: number;
  consistencyScore?: number;
  progressPercentage?: number;
  status?: ProjectStatus;
}

// =============================================
// PROJECT KEY RESULT (measurable outcomes)
// =============================================

export interface ProjectKeyResult {
  id: string;
  userId: string;
  projectId: string;

  // Metric Definition
  name: string;
  description: string | null;

  // Values
  targetValue: number;
  currentValue: number;
  startingValue: number;

  // Unit & Display
  unitType: UnitType;
  unitLabel: string | null;

  // Weight for project progress
  weight: number;

  // Progress
  progressPercentage: number;

  // Status
  status: KeyResultStatus;
  completedAt: Date | null;

  // Ordering
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;

  // Relations
  project?: Project;
  logs?: ProjectKeyResultLog[];
  tasks?: Task[];
}

export interface CreateKeyResultInput {
  projectId: string;
  name: string;
  description?: string;
  targetValue: number;
  startingValue?: number;
  unitType?: UnitType;
  unitLabel?: string;
  weight?: number;
  sortOrder?: number;
}

export interface UpdateKeyResultInput extends Partial<Omit<CreateKeyResultInput, 'projectId'>> {
  currentValue?: number;
  status?: KeyResultStatus;
}

// =============================================
// PROJECT KEY RESULT LOG (progress history)
// =============================================

export interface ProjectKeyResultLog {
  id: string;
  userId: string;
  keyResultId: string;

  previousValue: number | null;
  newValue: number;

  note: string | null;
  source: 'manual' | 'api' | 'automation';

  loggedAt: Date;
  createdAt: Date;

  // Relations
  keyResult?: ProjectKeyResult;
}

export interface LogKeyResultProgressInput {
  keyResultId: string;
  newValue: number;
  note?: string;
  source?: 'manual' | 'api' | 'automation';
}

// =============================================
// MILESTONE V2 (quarterly checkpoints)
// =============================================

export interface MilestoneV2 {
  id: string;
  userId: string;
  projectId: string;

  // Basic Info
  title: string;
  description: string | null;

  // Timeline
  quarter: number | null; // 1-4
  year: number | null;
  targetDate: string | null;

  // Linked Key Results
  linkedKeyResultIds: string[];

  // Progress
  progressPercentage: number;
  status: MilestoneStatus;
  completedAt: Date | null;

  // Ordering
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;

  // Relations
  project?: Project;
  tasks?: Task[];
}

export interface CreateMilestoneInput {
  projectId: string;
  title: string;
  description?: string;
  quarter?: number;
  year?: number;
  targetDate?: string;
  linkedKeyResultIds?: string[];
  sortOrder?: number;
}

export interface UpdateMilestoneInput extends Partial<Omit<CreateMilestoneInput, 'projectId'>> {
  progressPercentage?: number;
  status?: MilestoneStatus;
}

// =============================================
// TASK (unified task system)
// =============================================

export interface Task {
  id: string;
  userId: string;
  projectId: string | null;
  milestoneId: string | null;
  keyResultId: string | null;

  // Basic Info
  title: string;
  description: string | null;

  // Time Estimation
  estimatedMinutes: number;
  actualMinutes: number | null;

  // Scheduling
  scheduledDate: string | null;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  dueDate: string | null;

  // Priority
  priority: TaskPriority;

  // Categorization
  valueQuadrant: ValueQuadrant | null;
  fourCsTag: FourCsType | null;

  // Recurrence
  recurrence: TaskRecurrence;
  recurrenceRule: string | null;
  parentTaskId: string | null;

  // Google Calendar Integration
  googleCalendarEventId: string | null;
  calendarSyncStatus: CalendarSyncStatus;
  calendarSyncedAt: Date | null;

  // Status
  status: TaskStatus;
  completedAt: Date | null;

  // XP awarded
  xpAwarded: number;

  // Ordering
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;

  // Relations
  project?: Project;
  milestone?: MilestoneV2;
  keyResult?: ProjectKeyResult;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId?: string;
  milestoneId?: string;
  keyResultId?: string;
  estimatedMinutes?: number;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  dueDate?: string;
  priority?: TaskPriority;
  valueQuadrant?: ValueQuadrant;
  fourCsTag?: FourCsType;
  recurrence?: TaskRecurrence;
  recurrenceRule?: string;
  sortOrder?: number;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  actualMinutes?: number;
  status?: TaskStatus;
  googleCalendarEventId?: string;
  calendarSyncStatus?: CalendarSyncStatus;
}

export interface CompleteTaskResult {
  task: Task;
  xpAwarded: number;
  comboMultiplier: number;
  streaksUpdated: StreakType[];
  achievementsUnlocked: string[];
  rewardsUnlocked: string[];
}

// =============================================
// DAILY CHECK-IN (300% score tracking)
// =============================================

export interface DailyCheckIn {
  id: string;
  userId: string;
  projectId: string | null;

  checkInDate: string;

  // 300% Scores (1-10 each)
  clarityScore: number;
  beliefScore: number;
  consistencyScore: number;

  // Total (sum * 10 = max 300)
  totalScore: number;

  note: string | null;
  promptsTriggered: string[];
  xpAwarded: number;

  createdAt: Date;
  updatedAt: Date;

  // Relations
  project?: Project;
}

export interface CreateCheckInInput {
  projectId?: string;
  clarityScore: number; // 1-10
  beliefScore: number;  // 1-10
  consistencyScore: number; // 1-10
  note?: string;
}

export interface CheckInResult {
  checkIn: DailyCheckIn;
  xpAwarded: number;
  promptsTriggered: ('low_clarity' | 'low_belief' | 'low_consistency')[];
  streakUpdated: boolean;
  newStreakLength: number;
}

// =============================================
// STREAK V2 (enhanced streak tracking)
// =============================================

export interface StreakV2 {
  id: string;
  userId: string;
  projectId: string | null;

  streakType: StreakType;

  currentStreak: number;
  longestStreak: number;

  lastActivityDate: string | null;
  streakStartDate: string | null;

  recoveryUsedThisWeek: boolean;
  lastRecoveryDate: string | null;

  createdAt: Date;
  updatedAt: Date;

  // Relations
  project?: Project;
}

export interface StreakRecoveryResult {
  success: boolean;
  streak: StreakV2;
  message: string;
}

// =============================================
// REWARD (custom user rewards)
// =============================================

export interface Reward {
  id: string;
  userId: string;

  name: string;
  description: string | null;
  imageUrl: string | null;
  estimatedValue: number | null;

  triggerType: RewardTriggerType;
  triggerId: string | null; // milestone_id or key_result_id
  triggerValue: number | null; // XP threshold

  progressPercentage: number;
  currentProgress: number;

  status: RewardStatus;
  unlockedAt: Date | null;

  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;

  // Relations
  claims?: RewardClaim[];
}

export interface CreateRewardInput {
  name: string;
  description?: string;
  imageUrl?: string;
  estimatedValue?: number;
  triggerType: RewardTriggerType;
  triggerId?: string;
  triggerValue?: number;
  sortOrder?: number;
}

export interface UpdateRewardInput extends Partial<CreateRewardInput> {
  status?: RewardStatus;
}

// =============================================
// REWARD CLAIM (claimed rewards history)
// =============================================

export interface RewardClaim {
  id: string;
  userId: string;
  rewardId: string;

  claimedAt: Date;

  // Snapshot at claim time
  rewardName: string;
  rewardDescription: string | null;
  rewardValue: number | null;

  note: string | null;

  createdAt: Date;

  // Relations
  reward?: Reward;
}

export interface ClaimRewardInput {
  rewardId: string;
  note?: string;
}

// =============================================
// GAMIFICATION V2 (enhanced XP system)
// =============================================

export interface XpAwardResult {
  baseXp: number;
  multipliers: {
    name: string;
    value: number;
  }[];
  totalXp: number;
  newTotalXp: number;
  leveledUp: boolean;
  newLevel: number;
}

export interface ComboResult {
  isCombo: boolean;
  comboName: string | null; // 'COMBO!', 'MEGA COMBO!', etc.
  multiplier: number;
  components: string[];
}

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

// Level thresholds for V2
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

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ProjectWithRelations extends Project {
  keyResults: ProjectKeyResult[];
  milestones: MilestoneV2[];
  tasks: Task[];
  todayCheckIn: DailyCheckIn | null;
  streaks: StreakV2[];
  rewards: Reward[];
}

export interface TodayViewData {
  checkIn: DailyCheckIn | null;
  focusedProject: Project | null;
  scheduledTasks: Task[];
  unscheduledTasks: Task[];
  streaks: StreakV2[];
  momentum: {
    yesterdayTasksCompleted: number;
    yesterdayTasksTotal: number;
    weekTasksCompleted: number;
    weekTasksTotal: number;
  };
  xpStats: {
    todayXp: number;
    totalXp: number;
    level: number;
    progressToNextLevel: number;
  };
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalKeyResults: number;
  keyResultsOnTrack: number;
  totalMilestones: number;
  milestonesCompleted: number;
  totalTasks: number;
  tasksCompletedThisWeek: number;
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  currentLevel: number;
  rewardsUnlocked: number;
  rewardsClaimed: number;
}
