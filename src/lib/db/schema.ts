// Drizzle ORM Schema for Goal Achiever Pro
// Tables for: time tracking, categorization, leverage, network, team/sharing, calendar sync, admin

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
export const fourCsTypeEnum = pgEnum('four_cs_type', [
  'code',         // Building systems/automation
  'content',      // Creating content/media
  'capital',      // Money/investments
  'collaboration', // People/partnerships
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
// DETECTED PROJECTS (Auto-detected from AI classification)
// =============================================
export const detectedProjects = pgTable('detected_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  color: text('color').default('#6366f1'),
  // Optional link to Impact Project (archived table, kept as raw FK)
  impactProjectId: uuid('power_goal_id'),
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
  isDefault: boolean('is_default').default(false),
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
  minId: uuid('min_id'), // FK to archived mins table, kept as raw column
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
  activityType: text('activity_type'),
  detectedProjectId: uuid('detected_project_id').references(() => detectedProjects.id, { onDelete: 'set null' }),
  aiClassificationConfidence: decimal('ai_classification_confidence', { precision: 3, scale: 2 }),
  aiClassifiedAt: timestamp('ai_classified_at'),
  // Energy rating
  energyRating: text('energy_rating').notNull(),
  energyScore: integer('energy_score'),
  // Value Matrix categorization
  valueQuadrant: text('drip_quadrant'),
  makesMoneyScore: integer('makes_money_score'),
  lightsUpScore: integer('lights_up_score'),
  // Leverage tracking (4 C's)
  leverageType: text('leverage_type'),
  // Day marker (workday boundaries)
  dayMarker: text('day_marker'),
  // Source tracking
  source: text('source').default('manual'),
  externalEventId: text('external_event_id'),
  // Recurring event support
  isRecurring: boolean('is_recurring').default(false),
  recurrenceRule: text('recurrence_rule'),
  recurrenceEndDate: date('recurrence_end_date'),
  parentBlockId: uuid('parent_block_id'),
  isRecurrenceException: boolean('is_recurrence_exception').default(false),
  originalDate: date('original_date'),
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
  isExternal: boolean('is_external').default(false),
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
// EVENT CATEGORIZATIONS (Cross-device sync for calendar event categorizations)
// =============================================
export const eventCategorizations = pgTable('event_categorizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  externalEventId: text('external_event_id').notNull(),
  eventName: text('event_name').notNull(),
  valueQuadrant: text('value_quadrant'),
  energyRating: text('energy_rating'),
  activityType: text('activity_type'),
  activityCategory: text('activity_category'),
  leverageType: text('leverage_type'),
  detectedProjectId: uuid('detected_project_id'),
  detectedProjectName: text('detected_project_name'),
  dayMarker: text('day_marker'),
  isIgnored: boolean('is_ignored').default(false),
  categorizedAt: timestamp('categorized_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('event_categorizations_user_idx').on(table.userId),
  userEventIdx: uniqueIndex('event_categorizations_user_event_idx').on(table.userId, table.externalEventId),
}));

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
// TIME BLOCK LEVERAGE LINKS (Junction table for leverage items)
// =============================================
export const timeBlockLeverageLinks = pgTable('time_block_leverage_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  timeBlockId: uuid('time_block_id').notNull().references(() => timeBlocks.id, { onDelete: 'cascade' }),
  leverageItemId: uuid('leverage_item_id').notNull().references(() => leverageItems.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  blockLeverageIdx: uniqueIndex('time_block_leverage_links_block_leverage_idx').on(table.timeBlockId, table.leverageItemId),
  leverageItemIdx: index('time_block_leverage_links_leverage_idx').on(table.leverageItemId),
}));

// =============================================
// USER CHARTS (Customizable chart configurations)
// =============================================
export const userCharts = pgTable('user_charts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  chartType: text('chart_type').notNull(),
  title: text('title').notNull(),
  config: jsonb('config').default({}).notNull(),
  position: integer('position').default(0),
  isAutoGenerated: boolean('is_auto_generated').default(false),
  isVisible: boolean('is_visible').default(true),
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
// LEVERAGE ITEMS (4 C's)
// =============================================
export const leverageItems = pgTable('leverage_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  impactProjectId: uuid('power_goal_id'), // FK to archived impactProjects table, kept as raw column
  leverageType: text('leverage_type').notNull(),
  actionType: text('action_type').notNull(),
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
  energyImpact: text('energy_impact'),
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
// PRO TIPS (Rotating motivational content)
// =============================================
export const proTips = pgTable('pro_tips', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: text('category').notNull(),
  content: text('content').notNull(),
  source: text('source'),
  timeOfDay: text('time_of_day').array(),
  isActive: boolean('is_active').default(true),
  displayCount: integer('display_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

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
  conflictResolution: text('conflict_resolution').default('app_wins'),
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
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  // Google Calendar reference
  googleEventId: text('google_event_id').notNull(),
  googleCalendarId: text('google_calendar_id').default('primary'),
  // Sync metadata
  syncStatus: text('sync_status').default('synced'),
  lastSyncedAt: timestamp('last_synced_at'),
  localModifiedAt: timestamp('local_modified_at'),
  remoteModifiedAt: timestamp('remote_modified_at'),
  etag: text('etag'),
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
  channelId: text('channel_id').notNull().unique(),
  resourceId: text('resource_id').notNull(),
  expiration: timestamp('expiration').notNull(),
  token: text('token'),
  calendarId: text('calendar_id').default('primary'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('calendar_webhook_user_idx').on(table.userId),
}));

// =============================================
// AI USAGE LOGS (Track AI API calls for billing)
// =============================================
export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  model: text('model').notNull(),
  promptTokens: integer('prompt_tokens').default(0),
  completionTokens: integer('completion_tokens').default(0),
  totalTokens: integer('total_tokens').default(0),
  estimatedCostCents: decimal('estimated_cost_cents', { precision: 10, scale: 4 }).default('0'),
  requestType: text('request_type'),
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  responseTimeMs: integer('response_time_ms'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('ai_usage_logs_user_idx').on(table.userId),
  createdAtIdx: index('ai_usage_logs_created_at_idx').on(table.createdAt),
  endpointIdx: index('ai_usage_logs_endpoint_idx').on(table.endpoint),
}));

// =============================================
// TEAM MEMBERS (Team Directory)
// =============================================
export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  email: text('email'),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('member'),
  accessLevel: text('access_level').notNull().default('limited'),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
  inviteStatus: text('invite_status').default('pending'),
  invitedAt: timestamp('invited_at'),
  acceptedAt: timestamp('accepted_at'),
  inviteToken: text('invite_token'),
  phone: text('phone'),
  title: text('title'),
  department: text('department'),
  notes: text('notes'),
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
  tabName: text('tab_name').notNull(),
  permissionLevel: text('permission_level').notNull().default('view'),
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
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  permissionLevel: text('permission_level').notNull().default('view'),
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
  status: text('status').default('pending'),
  shareType: text('share_type').notNull(),
  tabPermissionsData: jsonb('tab_permissions_data').default([]),
  itemPermissionsData: jsonb('item_permissions_data').default([]),
  createdAt: timestamp('created_at').defaultNow(),
  acceptedAt: timestamp('accepted_at'),
  acceptedBy: uuid('accepted_by').references(() => profiles.id, { onDelete: 'set null' }),
}, (table) => ({
  tokenIdx: uniqueIndex('share_invitations_token_idx').on(table.inviteToken),
  ownerEmailIdx: index('share_invitations_owner_email_idx').on(table.ownerId, table.email),
  statusIdx: index('share_invitations_status_idx').on(table.status),
}));

