// Drizzle ORM Schema for Goal Achiever Pro

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  date,
  time,
  decimal,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
  // Status
  isActive: boolean('is_active').default(true),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// =============================================
// POWER GOALS (12 Annual Projects)
// =============================================
export const powerGoals = pgTable('power_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  visionId: uuid('vision_id').references(() => visions.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  targetDate: date('target_date'),
  year: integer('year').notNull(),
  quarter: integer('quarter'),
  category: text('category'),
  progressPercentage: integer('progress_percentage').default(0),
  status: text('status').default('active'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userYearIdx: index('power_goals_user_year_idx').on(table.userId, table.year),
}));

// =============================================
// MONTHLY TARGETS (Links to Power Goals)
// =============================================
export const monthlyTargets = pgTable('monthly_targets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  powerGoalId: uuid('power_goal_id').notNull().references(() => powerGoals.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  targetMonth: integer('target_month').notNull(), // 1-12
  targetYear: integer('target_year').notNull(),
  keyMetric: text('key_metric'),
  targetValue: decimal('target_value', { precision: 15, scale: 2 }),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0'),
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
  status: text('status').default('pending'),
  completedAt: timestamp('completed_at'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userDateIdx: index('daily_actions_user_date_idx').on(table.userId, table.actionDate),
}));

// =============================================
// MINS (Most Important Next Steps)
// =============================================
export const mins = pgTable('mins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  powerGoalId: uuid('power_goal_id').references(() => powerGoals.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  scheduledDate: date('scheduled_date').notNull(),
  scheduledTime: time('scheduled_time'),
  durationMinutes: integer('duration_minutes').default(30),
  priority: integer('priority').default(1),
  // DRIP categorization
  dripQuadrant: text('drip_quadrant'),
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
  // Energy rating
  energyRating: text('energy_rating').notNull(), // green, yellow, red
  energyScore: integer('energy_score'),
  // DRIP categorization
  dripQuadrant: text('drip_quadrant'),
  makesMoneyScore: integer('makes_money_score'),
  lightsUpScore: integer('lights_up_score'),
  // Source tracking
  source: text('source').default('manual'),
  externalEventId: text('external_event_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userDateIdx: index('time_blocks_user_date_idx').on(table.userId, table.blockDate),
  dripIdx: index('time_blocks_drip_idx').on(table.userId, table.dripQuadrant),
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
  defaultDripQuadrant: text('default_drip_quadrant'),
  defaultMakesMoneyScore: integer('default_makes_money_score'),
  defaultEnergyScore: integer('default_energy_score'),
  isSystemDefault: boolean('is_system_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

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
  powerGoalId: uuid('power_goal_id').references(() => powerGoals.id, { onDelete: 'set null' }),
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
  powerGoalId: uuid('power_goal_id').references(() => powerGoals.id, { onDelete: 'set null' }),
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
// RELATIONS
// =============================================
export const profilesRelations = relations(profiles, ({ many }) => ({
  visions: many(visions),
  powerGoals: many(powerGoals),
  mins: many(mins),
  timeBlocks: many(timeBlocks),
  routines: many(routines),
  dailyReviews: many(dailyReviews),
  leverageItems: many(leverageItems),
  friendInventory: many(friendInventory),
  northStarMetrics: many(northStarMetrics),
  weeklyScorecards: many(weeklyScorecards),
}));

export const visionsRelations = relations(visions, ({ one, many }) => ({
  user: one(profiles, { fields: [visions.userId], references: [profiles.id] }),
  powerGoals: many(powerGoals),
  northStarMetrics: many(northStarMetrics),
}));

export const powerGoalsRelations = relations(powerGoals, ({ one, many }) => ({
  user: one(profiles, { fields: [powerGoals.userId], references: [profiles.id] }),
  vision: one(visions, { fields: [powerGoals.visionId], references: [visions.id] }),
  mins: many(mins),
  leverageItems: many(leverageItems),
  monthlyTargets: many(monthlyTargets),
}));

export const monthlyTargetsRelations = relations(monthlyTargets, ({ one, many }) => ({
  user: one(profiles, { fields: [monthlyTargets.userId], references: [profiles.id] }),
  powerGoal: one(powerGoals, { fields: [monthlyTargets.powerGoalId], references: [powerGoals.id] }),
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
  powerGoal: one(powerGoals, { fields: [mins.powerGoalId], references: [powerGoals.id] }),
  timeBlocks: many(timeBlocks),
}));

export const timeBlocksRelations = relations(timeBlocks, ({ one }) => ({
  user: one(profiles, { fields: [timeBlocks.userId], references: [profiles.id] }),
  min: one(mins, { fields: [timeBlocks.minId], references: [mins.id] }),
}));

export const routinesRelations = relations(routines, ({ one, many }) => ({
  user: one(profiles, { fields: [routines.userId], references: [profiles.id] }),
  steps: many(routineSteps),
  completions: many(routineCompletions),
}));

export const routineStepsRelations = relations(routineSteps, ({ one }) => ({
  routine: one(routines, { fields: [routineSteps.routineId], references: [routines.id] }),
}));
