/**
 * Progress Cache API Endpoint
 *
 * GET  - Read cached progress for a KPI
 * POST - Recalculate progress (respects manual override unless ?force=true)
 * PUT  - Update KPI weight and trigger parent recalculation
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
 * GET /api/vision-kpis/[id]/progress
 *
 * Returns cached progress for a KPI. If no cache entry exists,
 * calculates progress on demand without persisting.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: kpiId } = await params;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Fetch progress cache entry
    const { data: cache, error } = await supabase
      .from('kpi_progress_cache')
      .select('*')
      .eq('kpi_id', kpiId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching progress cache:', error);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    // If no cache entry, calculate on demand
    if (!cache) {
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
      return NextResponse.json({ progress: result, cached: false });
    }

    return NextResponse.json({
      progress: {
        kpiId,
        progressPercentage: Number(cache.progress_percentage),
        childCount: cache.child_count,
        completedChildCount: cache.completed_child_count,
        weightedProgress: Number(cache.weighted_progress),
        totalWeight: Number(cache.total_weight),
        status: cache.status,
        calculationMethod: cache.calculation_method,
        manualOverrideReason: cache.manual_override_reason,
        lastCalculatedAt: cache.last_calculated_at,
      },
      cached: true,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

/**
 * POST /api/vision-kpis/[id]/progress
 *
 * Recalculates and caches progress for a KPI from its children.
 * Respects manual override unless ?force=true is passed.
 *
 * Query params:
 * - force=true: Clear manual override and recalculate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id: kpiId } = await params;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Check for force parameter and existing override
    const { searchParams } = new URL(request.url);
    const forceRecalculate = searchParams.get('force') === 'true';

    const { data: existingCache } = await supabase
      .from('kpi_progress_cache')
      .select('calculation_method')
      .eq('kpi_id', kpiId)
      .single();

    if (existingCache?.calculation_method === 'manual_override' && !forceRecalculate) {
      return NextResponse.json({
        progress: {
          kpiId,
          message: 'KPI has manual override, skipping auto-recalculation',
          manualOverride: true,
        },
        duration: Date.now() - startTime,
        skipped: true,
      });
    }

    // Get direct children with their progress
    const { data: children, error: childError } = await supabase
      .from('vision_kpis')
      .select(`
        id,
        title,
        weight,
        kpi_progress_cache (progress_percentage)
      `)
      .eq('parent_kpi_id', kpiId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (childError) {
      console.error('Error fetching children:', childError);
      return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 });
    }

    // Map to WeightedKPI format
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

    // Calculate progress
    const result = calculateKpiProgress(kpiId, weightedChildren);
    const cacheData = buildCacheUpdateData(result);

    // Upsert cache entry (clear override if force=true)
    const upsertData = forceRecalculate
      ? { kpi_id: kpiId, ...cacheData, calculation_method: 'auto', manual_override_reason: null }
      : { kpi_id: kpiId, ...cacheData };

    const { error: upsertError } = await supabase
      .from('kpi_progress_cache')
      .upsert(upsertData, { onConflict: 'kpi_id' });

    if (upsertError) {
      console.error('Error updating cache:', upsertError);
      return NextResponse.json({ error: 'Failed to update cache' }, { status: 500 });
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      progress: result,
      duration,
      cached: true,
    });
  } catch (error) {
    console.error('Recalculate progress error:', error);
    return NextResponse.json({ error: 'Failed to recalculate progress' }, { status: 500 });
  }
}

/**
 * PUT /api/vision-kpis/[id]/progress
 *
 * Updates the weight of a KPI and triggers parent recalculation.
 *
 * Body:
 * - weight: number (>= 0, typically 0.1 to 10)
 */
export async function PUT(
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
    const { weight } = body;

    if (weight === undefined || weight < 0) {
      return NextResponse.json({ error: 'Valid weight is required (>= 0)' }, { status: 400 });
    }

    // Update weight on the KPI
    const { error: updateError } = await supabase
      .from('vision_kpis')
      .update({ weight, updated_at: new Date().toISOString() })
      .eq('id', kpiId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating weight:', updateError);
      return NextResponse.json({ error: 'Failed to update weight' }, { status: 500 });
    }

    // Recalculate parent's progress since child weight changed
    const { data: kpi } = await supabase
      .from('vision_kpis')
      .select('parent_kpi_id')
      .eq('id', kpiId)
      .single();

    if (kpi?.parent_kpi_id) {
      await recalculateParentChain(supabase, kpi.parent_kpi_id);
    }

    return NextResponse.json({ success: true, weight });
  } catch (error) {
    console.error('Update weight error:', error);
    return NextResponse.json({ error: 'Failed to update weight' }, { status: 500 });
  }
}
