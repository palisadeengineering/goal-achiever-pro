// Drizzle ORM Schema for Goal Achiever Pro

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
// ENUMS
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

export const fourCsTypeEnum = pgEnum('four_cs_type', [
  'code',         // Building systems/automation
  'content',      // Creating content/media
  'capital',      // Money/investments
  'collaboration', // People/partnerships
]);

export const streakTypeEnum = pgEnum('streak_type', [
  'daily_execution',  // Completed 1+ task per day
  'check_in',         // Did 300% pulse check
  'production',       // Logged 4+ hours Production time
  'project',          // Worked on main project
]);

// =============================================
// PROFILES (extends Supabase auth.users)
// =============================================
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  timezone: text('timezone').default('UTC'),
  subscriptionTier: text('subscription_tier').default('free'),
  subscriptionStatus: text('subscription_status').default('active'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  trialEndsAt: timestamp('trial_ends_at'),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  isAdmin: boolean('is_admin').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =============================================
// VISIONS (SMART Goals)
// =============================================
export const visions = pgTable('visions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  visionId: uuid('vision_id').notNull().references(() => visions.id, { onDelete: 'cascade' }),

  // Revenue Math Section
  revenueTarget: decimal('revenue_target', { precision: 15, scale: 2 }),
  revenueType: text('revenue_type'), // 'mrr', 'arr', 'one-time'
  targetTimeframe: date('target_timeframe'),
  pricingModel: text('pricing_model'), // 'mass_market', 'prosumer', 'enterprise', 'hybrid'
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
  marketSize: text('market_size'), // 'niche', 'medium', 'large', 'massive'

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
  completionScore: integer('completion_score').default(0), // 0-100
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  visionId: uuid('vision_id').notNull().references(() => visions.id, { onDelete: 'cascade' }),
  // Time constraints
  availableHoursPerWeek: decimal('available_hours_per_week', { precision: 5, scale: 2 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  // Plan status
  status: text('status').default('draft'), // draft, active, paused, completed
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  visionId: uuid('vision_id').notNull().references(() => visions.id, { onDelete: 'cascade' }),
  backtrackPlanId: uuid('backtrack_plan_id').references(() => backtrackPlans.id, { onDelete: 'cascade' }),
  quarter: integer('quarter').notNull(), // 1-4
  year: integer('year').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  // Key metrics
  keyMetric: text('key_metric'),
  targetValue: decimal('target_value', { precision: 15, scale: 2 }),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
  // Progress tracking
  status: text('status').default('pending'), // pending, in_progress, completed
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  visionId: uuid('vision_id').references(() => visions.id, { onDelete: 'set null' }),
  // Backtrack planning connections
  quarterlyTargetId: uuid('quarterly_target_id').references(() => quarterlyTargets.id, { onDelete: 'set null' }),
  backtrackPlanId: uuid('backtrack_plan_id').references(() => backtrackPlans.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  targetDate: date('target_date'),
  year: integer('year').notNull(),
  quarter: integer('quarter'),
  category: text('category'),
  // Milestone period (monthly or quarterly)
  milestonePeriod: text('milestone_period').default('quarterly'), // 'monthly' | 'quarterly'
  // Assignee tracking
  assigneeId: uuid('assignee_id').references(() => profiles.id, { onDelete: 'set null' }),
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  impactProjectId: uuid('power_goal_id').notNull().references(() => impactProjects.id, { onDelete: 'cascade' }),
  // Backtrack planning connection
  quarterlyTargetId: uuid('quarterly_target_id').references(() => quarterlyTargets.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  targetMonth: integer('target_month').notNull(), // 1-12
  targetYear: integer('target_year').notNull(),
  keyMetric: text('key_metric'),
  targetValue: decimal('target_value', { precision: 15, scale: 2 }),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
  // Assignee tracking
  assigneeId: uuid('assignee_id').references(() => profiles.id, { onDelete: 'set null' }),
  assigneeName: text('assignee_name'),
  status: text('status').default('pending'), // pending, in_progress, completed
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  monthlyTargetId: uuid('monthly_target_id').notNull().references(() => monthlyTargets.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  weekNumber: integer('week_number').notNull(), // 1-5 within month
  weekStartDate: date('week_start_date').notNull(),
  weekEndDate: date('week_end_date').notNull(),
  keyMetric: text('key_metric'),
  targetValue: decimal('target_value', { precision: 15, scale: 2 }),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
  // Assignee tracking
  assigneeId: uuid('assignee_id').references(() => profiles.id, { onDelete: 'set null' }),
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  weeklyTargetId: uuid('weekly_target_id').notNull().references(() => weeklyTargets.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  actionDate: date('action_date').notNull(),
  estimatedMinutes: integer('estimated_minutes').default(30),
  keyMetric: text('key_metric'),
  targetValue: decimal('target_value', { precision: 15, scale: 2 }),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
  // Assignee tracking
  assigneeId: uuid('assignee_id').references(() => profiles.id, { onDelete: 'set null' }),
  assigneeName: text('assignee_name'),
  status: text('status').default('pending'),
  completedAt: timestamp('completed_at'),
  sortOrder: integer('sort_order').default(0),
  // Google Calendar sync tracking
  calendarEventId: text('calendar_event_id'),
  calendarSyncStatus: text('calendar_sync_status').default('not_synced'), // 'not_synced', 'synced', 'pending', 'error'
  calendarSyncedAt: timestamp('calendar_synced_at'),
  calendarSyncError: text('calendar_sync_error'),
  // Scheduling (for calendar events)
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  impactProjectId: uuid('power_goal_id').references(() => impactProjects.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  scheduledDate: date('scheduled_date').notNull(),
  scheduledTime: time('scheduled_time'),
  durationMinutes: integer('duration_minutes').default(30),
  priority: integer('priority').default(1),
  // Time scope (daily vs weekly)
  timeScope: text('time_scope').default('daily'), // 'daily' | 'weekly'
  weekStartDate: date('week_start_date'), // for weekly MINS
  weekEndDate: date('week_end_date'), // for weekly MINS
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
// DETECTED PROJECTS (Auto-detected from AI classification)
// =============================================
export const detectedProjects = pgTable('detected_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(), // lowercase, trimmed for matching
  color: text('color').default('#6366f1'),
  // Optional link to Impact Project
  impactProjectId: uuid('power_goal_id').references(() => impactProjects.id, { onDelete: 'set null' }),
  // Cached aggregates
  totalMinutes: integer('total_minutes').default(0),
  eventCount: integer('event_count').default(0),
  // Status
  isArchived: boolean('is_archived').default(false),
  // For merging duplicates
  mergedIntoId: uuid('merged_into_id').references((): AnyPgColumn => detectedProjects.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('detected_projects_user_idx').on(table.userId),
  normalizedNameIdx: uniqueIndex('detected_projects_normalized_name_idx').on(table.userId, table.normalizedName),
  impactProjectIdx: index('detected_projects_power_goal_idx').on(table.impactProjectId),
}));

// =============================================
// MEETING CATEGORIES (User-defined meeting types)
// =============================================
export const meetingCategories = pgTable('meeting_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').default('#ec4899'),
  description: text('description'),
  isDefault: boolean('is_default').default(false), // system defaults
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('meeting_categories_user_idx').on(table.userId),
  userNameIdx: uniqueIndex('meeting_categories_user_name_idx').on(table.userId, table.name),
}));

// =============================================
// TIME BLOCKS (15-minute increments)
// =============================================
export const timeBlocks = pgTable('time_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  minId: uuid('min_id').references(() => mins.id, { onDelete: 'set null' }),
  // Time specification
  blockDate: date('block_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  durationMinutes: integer('duration_minutes'),
  // Activity details
  activityName: text('activity_name').notNull(),
  activityCategory: text('activity_category'),
  notes: text('notes'),
  // AI Activity Classification
  activityType: text('activity_type'), // 'project', 'meeting', 'commute', 'deep_work', 'admin', 'break', 'other'
  detectedProjectId: uuid('detected_project_id').references(() => detectedProjects.id, { onDelete: 'set null' }),
  aiClassificationConfidence: decimal('ai_classification_confidence', { precision: 3, scale: 2 }),
  aiClassifiedAt: timestamp('ai_classified_at'),
  // Energy rating
  energyRating: text('energy_rating').notNull(), // green, yellow, red
  energyScore: integer('energy_score'),
  // Value Matrix categorization
  valueQuadrant: text('drip_quadrant'),
  makesMoneyScore: integer('makes_money_score'),
  lightsUpScore: integer('lights_up_score'),
  // Source tracking
  source: text('source').default('manual'),
  externalEventId: text('external_event_id'),
  // Recurring event support
  isRecurring: boolean('is_recurring').default(false),
  recurrenceRule: text('recurrence_rule'), // RFC 5545 RRULE format (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR")
  recurrenceEndDate: date('recurrence_end_date'), // When the recurrence ends
  parentBlockId: uuid('parent_block_id'), // For instances of recurring events, points to the template
  isRecurrenceException: boolean('is_recurrence_exception').default(false), // True if this instance was modified from template
  originalDate: date('original_date'), // Original date before modification (for exceptions)
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userDateIdx: index('time_blocks_user_date_idx').on(table.userId, table.blockDate),
  valueIdx: index('time_blocks_drip_idx').on(table.userId, table.valueQuadrant),
  recurringIdx: index('time_blocks_recurring_idx').on(table.userId, table.isRecurring),
  parentIdx: index('time_blocks_parent_idx').on(table.parentBlockId),
  activityTypeIdx: index('time_blocks_activity_type_idx').on(table.userId, table.activityType),
  detectedProjectIdx: index('time_blocks_detected_project_idx').on(table.detectedProjectId),
}));

// =============================================
// TIME BLOCK MEETING DETAILS (Meeting metadata)
// =============================================
export const timeBlockMeetingDetails = pgTable('time_block_meeting_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  timeBlockId: uuid('time_block_id').notNull().references(() => timeBlocks.id, { onDelete: 'cascade' }).unique(),
  meetingCategoryId: uuid('meeting_category_id').references(() => meetingCategories.id, { onDelete: 'set null' }),
  attendeeCount: integer('attendee_count'),
  isRecurring: boolean('is_recurring').default(false),
  isExternal: boolean('is_external').default(false), // external vs internal
  organizer: text('organizer'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  timeBlockIdx: uniqueIndex('time_block_meeting_details_block_idx').on(table.timeBlockId),
  categoryIdx: index('time_block_meeting_details_category_idx').on(table.meetingCategoryId),
}));

// =============================================
// ACTIVITY CATEGORIES
// =============================================
export const activityCategories = pgTable('activity_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').default('#6366f1'),
  icon: text('icon'),
  defaultValueQuadrant: text('default_drip_quadrant'),
  defaultMakesMoneyScore: integer('default_makes_money_score'),
  defaultEnergyScore: integer('default_energy_score'),
  isSystemDefault: boolean('is_system_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// =============================================
// TIME BLOCK TAGS (Custom user tags for projects/categories)
// =============================================
export const timeBlockTags = pgTable('time_block_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6366f1'),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userNameIdx: uniqueIndex('time_block_tags_user_name_idx').on(table.userId, table.name),
}));

// =============================================
// TIME BLOCK TAG ASSIGNMENTS (Junction table)
// =============================================
export const timeBlockTagAssignments = pgTable('time_block_tag_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  timeBlockId: uuid('time_block_id').notNull().references(() => timeBlocks.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => timeBlockTags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  blockTagIdx: uniqueIndex('time_block_tag_assignments_block_tag_idx').on(table.timeBlockId, table.tagId),
}));

