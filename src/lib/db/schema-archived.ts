// Archived table definitions - preserved for reference. Tables still exist in Supabase DB.

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  date,
  time,
  decimal,
  jsonb,
  index,
  uniqueIndex,
  unique,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =============================================
// ARCHIVED ENUMS
// =============================================
export const achievementCategoryEnum = pgEnum('achievement_category', [
  'milestone',    // Completion count milestones
  'streak',       // Streak-based achievements
  'exploration',  // Using features for first time
  'mastery',      // Advanced usage patterns
]);

export const rewardTriggerTypeEnum = pgEnum('reward_trigger_type', [
  'milestone',    // Triggered when milestone is completed
  'key_result',   // Triggered when key result hits target
  'xp_threshold', // Triggered when XP threshold is reached
]);

export const taskPriorityEnum = pgEnum('task_priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);

export const taskRecurrenceEnum = pgEnum('task_recurrence', [
  'none',
  'daily',
  'weekly',
  'monthly',
]);

export const streakTypeEnum = pgEnum('streak_type', [
  'daily_execution',  // Completed 1+ task per day
  'check_in',         // Did 300% pulse check
  'production',       // Logged 4+ hours Production time
  'project',          // Worked on main project
]);

// =============================================
// VISIONS (SMART Goals)
// =============================================
export const visions = pgTable('visions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  // SMART components
  specific: text('specific'),
  measurable: text('measurable'),
  attainable: text('attainable'),
  realistic: text('realistic'),
  timeBound: date('time_bound'),
  // 300% Rule tracking
  clarityScore: integer('clarity_score').default(0),
  beliefScore: integer('belief_score').default(0),
  consistencyScore: integer('consistency_score').default(0),
  // Multi-vision support
  priority: integer('priority').default(1),
  color: text('color').default('#6366f1'),
  // Vision board
  coverImageId: uuid('cover_image_id'),
  affirmationText: text('affirmation_text'),
  // Status
  isActive: boolean('is_active').default(true),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =============================================
// STRATEGIC DISCOVERIES (Business model questioning)
// =============================================
export const strategicDiscoveries = pgTable('strategic_discoveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  visionId: uuid('vision_id').notNull(),

  // Revenue Math Section
  revenueTarget: decimal('revenue_target', { precision: 15, scale: 2 }),
  revenueType: text('revenue_type'),
  targetTimeframe: date('target_timeframe'),
  pricingModel: text('pricing_model'),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }),
  premiumPrice: decimal('premium_price', { precision: 10, scale: 2 }),
  targetCustomerCount: integer('target_customer_count'),
  arpu: decimal('arpu', { precision: 10, scale: 2 }),
  revenueOptions: jsonb('revenue_options').default([]),

  // Positioning Section
  targetCustomerDescription: text('target_customer_description'),
  problemSolved: text('problem_solved'),
  competitorAnalysis: text('competitor_analysis'),
  uniqueDifferentiator: text('unique_differentiator'),
  marketSize: text('market_size'),

  // Product Section
  coreFeatures: jsonb('core_features').default([]),
  pricingTiers: jsonb('pricing_tiers').default([]),
  retentionStrategy: text('retention_strategy'),
  upgradePath: text('upgrade_path'),

  // Acquisition Section
  primaryChannels: jsonb('primary_channels').default([]),
  estimatedCAC: decimal('estimated_cac', { precision: 10, scale: 2 }),
  criticalMilestones: jsonb('critical_milestones').default([]),
  launchDate: date('launch_date'),
  criticalPath: jsonb('critical_path').default([]),

  // AI Conversation Data
  aiConversationHistory: jsonb('ai_conversation_history').default([]),
  aiInsights: jsonb('ai_insights').default({}),

  // Progress
  completionScore: integer('completion_score').default(0),
  sectionsCompleted: jsonb('sections_completed').default([]),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('strategic_discoveries_user_idx').on(table.userId),
  visionIdx: index('strategic_discoveries_vision_idx').on(table.visionId),
  userVisionUnique: uniqueIndex('strategic_discoveries_user_vision_idx').on(table.userId, table.visionId),
}));

// =============================================
// BACKTRACK PLANS (Time-based planning)
// =============================================
export const backtrackPlans = pgTable('backtrack_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  visionId: uuid('vision_id').notNull(),
  // Time constraints
  availableHoursPerWeek: decimal('available_hours_per_week', { precision: 5, scale: 2 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  // Plan status
  status: text('status').default('draft'),
  // AI generation metadata
  aiGeneratedAt: timestamp('ai_generated_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('backtrack_plans_user_idx').on(table.userId),
  visionIdx: index('backtrack_plans_vision_idx').on(table.visionId),
}));

// =============================================
// QUARTERLY TARGETS (Links Vision to Impact Projects)
// =============================================
export const quarterlyTargets = pgTable('quarterly_targets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  visionId: uuid('vision_id').notNull(),
  backtrackPlanId: uuid('backtrack_plan_id'),
  quarter: integer('quarter').notNull(),
  year: integer('year').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  // Key metrics
  keyMetric: text('key_metric'),
  targetValue: decimal('target_value', { precision: 15, scale: 2 }),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
  // Progress tracking
  status: text('status').default('pending'),
  progressPercentage: integer('progress_percentage').default(0),
  // Time allocation
  estimatedHoursTotal: integer('estimated_hours_total'),
  hoursPerWeek: decimal('hours_per_week', { precision: 5, scale: 2 }),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userYearIdx: index('quarterly_targets_user_year_idx').on(table.userId, table.year),
  visionQuarterIdx: index('quarterly_targets_vision_quarter_idx').on(table.visionId, table.quarter, table.year),
}));

