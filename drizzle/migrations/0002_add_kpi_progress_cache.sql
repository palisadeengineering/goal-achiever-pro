-- Migration: Add kpi_progress_cache table for pre-computed aggregates
-- Purpose: Enable fast dashboard reads by storing pre-computed progress percentages
--
-- This table stores cached progress calculations for each KPI to avoid
-- expensive recursive calculations on every page load.

-- Create the kpi_progress_cache table
CREATE TABLE IF NOT EXISTS "kpi_progress_cache" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kpi_id" uuid NOT NULL UNIQUE,
  "current_value" numeric(15, 2) DEFAULT '0',
  "target_value" numeric(15, 2),
  "progress_percentage" numeric(5, 2) DEFAULT '0',
  "child_count" integer DEFAULT 0,
  "completed_child_count" integer DEFAULT 0,
  "weighted_progress" numeric(5, 2),
  "total_weight" numeric(5, 2) DEFAULT '1',
  "status" text DEFAULT 'not_started',
  "last_calculated_at" timestamp DEFAULT now(),
  "calculation_method" text DEFAULT 'auto',
  "manual_override_reason" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "kpi_progress_cache_kpi_id_fkey"
    FOREIGN KEY ("kpi_id")
    REFERENCES "vision_kpis"("id")
    ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE UNIQUE INDEX IF NOT EXISTS "kpi_progress_cache_kpi_idx" ON "kpi_progress_cache" USING btree ("kpi_id");
CREATE INDEX IF NOT EXISTS "kpi_progress_cache_status_idx" ON "kpi_progress_cache" USING btree ("status");
CREATE INDEX IF NOT EXISTS "kpi_progress_cache_last_calculated_idx" ON "kpi_progress_cache" USING btree ("last_calculated_at");

-- Comment explaining the table purpose
COMMENT ON TABLE "kpi_progress_cache" IS 'Pre-computed progress aggregates for KPIs to enable fast dashboard reads';
COMMENT ON COLUMN "kpi_progress_cache"."status" IS 'Derived status: not_started, in_progress, at_risk, on_track, completed';
COMMENT ON COLUMN "kpi_progress_cache"."calculation_method" IS 'How progress was calculated: auto (from children) or manual_override';