// =============================================
// USER CHARTS (Customizable chart configurations)
// =============================================
export const userCharts = pgTable('user_charts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  // Chart configuration
  chartType: text('chart_type').notNull(), // 'pie', 'bar', 'line'
  title: text('title').notNull(),
  // Flexible configuration stored as JSON
  config: jsonb('config').default({}).notNull(),
  // Display ordering
  position: integer('position').default(0),
  // Track auto-generated vs user-created
  isAutoGenerated: boolean('is_auto_generated').default(false),
  // Visibility
  isVisible: boolean('is_visible').default(true),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('user_charts_user_idx').on(table.userId),
  userPositionIdx: index('user_charts_user_position_idx').on(table.userId, table.position),
}));

// =============================================
// AUDIT SNAPSHOTS (Weekly aggregations)
// =============================================
export const auditSnapshots = pgTable('audit_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  weekStartDate: date('week_start_date').notNull(),
  weekEndDate: date('week_end_date').notNull(),
  // Aggregated metrics
  totalMinutes: integer('total_minutes').default(0),
  delegationMinutes: integer('delegation_minutes').default(0),
  replacementMinutes: integer('replacement_minutes').default(0),
  investmentMinutes: integer('investment_minutes').default(0),
  productionMinutes: integer('production_minutes').default(0),
  greenEnergyMinutes: integer('green_energy_minutes').default(0),
  yellowEnergyMinutes: integer('yellow_energy_minutes').default(0),
  redEnergyMinutes: integer('red_energy_minutes').default(0),
  // Computed scores
  productionRatio: decimal('production_ratio', { precision: 5, scale: 2 }),
  energyBalanceScore: decimal('energy_balance_score', { precision: 5, scale: 2 }),
  // Notes
  reflectionNotes: text('reflection_notes'),
  insights: jsonb('insights'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userWeekIdx: uniqueIndex('audit_snapshots_user_week_idx').on(table.userId, table.weekStartDate),
}));