// =============================================
// IMPACT PROJECTS (12 Annual Projects)
// =============================================
export const impactProjects = pgTable('power_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  visionId: uuid('vision_id'),
  // Backtrack planning connections
  quarterlyTargetId: uuid('quarterly_target_id'),
  backtrackPlanId: uuid('backtrack_plan_id'),
  title: text('title').notNull(),
  description: text('description'),
  targetDate: date('target_date'),
  year: integer('year').notNull(),
  quarter: integer('quarter'),
  category: text('category'),
  // Milestone period (monthly or quarterly)
  milestonePeriod: text('milestone_period').default('quarterly'),
  // Assignee tracking
  assigneeId: uuid('assignee_id'),
  assigneeName: text('assignee_name'),
  // Time estimation
  estimatedHours: integer('estimated_hours'),
  progressPercentage: integer('progress_percentage').default(0),
  status: text('status').default('active'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userYearIdx: index('power_goals_user_year_idx').on(table.userId, table.year),
}));

// =============================================
// MONTHLY TARGETS (Links to Impact Projects)
// =============================================
export const monthlyTargets = pgTable('monthly_targets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  impactProjectId: uuid('power_goal_id').notNull(),
  // Backtrack planning connection
  quarterlyTargetId: uuid('quarterly_target_id'),
  title: text('title').notNull(),
  description: text('description'),
  targetMonth: integer('target_month').notNull(),
  targetYear: integer('target_year').notNull(),
  keyMetric: text('key_metric'),
  targetValue: decimal('target_value', { precision: 15, scale: 2 }),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
  // Assignee tracking
  assigneeId: uuid('assignee_id'),
  assigneeName: text('assignee_name'),
  status: text('status').default('pending'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userMonthIdx: index('monthly_targets_user_month_idx').on(table.userId, table.targetYear, table.targetMonth),
}));

// =============================================
// WEEKLY TARGETS (Links to Monthly Targets)
// =============================================
export const weeklyTargets = pgTable('weekly_targets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  monthlyTargetId: uuid('monthly_target_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  weekNumber: integer('week_number').notNull(),
  weekStartDate: date('week_start_date').notNull(),
  weekEndDate: date('week_end_date').notNull(),
  keyMetric: text('key_metric'),
  targetValue: decimal('target_value', { precision: 15, scale: 2 }),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
  // Assignee tracking
  assigneeId: uuid('assignee_id'),
  assigneeName: text('assignee_name'),
  status: text('status').default('pending'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userWeekIdx: index('weekly_targets_user_week_idx').on(table.userId, table.weekStartDate),
}));

// =============================================
// DAILY ACTIONS (Links to Weekly Targets)
// =============================================
export const dailyActions = pgTable('daily_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  weeklyTargetId: uuid('weekly_target_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  actionDate: date('action_date').notNull(),
  estimatedMinutes: integer('estimated_minutes').default(30),
  keyMetric: text('key_metric'),
  targetValue: decimal('target_value', { precision: 15, scale: 2 }),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
  // Assignee tracking
  assigneeId: uuid('assignee_id'),
  assigneeName: text('assignee_name'),
  status: text('status').default('pending'),
  completedAt: timestamp('completed_at'),
  sortOrder: integer('sort_order').default(0),
  // Google Calendar sync tracking
  calendarEventId: text('calendar_event_id'),
  calendarSyncStatus: text('calendar_sync_status').default('not_synced'),
  calendarSyncedAt: timestamp('calendar_synced_at'),
  calendarSyncError: text('calendar_sync_error'),
  // Scheduling
  scheduledStartTime: time('scheduled_start_time'),
  scheduledEndTime: time('scheduled_end_time'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userDateIdx: index('daily_actions_user_date_idx').on(table.userId, table.actionDate),
  calendarEventIdx: index('daily_actions_calendar_event_idx').on(table.calendarEventId),
}));

// =============================================
// MINS (Most Important Next Steps)
// =============================================
export const mins = pgTable('mins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  impactProjectId: uuid('power_goal_id'),
  title: text('title').notNull(),
  description: text('description'),
  scheduledDate: date('scheduled_date').notNull(),
  scheduledTime: time('scheduled_time'),
  durationMinutes: integer('duration_minutes').default(30),
  priority: integer('priority').default(1),
  // Time scope
  timeScope: text('time_scope').default('daily'),
  weekStartDate: date('week_start_date'),
  weekEndDate: date('week_end_date'),
  // Value Matrix categorization
  valueQuadrant: text('drip_quadrant'),
  makesMoneyScore: integer('makes_money_score'),
  energyScore: integer('energy_score'),
  // Status
  status: text('status').default('pending'),
  completedAt: timestamp('completed_at'),
  // Recurring
  isRecurring: boolean('is_recurring').default(false),
  recurrenceRule: text('recurrence_rule'),
  parentMinId: uuid('parent_min_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userDateIdx: index('mins_user_date_idx').on(table.userId, table.scheduledDate),
  statusIdx: index('mins_status_idx').on(table.userId, table.status),
}));

