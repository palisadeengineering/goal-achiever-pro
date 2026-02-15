import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { validateDateParam } from '@/lib/validations/common';
import { sanitizeErrorForClient } from '@/lib/utils/api-errors';

// GET /api/mins - List MINS with optional filters
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);

    const date = validateDateParam(searchParams.get('date')); // specific date
    const timeScope = searchParams.get('timeScope'); // 'daily' | 'weekly' | 'all'
    const status = searchParams.get('status'); // 'pending' | 'completed' | 'all'
    const impactProjectId = searchParams.get('impactProjectId');

    let query = supabase
      .from('mins')
      .select(`
        *,
        impact_projects:power_goals (
          id,
          title,
          category,
          visions (
            id,
            title,
            color
          )
        )
      `)
      .eq('user_id', userId)
      .order('priority', { ascending: true })
      .order('scheduled_time', { ascending: true, nullsFirst: false });

    if (date) {
      query = query.eq('scheduled_date', date);
    }

    if (timeScope && timeScope !== 'all') {
      query = query.eq('time_scope', timeScope);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (impactProjectId) {
      query = query.eq('power_goal_id', impactProjectId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'fetch mins') }, { status: 500 });
    }

    return NextResponse.json({ mins: data || [] });
  } catch (error) {
    console.error('GET /api/mins error:', error);
    return NextResponse.json({ error: 'Failed to fetch MINS' }, { status: 500 });
  }
}

// POST /api/mins - Create new MIN
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const body = await request.json();

    const {
      title,
      description,
      scheduledDate,
      scheduledTime,
      durationMinutes = 30,
      priority = 1,
      timeScope = 'daily',
      weekStartDate,
      weekEndDate,
      valueQuadrant,
      makesMoneyScore,
      energyScore,
      impactProjectId,
      isRecurring = false,
      recurrenceRule,
    } = body;

    if (!title || !scheduledDate) {
      return NextResponse.json(
        { error: 'Title and scheduled date are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('mins')
      .insert({
        user_id: userId,
        title,
        description,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        duration_minutes: durationMinutes,
        priority,
        time_scope: timeScope,
        week_start_date: weekStartDate,
        week_end_date: weekEndDate,
        drip_quadrant: valueQuadrant,
        makes_money_score: makesMoneyScore,
        energy_score: energyScore,
        power_goal_id: impactProjectId,
        is_recurring: isRecurring,
        recurrence_rule: recurrenceRule,
        status: 'pending',
      })
      .select(`
        *,
        impact_projects:power_goals (
          id,
          title,
          category,
          visions (id, title, color)
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'create min') }, { status: 500 });
    }

    return NextResponse.json({ min: data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/mins error:', error);
    return NextResponse.json({ error: 'Failed to create MIN' }, { status: 500 });
  }
}