// =============================================
// ROUTINES
// =============================================
export const routines = pgTable('routines', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // morning, evening, midday, custom
  description: text('description'),
  targetDurationMinutes: integer('target_duration_minutes'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const routineSteps = pgTable('routine_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  routineId: uuid('routine_id').notNull().references(() => routines.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').default(5),
  sortOrder: integer('sort_order').default(0),
  isOptional: boolean('is_optional').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const routineCompletions = pgTable('routine_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  routineId: uuid('routine_id').notNull().references(() => routines.id, { onDelete: 'cascade' }),
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  minId: uuid('min_id').references(() => mins.id, { onDelete: 'set null' }),
  impactProjectId: uuid('power_goal_id').references(() => impactProjects.id, { onDelete: 'set null' }),
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  reviewDate: date('review_date').notNull(),
  reviewType: text('review_type').notNull(), // morning, midday, evening
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
// LEVERAGE ITEMS (4 C's)
// =============================================
export const leverageItems = pgTable('leverage_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  impactProjectId: uuid('power_goal_id').references(() => impactProjects.id, { onDelete: 'set null' }),
  leverageType: text('leverage_type').notNull(), // code, content, capital, collaboration
  actionType: text('action_type').notNull(), // automate, delegate, duplicate
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('idea'),
  implementationNotes: text('implementation_notes'),
  estimatedHoursSavedWeekly: decimal('estimated_hours_saved_weekly', { precision: 5, scale: 2 }),
  actualHoursSavedWeekly: decimal('actual_hours_saved_weekly', { precision: 5, scale: 2 }),
  delegatedTo: text('delegated_to'),
  delegationCostMonthly: decimal('delegation_cost_monthly', { precision: 10, scale: 2 }),
  resourceUrls: jsonb('resource_urls').default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =============================================
// FRIEND INVENTORY
// =============================================
export const friendInventory = pgTable('friend_inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  relationshipType: text('relationship_type'),
  energyImpact: text('energy_impact'), // energizing, neutral, draining
  energyScore: integer('energy_score'),
  connectionFrequency: text('connection_frequency'),
  lastContactDate: date('last_contact_date'),
  nextPlannedContact: date('next_planned_contact'),
  boundariesNotes: text('boundaries_notes'),
  timeLimitWeeklyMinutes: integer('time_limit_weekly_minutes'),
  notes: text('notes'),
  tags: jsonb('tags').default([]),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =============================================
// USER SETTINGS
// =============================================
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }).unique(),
  theme: text('theme').default('system'),
  notifications: boolean('notifications').default(true),
  emailReminders: boolean('email_reminders').default(false),
  weekStartsOn: text('week_starts_on').default('sunday'),
  timeFormat: text('time_format').default('12h'),
  pomodoroWorkMinutes: integer('pomodoro_work_minutes').default(25),
  pomodoroBreakMinutes: integer('pomodoro_break_minutes').default(5),
  calendarStartHour: integer('calendar_start_hour').default(5),
  calendarEndHour: integer('calendar_end_hour').default(23),
  aiProvider: text('ai_provider').default('anthropic'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =============================================
// NORTH STAR METRICS
// =============================================
export const northStarMetrics = pgTable('north_star_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  visionId: uuid('vision_id').references(() => visions.id, { onDelete: 'set null' }),
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
  metricId: uuid('metric_id').notNull().references(() => northStarMetrics.id, { onDelete: 'cascade' }),
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  partnerUserId: uuid('partner_user_id').references(() => profiles.id, { onDelete: 'set null' }),
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  visionId: uuid('vision_id').references(() => visions.id, { onDelete: 'set null' }),
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
// PRO TIPS (Rotating motivational content)
// =============================================
export const proTips = pgTable('pro_tips', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: text('category').notNull(), // 'quote', 'actionable', 'dan_martell'
  content: text('content').notNull(),
  source: text('source'), // attribution
  timeOfDay: text('time_of_day').array(), // ['morning', 'afternoon', 'evening'] or null for all
  isActive: boolean('is_active').default(true),
  displayCount: integer('display_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// =============================================
// DAILY AFFIRMATION COMPLETIONS
// =============================================
export const dailyAffirmationCompletions = pgTable('daily_affirmation_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  visionId: uuid('vision_id').notNull().references(() => visions.id, { onDelete: 'cascade' }),
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  visionId: uuid('vision_id').notNull().references(() => visions.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  frequency: text('frequency').default('daily'), // 'daily', 'weekdays', 'weekends'
  targetCount: integer('target_count').default(1), // times per day
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  nonNegotiableId: uuid('non_negotiable_id').notNull().references(() => nonNegotiables.id, { onDelete: 'cascade' }),
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  visionId: uuid('vision_id').notNull().references(() => visions.id, { onDelete: 'cascade' }),
  reminderType: text('reminder_type').notNull(), // 'daily', 'weekly', 'on_login'
  reminderTime: text('reminder_time'), // for daily reminders, e.g., '06:00'
  dayOfWeek: integer('day_of_week'), // 0-6 for weekly
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('vision_reminders_user_idx').on(table.userId),
  visionIdx: index('vision_reminders_vision_idx').on(table.visionId),
}));

// =============================================
// RELATIONS
// =============================================
export const profilesRelations = relations(profiles, ({ many, one }) => ({
  visions: many(visions),
  backtrackPlans: many(backtrackPlans),
  quarterlyTargets: many(quarterlyTargets),
  impactProjects: many(impactProjects),
  mins: many(mins),
  timeBlocks: many(timeBlocks),
  routines: many(routines),
  dailyReviews: many(dailyReviews),
  leverageItems: many(leverageItems),
  friendInventory: many(friendInventory),
  northStarMetrics: many(northStarMetrics),
  weeklyScorecards: many(weeklyScorecards),
  visionBoardImages: many(visionBoardImages),
  dailyAffirmationCompletions: many(dailyAffirmationCompletions),
  nonNegotiables: many(nonNegotiables),
  nonNegotiableCompletions: many(nonNegotiableCompletions),
  visionReviewReminders: many(visionReviewReminders),
  // New KPI and calendar sync relations
  visionKpis: many(visionKpis),
  kpiLogs: many(kpiLogs),
  calendarSyncSettings: one(calendarSyncSettings),
  calendarSyncRecords: many(calendarSyncRecords),
  calendarWebhookChannels: many(calendarWebhookChannels),
  // AI usage tracking
  aiUsageLogs: many(aiUsageLogs),
  // User settings
  userSettings: one(userSettings),
  // Team collaboration
  ownedTeamMembers: many(teamMembers, { relationName: 'teamOwner' }),
  teamMemberships: many(teamMembers, { relationName: 'teamUser' }),
  keyResults: many(keyResults),
  taskComments: many(taskComments),
  betaFeedback: many(betaFeedback),
  // Sharing
  ownedTabPermissions: many(tabPermissions),
  ownedItemPermissions: many(itemPermissions),
  shareInvitations: many(shareInvitations),
  // Time audit enhanced analytics
  detectedProjects: many(detectedProjects),
  meetingCategories: many(meetingCategories),
  // Gamification
  userAchievements: many(userAchievements),
  userGamification: one(userGamification),
  // Charts and tags
  timeBlockTags: many(timeBlockTags),
  userCharts: many(userCharts),
}));

export const visionsRelations = relations(visions, ({ one, many }) => ({
  user: one(profiles, { fields: [visions.userId], references: [profiles.id] }),
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
  user: one(profiles, { fields: [backtrackPlans.userId], references: [profiles.id] }),
  vision: one(visions, { fields: [backtrackPlans.visionId], references: [visions.id] }),
  quarterlyTargets: many(quarterlyTargets),
  impactProjects: many(impactProjects),
}));

export const quarterlyTargetsRelations = relations(quarterlyTargets, ({ one, many }) => ({
  user: one(profiles, { fields: [quarterlyTargets.userId], references: [profiles.id] }),
  vision: one(visions, { fields: [quarterlyTargets.visionId], references: [visions.id] }),
  backtrackPlan: one(backtrackPlans, { fields: [quarterlyTargets.backtrackPlanId], references: [backtrackPlans.id] }),
  impactProjects: many(impactProjects),
  monthlyTargets: many(monthlyTargets),
}));

export const impactProjectsRelations = relations(impactProjects, ({ one, many }) => ({
  user: one(profiles, { fields: [impactProjects.userId], references: [profiles.id] }),
  vision: one(visions, { fields: [impactProjects.visionId], references: [visions.id] }),
  quarterlyTarget: one(quarterlyTargets, { fields: [impactProjects.quarterlyTargetId], references: [quarterlyTargets.id] }),
  backtrackPlan: one(backtrackPlans, { fields: [impactProjects.backtrackPlanId], references: [backtrackPlans.id] }),
  mins: many(mins),
  leverageItems: many(leverageItems),
  monthlyTargets: many(monthlyTargets),
  milestoneKpis: many(milestoneKpis),
}));

export const monthlyTargetsRelations = relations(monthlyTargets, ({ one, many }) => ({
  user: one(profiles, { fields: [monthlyTargets.userId], references: [profiles.id] }),
  impactProject: one(impactProjects, { fields: [monthlyTargets.impactProjectId], references: [impactProjects.id] }),
  quarterlyTarget: one(quarterlyTargets, { fields: [monthlyTargets.quarterlyTargetId], references: [quarterlyTargets.id] }),
  weeklyTargets: many(weeklyTargets),
}));

export const weeklyTargetsRelations = relations(weeklyTargets, ({ one, many }) => ({
  user: one(profiles, { fields: [weeklyTargets.userId], references: [profiles.id] }),
  monthlyTarget: one(monthlyTargets, { fields: [weeklyTargets.monthlyTargetId], references: [monthlyTargets.id] }),
  dailyActions: many(dailyActions),
}));

export const dailyActionsRelations = relations(dailyActions, ({ one }) => ({
  user: one(profiles, { fields: [dailyActions.userId], references: [profiles.id] }),
  weeklyTarget: one(weeklyTargets, { fields: [dailyActions.weeklyTargetId], references: [weeklyTargets.id] }),
}));

export const minsRelations = relations(mins, ({ one, many }) => ({
  user: one(profiles, { fields: [mins.userId], references: [profiles.id] }),
  impactProject: one(impactProjects, { fields: [mins.impactProjectId], references: [impactProjects.id] }),
  timeBlocks: many(timeBlocks),
}));

export const timeBlocksRelations = relations(timeBlocks, ({ one, many }) => ({
  user: one(profiles, { fields: [timeBlocks.userId], references: [profiles.id] }),
  min: one(mins, { fields: [timeBlocks.minId], references: [mins.id] }),
  detectedProject: one(detectedProjects, { fields: [timeBlocks.detectedProjectId], references: [detectedProjects.id] }),
  meetingDetails: one(timeBlockMeetingDetails),
  tagAssignments: many(timeBlockTagAssignments),
}));

// =============================================
// TIME BLOCK TAG RELATIONS
// =============================================
export const timeBlockTagsRelations = relations(timeBlockTags, ({ one, many }) => ({
  user: one(profiles, { fields: [timeBlockTags.userId], references: [profiles.id] }),
  assignments: many(timeBlockTagAssignments),
}));

export const timeBlockTagAssignmentsRelations = relations(timeBlockTagAssignments, ({ one }) => ({
  timeBlock: one(timeBlocks, { fields: [timeBlockTagAssignments.timeBlockId], references: [timeBlocks.id] }),
  tag: one(timeBlockTags, { fields: [timeBlockTagAssignments.tagId], references: [timeBlockTags.id] }),
}));

// =============================================
// USER CHARTS RELATIONS
// =============================================
export const userChartsRelations = relations(userCharts, ({ one }) => ({
  user: one(profiles, { fields: [userCharts.userId], references: [profiles.id] }),
}));

export const detectedProjectsRelations = relations(detectedProjects, ({ one, many }) => ({
  user: one(profiles, { fields: [detectedProjects.userId], references: [profiles.id] }),
  impactProject: one(impactProjects, { fields: [detectedProjects.impactProjectId], references: [impactProjects.id] }),
  mergedInto: one(detectedProjects, { fields: [detectedProjects.mergedIntoId], references: [detectedProjects.id], relationName: 'projectMerge' }),
  mergedFrom: many(detectedProjects, { relationName: 'projectMerge' }),
  timeBlocks: many(timeBlocks),
}));

export const meetingCategoriesRelations = relations(meetingCategories, ({ one, many }) => ({
  user: one(profiles, { fields: [meetingCategories.userId], references: [profiles.id] }),
  meetingDetails: many(timeBlockMeetingDetails),
}));

export const timeBlockMeetingDetailsRelations = relations(timeBlockMeetingDetails, ({ one }) => ({
  timeBlock: one(timeBlocks, { fields: [timeBlockMeetingDetails.timeBlockId], references: [timeBlocks.id] }),
  meetingCategory: one(meetingCategories, { fields: [timeBlockMeetingDetails.meetingCategoryId], references: [meetingCategories.id] }),
}));

export const routinesRelations = relations(routines, ({ one, many }) => ({
  user: one(profiles, { fields: [routines.userId], references: [profiles.id] }),
  steps: many(routineSteps),
  completions: many(routineCompletions),
}));

export const routineStepsRelations = relations(routineSteps, ({ one }) => ({
  routine: one(routines, { fields: [routineSteps.routineId], references: [routines.id] }),
}));

export const visionBoardImagesRelations = relations(visionBoardImages, ({ one }) => ({
  user: one(profiles, { fields: [visionBoardImages.userId], references: [profiles.id] }),
  vision: one(visions, { fields: [visionBoardImages.visionId], references: [visions.id] }),
}));

export const dailyAffirmationCompletionsRelations = relations(dailyAffirmationCompletions, ({ one }) => ({
  user: one(profiles, { fields: [dailyAffirmationCompletions.userId], references: [profiles.id] }),
  vision: one(visions, { fields: [dailyAffirmationCompletions.visionId], references: [visions.id] }),
}));

export const nonNegotiablesRelations = relations(nonNegotiables, ({ one, many }) => ({
  user: one(profiles, { fields: [nonNegotiables.userId], references: [profiles.id] }),
  vision: one(visions, { fields: [nonNegotiables.visionId], references: [visions.id] }),
  completions: many(nonNegotiableCompletions),
}));

export const nonNegotiableCompletionsRelations = relations(nonNegotiableCompletions, ({ one }) => ({
  user: one(profiles, { fields: [nonNegotiableCompletions.userId], references: [profiles.id] }),
  nonNegotiable: one(nonNegotiables, { fields: [nonNegotiableCompletions.nonNegotiableId], references: [nonNegotiables.id] }),
}));

export const visionReviewRemindersRelations = relations(visionReviewReminders, ({ one }) => ({
  user: one(profiles, { fields: [visionReviewReminders.userId], references: [profiles.id] }),
  vision: one(visions, { fields: [visionReviewReminders.visionId], references: [visions.id] }),
}));

// =============================================
// VISION KPIs (AI-Generated Hierarchical KPIs)
// =============================================
export const visionKpis = pgTable('vision_kpis', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  visionId: uuid('vision_id').notNull().references(() => visions.id, { onDelete: 'cascade' }),
  // KPI hierarchy level
  level: text('level').notNull(), // 'quarterly', 'monthly', 'weekly', 'daily'
  // KPI details
  title: text('title').notNull(),
  description: text('description'),
  targetValue: text('target_value'), // e.g., "$10,000", "5 per week"
  unit: text('unit'), // e.g., "dollars", "count", "hours"
  numericTarget: decimal('numeric_target', { precision: 15, scale: 2 }),
  // Hierarchical organization - self-reference with FK constraint
  parentKpiId: uuid('parent_kpi_id').references((): AnyPgColumn => visionKpis.id, { onDelete: 'set null' }),
  // Weight for weighted progress calculation (PROG-03)
  weight: decimal('weight', { precision: 5, scale: 2 }).default('1'),
  quarter: integer('quarter'), // 1-4 for quarterly
  month: integer('month'), // 1-12 for monthly
  // Additional metadata from AI generation
  category: text('category'), // 'Activity' or 'Output' for weekly KPIs
  trackingMethod: text('tracking_method'),
  leadsTo: text('leads_to'), // what this KPI drives
  bestTime: text('best_time'), // for daily habits: 'Morning', 'Afternoon', 'Evening'
  timeRequired: text('time_required'), // for daily habits: '30 minutes'
  whyItMatters: text('why_it_matters'),
  // AI generation metadata
  successFormula: text('success_formula'), // narrative explaining the system
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  kpiId: uuid('kpi_id').notNull().references(() => visionKpis.id, { onDelete: 'cascade' }),
  // Log details
  logDate: date('log_date').notNull(),
  value: decimal('value', { precision: 15, scale: 2 }),
  isCompleted: boolean('is_completed').default(false),
  completionCount: integer('completion_count').default(0),
  // Notes and context
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
  kpiId: uuid('kpi_id').notNull().references(() => visionKpis.id, { onDelete: 'cascade' }).unique(),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastCompletedDate: date('last_completed_date'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =============================================
// ACHIEVEMENTS (Predefined achievement definitions)
// =============================================
export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 50 }).notNull().unique(), // e.g., 'first_kpi', 'streak_7'
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  category: achievementCategoryEnum('category').notNull(),
  iconName: varchar('icon_name', { length: 50 }), // Lucide icon name
  xpReward: integer('xp_reward').default(0),
  requiredValue: integer('required_value'), // e.g., 7 for 7-day streak
  isSecret: boolean('is_secret').default(false), // Hidden until unlocked
  createdAt: timestamp('created_at').defaultNow(),
});

// =============================================
// USER_ACHIEVEMENTS (Junction table for unlocked achievements)
// =============================================
export const userAchievements = pgTable('user_achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  achievementId: uuid('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  unlockedAt: timestamp('unlocked_at').defaultNow(),
  progressValue: integer('progress_value'), // Current progress toward achievement
}, (table) => ({
  uniqueUserAchievement: unique().on(table.userId, table.achievementId),
  userIdx: index('user_achievements_user_idx').on(table.userId),
}));

// =============================================
// USER_GAMIFICATION (XP/Level tracking per user)
// =============================================
export const userGamification = pgTable('user_gamification', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }).unique(),
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
// KPI PROGRESS CACHE (Pre-computed Aggregates)
// =============================================
export const kpiProgressCache = pgTable('kpi_progress_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  kpiId: uuid('kpi_id').notNull().references(() => visionKpis.id, { onDelete: 'cascade' }).unique(),
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
  // Status derived from progress
  status: text('status').default('not_started'), // 'not_started', 'in_progress', 'at_risk', 'on_track', 'completed'
  // Metadata
  lastCalculatedAt: timestamp('last_calculated_at').defaultNow(),
  calculationMethod: text('calculation_method').default('auto'), // 'auto', 'manual_override'
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  milestoneId: uuid('milestone_id').notNull().references(() => impactProjects.id, { onDelete: 'cascade' }),
  kpiId: uuid('kpi_id').references(() => visionKpis.id, { onDelete: 'cascade' }),
  // Custom KPI fields (when not linking to existing vision KPI)
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
// CALENDAR SYNC SETTINGS (User Preferences)
// =============================================
export const calendarSyncSettings = pgTable('calendar_sync_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }).unique(),
  // Sync preferences per goal level
  syncQuarterlyTargets: boolean('sync_quarterly_targets').default(true),
  syncMonthlyTargets: boolean('sync_monthly_targets').default(true),
  syncWeeklyTargets: boolean('sync_weekly_targets').default(true),
  syncDailyActions: boolean('sync_daily_actions').default(true),
  // Event appearance (Google Calendar color IDs)
  quarterlyColorId: text('quarterly_color_id').default('11'),
  monthlyColorId: text('monthly_color_id').default('10'),
  weeklyColorId: text('weekly_color_id').default('9'),
  dailyColorId: text('daily_color_id').default('1'),
  // Sync settings
  autoSyncEnabled: boolean('auto_sync_enabled').default(true),
  syncIntervalMinutes: integer('sync_interval_minutes').default(15),
  // Two-way sync settings
  twoWaySyncEnabled: boolean('two_way_sync_enabled').default(true),
  conflictResolution: text('conflict_resolution').default('app_wins'), // 'app_wins', 'calendar_wins', 'ask'
  // Timestamps
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =============================================
// CALENDAR SYNC RECORDS (Event Tracking)
// =============================================
export const calendarSyncRecords = pgTable('calendar_sync_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  // Entity reference (polymorphic)
  entityType: text('entity_type').notNull(), // 'quarterly_target', 'monthly_target', 'weekly_target', 'daily_action'
  entityId: uuid('entity_id').notNull(),
  // Google Calendar reference
  googleEventId: text('google_event_id').notNull(),
  googleCalendarId: text('google_calendar_id').default('primary'),
  // Sync metadata
  syncStatus: text('sync_status').default('synced'), // 'synced', 'pending_push', 'pending_pull', 'conflict', 'error'
  lastSyncedAt: timestamp('last_synced_at'),
  localModifiedAt: timestamp('local_modified_at'),
  remoteModifiedAt: timestamp('remote_modified_at'),
  etag: text('etag'), // Google Calendar ETag for optimistic concurrency
  // Error tracking
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  nextRetryAt: timestamp('next_retry_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  entityIdx: uniqueIndex('calendar_sync_entity_idx').on(table.entityType, table.entityId),
  userStatusIdx: index('calendar_sync_user_status_idx').on(table.userId, table.syncStatus),
  googleEventIdx: index('calendar_sync_google_event_idx').on(table.googleEventId),
}));

// =============================================
// CALENDAR WEBHOOK CHANNELS (Push Notifications)
// =============================================
export const calendarWebhookChannels = pgTable('calendar_webhook_channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  channelId: text('channel_id').notNull().unique(), // Our UUID for the channel
  resourceId: text('resource_id').notNull(), // Google's resource ID
  expiration: timestamp('expiration').notNull(),
  token: text('token'), // Verification token
  calendarId: text('calendar_id').default('primary'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('calendar_webhook_user_idx').on(table.userId),
}));

// =============================================
// PROJECTS (Unified Vision/Goal System - V2)
// =============================================
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),

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

  // 300% Rule Scores (latest values - history in daily_checkins)
  clarityScore: integer('clarity_score').default(0),
  beliefScore: integer('belief_score').default(0),
  consistencyScore: integer('consistency_score').default(0),

  // Revenue Math (for money goals - Hormozi style)
  revenueMath: jsonb('revenue_math').default({}), // { currentRevenue, targetRevenue, avgDealValue, closeRate, dealsNeeded, proposalsNeeded, leadsNeeded }

  // Focus & Priority
  isFocused: boolean('is_focused').default(false), // Is this the user's primary focus project?
  priority: integer('priority').default(1),

  // Progress (calculated from key results)
  progressPercentage: integer('progress_percentage').default(0),

  // Vision Board
  coverImageUrl: text('cover_image_url'),
  affirmationText: text('affirmation_text'),

  // Status
  status: text('status').default('active'), // 'active', 'paused', 'completed', 'archived'
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
// PROJECT KEY RESULTS (Measurable Outcomes for Projects - V2)
// =============================================
export const projectKeyResults = pgTable('project_key_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),

  // Metric Definition
  name: text('name').notNull(),
  description: text('description'),

  // Values
  targetValue: decimal('target_value', { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
  startingValue: decimal('starting_value', { precision: 15, scale: 2 }).default('0'),

  // Unit & Display
  unitType: text('unit_type').default('number'), // 'number', 'currency', 'percentage', 'boolean'
  unitLabel: text('unit_label'), // e.g., 'projects', 'dollars', '%'

  // Weight for project progress calculation
  weight: decimal('weight', { precision: 3, scale: 2 }).default('1.00'), // 0.00 to 1.00

  // Progress (calculated)
  progressPercentage: integer('progress_percentage').default(0),

  // Status
  status: text('status').default('not_started'), // 'not_started', 'in_progress', 'at_risk', 'on_track', 'completed'
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
// PROJECT KEY RESULT LOGS (Progress History - V2)
// =============================================
export const projectKeyResultLogs = pgTable('project_key_result_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  keyResultId: uuid('key_result_id').notNull().references(() => projectKeyResults.id, { onDelete: 'cascade' }),

  // Value change
  previousValue: decimal('previous_value', { precision: 15, scale: 2 }),
  newValue: decimal('new_value', { precision: 15, scale: 2 }).notNull(),

  // Metadata
  note: text('note'),
  source: text('source').default('manual'), // 'manual', 'api', 'automation'

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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),

  // Basic Info
  title: text('title').notNull(),
  description: text('description'),

  // Timeline
  quarter: integer('quarter'), // 1-4 (optional, for quarterly view)
  year: integer('year'),
  targetDate: date('target_date'),

  // Linked Key Results (which KRs does completing this milestone impact?)
  linkedKeyResultIds: jsonb('linked_key_result_ids').default([]), // Array of key_result UUIDs

  // Progress
  progressPercentage: integer('progress_percentage').default(0),
  status: text('status').default('pending'), // 'pending', 'in_progress', 'completed'
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  milestoneId: uuid('milestone_id').references(() => milestonesV2.id, { onDelete: 'set null' }),
  keyResultId: uuid('key_result_id').references(() => projectKeyResults.id, { onDelete: 'set null' }),

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
  valueQuadrant: text('value_quadrant'), // 'D', 'R', 'I', 'P' (Value Matrix)
  fourCsTag: fourCsTypeEnum('four_cs_tag'), // Code, Content, Capital, Collaboration

  // Recurrence
  recurrence: taskRecurrenceEnum('recurrence').default('none'),
  recurrenceRule: text('recurrence_rule'), // RFC 5545 RRULE
  parentTaskId: uuid('parent_task_id'), // For recurring task instances

  // Google Calendar Integration
  googleCalendarEventId: text('google_calendar_event_id'),
  calendarSyncStatus: text('calendar_sync_status').default('not_synced'), // 'not_synced', 'synced', 'pending', 'error'
  calendarSyncedAt: timestamp('calendar_synced_at'),

  // Status
  status: text('status').default('pending'), // 'pending', 'in_progress', 'completed', 'cancelled'
  completedAt: timestamp('completed_at'),

  // XP awarded (for tracking)
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),

  // Date of check-in
  checkInDate: date('check_in_date').notNull(),

  // 300% Scores (1-10 each)
  clarityScore: integer('clarity_score').notNull(),
  beliefScore: integer('belief_score').notNull(),
  consistencyScore: integer('consistency_score').notNull(),

  // Calculated total (sum of 3 scores * 10 = max 300)
  totalScore: integer('total_score').notNull(),

  // Optional notes
  note: text('note'),

  // Prompts triggered based on low scores
  promptsTriggered: jsonb('prompts_triggered').default([]), // ['low_clarity', 'low_belief', 'low_consistency']

  // XP awarded for this check-in
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),

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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),

  // Reward definition
  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  estimatedValue: decimal('estimated_value', { precision: 10, scale: 2 }), // Dollar value (optional)

  // Trigger configuration
  triggerType: rewardTriggerTypeEnum('trigger_type').notNull(),
  triggerId: uuid('trigger_id'), // milestone_id or key_result_id (null for XP threshold)
  triggerValue: decimal('trigger_value', { precision: 15, scale: 2 }), // XP threshold amount (for xp_threshold type)

  // Progress tracking
  progressPercentage: integer('progress_percentage').default(0),
  currentProgress: decimal('current_progress', { precision: 15, scale: 2 }).default('0'), // Current XP or completion %

  // Status
  status: text('status').default('locked'), // 'locked', 'unlocked', 'claimed'
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
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  rewardId: uuid('reward_id').notNull().references(() => rewards.id, { onDelete: 'cascade' }),

  // Claim details
  claimedAt: timestamp('claimed_at').defaultNow(),

  // Snapshot of reward at claim time
  rewardName: text('reward_name').notNull(),
  rewardDescription: text('reward_description'),
  rewardValue: decimal('reward_value', { precision: 10, scale: 2 }),

  // Optional note from user
  note: text('note'),

  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('reward_claims_user_idx').on(table.userId),
  rewardIdx: index('reward_claims_reward_idx').on(table.rewardId),
  dateIdx: index('reward_claims_date_idx').on(table.userId, table.claimedAt),
}));