// =============================================
// ROUTINES
// =============================================
export const routines = pgTable('routines', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  description: text('description'),
  targetDurationMinutes: integer('target_duration_minutes'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const routineSteps = pgTable('routine_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  routineId: uuid('routine_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').default(5),
  sortOrder: integer('sort_order').default(0),
  isOptional: boolean('is_optional').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const routineCompletions = pgTable('routine_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  routineId: uuid('routine_id').notNull(),
  completionDate: date('completion_date').notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  stepsCompleted: jsonb('steps_completed').default([]),
  completionPercentage: integer('completion_percentage').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  routineDateIdx: uniqueIndex('routine_completions_routine_date_idx').on(table.routineId, table.completionDate),
}));

// =============================================
// POMODORO SESSIONS
// =============================================
export const pomodoroSessions = pgTable('pomodoro_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  minId: uuid('min_id'),
  impactProjectId: uuid('power_goal_id'),
  sessionDate: date('session_date').notNull(),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
  plannedDurationMinutes: integer('planned_duration_minutes').default(25),
  actualDurationMinutes: integer('actual_duration_minutes'),
  breakDurationMinutes: integer('break_duration_minutes').default(5),
  status: text('status').default('in_progress'),
  interruptionCount: integer('interruption_count').default(0),
  focusNotes: text('focus_notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userDateIdx: index('pomodoro_user_date_idx').on(table.userId, table.sessionDate),
}));

// =============================================
// DAILY REVIEWS
// =============================================
export const dailyReviews = pgTable('daily_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  reviewDate: date('review_date').notNull(),
  reviewType: text('review_type').notNull(),
  // Content
  wins: jsonb('wins').default([]),
  challenges: jsonb('challenges').default([]),
  lessonsLearned: text('lessons_learned'),
  gratitude: jsonb('gratitude').default([]),
  tomorrowFocus: text('tomorrow_focus'),
  // Ratings
  productivityScore: integer('productivity_score'),
  energyLevel: integer('energy_level'),
  moodScore: integer('mood_score'),
  // 300% Rule check-in
  clarityToday: integer('clarity_today'),
  beliefToday: integer('belief_today'),
  consistencyToday: integer('consistency_today'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userDateTypeIdx: uniqueIndex('daily_reviews_user_date_type_idx').on(table.userId, table.reviewDate, table.reviewType),
}));

// =============================================
// NORTH STAR METRICS
// =============================================
export const northStarMetrics = pgTable('north_star_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  visionId: uuid('vision_id'),
  name: text('name').notNull(),
  description: text('description'),
  unit: text('unit').notNull(),
  targetValue: decimal('target_value', { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
  trackingFrequency: text('tracking_frequency').default('weekly'),
  isPrimary: boolean('is_primary').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const metricLogs = pgTable('metric_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  metricId: uuid('metric_id').notNull(),
  logDate: date('log_date').notNull(),
  value: decimal('value', { precision: 15, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  metricDateIdx: uniqueIndex('metric_logs_metric_date_idx').on(table.metricId, table.logDate),
}));

// =============================================
// WEEKLY SCORECARDS
// =============================================
export const weeklyScorecards = pgTable('weekly_scorecards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  weekStartDate: date('week_start_date').notNull(),
  weekEndDate: date('week_end_date').notNull(),
  // Scores
  overallScore: decimal('overall_score', { precision: 5, scale: 2 }),
  goalsProgressScore: decimal('goals_progress_score', { precision: 5, scale: 2 }),
  minsCompletionRate: decimal('mins_completion_rate', { precision: 5, scale: 2 }),
  routineCompletionRate: decimal('routine_completion_rate', { precision: 5, scale: 2 }),
  timeInProductionRate: decimal('time_in_production_rate', { precision: 5, scale: 2 }),
  energyBalanceScore: decimal('energy_balance_score', { precision: 5, scale: 2 }),
  // 300% Rule
  avgClarity: integer('avg_clarity'),
  avgBelief: integer('avg_belief'),
  avgConsistency: integer('avg_consistency'),
  // Reflection
  biggestWin: text('biggest_win'),
  biggestChallenge: text('biggest_challenge'),
  nextWeekFocus: text('next_week_focus'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userWeekIdx: uniqueIndex('weekly_scorecards_user_week_idx').on(table.userId, table.weekStartDate),
}));

// =============================================
// ACCOUNTABILITY PARTNERS
// =============================================
export const accountabilityPartners = pgTable('accountability_partners', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  partnerUserId: uuid('partner_user_id'),
  partnerEmail: text('partner_email'),
  partnerName: text('partner_name'),
  status: text('status').default('pending'),
  checkInFrequency: text('check_in_frequency').default('weekly'),
  nextCheckInDate: date('next_check_in_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =============================================
// VISION BOARD IMAGES
// =============================================
export const visionBoardImages = pgTable('vision_board_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  visionId: uuid('vision_id'),
  filePath: text('file_path').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  width: integer('width'),
  height: integer('height'),
  sortOrder: integer('sort_order').default(0),
  caption: text('caption'),
  isCover: boolean('is_cover').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('vision_board_images_user_idx').on(table.userId),
  visionIdx: index('vision_board_images_vision_idx').on(table.visionId),
}));

// =============================================
// DAILY AFFIRMATION COMPLETIONS
// =============================================
export const dailyAffirmationCompletions = pgTable('daily_affirmation_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  visionId: uuid('vision_id').notNull(),
  completionDate: date('completion_date').notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
}, (table) => ({
  userVisionDateIdx: uniqueIndex('affirmation_user_vision_date_idx').on(table.userId, table.visionId, table.completionDate),
}));

// =============================================
// NON-NEGOTIABLES (Daily Behaviors/Rules)
// =============================================
export const nonNegotiables = pgTable('non_negotiables', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  visionId: uuid('vision_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  frequency: text('frequency').default('daily'),
  targetCount: integer('target_count').default(1),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('non_negotiables_user_idx').on(table.userId),
  visionIdx: index('non_negotiables_vision_idx').on(table.visionId),
}));

