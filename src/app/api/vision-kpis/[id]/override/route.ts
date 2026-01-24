/**
 * Manual Override API Endpoint
 *
 * POST   - Set manual override with progressPercentage and reason
 * DELETE - Clear manual override and restore auto-calculation
 *
 * Implements PROG-04: Manual override with explanation that persists.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateKpiProgress, buildCacheUpdateData } from '@/lib/progress/rollup';
import { recalculateParentChain } from '@/lib/progress/ancestor-rollup';
import type { WeightedKPI } from '@/lib/progress/types';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

/**
 * POST /api/vision-kpis/[id]/override
 *
 * Set manual override with required explanation.
 *
 * Body:
 * - progressPercentage: number (0-100)
 * - reason: string (required explanation for the override)
 *
 * Returns:
 * - Override details including what auto-calculation would have produced
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kpiId } = await params;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const body = await request.json();
    const { progressPercentage, reason } = body;

    // Validate inputs
    if (progressPercentage === undefined || progressPercentage < 0 || progressPercentage > 100) {
      return NextResponse.json(
        { error: 'progressPercentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reason is required for manual override' },
        { status: 400 }
      );
    }

    // Verify KPI belongs to user
    const { data: kpi, error: kpiError } = await supabase
      .from('vision_kpis')
      .select('id, parent_kpi_id, title')
      .eq('id', kpiId)
      .eq('user_id', userId)
      .single();

    if (kpiError || !kpi) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 });
    }

    // Get what auto-calculation would produce for transparency
    const { data: children } = await supabase
      .from('vision_kpis')
      .select(`
        id,
        title,
        weight,
        kpi_progress_cache (progress_percentage)
      `)
      .eq('parent_kpi_id', kpiId)
      .eq('is_active', true);

    const weightedChildren: WeightedKPI[] = (children || []).map(c => {
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

    const autoCalcResult = calculateKpiProgress(kpiId, weightedChildren);

    // Determine status based on override percentage
    let status: 'not_started' | 'in_progress' | 'at_risk' | 'on_track' | 'completed' = 'in_progress';
    if (progressPercentage >= 100) status = 'completed';
    else if (progressPercentage === 0) status = 'not_started';
    else if (progressPercentage >= 70) status = 'on_track';
    else if (progressPercentage < 30) status = 'at_risk';

    // Update cache with manual override
    const { error: updateError } = await supabase
      .from('kpi_progress_cache')
      .upsert({
        kpi_id: kpiId,
        progress_percentage: progressPercentage.toFixed(2),
        weighted_progress: autoCalcResult.weightedProgress.toFixed(2), // Store what auto-calc would be
        child_count: autoCalcResult.childCount,
        completed_child_count: autoCalcResult.completedChildCount,
        total_weight: autoCalcResult.totalWeight.toFixed(2),
        status,
        calculation_method: 'manual_override',
        manual_override_reason: reason.trim(),
        last_calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'kpi_id' });

    if (updateError) {
      console.error('Error setting override:', updateError);
      return NextResponse.json({ error: 'Failed to set override' }, { status: 500 });
    }

    // Recalculate parent if exists (parent is NOT protected by this KPI's override)
    if (kpi.parent_kpi_id) {
      await recalculateParentChain(supabase, kpi.parent_kpi_id);
    }

    return NextResponse.json({
      success: true,
      override: {
        kpiId,
        progressPercentage,
        reason: reason.trim(),
        autoCalculatedWouldBe: autoCalcResult.progressPercentage,
      },
    });
  } catch (error) {
    console.error('Set override error:', error);
    return NextResponse.json({ error: 'Failed to set override' }, { status: 500 });
  }
}

/**
 * DELETE /api/vision-kpis/[id]/override
 *
 * Clear manual override and recalculate using auto-calculation.
 *
 * Returns:
 * - New auto-calculated progress value
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kpiId } = await params;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);

    // Verify KPI belongs to user
    const { data: kpi, error: kpiError } = await supabase
      .from('vision_kpis')
      .select('id, parent_kpi_id')
      .eq('id', kpiId)
      .eq('user_id', userId)
      .single();

    if (kpiError || !kpi) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 });
    }

    // Recalculate this KPI using auto calculation
    const { data: children } = await supabase
      .from('vision_kpis')
      .select(`
        id,
        title,
        weight,
        kpi_progress_cache (progress_percentage)
      `)
      .eq('parent_kpi_id', kpiId)
      .eq('is_active', true);

    const weightedChildren: WeightedKPI[] = (children || []).map(c => {
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

    const result = calculateKpiProgress(kpiId, weightedChildren);
    const cacheData = buildCacheUpdateData(result);

    // Update cache, clearing override
    const { error: updateError } = await supabase
      .from('kpi_progress_cache')
      .upsert({
        kpi_id: kpiId,
        ...cacheData,
        calculation_method: 'auto',
        manual_override_reason: null,
      }, { onConflict: 'kpi_id' });

    if (updateError) {
      console.error('Error clearing override:', updateError);
      return NextResponse.json({ error: 'Failed to clear override' }, { status: 500 });
    }

    // Recalculate parent if exists
    if (kpi.parent_kpi_id) {
      await recalculateParentChain(supabase, kpi.parent_kpi_id);
    }

    return NextResponse.json({
      success: true,
      newProgress: result.progressPercentage,
    });
  } catch (error) {
    console.error('Clear override error:', error);
    return NextResponse.json({ error: 'Failed to clear override' }, { status: 500 });
  }
}