// =============================================
// KPI RELATIONS
// =============================================
export const visionKpisRelations = relations(visionKpis, ({ one, many }) => ({
  user: one(profiles, { fields: [visionKpis.userId], references: [profiles.id] }),
  vision: one(visions, { fields: [visionKpis.visionId], references: [visions.id] }),
  parentKpi: one(visionKpis, { fields: [visionKpis.parentKpiId], references: [visionKpis.id], relationName: 'parentChild' }),
  childKpis: many(visionKpis, { relationName: 'parentChild' }),
  logs: many(kpiLogs),
  streak: one(kpiStreaks),
  progressCache: one(kpiProgressCache),
}));

// KPI Progress Cache Relations
export const kpiProgressCacheRelations = relations(kpiProgressCache, ({ one }) => ({
  kpi: one(visionKpis, { fields: [kpiProgressCache.kpiId], references: [visionKpis.id] }),
}));

export const kpiLogsRelations = relations(kpiLogs, ({ one }) => ({
  user: one(profiles, { fields: [kpiLogs.userId], references: [profiles.id] }),
  kpi: one(visionKpis, { fields: [kpiLogs.kpiId], references: [visionKpis.id] }),
}));

export const kpiStreaksRelations = relations(kpiStreaks, ({ one }) => ({
  kpi: one(visionKpis, { fields: [kpiStreaks.kpiId], references: [visionKpis.id] }),
}));

