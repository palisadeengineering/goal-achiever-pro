import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET - Fetch pomodoro sessions (optionally by date)
export async function GET(request: NextRequest) {
  try {
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
    const date = searchParams.get('date');

    let query = supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (date) {
      query = query.eq('session_date', date);
    } else {
      // Get last 7 days by default
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte('session_date', weekAgo.toISOString().split('T')[0]);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching pomodoro sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Transform and group by date for today's summary
    const transformedSessions = (sessions || []).map(session => ({
      id: session.id,
      date: session.session_date,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      plannedMinutes: session.planned_duration_minutes || 25,
      actualMinutes: session.actual_duration_minutes || 0,
      breakMinutes: session.break_duration_minutes || 5,
      status: session.status || 'completed',
      focusNotes: session.focus_notes || '',
      interruptionCount: session.interruption_count || 0,
    }));

    // Also return today's summary
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = transformedSessions.filter(s => s.date === today);
    const todayCompleted = todaySessions.filter(s => s.status === 'completed').length;
    const todayMinutes = todaySessions
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + (s.actualMinutes || s.plannedMinutes), 0);

    return NextResponse.json({
      sessions: transformedSessions,
      todaySummary: {
        date: today,
        completedPomodoros: todayCompleted,
        totalMinutes: todayMinutes,
        tasks: todaySessions
          .filter(s => s.focusNotes)
          .map(s => s.focusNotes)
          .filter((v, i, a) => a.indexOf(v) === i), // unique
      },
    });
  } catch (error) {
    console.error('Error fetching pomodoro sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST - Create/complete a pomodoro session
export async function POST(request: NextRequest) {
  try {
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
      date,
      plannedMinutes,
      actualMinutes,
      breakMinutes,
      status,
      focusNotes,
      interruptionCount,
    } = body;

    const sessionDate = date || new Date().toISOString().split('T')[0];

    const { data: session, error } = await supabase
      .from('pomodoro_sessions')
      .insert({
        user_id: userId,
        session_date: sessionDate,
        started_at: new Date().toISOString(),
        ended_at: status === 'completed' ? new Date().toISOString() : null,
        planned_duration_minutes: plannedMinutes || 25,
        actual_duration_minutes: actualMinutes || plannedMinutes || 25,
        break_duration_minutes: breakMinutes || 5,
        status: status || 'completed',
        focus_notes: focusNotes || null,
        interruption_count: interruptionCount || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pomodoro session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({
      id: session.id,
      date: session.session_date,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      plannedMinutes: session.planned_duration_minutes,
      actualMinutes: session.actual_duration_minutes,
      breakMinutes: session.break_duration_minutes,
      status: session.status,
      focusNotes: session.focus_notes || '',
      interruptionCount: session.interruption_count || 0,
    });
  } catch (error) {
    console.error('Error creating pomodoro session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// PUT - Update a pomodoro session (e.g., mark as completed)
export async function PUT(request: NextRequest) {
  try {
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
      id,
      actualMinutes,
      status,
      focusNotes,
      interruptionCount,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (actualMinutes !== undefined) updateData.actual_duration_minutes = actualMinutes;
    if (status !== undefined) updateData.status = status;
    if (focusNotes !== undefined) updateData.focus_notes = focusNotes;
    if (interruptionCount !== undefined) updateData.interruption_count = interruptionCount;
    if (status === 'completed') updateData.ended_at = new Date().toISOString();

    const { data: session, error } = await supabase
      .from('pomodoro_sessions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating pomodoro session:', error);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json({
      id: session.id,
      date: session.session_date,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      plannedMinutes: session.planned_duration_minutes,
      actualMinutes: session.actual_duration_minutes,
      breakMinutes: session.break_duration_minutes,
      status: session.status,
      focusNotes: session.focus_notes || '',
      interruptionCount: session.interruption_count || 0,
    });
  } catch (error) {
    console.error('Error updating pomodoro session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
