/**
 * Goal Tree API Endpoint
 *
 * GET /api/goal-tree/[visionId]
 *
 * Returns the complete KPI hierarchy for a vision with pre-computed progress values.
 * Enables instant dashboard loads by fetching entire tree in one API call (API-01).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildKpiTree, countTreeNodes, getLatestCalculationTime } from '@/lib/progress/tree';
import type { FlatKpiWithProgress } from '@/lib/progress/tree';

// Demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

/**
 * Validate UUID format
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * GET /api/goal-tree/[visionId]
 *
 * Returns nested KPI hierarchy with progress from cache.
 *
 * Response shape:
 * {
 *   "visionId": "...",
 *   "tree": KpiTreeNode[],
 *   "metadata": {
 *     "totalKpis": number,
 *     "lastCalculated": "ISO timestamp" | null
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ visionId: string }> }
) {
  const startTime = Date.now();

  try {
    const { visionId } = await params;

    // Validate visionId format
    if (!visionId || !isValidUUID(visionId)) {
      return NextResponse.json(
        { error: 'Invalid vision ID format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    // Verify user owns the vision
    const { data: vision, error: visionError } = await supabase
      .from('visions')
      .select('id')
      .eq('id', visionId)
      .eq('user_id', userId)
      .single();

    if (visionError || !vision) {
      // Check if vision exists at all (for better error message)
      const { data: anyVision } = await supabase
        .from('visions')
        .select('id')
        .eq('id', visionId)
        .single();

      if (!anyVision) {
        return NextResponse.json(
          { error: 'Vision not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Access denied to this vision' },
        { status: 403 }
      );
    }

    // Fetch all KPIs for the vision with their progress cache
    // Using LEFT JOIN via Supabase's select syntax
    const { data: kpisWithCache, error: kpisError } = await supabase
      .from('vision_kpis')
      .select(`
        id,
        user_id,
        vision_id,
        level,
        title,
        description,
        target_value,
        unit,
        numeric_target,
        parent_kpi_id,
        weight,
        quarter,
        month,
        category,
        tracking_method,
        leads_to,
        best_time,
        time_required,
        why_it_matters,
        success_formula,
        is_active,
        sort_order,
        created_at,
        updated_at,
        kpi_progress_cache (
          progress_percentage,
          status,
          child_count,
          completed_child_count,
          calculation_method,
          last_calculated_at
        )
      `)
      .eq('vision_id', visionId)
      .eq('is_active', true)
      .order('level', { ascending: true })
      .order('sort_order', { ascending: true });

    if (kpisError) {
      console.error('Error fetching KPIs:', kpisError);
      return NextResponse.json(
        { error: 'Failed to fetch KPIs' },
        { status: 500 }
      );
    }

    // Transform to flat KPI format with progress cache merged
    const flatKpis: FlatKpiWithProgress[] = (kpisWithCache || []).map(kpi => {
      // Handle the nested kpi_progress_cache - it may be an array or single object
      const cache = Array.isArray(kpi.kpi_progress_cache)
        ? kpi.kpi_progress_cache[0]
        : kpi.kpi_progress_cache;

      return {
        id: kpi.id,
        user_id: kpi.user_id,
        vision_id: kpi.vision_id,
        level: kpi.level,
        title: kpi.title,
        description: kpi.description,
        target_value: kpi.target_value,
        unit: kpi.unit,
        numeric_target: kpi.numeric_target,
        parent_kpi_id: kpi.parent_kpi_id,
        weight: kpi.weight,
        quarter: kpi.quarter,
        month: kpi.month,
        category: kpi.category,
        tracking_method: kpi.tracking_method,
        leads_to: kpi.leads_to,
        best_time: kpi.best_time,
        time_required: kpi.time_required,
        why_it_matters: kpi.why_it_matters,
        success_formula: kpi.success_formula,
        is_active: kpi.is_active,
        sort_order: kpi.sort_order ?? 0,
        created_at: kpi.created_at,
        updated_at: kpi.updated_at,
        // Progress cache fields (with defaults)
        progress_percentage: cache?.progress_percentage ?? null,
        status: cache?.status ?? null,
        child_count: cache?.child_count ?? null,
        completed_child_count: cache?.completed_child_count ?? null,
        calculation_method: cache?.calculation_method ?? null,
        last_calculated_at: cache?.last_calculated_at ?? null,
      };
    });

    // Build the nested tree structure
    const tree = buildKpiTree(flatKpis);

    // Calculate metadata
    const totalKpis = countTreeNodes(tree);
    const lastCalculated = getLatestCalculationTime(tree);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      visionId,
      tree,
      metadata: {
        totalKpis,
        lastCalculated,
        duration,
      },
    });
  } catch (error) {
    console.error('Goal tree fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal tree' },
      { status: 500 }
    );
  }
}