export const milestoneKpisRelations = relations(milestoneKpis, ({ one }) => ({
  user: one(profiles, { fields: [milestoneKpis.userId], references: [profiles.id] }),
  milestone: one(impactProjects, { fields: [milestoneKpis.milestoneId], references: [impactProjects.id] }),
  kpi: one(visionKpis, { fields: [milestoneKpis.kpiId], references: [visionKpis.id] }),
}));

// =============================================
// CALENDAR SYNC RELATIONS
// =============================================
export const calendarSyncSettingsRelations = relations(calendarSyncSettings, ({ one }) => ({
  user: one(profiles, { fields: [calendarSyncSettings.userId], references: [profiles.id] }),
}));

export const calendarSyncRecordsRelations = relations(calendarSyncRecords, ({ one }) => ({
  user: one(profiles, { fields: [calendarSyncRecords.userId], references: [profiles.id] }),
}));

export const calendarWebhookChannelsRelations = relations(calendarWebhookChannels, ({ one }) => ({
  user: one(profiles, { fields: [calendarWebhookChannels.userId], references: [profiles.id] }),
}));

// =============================================
// AI USAGE LOGS (Track AI API calls for billing)
// =============================================
export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  // API endpoint that was called
  endpoint: text('endpoint').notNull(),
  // AI model used
  model: text('model').notNull(),
  // Token usage
  promptTokens: integer('prompt_tokens').default(0),
  completionTokens: integer('completion_tokens').default(0),
  totalTokens: integer('total_tokens').default(0),
  // Cost calculation (in cents for precision)
  estimatedCostCents: decimal('estimated_cost_cents', { precision: 10, scale: 4 }).default('0'),
  // Request metadata
  requestType: text('request_type'), // 'generate-smart', 'generate-power-goals', 'generate-kpis', etc.
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  // Response time in milliseconds
  responseTimeMs: integer('response_time_ms'),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('ai_usage_logs_user_idx').on(table.userId),
  createdAtIdx: index('ai_usage_logs_created_at_idx').on(table.createdAt),
  endpointIdx: index('ai_usage_logs_endpoint_idx').on(table.endpoint),
}));

