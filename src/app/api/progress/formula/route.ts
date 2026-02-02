/**
 * Progress Formula Transparency Endpoint (PROG-05)
 *
 * GET /api/progress/formula?kpiId=xxx
 *
 * Returns a transparent breakdown of how progress is calculated for a KPI,
 * including each child's contribution, weights, and the formula used.
 *
 * This enables the UI to show users exactly how their progress is computed,
 * building trust and understanding of the weighted calculation system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { buildProgressFormula } from '@/lib/progress/calculator';
import type { WeightedKPI, ProgressFormula } from '@/lib/progress/types';

/**
 * GET /api/progress/formula?kpiId=xxx
 *
 * Query params:
 * - kpiId: The KPI to get formula breakdown for (required)
 *
 * Returns:
 * - kpiId, kpiTitle, level, parentKpiId: KPI metadata
 * - formula: Full ProgressFormula with components, formula string, method
 * - children: Array of children with their individual contributions
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const kpiId = searchParams.get('kpiId');

    if (!kpiId) {
      return NextResponse.json({ error: 'kpiId is required' }, { status: 400 });
    }

    // Get KPI details
    const { data: kpi, error: kpiError } = await supabase
      .from('vision_kpis')
      .select('id, title, level, parent_kpi_id')
      .eq('id', kpiId)
      .single();

    if (kpiError || !kpi) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 });
    }

    // Get children with their progress
    const { data: children, error: childError } = await supabase
      .from('vision_kpis')
      .select(`
        id,
        title,
        weight,
        kpi_progress_cache (
          progress_percentage,
          calculation_method,
          manual_override_reason
        )
      `)
      .eq('parent_kpi_id', kpiId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (childError) {
      console.error('Error fetching children:', childError);
      return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 });
    }

    // Get cache entry for this KPI to check for override info
    const { data: cache } = await supabase
      .from('kpi_progress_cache')
      .select('calculation_method, manual_override_reason, progress_percentage')
      .eq('kpi_id', kpiId)
      .single();

    const isManualOverride = cache?.calculation_method === 'manual_override';

    // Build WeightedKPI array from children
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

    // Build formula with override info if applicable
    const formula: ProgressFormula = buildProgressFormula(
      weightedChildren,
      isManualOverride
        ? {
            manualOverride: Number(cache!.progress_percentage),
            overrideReason: cache!.manual_override_reason || undefined,
          }
        : undefined
    );

    // Build response with children contribution breakdown
    return NextResponse.json({
      kpiId,
      kpiTitle: kpi.title,
      level: kpi.level,
      parentKpiId: kpi.parent_kpi_id,
      formula,
      children: weightedChildren.map(c => {
        const component = formula.components.find(comp => comp.kpiId === c.id);
        return {
          id: c.id,
          title: c.title,
          progress: c.progress,
          weight: c.weight,
          contributionPercent: component?.contribution || 0,
        };
      }),
      summary: {
        totalChildren: weightedChildren.length,
        totalWeight: weightedChildren.reduce((sum, c) => sum + c.weight, 0),
        resultPercentage: formula.resultPercentage,
        method: formula.method,
        isOverride: isManualOverride,
      },
    });
  } catch (error) {
    console.error('Get formula error:', error);
    return NextResponse.json({ error: 'Failed to get formula' }, { status: 500 });
  }
}