// =============================================
// NON-NEGOTIABLE COMPLETIONS (Streak Tracking)
// =============================================
export const nonNegotiableCompletions = pgTable('non_negotiable_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  nonNegotiableId: uuid('non_negotiable_id').notNull(),
  completionDate: date('completion_date').notNull(),
  completionCount: integer('completion_count').default(1),
  notes: text('notes'),
  completedAt: timestamp('completed_at').defaultNow(),
}, (table) => ({
  uniqueIdx: uniqueIndex('nn_completion_unique_idx').on(table.nonNegotiableId, table.completionDate),
  userIdx: index('nn_completions_user_idx').on(table.userId),
}));

// =============================================
// VISION REVIEW REMINDERS
// =============================================
export const visionReviewReminders = pgTable('vision_review_reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  visionId: uuid('vision_id').notNull(),
  reminderType: text('reminder_type').notNull(),
  reminderTime: text('reminder_time'),
  dayOfWeek: integer('day_of_week'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('vision_reminders_user_idx').on(table.userId),
  visionIdx: index('vision_reminders_vision_idx').on(table.visionId),
}));

// =============================================
// VISION KPIs (AI-Generated Hierarchical KPIs)
// =============================================
export const visionKpis = pgTable('vision_kpis', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  visionId: uuid('vision_id').notNull(),
  // KPI hierarchy level
  level: text('level').notNull(),
  // KPI details
  title: text('title').notNull(),
  description: text('description'),
  targetValue: text('target_value'),
  unit: text('unit'),
  numericTarget: decimal('numeric_target', { precision: 15, scale: 2 }),
  // Hierarchical organization
  parentKpiId: uuid('parent_kpi_id').references((): AnyPgColumn => visionKpis.id, { onDelete: 'set null' }),
  // Weight
  weight: decimal('weight', { precision: 5, scale: 2 }).default('1'),
  quarter: integer('quarter'),
  month: integer('month'),
  // Additional metadata
  category: text('category'),
  trackingMethod: text('tracking_method'),
  leadsTo: text('leads_to'),
  bestTime: text('best_time'),
  timeRequired: text('time_required'),
  whyItMatters: text('why_it_matters'),
  // AI generation metadata
  successFormula: text('success_formula'),
  // Status
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userVisionIdx: index('vision_kpis_user_vision_idx').on(table.userId, table.visionId),
  levelIdx: index('vision_kpis_level_idx').on(table.visionId, table.level),
  parentKpiIdx: index('vision_kpis_parent_kpi_idx').on(table.parentKpiId),
}));

// =============================================
// KPI LOGS (Check-offs and Value Entries)
// =============================================
export const kpiLogs = pgTable('kpi_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  kpiId: uuid('kpi_id').notNull(),
  // Log details
  logDate: date('log_date').notNull(),
  value: decimal('value', { precision: 15, scale: 2 }),
  isCompleted: boolean('is_completed').default(false),
  completionCount: integer('completion_count').default(0),
  // Notes
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  kpiDateIdx: uniqueIndex('kpi_logs_kpi_date_idx').on(table.kpiId, table.logDate),
  userDateIdx: index('kpi_logs_user_date_idx').on(table.userId, table.logDate),
}));

// =============================================
// KPI STREAKS (Cached Streak Calculations)
// =============================================
export const kpiStreaks = pgTable('kpi_streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  kpiId: uuid('kpi_id').notNull().unique(),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastCompletedDate: date('last_completed_date'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =============================================
// KPI PROGRESS CACHE (Pre-computed Aggregates)
// =============================================
export const kpiProgressCache = pgTable('kpi_progress_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  kpiId: uuid('kpi_id').notNull().unique(),
  // Progress values
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
  targetValue: decimal('target_value', { precision: 15, scale: 2 }),
  progressPercentage: decimal('progress_percentage', { precision: 5, scale: 2 }).default('0'),
  // Hierarchy aggregates
  childCount: integer('child_count').default(0),
  completedChildCount: integer('completed_child_count').default(0),
  // Weighted calculation support
  weightedProgress: decimal('weighted_progress', { precision: 5, scale: 2 }),
  totalWeight: decimal('total_weight', { precision: 5, scale: 2 }).default('1'),
  // Status
  status: text('status').default('not_started'),
  // Metadata
  lastCalculatedAt: timestamp('last_calculated_at').defaultNow(),
  calculationMethod: text('calculation_method').default('auto'),
  manualOverrideReason: text('manual_override_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  kpiIdx: uniqueIndex('kpi_progress_cache_kpi_idx').on(table.kpiId),
  statusIdx: index('kpi_progress_cache_status_idx').on(table.status),
  lastCalculatedIdx: index('kpi_progress_cache_last_calculated_idx').on(table.lastCalculatedAt),
}));