// =============================================
// TASK COMMENTS (For team collaboration)
// =============================================
export const taskComments = pgTable('task_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  content: text('content').notNull(),
  parentCommentId: uuid('parent_comment_id'),
  isEdited: boolean('is_edited').default(false),
  editedAt: timestamp('edited_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  entityIdx: index('task_comments_entity_idx').on(table.entityType, table.entityId),
  userIdx: index('task_comments_user_idx').on(table.userId),
}));

// =============================================
// BETA FEEDBACK (Bug Reports & Feature Requests)
// =============================================
export const betaFeedback = pgTable('beta_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  feedbackType: text('feedback_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priority: text('priority').default('medium'),
  status: text('status').default('open'),
  currentUrl: text('current_url'),
  userAgent: text('user_agent'),
  screenResolution: text('screen_resolution'),
  screenshotUrl: text('screenshot_url'),
  adminResponse: text('admin_response'),
  respondedAt: timestamp('responded_at'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('beta_feedback_user_idx').on(table.userId),
  statusIdx: index('beta_feedback_status_idx').on(table.status),
  typeIdx: index('beta_feedback_type_idx').on(table.feedbackType),
  createdAtIdx: index('beta_feedback_created_at_idx').on(table.createdAt),
}));

// =============================================
// BETA INVITATIONS (Beta Access Control)
// =============================================
export const betaInvitations = pgTable('beta_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  inviteToken: text('invite_token').notNull().unique(),
  invitedByEmail: text('invited_by_email'),
  status: text('status').default('pending'),
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

// =============================================
// RELATIONS
// =============================================
export const profilesRelations = relations(profiles, ({ many, one }) => ({
  timeBlocks: many(timeBlocks),
  leverageItems: many(leverageItems),
  friendInventory: many(friendInventory),
  calendarSyncSettings: one(calendarSyncSettings),
  calendarSyncRecords: many(calendarSyncRecords),
  calendarWebhookChannels: many(calendarWebhookChannels),
  aiUsageLogs: many(aiUsageLogs),
  userSettings: one(userSettings),
  ownedTeamMembers: many(teamMembers, { relationName: 'teamOwner' }),
  teamMemberships: many(teamMembers, { relationName: 'teamUser' }),
  taskComments: many(taskComments),
  betaFeedback: many(betaFeedback),
  ownedTabPermissions: many(tabPermissions),
  ownedItemPermissions: many(itemPermissions),
  shareInvitations: many(shareInvitations),
  detectedProjects: many(detectedProjects),
  meetingCategories: many(meetingCategories),
  timeBlockTags: many(timeBlockTags),
  userCharts: many(userCharts),
}));

export const timeBlocksRelations = relations(timeBlocks, ({ one, many }) => ({
  user: one(profiles, { fields: [timeBlocks.userId], references: [profiles.id] }),
  detectedProject: one(detectedProjects, { fields: [timeBlocks.detectedProjectId], references: [detectedProjects.id] }),
  meetingDetails: one(timeBlockMeetingDetails),
  tagAssignments: many(timeBlockTagAssignments),
  leverageLinks: many(timeBlockLeverageLinks),
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
// TIME BLOCK LEVERAGE LINKS RELATIONS
// =============================================
export const timeBlockLeverageLinksRelations = relations(timeBlockLeverageLinks, ({ one }) => ({
  timeBlock: one(timeBlocks, { fields: [timeBlockLeverageLinks.timeBlockId], references: [timeBlocks.id] }),
  leverageItem: one(leverageItems, { fields: [timeBlockLeverageLinks.leverageItemId], references: [leverageItems.id] }),
}));

// =============================================
// USER CHARTS RELATIONS
// =============================================
export const userChartsRelations = relations(userCharts, ({ one }) => ({
  user: one(profiles, { fields: [userCharts.userId], references: [profiles.id] }),
}));

export const detectedProjectsRelations = relations(detectedProjects, ({ one, many }) => ({
  user: one(profiles, { fields: [detectedProjects.userId], references: [profiles.id] }),
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

export const leverageItemsRelations = relations(leverageItems, ({ one, many }) => ({
  user: one(profiles, { fields: [leverageItems.userId], references: [profiles.id] }),
  timeBlockLinks: many(timeBlockLeverageLinks),
}));

export const auditSnapshotsRelations = relations(auditSnapshots, ({ one }) => ({
  user: one(profiles, { fields: [auditSnapshots.userId], references: [profiles.id] }),
}));

export const friendInventoryRelations = relations(friendInventory, ({ one }) => ({
  user: one(profiles, { fields: [friendInventory.userId], references: [profiles.id] }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(profiles, { fields: [userSettings.userId], references: [profiles.id] }),
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
// AI USAGE LOGS RELATIONS
// =============================================
export const aiUsageLogsRelations = relations(aiUsageLogs, ({ one }) => ({
  user: one(profiles, { fields: [aiUsageLogs.userId], references: [profiles.id] }),
}));

// =============================================
// TEAM MEMBER RELATIONS
// =============================================
export const teamMembersRelations = relations(teamMembers, ({ one, many }) => ({
  owner: one(profiles, { fields: [teamMembers.ownerId], references: [profiles.id], relationName: 'teamOwner' }),
  user: one(profiles, { fields: [teamMembers.userId], references: [profiles.id], relationName: 'teamUser' }),
  tabPermissions: many(tabPermissions),
  itemPermissions: many(itemPermissions),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  user: one(profiles, { fields: [taskComments.userId], references: [profiles.id] }),
}));

export const betaFeedbackRelations = relations(betaFeedback, ({ one }) => ({
  user: one(profiles, { fields: [betaFeedback.userId], references: [profiles.id] }),
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

export const eventCategorizationsRelations = relations(eventCategorizations, ({ one }) => ({
  user: one(profiles, { fields: [eventCategorizations.userId], references: [profiles.id] }),
}));

export const activityCategoriesRelations = relations(activityCategories, ({ one }) => ({
  user: one(profiles, { fields: [activityCategories.userId], references: [profiles.id] }),
}));
