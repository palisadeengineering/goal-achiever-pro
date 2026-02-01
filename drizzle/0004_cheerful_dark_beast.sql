CREATE TYPE "public"."four_cs_type" AS ENUM('code', 'content', 'capital', 'collaboration');--> statement-breakpoint
CREATE TYPE "public"."reward_trigger_type" AS ENUM('milestone', 'key_result', 'xp_threshold');--> statement-breakpoint
CREATE TYPE "public"."streak_type" AS ENUM('daily_execution', 'check_in', 'production', 'project');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_recurrence" AS ENUM('none', 'daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TABLE "daily_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
	"check_in_date" date NOT NULL,
	"clarity_score" integer NOT NULL,
	"belief_score" integer NOT NULL,
	"consistency_score" integer NOT NULL,
	"total_score" integer NOT NULL,
	"note" text,
	"prompts_triggered" jsonb DEFAULT '[]'::jsonb,
	"xp_awarded" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "milestones_v2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"quarter" integer,
	"year" integer,
	"target_date" date,
	"linked_key_result_ids" jsonb DEFAULT '[]'::jsonb,
	"progress_percentage" integer DEFAULT 0,
	"status" text DEFAULT 'pending',
	"completed_at" timestamp,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_key_result_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key_result_id" uuid NOT NULL,
	"previous_value" numeric(15, 2),
	"new_value" numeric(15, 2) NOT NULL,
	"note" text,
	"source" text DEFAULT 'manual',
	"logged_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_key_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"target_value" numeric(15, 2) NOT NULL,
	"current_value" numeric(15, 2) DEFAULT '0',
	"starting_value" numeric(15, 2) DEFAULT '0',
	"unit_type" text DEFAULT 'number',
	"unit_label" text,
	"weight" numeric(3, 2) DEFAULT '1.00',
	"progress_percentage" integer DEFAULT 0,
	"status" text DEFAULT 'not_started',
	"completed_at" timestamp,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6366f1',
	"specific" text,
	"measurable" text,
	"attainable" text,
	"realistic" text,
	"time_bound" date,
	"start_date" date,
	"target_date" date,
	"clarity_score" integer DEFAULT 0,
	"belief_score" integer DEFAULT 0,
	"consistency_score" integer DEFAULT 0,
	"revenue_math" jsonb DEFAULT '{}'::jsonb,
	"is_focused" boolean DEFAULT false,
	"priority" integer DEFAULT 1,
	"progress_percentage" integer DEFAULT 0,
	"cover_image_url" text,
	"affirmation_text" text,
	"status" text DEFAULT 'active',
	"completed_at" timestamp,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reward_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reward_id" uuid NOT NULL,
	"claimed_at" timestamp DEFAULT now(),
	"reward_name" text NOT NULL,
	"reward_description" text,
	"reward_value" numeric(10, 2),
	"note" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"estimated_value" numeric(10, 2),
	"trigger_type" "reward_trigger_type" NOT NULL,
	"trigger_id" uuid,
	"trigger_value" numeric(15, 2),
	"progress_percentage" integer DEFAULT 0,
	"current_progress" numeric(15, 2) DEFAULT '0',
	"status" text DEFAULT 'locked',
	"unlocked_at" timestamp,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "streaks_v2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
	"streak_type" "streak_type" NOT NULL,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"last_activity_date" date,
	"streak_start_date" date,
	"recovery_used_this_week" boolean DEFAULT false,
	"last_recovery_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
	"milestone_id" uuid,
	"key_result_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"estimated_minutes" integer DEFAULT 30,
	"actual_minutes" integer,
	"scheduled_date" date,
	"scheduled_start_time" time,
	"scheduled_end_time" time,
	"due_date" date,
	"priority" "task_priority" DEFAULT 'medium',
	"value_quadrant" text,
	"four_cs_tag" "four_cs_type",
	"recurrence" "task_recurrence" DEFAULT 'none',
	"recurrence_rule" text,
	"parent_task_id" uuid,
	"google_calendar_event_id" text,
	"calendar_sync_status" text DEFAULT 'not_synced',
	"calendar_synced_at" timestamp,
	"status" text DEFAULT 'pending',
	"completed_at" timestamp,
	"xp_awarded" integer DEFAULT 0,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones_v2" ADD CONSTRAINT "milestones_v2_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones_v2" ADD CONSTRAINT "milestones_v2_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_key_result_logs" ADD CONSTRAINT "project_key_result_logs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_key_result_logs" ADD CONSTRAINT "project_key_result_logs_key_result_id_project_key_results_id_fk" FOREIGN KEY ("key_result_id") REFERENCES "public"."project_key_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_key_results" ADD CONSTRAINT "project_key_results_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_key_results" ADD CONSTRAINT "project_key_results_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_claims" ADD CONSTRAINT "reward_claims_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_claims" ADD CONSTRAINT "reward_claims_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaks_v2" ADD CONSTRAINT "streaks_v2_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaks_v2" ADD CONSTRAINT "streaks_v2_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestone_id_milestones_v2_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones_v2"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_key_result_id_project_key_results_id_fk" FOREIGN KEY ("key_result_id") REFERENCES "public"."project_key_results"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_checkins_user_date_idx" ON "daily_checkins" USING btree ("user_id","check_in_date","project_id");--> statement-breakpoint
CREATE INDEX "daily_checkins_project_idx" ON "daily_checkins" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "milestones_v2_project_idx" ON "milestones_v2" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "milestones_v2_user_idx" ON "milestones_v2" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "milestones_v2_quarter_idx" ON "milestones_v2" USING btree ("project_id","year","quarter");--> statement-breakpoint
CREATE INDEX "milestones_v2_status_idx" ON "milestones_v2" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "project_key_result_logs_kr_idx" ON "project_key_result_logs" USING btree ("key_result_id");--> statement-breakpoint
CREATE INDEX "project_key_result_logs_date_idx" ON "project_key_result_logs" USING btree ("key_result_id","logged_at");--> statement-breakpoint
CREATE INDEX "project_key_results_project_idx" ON "project_key_results" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_key_results_user_idx" ON "project_key_results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_key_results_status_idx" ON "project_key_results" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "projects_user_idx" ON "projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "projects_user_status_idx" ON "projects" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "projects_focused_idx" ON "projects" USING btree ("user_id","is_focused");--> statement-breakpoint
CREATE INDEX "reward_claims_user_idx" ON "reward_claims" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reward_claims_reward_idx" ON "reward_claims" USING btree ("reward_id");--> statement-breakpoint
CREATE INDEX "reward_claims_date_idx" ON "reward_claims" USING btree ("user_id","claimed_at");--> statement-breakpoint
CREATE INDEX "rewards_user_idx" ON "rewards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rewards_status_idx" ON "rewards" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "rewards_trigger_idx" ON "rewards" USING btree ("trigger_type","trigger_id");--> statement-breakpoint
CREATE UNIQUE INDEX "streaks_v2_user_type_idx" ON "streaks_v2" USING btree ("user_id","streak_type","project_id");--> statement-breakpoint
CREATE INDEX "streaks_v2_user_idx" ON "streaks_v2" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_user_idx" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_project_idx" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_milestone_idx" ON "tasks" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "tasks_scheduled_idx" ON "tasks" USING btree ("user_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "tasks_calendar_event_idx" ON "tasks" USING btree ("google_calendar_event_id");