export const aiUsageLogsRelations = relations(aiUsageLogs, ({ one }) => ({
  user: one(profiles, { fields: [aiUsageLogs.userId], references: [profiles.id] }),
}));

// =============================================
// TEAM MEMBERS (Team Directory)
// =============================================
export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  // Member identity
  email: text('email'),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  // Role and access
  role: text('role').notNull().default('member'), // 'admin', 'member', 'viewer', 'external'
  accessLevel: text('access_level').notNull().default('limited'), // 'full', 'limited', 'external'
  // For linked accounts
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
  // Invitation status
  inviteStatus: text('invite_status').default('pending'), // 'pending', 'accepted', 'declined'
  invitedAt: timestamp('invited_at'),
  acceptedAt: timestamp('accepted_at'),
  inviteToken: text('invite_token'),
  // Contact info
  phone: text('phone'),
  title: text('title'), // Job title
  department: text('department'),
  // Notes
  notes: text('notes'),
  // Status
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  ownerIdx: index('team_members_owner_idx').on(table.ownerId),
  emailIdx: index('team_members_email_idx').on(table.ownerId, table.email),
  userIdx: index('team_members_user_idx').on(table.userId),
}));

// =============================================
// TAB PERMISSIONS (Tab-level sharing)
// =============================================
export const tabPermissions = pgTable('tab_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  teamMemberId: uuid('team_member_id').notNull().references(() => teamMembers.id, { onDelete: 'cascade' }),
  tabName: text('tab_name').notNull(), // 'vision', 'goals', 'time_audit', 'mins', etc.
  permissionLevel: text('permission_level').notNull().default('view'), // 'view' | 'edit'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  ownerMemberTabIdx: uniqueIndex('tab_permissions_owner_member_tab_idx').on(table.ownerId, table.teamMemberId, table.tabName),
  memberIdx: index('tab_permissions_member_idx').on(table.teamMemberId),
}));

