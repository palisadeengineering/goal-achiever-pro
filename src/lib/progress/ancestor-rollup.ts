/**
 * Ancestor Rollup Module
 *
 * Provides reusable functions for rolling up progress to ancestor KPIs.
 * Used by multiple API endpoints after KPI changes (logging, overrides, weight changes).
 *
 * Implements:
 * - PROG-01: Parent updates when child changes
 * - PROG-02: Full chain rollup to vision level
 * - API-02: Return full ancestor values for UI updates
 */

import { createClient } from '@/lib/supabase/server';
import { calculateKpiProgress, buildCacheUpdateData } from './rollup';
import type { WeightedKPI } from './types';

/**
 * Represents a KPI that was updated during ancestor rollup.
 * Contains all data needed for frontend to update UI without refetching.
 */
export interface AncestorProgressUpdate {
  kpiId: string;
  level: string;
  title: string;
  progressPercentage: number;
  status: string;
  childCount: number;
  completedChildCount: number;
}

/**
 * Roll up progress to all ancestors after a KPI change.
 *
 * This is the primary function for updating the progress cache hierarchy.
 * Call this after:
 * - Logging a KPI value/completion
 * - Setting/clearing a manual override
 * - Changing a KPI's weight
 *
 * @param supabase - Authenticated Supabase client
 * @param kpiId - The KPI that changed (starting point for rollup)
 * @returns Object with updated KPIs (full progress data), duration, and optional error
 */
