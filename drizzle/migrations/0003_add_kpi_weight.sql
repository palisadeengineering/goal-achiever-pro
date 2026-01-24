-- Add weight column to vision_kpis for weighted progress calculation (PROG-03)
-- Default weight of 1 means equal weighting
-- Higher weights contribute more to parent progress

ALTER TABLE "vision_kpis"
ADD COLUMN IF NOT EXISTS "weight" DECIMAL(5, 2) DEFAULT 1;

-- Add comment explaining the column
COMMENT ON COLUMN "vision_kpis"."weight" IS 'Weight for weighted progress calculation. Higher weights contribute more to parent progress. Default 1 for equal weighting.';
