/**
 * Progress Rollup Module
 *
 * Provides hierarchical rollup logic with SQL for ancestor traversal.
 * Used by API endpoints to recalculate parent progress when children change.
 */

import { sql } from 'drizzle-orm';
import type { KpiAncestor, ProgressResult, WeightedKPI } from './types';
import {
  calculateWeightedProgress,
  buildProgressFormula,
  deriveStatus,
  countCompletedChildren,
} from './calculator';

/**
 * SQL query to get all ancestors of a KPI using recursive CTE
 * Returns ancestors from child to root (depth ascending)
 *
 * The recursive CTE:
 * 1. Starts with the changed KPI (anchor)
 * 2. Traverses up the parent chain
 * 3. Returns all ancestors with their depth
 *
 * @param kpiId - The KPI ID to find ancestors for
 * @returns SQL query that can be executed with db.execute()
 */
export function getAncestorsCteQuery(kpiId: string) {
  return sql`
    WITH RECURSIVE kpi_ancestors AS (
      -- Anchor: start with the changed KPI
      SELECT id, parent_kpi_id, level, title, 1 as depth
      FROM vision_kpis
      WHERE id = ${kpiId}

      UNION ALL

      -- Recursive: traverse up the tree
      SELECT p.id, p.parent_kpi_id, p.level, p.title, ka.depth + 1
      FROM vision_kpis p
      INNER JOIN kpi_ancestors ka ON p.id = ka.parent_kpi_id
      WHERE p.is_active = true
    )
    SELECT * FROM kpi_ancestors ORDER BY depth ASC
  `;
}

/**
 * SQL query to get direct children of a KPI with their progress from cache
 *
 * Joins with kpi_progress_cache to get cached progress values.
 * Orders by sort_order for consistent results.
 *
 * @param parentKpiId - The parent KPI ID to find children for
 * @returns SQL query that returns WeightedKPI-compatible rows
 */
export function getChildrenWithProgressQuery(parentKpiId: string) {
  return sql`
    SELECT
      vk.id,
      vk.title,
      COALESCE(vk.weight, 1) as weight,
      COALESCE(pc.progress_percentage, 0) as progress
    FROM vision_kpis vk
    LEFT JOIN kpi_progress_cache pc ON pc.kpi_id = vk.id
    WHERE vk.parent_kpi_id = ${parentKpiId}
      AND vk.is_active = true
    ORDER BY vk.sort_order ASC
  `;
}

/**
 * SQL query to get children count for a parent KPI
 *
 * @param parentKpiId - The parent KPI ID
 * @returns SQL query that returns count of active children
 */
export function getChildrenCountQuery(parentKpiId: string) {
  return sql`
    SELECT COUNT(*) as count
    FROM vision_kpis
    WHERE parent_kpi_id = ${parentKpiId}
      AND is_active = true
  `;
}

/**
 * Calculate progress for a single KPI based on its children
 * Returns ProgressResult with formula breakdown
 *
 * @param kpiId - The KPI to calculate progress for
 * @param children - Array of child KPIs with their progress and weights
 * @param options - Optional manual override settings
 * @returns Complete progress result with formula breakdown
 */
export function calculateKpiProgress(
  kpiId: string,
  children: WeightedKPI[],
  options?: {
    manualOverride?: number;
    overrideReason?: string;
    overrideBy?: string;
  }
): ProgressResult {
  const formula = buildProgressFormula(children, options);
  const progressPercentage = formula.resultPercentage;

  return {
    kpiId,
    progressPercentage,
    formula,
    childCount: children.length,
    completedChildCount: countCompletedChildren(children),
    weightedProgress: calculateWeightedProgress(children),
    totalWeight: children.reduce((sum, c) => sum + (c.weight || 1), 0),
    status: deriveStatus(progressPercentage),
  };
}

/**
 * Build update data for kpi_progress_cache table
 *
 * Transforms a ProgressResult into the format expected by the cache table.
 *
 * @param result - The calculated progress result
 * @returns Object suitable for INSERT/UPDATE on kpi_progress_cache
 */
export function buildCacheUpdateData(result: ProgressResult) {
  return {
    progress_percentage: result.progressPercentage.toString(),
    child_count: result.childCount,
    completed_child_count: result.completedChildCount,
    weighted_progress: result.weightedProgress.toString(),
    total_weight: result.totalWeight.toString(),
    status: result.status,
    calculation_method: result.formula.method,
    manual_override_reason: result.formula.overrideReason || null,
    last_calculated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * SQL query to upsert progress cache entry
 *
 * Uses ON CONFLICT to update if exists, insert if new.
 *
 * @param kpiId - The KPI ID
 * @param data - The cache update data from buildCacheUpdateData
 * @returns SQL query for upserting cache entry
 */
export function upsertProgressCacheQuery(
  kpiId: string,
  data: ReturnType<typeof buildCacheUpdateData>
) {
  return sql`
    INSERT INTO kpi_progress_cache (
      id,
      kpi_id,
      progress_percentage,
      child_count,
      completed_child_count,
      weighted_progress,
      total_weight,
      status,
      calculation_method,
      manual_override_reason,
      last_calculated_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      ${kpiId},
      ${data.progress_percentage},
      ${data.child_count},
      ${data.completed_child_count},
      ${data.weighted_progress},
      ${data.total_weight},
      ${data.status},
      ${data.calculation_method},
      ${data.manual_override_reason},
      ${data.last_calculated_at},
      NOW(),
      ${data.updated_at}
    )
    ON CONFLICT (kpi_id) DO UPDATE SET
      progress_percentage = EXCLUDED.progress_percentage,
      child_count = EXCLUDED.child_count,
      completed_child_count = EXCLUDED.completed_child_count,
      weighted_progress = EXCLUDED.weighted_progress,
      total_weight = EXCLUDED.total_weight,
      status = EXCLUDED.status,
      calculation_method = EXCLUDED.calculation_method,
      manual_override_reason = EXCLUDED.manual_override_reason,
      last_calculated_at = EXCLUDED.last_calculated_at,
      updated_at = EXCLUDED.updated_at
  `;
}

// Re-export types for convenience
export type { KpiAncestor, ProgressResult, WeightedKPI };
