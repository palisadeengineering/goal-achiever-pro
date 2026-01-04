import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// GET /api/vision-kpis?visionId=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { searchParams } = new URL(request.url);
    const visionId = searchParams.get('visionId');
    const level = searchParams.get('level'); // Optional: 'quarterly', 'monthly', 'weekly', 'daily'

    if (!visionId) {
      return NextResponse.json({ error: 'Vision ID is required' }, { status: 400 });
    }

    let query = supabase
      .from('vision_kpis')
      .select('*')
      .eq('user_id', userId)
      .eq('vision_id', visionId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (level) {
      query = query.eq('level', level);
    }

    const { data: kpis, error } = await query;

    if (error) {
      console.error('Error fetching KPIs:', error);
      return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 });
    }

    return NextResponse.json({ kpis: kpis || [] });
  } catch (error) {
    console.error('Get KPIs error:', error);
    return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 });
  }
}

// POST /api/vision-kpis - Create or bulk create KPIs
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const body = await request.json();

    // Support both single KPI and bulk creation
    const kpisToCreate = Array.isArray(body) ? body : [body];

    const kpisWithUser = kpisToCreate.map((kpi, index) => ({
      user_id: userId,
      vision_id: kpi.visionId,
      level: kpi.level,
      title: kpi.title,
      description: kpi.description || null,
      target_value: kpi.targetValue || null,
      unit: kpi.unit || null,
      numeric_target: kpi.numericTarget || null,
      parent_kpi_id: kpi.parentKpiId || null,
      quarter: kpi.quarter || null,
      month: kpi.month || null,
      category: kpi.category || null,
      tracking_method: kpi.trackingMethod || 'checkbox',
      leads_to: kpi.leadsTo || null,
      best_time: kpi.bestTime || null,
      time_required: kpi.timeRequired || null,
      why_it_matters: kpi.whyItMatters || null,
      success_formula: kpi.successFormula || null,
      is_active: true,
      sort_order: kpi.sortOrder ?? index,
    }));

    const { data: kpis, error } = await supabase
      .from('vision_kpis')
      .insert(kpisWithUser)
      .select();

    if (error) {
      console.error('Error creating KPIs:', error);
      return NextResponse.json({ error: 'Failed to create KPIs' }, { status: 500 });
    }

    return NextResponse.json({ kpis, count: kpis?.length || 0 });
  } catch (error) {
    console.error('Create KPIs error:', error);
    return NextResponse.json({ error: 'Failed to create KPIs' }, { status: 500 });
  }
}

// PUT /api/vision-kpis - Update a KPI
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'KPI ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.targetValue !== undefined) updateData.target_value = updates.targetValue;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.numericTarget !== undefined) updateData.numeric_target = updates.numericTarget;
    if (updates.trackingMethod !== undefined) updateData.tracking_method = updates.trackingMethod;
    if (updates.bestTime !== undefined) updateData.best_time = updates.bestTime;
    if (updates.timeRequired !== undefined) updateData.time_required = updates.timeRequired;
    if (updates.whyItMatters !== undefined) updateData.why_it_matters = updates.whyItMatters;
    if (updates.successFormula !== undefined) updateData.success_formula = updates.successFormula;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;

    const { data: kpi, error } = await supabase
      .from('vision_kpis')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating KPI:', error);
      return NextResponse.json({ error: 'Failed to update KPI' }, { status: 500 });
    }

    return NextResponse.json({ kpi });
  } catch (error) {
    console.error('Update KPI error:', error);
    return NextResponse.json({ error: 'Failed to update KPI' }, { status: 500 });
  }
}

// DELETE /api/vision-kpis?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'KPI ID is required' }, { status: 400 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('vision_kpis')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting KPI:', error);
      return NextResponse.json({ error: 'Failed to delete KPI' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete KPI error:', error);
    return NextResponse.json({ error: 'Failed to delete KPI' }, { status: 500 });
  }
}