// =============================================
// MILESTONE KPIs (Link Milestones to KPIs)
// =============================================
export const milestoneKpis = pgTable('milestone_kpis', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  milestoneId: uuid('milestone_id').notNull(),
  kpiId: uuid('kpi_id'),
  // Custom KPI fields
  customKpiName: text('custom_kpi_name'),
  customKpiTarget: text('custom_kpi_target'),
  // Tracking
  isAutoLinked: boolean('is_auto_linked').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('milestone_kpis_user_idx').on(table.userId),
  milestoneIdx: index('milestone_kpis_milestone_idx').on(table.milestoneId),
}));

// =============================================
// ACHIEVEMENTS (Predefined achievement definitions)
// =============================================
export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  category: achievementCategoryEnum('category').notNull(),
  iconName: varchar('icon_name', { length: 50 }),
  xpReward: integer('xp_reward').default(0),
  requiredValue: integer('required_value'),
  isSecret: boolean('is_secret').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// =============================================
// USER_ACHIEVEMENTS (Junction table)
// =============================================
export const userAchievements = pgTable('user_achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  achievementId: uuid('achievement_id').notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow(),
  progressValue: integer('progress_value'),
}, (table) => ({
  uniqueUserAchievement: unique().on(table.userId, table.achievementId),
  userIdx: index('user_achievements_user_idx').on(table.userId),
}));

// =============================================
// USER_GAMIFICATION (XP/Level tracking)
// =============================================
export const userGamification = pgTable('user_gamification', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  totalXp: integer('total_xp').default(0),
  currentLevel: integer('current_level').default(1),
  kpisCompleted: integer('kpis_completed').default(0),
  visionsCreated: integer('visions_created').default(0),
  longestStreak: integer('longest_streak').default(0),
  currentStreak: integer('current_streak').default(0),
  lastActivityDate: date('last_activity_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =============================================
// PROJECTS (Unified Vision/Goal System - V2)
// =============================================
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),

  // Basic Info
  title: text('title').notNull(),
  description: text('description'),
  color: text('color').default('#6366f1'),

  // SMART Goal Components
  specific: text('specific'),
  measurable: text('measurable'),
  attainable: text('attainable'),
  realistic: text('realistic'),
  timeBound: date('time_bound'),

  // Timeline
  startDate: date('start_date'),
  targetDate: date('target_date'),

  // 300% Rule Scores
  clarityScore: integer('clarity_score').default(0),
  beliefScore: integer('belief_score').default(0),
  consistencyScore: integer('consistency_score').default(0),

  // Revenue Math
  revenueMath: jsonb('revenue_math').default({}),

  // Focus & Priority
  isFocused: boolean('is_focused').default(false),
  priority: integer('priority').default(1),

  // Progress
  progressPercentage: integer('progress_percentage').default(0),

  // Vision Board
  coverImageUrl: text('cover_image_url'),
  affirmationText: text('affirmation_text'),

  // Status
  status: text('status').default('active'),
  completedAt: timestamp('completed_at'),
  archivedAt: timestamp('archived_at'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('projects_user_idx').on(table.userId),
  userStatusIdx: index('projects_user_status_idx').on(table.userId, table.status),
  focusedIdx: index('projects_focused_idx').on(table.userId, table.isFocused),
}));

// =============================================
// PROJECT KEY RESULTS (V2)
// =============================================
export const projectKeyResults = pgTable('project_key_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id').notNull(),

  // Metric Definition
  name: text('name').notNull(),
  description: text('description'),

  // Values
  targetValue: decimal('target_value', { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
  startingValue: decimal('starting_value', { precision: 15, scale: 2 }).default('0'),

  // Unit & Display
  unitType: text('unit_type').default('number'),
  unitLabel: text('unit_label'),

  // Weight
  weight: decimal('weight', { precision: 3, scale: 2 }).default('1.00'),

  // Progress
  progressPercentage: integer('progress_percentage').default(0),

  // Status
  status: text('status').default('not_started'),
  completedAt: timestamp('completed_at'),

  // Ordering
  sortOrder: integer('sort_order').default(0),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  projectIdx: index('project_key_results_project_idx').on(table.projectId),
  userIdx: index('project_key_results_user_idx').on(table.userId),
  statusIdx: index('project_key_results_status_idx').on(table.projectId, table.status),
}));

// =============================================
// PROJECT KEY RESULT LOGS (V2)
// =============================================
export const projectKeyResultLogs = pgTable('project_key_result_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  keyResultId: uuid('key_result_id').notNull(),

  // Value change
  previousValue: decimal('previous_value', { precision: 15, scale: 2 }),
  newValue: decimal('new_value', { precision: 15, scale: 2 }).notNull(),

  // Metadata
  note: text('note'),
  source: text('source').default('manual'),

  loggedAt: timestamp('logged_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  keyResultIdx: index('project_key_result_logs_kr_idx').on(table.keyResultId),
  dateIdx: index('project_key_result_logs_date_idx').on(table.keyResultId, table.loggedAt),
}));