// =============================================
// ITEM PERMISSIONS (Item-level sharing)
// =============================================
export const itemPermissions = pgTable('item_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  teamMemberId: uuid('team_member_id').notNull().references(() => teamMembers.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(), // 'vision', 'power_goal', 'monthly_target', 'time_block', etc.
  entityId: uuid('entity_id').notNull(),
  permissionLevel: text('permission_level').notNull().default('view'), // 'view' | 'edit'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  memberEntityIdx: uniqueIndex('item_permissions_member_entity_idx').on(table.teamMemberId, table.entityType, table.entityId),
  ownerIdx: index('item_permissions_owner_idx').on(table.ownerId),
  entityIdx: index('item_permissions_entity_idx').on(table.entityType, table.entityId),
}));

// =============================================
// SHARE INVITATIONS (Pending invites)
// =============================================
export const shareInvitations = pgTable('share_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  inviteToken: text('invite_token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  status: text('status').default('pending'), // 'pending' | 'accepted' | 'expired' | 'revoked'
  shareType: text('share_type').notNull(), // 'tab' | 'item' | 'both'
  // JSON data for what's being shared
  tabPermissionsData: jsonb('tab_permissions_data').default([]), // [{tabName, permissionLevel}]
  itemPermissionsData: jsonb('item_permissions_data').default([]), // [{entityType, entityId, permissionLevel}]
  // Tracking
  createdAt: timestamp('created_at').defaultNow(),
  acceptedAt: timestamp('accepted_at'),
  acceptedBy: uuid('accepted_by').references(() => profiles.id, { onDelete: 'set null' }),
}, (table) => ({
  tokenIdx: uniqueIndex('share_invitations_token_idx').on(table.inviteToken),
  ownerEmailIdx: index('share_invitations_owner_email_idx').on(table.ownerId, table.email),
  statusIdx: index('share_invitations_status_idx').on(table.status),
}));

// =============================================
// KEY RESULTS (OKRs)
// =============================================
export const keyResults = pgTable('key_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  visionId: uuid('vision_id').notNull().references(() => visions.id, { onDelete: 'cascade' }),
  // Optional link to impact project (DB column still named power_goal_id)
  impactProjectId: uuid('power_goal_id').references(() => impactProjects.id, { onDelete: 'set null' }),
  // Key Result details
  title: text('title').notNull(),
  description: text('description'),
  // Target metrics
  targetValue: decimal('target_value', { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
  startValue: decimal('start_value', { precision: 15, scale: 2 }).default('0'),
  unit: text('unit').notNull(), // '$', 'users', '%', 'count', etc.
  // Ownership
  assigneeId: uuid('assignee_id').references(() => teamMembers.id, { onDelete: 'set null' }),
  assigneeName: text('assignee_name'),
  // Time period
  quarter: integer('quarter'), // 1-4
  year: integer('year'),
  dueDate: date('due_date'),
  // Status tracking
  status: text('status').default('on_track'), // 'on_track', 'at_risk', 'behind', 'achieved', 'cancelled'
  progressPercentage: integer('progress_percentage').default(0),
  // Confidence level
  confidenceLevel: integer('confidence_level').default(70), // 0-100%
  // Notes and context
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
  keyResultId: uuid('key_result_id').notNull().references(() => keyResults.id, { onDelete: 'cascade' }),
  // Value change
  previousValue: decimal('previous_value', { precision: 15, scale: 2 }),
  newValue: decimal('new_value', { precision: 15, scale: 2 }).notNull(),
  // Status change
  previousStatus: text('previous_status'),
  newStatus: text('new_status'),
  // Context
  notes: text('notes'),
  // Who made the update
  updatedBy: uuid('updated_by').references(() => profiles.id, { onDelete: 'set null' }),
  updatedByName: text('updated_by_name'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  keyResultIdx: index('key_result_updates_kr_idx').on(table.keyResultId),
  dateIdx: index('key_result_updates_date_idx').on(table.createdAt),
}));

// =============================================
// TASK COMMENTS (For team collaboration)
// =============================================
export const taskComments = pgTable('task_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  // Polymorphic reference to task
  entityType: text('entity_type').notNull(), // 'daily_action', 'weekly_target', 'monthly_target', 'power_goal', 'key_result'
  entityId: uuid('entity_id').notNull(),
  // Comment content
  content: text('content').notNull(),
  // Thread support
  parentCommentId: uuid('parent_comment_id'),
  // Status
  isEdited: boolean('is_edited').default(false),
  editedAt: timestamp('edited_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  entityIdx: index('task_comments_entity_idx').on(table.entityType, table.entityId),
  userIdx: index('task_comments_user_idx').on(table.userId),
}));

