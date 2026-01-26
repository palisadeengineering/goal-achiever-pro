CREATE TABLE "beta_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"invite_token" text NOT NULL,
	"invited_by_email" text,
	"status" text DEFAULT 'pending',
	"note" text,
	"accepted_at" timestamp,
	"accepted_by_user_id" uuid,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "beta_invitations_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "detected_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"color" text DEFAULT '#6366f1',
	"power_goal_id" uuid,
	"total_minutes" integer DEFAULT 0,
	"event_count" integer DEFAULT 0,
	"is_archived" boolean DEFAULT false,
	"merged_into_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meeting_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#ec4899',
	"description" text,
	"is_default" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_block_meeting_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time_block_id" uuid NOT NULL,
	"meeting_category_id" uuid,
	"attendee_count" integer,
	"is_recurring" boolean DEFAULT false,
	"is_external" boolean DEFAULT false,
	"organizer" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "time_block_meeting_details_time_block_id_unique" UNIQUE("time_block_id")
);
--> statement-breakpoint
ALTER TABLE "time_blocks" ADD COLUMN "activity_type" text;--> statement-breakpoint
ALTER TABLE "time_blocks" ADD COLUMN "detected_project_id" uuid;--> statement-breakpoint
ALTER TABLE "time_blocks" ADD COLUMN "ai_classification_confidence" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "time_blocks" ADD COLUMN "ai_classified_at" timestamp;--> statement-breakpoint
ALTER TABLE "vision_kpis" ADD COLUMN "weight" numeric(5, 2) DEFAULT '1';--> statement-breakpoint
ALTER TABLE "beta_invitations" ADD CONSTRAINT "beta_invitations_accepted_by_user_id_profiles_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detected_projects" ADD CONSTRAINT "detected_projects_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detected_projects" ADD CONSTRAINT "detected_projects_power_goal_id_power_goals_id_fk" FOREIGN KEY ("power_goal_id") REFERENCES "public"."power_goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detected_projects" ADD CONSTRAINT "detected_projects_merged_into_id_detected_projects_id_fk" FOREIGN KEY ("merged_into_id") REFERENCES "public"."detected_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_categories" ADD CONSTRAINT "meeting_categories_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_block_meeting_details" ADD CONSTRAINT "time_block_meeting_details_time_block_id_time_blocks_id_fk" FOREIGN KEY ("time_block_id") REFERENCES "public"."time_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_block_meeting_details" ADD CONSTRAINT "time_block_meeting_details_meeting_category_id_meeting_categories_id_fk" FOREIGN KEY ("meeting_category_id") REFERENCES "public"."meeting_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "beta_invitations_email_idx" ON "beta_invitations" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "beta_invitations_token_idx" ON "beta_invitations" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "beta_invitations_status_idx" ON "beta_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "detected_projects_user_idx" ON "detected_projects" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "detected_projects_normalized_name_idx" ON "detected_projects" USING btree ("user_id","normalized_name");--> statement-breakpoint
CREATE INDEX "detected_projects_power_goal_idx" ON "detected_projects" USING btree ("power_goal_id");--> statement-breakpoint
CREATE INDEX "meeting_categories_user_idx" ON "meeting_categories" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_categories_user_name_idx" ON "meeting_categories" USING btree ("user_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "time_block_meeting_details_block_idx" ON "time_block_meeting_details" USING btree ("time_block_id");--> statement-breakpoint
CREATE INDEX "time_block_meeting_details_category_idx" ON "time_block_meeting_details" USING btree ("meeting_category_id");--> statement-breakpoint
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_detected_project_id_detected_projects_id_fk" FOREIGN KEY ("detected_project_id") REFERENCES "public"."detected_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "time_blocks_activity_type_idx" ON "time_blocks" USING btree ("user_id","activity_type");--> statement-breakpoint
CREATE INDEX "time_blocks_detected_project_idx" ON "time_blocks" USING btree ("detected_project_id");