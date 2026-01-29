import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rollupProgressToAncestors, type AncestorProgressUpdate } from '@/lib/progress';
import { awardXp } from '@/lib/services/gamification';

// Demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// GET /api/vision-kpis/[id]/log - Get logs for a KPI
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');

    let query = supabase
      .from('kpi_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('kpi_id', id)
      .order('log_date', { ascending: false });

    if (startDate) {
      query = query.gte('log_date', startDate);
    }
    if (endDate) {
      query = query.lte('log_date', endDate);
    }
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching KPI logs:', error);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    // Also fetch streak data
    const { data: streak } = await supabase
      .from('kpi_streaks')
      .select('*')
      .eq('kpi_id', id)
      .single();

    return NextResponse.json({ logs: logs || [], streak });
  } catch (error) {
    console.error('Get KPI logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

// POST /api/vision-kpis/[id]/log - Log a value or check-off
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const body = await request.json();
    const { date, value, isCompleted, notes } = body;

    const logDate = date || new Date().toISOString().split('T')[0];

    // Check if log exists for this date
    const { data: existing } = await supabase
      .from('kpi_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('kpi_id', id)
      .eq('log_date', logDate)
      .single();

    let log;
    if (existing) {
      // Update existing log
      const { data, error } = await supabase
        .from('kpi_logs')
        .update({
          value: value ?? existing.value,
          is_completed: isCompleted ?? existing.is_completed,
          completion_count: isCompleted ? (existing.completion_count || 0) + 1 : existing.completion_count,
          notes: notes ?? existing.notes,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating log:', error);
        return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
      }
      log = data;
    } else {
      // Create new log
      const { data, error } = await supabase
        .from('kpi_logs')
        .insert({
          user_id: userId,
          kpi_id: id,
          log_date: logDate,
          value: value || null,
          is_completed: isCompleted ?? false,
          completion_count: isCompleted ? 1 : 0,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating log:', error);
        return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
      }
      log = data;
    }

    // Update streak data
    await updateStreak(supabase, id, logDate, isCompleted);

    // Roll up progress to all ancestors (PROG-01, PROG-02)
    const rollupResult = await rollupProgressToAncestors(supabase, id);

    // Award XP for KPI completion (only when marking as completed)
    let gamificationResult = null;
    if (isCompleted) {
      try {
        // Get current streak from kpi_streaks if exists
        const { data: streakData } = await supabase
          .from('kpi_streaks')
          .select('current_streak')
          .eq('kpi_id', id)
          .single();

        gamificationResult = await awardXp(userId, 'KPI_COMPLETED', {
          kpiId: id,
          streakCount: streakData?.current_streak,
        });
      } catch (gamificationError) {
        // Log but don't fail the request
        console.error('Gamification error:', gamificationError);
      }
    }

    return NextResponse.json({
      log,
      rollup: {
        updatedKpis: rollupResult.updatedKpis,
        duration: rollupResult.duration,
      },
      gamification: gamificationResult,
    });
  } catch (error) {
    console.error('Log KPI error:', error);
    return NextResponse.json({ error: 'Failed to log KPI' }, { status: 500 });
  }
}

// DELETE /api/vision-kpis/[id]/log - Remove a log entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('kpi_logs')
      .delete()
      .eq('user_id', userId)
      .eq('kpi_id', id)
      .eq('log_date', date);

    if (error) {
      console.error('Error deleting log:', error);
      return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 });
    }

    // Recalculate streak
    await recalculateStreak(supabase, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete log error:', error);
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 });
  }
}

async function updateStreak(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kpiId: string,
  logDate: string,
  isCompleted: boolean
) {
  if (!supabase) return;

  try {
    // Get current streak data
    const { data: existing } = await supabase
      .from('kpi_streaks')
      .select('*')
      .eq('kpi_id', kpiId)
      .single();

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (isCompleted) {
      if (existing) {
        // Check if continuing streak
        const lastDate = existing.last_completed_date;
        const isContinuing = lastDate === yesterday || lastDate === today;

        const newStreak = isContinuing ? existing.current_streak + 1 : 1;
        const newLongest = Math.max(newStreak, existing.longest_streak || 0);

        await supabase
          .from('kpi_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: newLongest,
            last_completed_date: logDate,
            updated_at: new Date().toISOString(),
          })
          .eq('kpi_id', kpiId);
      } else {
        // Create new streak record
        await supabase
          .from('kpi_streaks')
          .insert({
            kpi_id: kpiId,
            current_streak: 1,
            longest_streak: 1,
            last_completed_date: logDate,
          });
      }
    }
  } catch (error) {
    console.error('Error updating streak:', error);
  }
}

async function recalculateStreak(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kpiId: string
) {
  if (!supabase) return;

  try {
    // Get all completed logs ordered by date desc
    const { data: logs } = await supabase
      .from('kpi_logs')
      .select('log_date')
      .eq('kpi_id', kpiId)
      .eq('is_completed', true)
      .order('log_date', { ascending: false });

    if (!logs || logs.length === 0) {
      // No completions, reset streak
      await supabase
        .from('kpi_streaks')
        .update({
          current_streak: 0,
          last_completed_date: null,
          updated_at: new Date().toISOString(),
        })
        .eq('kpi_id', kpiId);
      return;
    }

    // Calculate current streak
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const log of logs) {
      const logDate = new Date(log.log_date);
      if (!lastDate) {
        // First log
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today.getTime() - logDate.getTime()) / 86400000);

        if (daysDiff <= 1) {
          currentStreak = 1;
          lastDate = logDate;
        } else {
          break; // Streak is broken
        }
      } else {
        const daysDiff = Math.floor((lastDate.getTime() - logDate.getTime()) / 86400000);
        if (daysDiff === 1) {
          currentStreak++;
          lastDate = logDate;
        } else {
          break; // Streak is broken
        }
      }
    }

    // Update streak
    const { data: existing } = await supabase
      .from('kpi_streaks')
      .select('longest_streak')
      .eq('kpi_id', kpiId)
      .single();

    await supabase
      .from('kpi_streaks')
      .upsert({
        kpi_id: kpiId,
        current_streak: currentStreak,
        longest_streak: Math.max(currentStreak, existing?.longest_streak || 0),
        last_completed_date: logs[0]?.log_date || null,
        updated_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Error recalculating streak:', error);
  }
}