// =============================================
// MILESTONES (Quarterly Checkpoints - V2)
// =============================================
export const milestonesV2 = pgTable('milestones_v2', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id').notNull(),

  // Basic Info
  title: text('title').notNull(),
  description: text('description'),

  // Timeline
  quarter: integer('quarter'),
  year: integer('year'),
  targetDate: date('target_date'),

  // Linked Key Results
  linkedKeyResultIds: jsonb('linked_key_result_ids').default([]),

  // Progress
  progressPercentage: integer('progress_percentage').default(0),
  status: text('status').default('pending'),
  completedAt: timestamp('completed_at'),

  // Ordering
  sortOrder: integer('sort_order').default(0),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  projectIdx: index('milestones_v2_project_idx').on(table.projectId),
  userIdx: index('milestones_v2_user_idx').on(table.userId),
  quarterIdx: index('milestones_v2_quarter_idx').on(table.projectId, table.year, table.quarter),
  statusIdx: index('milestones_v2_status_idx').on(table.projectId, table.status),
}));

// =============================================
// TASKS (Unified Task System - V2)
// =============================================
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id'),
  milestoneId: uuid('milestone_id'),
  keyResultId: uuid('key_result_id'),

  // Basic Info
  title: text('title').notNull(),
  description: text('description'),

  // Time Estimation
  estimatedMinutes: integer('estimated_minutes').default(30),
  actualMinutes: integer('actual_minutes'),

  // Scheduling
  scheduledDate: date('scheduled_date'),
  scheduledStartTime: time('scheduled_start_time'),
  scheduledEndTime: time('scheduled_end_time'),
  dueDate: date('due_date'),

  // Priority
  priority: taskPriorityEnum('priority').default('medium'),

  // Categorization
  valueQuadrant: text('value_quadrant'),
  fourCsTag: text('four_cs_tag'),

  // Recurrence
  recurrence: taskRecurrenceEnum('recurrence').default('none'),
  recurrenceRule: text('recurrence_rule'),
  parentTaskId: uuid('parent_task_id'),

  // Google Calendar Integration
  googleCalendarEventId: text('google_calendar_event_id'),
  calendarSyncStatus: text('calendar_sync_status').default('not_synced'),
  calendarSyncedAt: timestamp('calendar_synced_at'),

  // Status
  status: text('status').default('pending'),
  completedAt: timestamp('completed_at'),

  // XP awarded
  xpAwarded: integer('xp_awarded').default(0),

  // Ordering
  sortOrder: integer('sort_order').default(0),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('tasks_user_idx').on(table.userId),
  projectIdx: index('tasks_project_idx').on(table.projectId),
  milestoneIdx: index('tasks_milestone_idx').on(table.milestoneId),
  scheduledIdx: index('tasks_scheduled_idx').on(table.userId, table.scheduledDate),
  statusIdx: index('tasks_status_idx').on(table.userId, table.status),
  calendarEventIdx: index('tasks_calendar_event_idx').on(table.googleCalendarEventId),
}));

// =============================================
// DAILY CHECK-INS (300% Score Tracking - V2)
// =============================================
export const dailyCheckins = pgTable('daily_checkins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id'),

  // Date
  checkInDate: date('check_in_date').notNull(),

  // 300% Scores
  clarityScore: integer('clarity_score').notNull(),
  beliefScore: integer('belief_score').notNull(),
  consistencyScore: integer('consistency_score').notNull(),

  // Calculated total
  totalScore: integer('total_score').notNull(),

  // Optional notes
  note: text('note'),

  // Prompts triggered
  promptsTriggered: jsonb('prompts_triggered').default([]),

  // XP
  xpAwarded: integer('xp_awarded').default(0),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userDateIdx: uniqueIndex('daily_checkins_user_date_idx').on(table.userId, table.checkInDate, table.projectId),
  projectIdx: index('daily_checkins_project_idx').on(table.projectId),
}));

// =============================================
// STREAKS (Enhanced Streak Tracking - V2)
// =============================================
export const streaksV2 = pgTable('streaks_v2', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id'),

  // Streak type
  streakType: streakTypeEnum('streak_type').notNull(),

  // Current streak
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),

  // Dates
  lastActivityDate: date('last_activity_date'),
  streakStartDate: date('streak_start_date'),

  // Recovery
  recoveryUsedThisWeek: boolean('recovery_used_this_week').default(false),
  lastRecoveryDate: date('last_recovery_date'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userStreakTypeIdx: uniqueIndex('streaks_v2_user_type_idx').on(table.userId, table.streakType, table.projectId),
  userIdx: index('streaks_v2_user_idx').on(table.userId),
}));

// =============================================
// REWARDS (Custom User Rewards - V2)
// =============================================
export const rewards = pgTable('rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),

  // Reward definition
  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  estimatedValue: decimal('estimated_value', { precision: 10, scale: 2 }),

  // Trigger configuration
  triggerType: rewardTriggerTypeEnum('trigger_type').notNull(),
  triggerId: uuid('trigger_id'),
  triggerValue: decimal('trigger_value', { precision: 15, scale: 2 }),

  // Progress tracking
  progressPercentage: integer('progress_percentage').default(0),
  currentProgress: decimal('current_progress', { precision: 15, scale: 2 }).default('0'),

  // Status
  status: text('status').default('locked'),
  unlockedAt: timestamp('unlocked_at'),

  // Ordering
  sortOrder: integer('sort_order').default(0),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('rewards_user_idx').on(table.userId),
  statusIdx: index('rewards_status_idx').on(table.userId, table.status),
  triggerIdx: index('rewards_trigger_idx').on(table.triggerType, table.triggerId),
}));

