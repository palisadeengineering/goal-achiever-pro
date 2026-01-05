import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// GET /api/milestone-kpis?milestoneId=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get('milestoneId');

    if (!milestoneId) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    // Get milestone KPIs with their linked vision KPIs
    const { data: milestoneKpis, error } = await supabase
      .from('milestone_kpis')
      .select(`
        *,
        kpi:vision_kpis(
          id,
          title,
          description,
          level,
          target_value,
          unit,
          tracking_method,
          best_time,
          time_required,
          why_it_matters
        )
      `)
      .eq('user_id', userId)
      .eq('milestone_id', milestoneId);

    if (error) {
      console.error('Error fetching milestone KPIs:', error);
      return NextResponse.json({ error: 'Failed to fetch milestone KPIs' }, { status: 500 });
    }

    // Get today's date for fetching KPI logs
    const today = new Date().toISOString().split('T')[0];

    // For each linked KPI, get today's completion status and streak
    const kpisWithStatus = await Promise.all((milestoneKpis || []).map(async (mk) => {
      if (!mk.kpi_id) {
        return {
          ...mk,
          kpi: mk.kpi ? {
            ...mk.kpi,
            isCompleted: false,
            currentStreak: 0,
            todayValue: null,
          } : null,
        };
      }

      // Get today's log
      const { data: todayLog } = await supabase
        .from('kpi_logs')
        .select('*')
        .eq('kpi_id', mk.kpi_id)
        .eq('log_date', today)
        .single();

      // Get streak
      const { data: streakData } = await supabase
        .from('kpi_streaks')
        .select('current_streak')
        .eq('kpi_id', mk.kpi_id)
        .single();

      return {
        ...mk,
        kpi: mk.kpi ? {
          ...mk.kpi,
          isCompleted: todayLog?.is_completed || false,
          currentStreak: streakData?.current_streak || 0,
          todayValue: todayLog?.value || null,
        } : null,
      };
    }));

    return NextResponse.json({ milestoneKpis: kpisWithStatus });
  } catch (error) {
    console.error('Get milestone KPIs error:', error);
    return NextResponse.json({ error: 'Failed to fetch milestone KPIs' }, { status: 500 });
  }
}

// POST /api/milestone-kpis - Link a KPI to a milestone or add custom KPI
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const body = await request.json();
    const { milestoneId, kpiId, customKpiName, customKpiTarget, isAutoLinked = true } = body;

    if (!milestoneId) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    if (!kpiId && !customKpiName) {
      return NextResponse.json({ error: 'Either KPI ID or custom KPI name is required' }, { status: 400 });
    }

    // Check if already linked (for vision KPIs)
    if (kpiId) {
      const { data: existing } = await supabase
        .from('milestone_kpis')
        .select('id')
        .eq('milestone_id', milestoneId)
        .eq('kpi_id', kpiId)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'KPI already linked to this milestone' }, { status: 400 });
      }
    }

    const { data: milestoneKpi, error } = await supabase
      .from('milestone_kpis')
      .insert({
        user_id: userId,
        milestone_id: milestoneId,
        kpi_id: kpiId || null,
        custom_kpi_name: customKpiName || null,
        custom_kpi_target: customKpiTarget || null,
        is_auto_linked: isAutoLinked,
      })
      .select(`
        *,
        kpi:vision_kpis(
          id,
          title,
          description,
          level,
          target_value,
          unit,
          tracking_method,
          best_time,
          time_required,
          why_it_matters
        )
      `)
      .single();

    if (error) {
      console.error('Error creating milestone KPI:', error);
      return NextResponse.json({ error: 'Failed to link KPI' }, { status: 500 });
    }

    return NextResponse.json({ milestoneKpi });
  } catch (error) {
    console.error('Create milestone KPI error:', error);
    return NextResponse.json({ error: 'Failed to link KPI' }, { status: 500 });
  }
}

// DELETE /api/milestone-kpis?id=xxx
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
      return NextResponse.json({ error: 'Milestone KPI ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('milestone_kpis')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting milestone KPI:', error);
      return NextResponse.json({ error: 'Failed to unlink KPI' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete milestone KPI error:', error);
    return NextResponse.json({ error: 'Failed to unlink KPI' }, { status: 500 });
  }
}
