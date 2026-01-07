import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEMO_USER_EMAIL = 'joel@pe-se.com';

async function getUserId(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>) {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) return user.id;

  // Demo mode fallback
  const { data: demoUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', DEMO_USER_EMAIL)
    .single();

  return demoUser?.id || null;
}

interface StreakData {
  nonNegotiableId: string;
  title: string;
  currentStreak: number;
  longestStreak: number;
  thisWeekCompletions: number;
  thisMonthCompletions: number;
  totalCompletions: number;
  lastCompletedDate: string | null;
}

function calculateStreak(completionDates: string[], targetCount: number): { current: number; longest: number } {
  if (completionDates.length === 0) return { current: 0, longest: 0 };

  // Sort dates in descending order
  const sortedDates = [...completionDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Calculate current streak (must include today or yesterday)
  const lastDate = new Date(sortedDates[0]);
  lastDate.setHours(0, 0, 0, 0);
  const daysSinceLastCompletion = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLastCompletion <= 1) {
    currentStreak = 1;
    const expectedDate = new Date(lastDate);

    for (let i = 1; i < sortedDates.length; i++) {
      expectedDate.setDate(expectedDate.getDate() - 1);
      const currentDate = new Date(sortedDates[i]);
      currentDate.setHours(0, 0, 0, 0);

      if (currentDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let prevDate: Date | null = null;
  for (const dateStr of sortedDates) {
    const currentDate = new Date(dateStr);
    currentDate.setHours(0, 0, 0, 0);

    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const daysDiff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    prevDate = currentDate;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
}

// GET /api/non-negotiables/streaks - Get streak data for all non-negotiables
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    const userId = await getUserId(supabase);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const visionId = searchParams.get('visionId');

    // Get all active non-negotiables
    let query = supabase
      .from('non_negotiables')
      .select('id, title, target_count, vision_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (visionId) {
      query = query.eq('vision_id', visionId);
    }

    const { data: nonNegotiables, error: nnError } = await query;

    if (nnError) {
      return NextResponse.json({ error: nnError.message }, { status: 500 });
    }

    if (!nonNegotiables || nonNegotiables.length === 0) {
      return NextResponse.json([]);
    }

    // Get completions for all non-negotiables
    const nnIds = nonNegotiables.map(nn => nn.id);
    const { data: completions, error: compError } = await supabase
      .from('non_negotiable_completions')
      .select('non_negotiable_id, completion_date, completion_count')
      .in('non_negotiable_id', nnIds)
      .order('completion_date', { ascending: false });

    if (compError) {
      return NextResponse.json({ error: compError.message }, { status: 500 });
    }

    // Calculate date ranges
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Group completions by non-negotiable
    const completionsByNn: Record<string, typeof completions> = {};
    for (const comp of completions || []) {
      if (!completionsByNn[comp.non_negotiable_id]) {
        completionsByNn[comp.non_negotiable_id] = [];
      }
      completionsByNn[comp.non_negotiable_id].push(comp);
    }

    // Calculate streaks for each non-negotiable
    const streakData: StreakData[] = nonNegotiables.map(nn => {
      const nnCompletions = completionsByNn[nn.id] || [];
      const dates = nnCompletions.map(c => c.completion_date);
      const { current, longest } = calculateStreak(dates, nn.target_count);

      // Calculate this week's completions
      const thisWeekCompletions = nnCompletions.filter(c => {
        const date = new Date(c.completion_date);
        return date >= startOfWeek;
      }).reduce((sum, c) => sum + (c.completion_count || 1), 0);

      // Calculate this month's completions
      const thisMonthCompletions = nnCompletions.filter(c => {
        const date = new Date(c.completion_date);
        return date >= startOfMonth;
      }).reduce((sum, c) => sum + (c.completion_count || 1), 0);

      // Total completions
      const totalCompletions = nnCompletions.reduce((sum, c) => sum + (c.completion_count || 1), 0);

      return {
        nonNegotiableId: nn.id,
        title: nn.title,
        currentStreak: current,
        longestStreak: longest,
        thisWeekCompletions,
        thisMonthCompletions,
        totalCompletions,
        lastCompletedDate: dates[0] || null,
      };
    });

    return NextResponse.json(streakData);
  } catch (error) {
    console.error('Error calculating streaks:', error);
    return NextResponse.json({ error: 'Failed to calculate streaks' }, { status: 500 });
  }
}
