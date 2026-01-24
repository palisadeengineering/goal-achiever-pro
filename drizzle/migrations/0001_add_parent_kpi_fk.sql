-- Migration: Add FK constraint and index for parent_kpi_id self-reference
-- Purpose: Enable database-enforced referential integrity for KPI hierarchy
--
-- The parent_kpi_id column already exists but lacks FK constraint.
-- This adds the constraint with SET NULL on delete to preserve child KPIs
-- when a parent is deleted (they become root-level items).

-- Add FK constraint with NOT VALID first (non-blocking for existing data)
ALTER TABLE "vision_kpis"
ADD CONSTRAINT "vision_kpis_parent_kpi_id_fkey"
FOREIGN KEY ("parent_kpi_id")
REFERENCES "vision_kpis"("id")
ON DELETE SET NULL
NOT VALID;

-- Validate constraint in separate step (can be interruptible if data is large)
ALTER TABLE "vision_kpis" VALIDATE CONSTRAINT "vision_kpis_parent_kpi_id_fkey";

-- Add btree index for efficient hierarchy queries
CREATE INDEX IF NOT EXISTS "vision_kpis_parent_kpi_idx" ON "vision_kpis" USING btree ("parent_kpi_id");