// =============================================
// TEAM MEMBER RELATIONS
// =============================================
export const teamMembersRelations = relations(teamMembers, ({ one, many }) => ({
  owner: one(profiles, { fields: [teamMembers.ownerId], references: [profiles.id], relationName: 'teamOwner' }),
  user: one(profiles, { fields: [teamMembers.userId], references: [profiles.id], relationName: 'teamUser' }),
  keyResults: many(keyResults),
  // Sharing permissions granted to this team member
  tabPermissions: many(tabPermissions),
  itemPermissions: many(itemPermissions),
}));

export const keyResultsRelations = relations(keyResults, ({ one, many }) => ({
  user: one(profiles, { fields: [keyResults.userId], references: [profiles.id] }),
  vision: one(visions, { fields: [keyResults.visionId], references: [visions.id] }),
  impactProject: one(impactProjects, { fields: [keyResults.impactProjectId], references: [impactProjects.id] }),
  assignee: one(teamMembers, { fields: [keyResults.assigneeId], references: [teamMembers.id] }),
  updates: many(keyResultUpdates),
}));

export const keyResultUpdatesRelations = relations(keyResultUpdates, ({ one }) => ({
  keyResult: one(keyResults, { fields: [keyResultUpdates.keyResultId], references: [keyResults.id] }),
  updatedByUser: one(profiles, { fields: [keyResultUpdates.updatedBy], references: [profiles.id] }),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  user: one(profiles, { fields: [taskComments.userId], references: [profiles.id] }),
}));

// =============================================
// BETA FEEDBACK (Bug Reports & Feature Requests)
// =============================================
export const betaFeedback = pgTable('beta_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  // Feedback details
  feedbackType: text('feedback_type').notNull(), // 'bug', 'feature', 'improvement', 'general'
  title: text('title').notNull(),
  description: text('description').notNull(),
  // Priority and status (for admin tracking)
  priority: text('priority').default('medium'), // 'low', 'medium', 'high', 'critical'
  status: text('status').default('open'), // 'open', 'in_progress', 'resolved', 'closed', 'wont_fix'
  // Browser/context info (auto-captured)
  currentUrl: text('current_url'),
  userAgent: text('user_agent'),
  screenResolution: text('screen_resolution'),
  // Optional screenshot reference
  screenshotUrl: text('screenshot_url'),
  // Admin response
  adminResponse: text('admin_response'),
  respondedAt: timestamp('responded_at'),
  resolvedAt: timestamp('resolved_at'),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('beta_feedback_user_idx').on(table.userId),
  statusIdx: index('beta_feedback_status_idx').on(table.status),
  typeIdx: index('beta_feedback_type_idx').on(table.feedbackType),
  createdAtIdx: index('beta_feedback_created_at_idx').on(table.createdAt),
}));

export const betaFeedbackRelations = relations(betaFeedback, ({ one }) => ({
  user: one(profiles, { fields: [betaFeedback.userId], references: [profiles.id] }),
}));

// =============================================
// BETA INVITATIONS (Beta Access Control)
// =============================================
export const betaInvitations = pgTable('beta_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  inviteToken: text('invite_token').notNull().unique(),
  invitedByEmail: text('invited_by_email'),
  status: text('status').default('pending'), // 'pending', 'accepted', 'expired', 'revoked'
  note: text('note'),
  acceptedAt: timestamp('accepted_at'),
  acceptedByUserId: uuid('accepted_by_user_id').references(() => profiles.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex('beta_invitations_email_idx').on(table.email),
  tokenIdx: uniqueIndex('beta_invitations_token_idx').on(table.inviteToken),
  statusIdx: index('beta_invitations_status_idx').on(table.status),
}));

export const betaInvitationsRelations = relations(betaInvitations, ({ one }) => ({
  acceptedByUser: one(profiles, { fields: [betaInvitations.acceptedByUserId], references: [profiles.id] }),
}));

// =============================================
// SHARING RELATIONS
// =============================================
export const tabPermissionsRelations = relations(tabPermissions, ({ one }) => ({
  owner: one(profiles, { fields: [tabPermissions.ownerId], references: [profiles.id] }),
  teamMember: one(teamMembers, { fields: [tabPermissions.teamMemberId], references: [teamMembers.id] }),
}));

export const itemPermissionsRelations = relations(itemPermissions, ({ one }) => ({
  owner: one(profiles, { fields: [itemPermissions.ownerId], references: [profiles.id] }),
  teamMember: one(teamMembers, { fields: [itemPermissions.teamMemberId], references: [teamMembers.id] }),
}));

export const shareInvitationsRelations = relations(shareInvitations, ({ one }) => ({
  owner: one(profiles, { fields: [shareInvitations.ownerId], references: [profiles.id] }),
  acceptedByUser: one(profiles, { fields: [shareInvitations.acceptedBy], references: [profiles.id] }),
}));

// =============================================
// GAMIFICATION RELATIONS
// =============================================
export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(profiles, {
    fields: [userAchievements.userId],
    references: [profiles.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const userGamificationRelations = relations(userGamification, ({ one }) => ({
  user: one(profiles, {
    fields: [userGamification.userId],
    references: [profiles.id],
  }),
}));

// =============================================
// PROJECT SYSTEM V2 RELATIONS
// =============================================
export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(profiles, { fields: [projects.userId], references: [profiles.id] }),
  keyResults: many(projectKeyResults),
  milestones: many(milestonesV2),
  tasks: many(tasks),
  dailyCheckins: many(dailyCheckins),
  streaks: many(streaksV2),
}));

export const projectKeyResultsRelations = relations(projectKeyResults, ({ one, many }) => ({
  user: one(profiles, { fields: [projectKeyResults.userId], references: [profiles.id] }),
  project: one(projects, { fields: [projectKeyResults.projectId], references: [projects.id] }),
  logs: many(projectKeyResultLogs),
  tasks: many(tasks),
}));

export const projectKeyResultLogsRelations = relations(projectKeyResultLogs, ({ one }) => ({
  user: one(profiles, { fields: [projectKeyResultLogs.userId], references: [profiles.id] }),
  keyResult: one(projectKeyResults, { fields: [projectKeyResultLogs.keyResultId], references: [projectKeyResults.id] }),
}));

export const milestonesV2Relations = relations(milestonesV2, ({ one, many }) => ({
  user: one(profiles, { fields: [milestonesV2.userId], references: [profiles.id] }),
  project: one(projects, { fields: [milestonesV2.projectId], references: [projects.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(profiles, { fields: [tasks.userId], references: [profiles.id] }),
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  milestone: one(milestonesV2, { fields: [tasks.milestoneId], references: [milestonesV2.id] }),
  keyResult: one(projectKeyResults, { fields: [tasks.keyResultId], references: [projectKeyResults.id] }),
}));

export const dailyCheckinsRelations = relations(dailyCheckins, ({ one }) => ({
  user: one(profiles, { fields: [dailyCheckins.userId], references: [profiles.id] }),
  project: one(projects, { fields: [dailyCheckins.projectId], references: [projects.id] }),
}));

export const streaksV2Relations = relations(streaksV2, ({ one }) => ({
  user: one(profiles, { fields: [streaksV2.userId], references: [profiles.id] }),
  project: one(projects, { fields: [streaksV2.projectId], references: [projects.id] }),
}));

export const rewardsRelations = relations(rewards, ({ one, many }) => ({
  user: one(profiles, { fields: [rewards.userId], references: [profiles.id] }),
  claims: many(rewardClaims),
}));

export const rewardClaimsRelations = relations(rewardClaims, ({ one }) => ({
  user: one(profiles, { fields: [rewardClaims.userId], references: [profiles.id] }),
  reward: one(rewards, { fields: [rewardClaims.rewardId], references: [rewards.id] }),
}));