// =============================================
// REWARD CLAIMS (Claimed Rewards History - V2)
// =============================================
export const rewardClaims = pgTable('reward_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  rewardId: uuid('reward_id').notNull(),

  // Claim details
  claimedAt: timestamp('claimed_at').defaultNow(),

  // Snapshot
  rewardName: text('reward_name').notNull(),
  rewardDescription: text('reward_description'),
  rewardValue: decimal('reward_value', { precision: 10, scale: 2 }),

  // Optional note
  note: text('note'),

  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('reward_claims_user_idx').on(table.userId),
  rewardIdx: index('reward_claims_reward_idx').on(table.rewardId),
  dateIdx: index('reward_claims_date_idx').on(table.userId, table.claimedAt),
}));

// =============================================
// KEY RESULTS (OKRs)
// =============================================
export const keyResults = pgTable('key_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  visionId: uuid('vision_id').notNull(),
  impactProjectId: uuid('power_goal_id'),
  // Key Result details
  title: text('title').notNull(),
  description: text('description'),
  // Target metrics
  targetValue: decimal('target_value', { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
  startValue: decimal('start_value', { precision: 15, scale: 2 }).default('0'),
  unit: text('unit').notNull(),
  // Ownership
  assigneeId: uuid('assignee_id'),
  assigneeName: text('assignee_name'),
  // Time period
  quarter: integer('quarter'),
  year: integer('year'),
  dueDate: date('due_date'),
  // Status tracking
  status: text('status').default('on_track'),
  progressPercentage: integer('progress_percentage').default(0),
  // Confidence level
  confidenceLevel: integer('confidence_level').default(70),
  // Notes
  successCriteria: text('success_criteria'),
  notes: text('notes'),
  // Status
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userVisionIdx: index('key_results_user_vision_idx').on(table.userId, table.visionId),
  quarterIdx: index('key_results_quarter_idx').on(table.userId, table.year, table.quarter),
  assigneeIdx: index('key_results_assignee_idx').on(table.assigneeId),
}));

// =============================================
// KEY RESULT UPDATES (Progress History)
// =============================================
export const keyResultUpdates = pgTable('key_result_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  keyResultId: uuid('key_result_id').notNull(),
  // Value change
  previousValue: decimal('previous_value', { precision: 15, scale: 2 }),
  newValue: decimal('new_value', { precision: 15, scale: 2 }).notNull(),
  // Status change
  previousStatus: text('previous_status'),
  newStatus: text('new_status'),
  // Context
  notes: text('notes'),
  // Who made the update
  updatedBy: uuid('updated_by'),
  updatedByName: text('updated_by_name'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  keyResultIdx: index('key_result_updates_kr_idx').on(table.keyResultId),
  dateIdx: index('key_result_updates_date_idx').on(table.createdAt),
}));

// =============================================
// ARCHIVED RELATIONS
// =============================================
export const visionsRelations = relations(visions, ({ many }) => ({
  backtrackPlans: many(backtrackPlans),
  quarterlyTargets: many(quarterlyTargets),
  impactProjects: many(impactProjects),
  northStarMetrics: many(northStarMetrics),
  visionBoardImages: many(visionBoardImages),
  dailyAffirmationCompletions: many(dailyAffirmationCompletions),
  nonNegotiables: many(nonNegotiables),
  visionReviewReminders: many(visionReviewReminders),
  visionKpis: many(visionKpis),
}));

export const backtrackPlansRelations = relations(backtrackPlans, ({ one, many }) => ({
  vision: one(visions, { fields: [backtrackPlans.visionId], references: [visions.id] }),
  quarterlyTargets: many(quarterlyTargets),
  impactProjects: many(impactProjects),
}));

export const quarterlyTargetsRelations = relations(quarterlyTargets, ({ one, many }) => ({
  vision: one(visions, { fields: [quarterlyTargets.visionId], references: [visions.id] }),
  backtrackPlan: one(backtrackPlans, { fields: [quarterlyTargets.backtrackPlanId], references: [backtrackPlans.id] }),
  impactProjects: many(impactProjects),
  monthlyTargets: many(monthlyTargets),
}));

export const impactProjectsRelations = relations(impactProjects, ({ one, many }) => ({
  vision: one(visions, { fields: [impactProjects.visionId], references: [visions.id] }),
  quarterlyTarget: one(quarterlyTargets, { fields: [impactProjects.quarterlyTargetId], references: [quarterlyTargets.id] }),
  backtrackPlan: one(backtrackPlans, { fields: [impactProjects.backtrackPlanId], references: [backtrackPlans.id] }),
  mins: many(mins),
  monthlyTargets: many(monthlyTargets),
  milestoneKpis: many(milestoneKpis),
}));

export const monthlyTargetsRelations = relations(monthlyTargets, ({ one, many }) => ({
  impactProject: one(impactProjects, { fields: [monthlyTargets.impactProjectId], references: [impactProjects.id] }),
  quarterlyTarget: one(quarterlyTargets, { fields: [monthlyTargets.quarterlyTargetId], references: [quarterlyTargets.id] }),
  weeklyTargets: many(weeklyTargets),
}));

export const weeklyTargetsRelations = relations(weeklyTargets, ({ one, many }) => ({
  monthlyTarget: one(monthlyTargets, { fields: [weeklyTargets.monthlyTargetId], references: [monthlyTargets.id] }),
  dailyActions: many(dailyActions),
}));