export async function rollupProgressToAncestors(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kpiId: string
): Promise<{ updatedKpis: AncestorProgressUpdate[]; duration: number; error?: string }> {
  if (!supabase) return { updatedKpis: [], duration: 0 };

  const startTime = Date.now();
  const updatedKpis: AncestorProgressUpdate[] = [];

  try {
    // Get the KPI and its parent
    const { data: kpi } = await supabase
      .from('vision_kpis')
      .select('id, parent_kpi_id, level, title, numeric_target')
      .eq('id', kpiId)
      .single();

    if (!kpi) return { updatedKpis, duration: Date.now() - startTime };

    // Get most recent log for this KPI to determine its own progress
    const { data: latestLog } = await supabase
      .from('kpi_logs')
      .select('is_completed, value')
      .eq('kpi_id', kpiId)
      .order('log_date', { ascending: false })
      .limit(1)
      .single();

    // Calculate self progress for leaf KPIs
    let selfProgress = 0;
    if (latestLog?.is_completed) {
      selfProgress = 100;
    } else if (latestLog?.value && kpi.numeric_target) {
      selfProgress = Math.min(100, (Number(latestLog.value) / Number(kpi.numeric_target)) * 100);
    }

    const selfStatus = selfProgress >= 100 ? 'completed' : selfProgress > 0 ? 'in_progress' : 'not_started';

    // Update this KPI's cache entry
    await supabase
      .from('kpi_progress_cache')
      .upsert({
        kpi_id: kpiId,
        progress_percentage: selfProgress.toFixed(2),
        status: selfStatus,
        calculation_method: 'auto',
        last_calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'kpi_id' });

    // Add the original KPI as first item in updatedKpis (leaf has no children for weighted calc)
    updatedKpis.push({
      kpiId: kpi.id,
      level: kpi.level || 'unknown',
      title: kpi.title || '',
      progressPercentage: selfProgress,
      status: selfStatus,
      childCount: 0,
      completedChildCount: 0,
    });

    // Traverse up the tree and update each ancestor
    let currentParentId = kpi.parent_kpi_id;

    while (currentParentId) {
      // Get parent KPI info
      const { data: parentKpi } = await supabase
        .from('vision_kpis')
        .select('id, parent_kpi_id, level, title')
        .eq('id', currentParentId)
        .single();

      if (!parentKpi) break;

      // Check if parent has manual override - if so, skip recalculation but continue traversal
      const { data: parentCache } = await supabase
        .from('kpi_progress_cache')
        .select('calculation_method, progress_percentage, status')
        .eq('kpi_id', currentParentId)
        .single();

      if (parentCache?.calculation_method !== 'manual_override') {
        // Get children of this parent with their progress
        const { data: children } = await supabase
          .from('vision_kpis')
          .select(`
            id,
            title,
            weight,
            kpi_progress_cache (progress_percentage)
          `)
          .eq('parent_kpi_id', currentParentId)
          .eq('is_active', true);

        const weightedChildren: WeightedKPI[] = (children || []).map(c => {
          // Supabase returns joined relations as arrays
          const cacheEntry = Array.isArray(c.kpi_progress_cache)
            ? c.kpi_progress_cache[0]
            : c.kpi_progress_cache;
          return {
            id: c.id,
            title: c.title,
            progress: Number(cacheEntry?.progress_percentage) || 0,
            weight: Number(c.weight) || 1,
          };
        });

        // Calculate and update parent's progress
        const result = calculateKpiProgress(currentParentId, weightedChildren);
        const cacheData = buildCacheUpdateData(result);

        await supabase
          .from('kpi_progress_cache')
          .upsert({
            kpi_id: currentParentId,
            ...cacheData,
          }, { onConflict: 'kpi_id' });

        // Count completed children
        const completedCount = weightedChildren.filter(c => c.progress >= 100).length;

        // Add to updatedKpis with full progress data
        updatedKpis.push({
          kpiId: parentKpi.id,
          level: parentKpi.level || 'unknown',
          title: parentKpi.title || '',
          progressPercentage: result.progressPercentage,
          status: result.status,
          childCount: weightedChildren.length,
          completedChildCount: completedCount,
        });
      } else {
        // Parent has manual override - still add it to updatedKpis with cached values
        // Count children for the response
        const { data: children } = await supabase
          .from('vision_kpis')
          .select('id, kpi_progress_cache(progress_percentage)')
          .eq('parent_kpi_id', currentParentId)
          .eq('is_active', true);

        const childCount = children?.length || 0;
        const completedCount = (children || []).filter(c => {
          const cache = Array.isArray(c.kpi_progress_cache)
            ? c.kpi_progress_cache[0]
            : c.kpi_progress_cache;
          return Number(cache?.progress_percentage) >= 100;
        }).length;

        updatedKpis.push({
          kpiId: parentKpi.id,
          level: parentKpi.level || 'unknown',
          title: parentKpi.title || '',
          progressPercentage: Number(parentCache?.progress_percentage) || 0,
          status: parentCache?.status || 'not_started',
          childCount,
          completedChildCount: completedCount,
        });
      }

      // Move to next ancestor
      currentParentId = parentKpi.parent_kpi_id;
    }

    return {
      updatedKpis,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Error in rollupProgressToAncestors:', error);
    return { updatedKpis, duration: Date.now() - startTime, error: String(error) };
  }
}

/**
 * Helper to fetch parent KPI ID
 */
async function getParentKpiId(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  kpiId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('vision_kpis')
    .select('parent_kpi_id')
    .eq('id', kpiId)
    .single();
  return data?.parent_kpi_id || null;
}

/**
 * Helper to check if KPI has manual override
 */
async function hasManualOverride(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  kpiId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('kpi_progress_cache')
    .select('calculation_method')
    .eq('kpi_id', kpiId)
    .single();
  return data?.calculation_method === 'manual_override';
}

/**
 * Helper to fetch children with progress for a parent KPI
 */
async function getChildrenWithProgress(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  parentKpiId: string
): Promise<WeightedKPI[]> {
  const { data: children } = await supabase
    .from('vision_kpis')
    .select(`
      id,
      title,
      weight,
      kpi_progress_cache (progress_percentage)
    `)
    .eq('parent_kpi_id', parentKpiId)
    .eq('is_active', true);

  return (children || []).map(c => {
    // Supabase returns joined relations as arrays
    const cacheEntry = Array.isArray(c.kpi_progress_cache)
      ? c.kpi_progress_cache[0]
      : c.kpi_progress_cache;
    return {
      id: c.id,
      title: c.title,
      progress: Number(cacheEntry?.progress_percentage) || 0,
      weight: Number(c.weight) || 1,
    };
  });
}

/**
 * Recalculate a single parent's progress and continue up the chain.
 *
 * Use this when you need to recalculate from a specific parent node,
 * such as after clearing a manual override or changing weights.
 *
 * @param supabase - Authenticated Supabase client
 * @param parentKpiId - The parent KPI to start recalculation from
 */
export async function recalculateParentChain(
  supabase: Awaited<ReturnType<typeof createClient>>,
  parentKpiId: string
): Promise<void> {
  if (!supabase) return;

  try {
    let currentId: string | null = parentKpiId;

    while (currentId) {
      // Check if has manual override - if so, stop
      if (await hasManualOverride(supabase, currentId)) {
        break;
      }

      // Get children and calculate progress
      const weightedChildren = await getChildrenWithProgress(supabase, currentId);
      const result = calculateKpiProgress(currentId, weightedChildren);
      const cacheData = buildCacheUpdateData(result);

      await supabase
        .from('kpi_progress_cache')
        .upsert({
          kpi_id: currentId,
          ...cacheData,
        }, { onConflict: 'kpi_id' });

      // Move to next ancestor
      currentId = await getParentKpiId(supabase, currentId);
    }
  } catch (error) {
    console.error('Error in recalculateParentChain:', error);
  }
}