export const dailyActionsRelations = relations(dailyActions, ({ one }) => ({
  weeklyTarget: one(weeklyTargets, { fields: [dailyActions.weeklyTargetId], references: [weeklyTargets.id] }),
}));

export const minsRelations = relations(mins, ({ one }) => ({
  impactProject: one(impactProjects, { fields: [mins.impactProjectId], references: [impactProjects.id] }),
}));

export const routinesRelations = relations(routines, ({ many }) => ({
  steps: many(routineSteps),
  completions: many(routineCompletions),
}));

export const routineStepsRelations = relations(routineSteps, ({ one }) => ({
  routine: one(routines, { fields: [routineSteps.routineId], references: [routines.id] }),
}));

export const visionBoardImagesRelations = relations(visionBoardImages, ({ one }) => ({
  vision: one(visions, { fields: [visionBoardImages.visionId], references: [visions.id] }),
}));

export const dailyAffirmationCompletionsRelations = relations(dailyAffirmationCompletions, ({ one }) => ({
  vision: one(visions, { fields: [dailyAffirmationCompletions.visionId], references: [visions.id] }),
}));

export const nonNegotiablesRelations = relations(nonNegotiables, ({ one, many }) => ({
  vision: one(visions, { fields: [nonNegotiables.visionId], references: [visions.id] }),
  completions: many(nonNegotiableCompletions),
}));

export const nonNegotiableCompletionsRelations = relations(nonNegotiableCompletions, ({ one }) => ({
  nonNegotiable: one(nonNegotiables, { fields: [nonNegotiableCompletions.nonNegotiableId], references: [nonNegotiables.id] }),
}));

export const visionReviewRemindersRelations = relations(visionReviewReminders, ({ one }) => ({
  vision: one(visions, { fields: [visionReviewReminders.visionId], references: [visions.id] }),
}));

export const visionKpisRelations = relations(visionKpis, ({ one, many }) => ({
  vision: one(visions, { fields: [visionKpis.visionId], references: [visions.id] }),
  parentKpi: one(visionKpis, { fields: [visionKpis.parentKpiId], references: [visionKpis.id], relationName: 'parentChild' }),
  childKpis: many(visionKpis, { relationName: 'parentChild' }),
  logs: many(kpiLogs),
  streak: one(kpiStreaks),
  progressCache: one(kpiProgressCache),
}));

export const kpiProgressCacheRelations = relations(kpiProgressCache, ({ one }) => ({
  kpi: one(visionKpis, { fields: [kpiProgressCache.kpiId], references: [visionKpis.id] }),
}));

export const kpiLogsRelations = relations(kpiLogs, ({ one }) => ({
  kpi: one(visionKpis, { fields: [kpiLogs.kpiId], references: [visionKpis.id] }),
}));

export const kpiStreaksRelations = relations(kpiStreaks, ({ one }) => ({
  kpi: one(visionKpis, { fields: [kpiStreaks.kpiId], references: [visionKpis.id] }),
}));

export const milestoneKpisRelations = relations(milestoneKpis, ({ one }) => ({
  milestone: one(impactProjects, { fields: [milestoneKpis.milestoneId], references: [impactProjects.id] }),
  kpi: one(visionKpis, { fields: [milestoneKpis.kpiId], references: [visionKpis.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  keyResults: many(projectKeyResults),
  milestones: many(milestonesV2),
  tasks: many(tasks),
  dailyCheckins: many(dailyCheckins),
  streaks: many(streaksV2),
}));

export const projectKeyResultsRelations = relations(projectKeyResults, ({ one, many }) => ({
  project: one(projects, { fields: [projectKeyResults.projectId], references: [projects.id] }),
  logs: many(projectKeyResultLogs),
  tasks: many(tasks),
}));

export const projectKeyResultLogsRelations = relations(projectKeyResultLogs, ({ one }) => ({
  keyResult: one(projectKeyResults, { fields: [projectKeyResultLogs.keyResultId], references: [projectKeyResults.id] }),
}));

export const milestonesV2Relations = relations(milestonesV2, ({ one, many }) => ({
  project: one(projects, { fields: [milestonesV2.projectId], references: [projects.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  milestone: one(milestonesV2, { fields: [tasks.milestoneId], references: [milestonesV2.id] }),
  keyResult: one(projectKeyResults, { fields: [tasks.keyResultId], references: [projectKeyResults.id] }),
}));

export const dailyCheckinsRelations = relations(dailyCheckins, ({ one }) => ({
  project: one(projects, { fields: [dailyCheckins.projectId], references: [projects.id] }),
}));

export const streaksV2Relations = relations(streaksV2, ({ one }) => ({
  project: one(projects, { fields: [streaksV2.projectId], references: [projects.id] }),
}));

export const rewardsRelations = relations(rewards, ({ many }) => ({
  claims: many(rewardClaims),
}));

export const rewardClaimsRelations = relations(rewardClaims, ({ one }) => ({
  reward: one(rewards, { fields: [rewardClaims.rewardId], references: [rewards.id] }),
}));

export const keyResultsRelations = relations(keyResults, ({ many }) => ({
  updates: many(keyResultUpdates),
}));

export const keyResultUpdatesRelations = relations(keyResultUpdates, ({ one }) => ({
  keyResult: one(keyResults, { fields: [keyResultUpdates.keyResultId], references: [keyResults.id] }),
}));
