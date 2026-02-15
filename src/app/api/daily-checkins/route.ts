import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { validateDateParam } from '@/lib/validations/common';
import { awardXpV2 } from '@/lib/services/gamification-v2';
import { updateStreakV2 } from '@/lib/services/streaks-v2';
import { sanitizeErrorForClient } from '@/lib/utils/api-errors';

// GET /api/daily-checkins - Get check-ins (today's or history)
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
    const projectId = searchParams.get('projectId');
    const date = validateDateParam(searchParams.get('date'));
    const today = searchParams.get('today');

    let query = supabase
      .from('daily_checkins')
      .select(`
        *,
        projects (
          id,
          title,
          color
        )
      `)
      .eq('user_id', userId)
      .order('check_in_date', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (date) {
      query = query.eq('check_in_date', date);
    }

    if (today === 'true') {
      const todayDate = new Date().toISOString().split('T')[0];
      query = query.eq('check_in_date', todayDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'fetch check-ins') }, { status: 500 });
    }

    // If requesting today and no results, return null instead of empty array
    if (today === 'true' && (!data || data.length === 0)) {
      return NextResponse.json({ checkIn: null });
    }

    return NextResponse.json({ checkIns: data });
  } catch (error) {
    console.error('GET /api/daily-checkins error:', error);
    return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
  }
}

// POST /api/daily-checkins - Create or update today's check-in
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
      projectId,
      clarityScore,
      beliefScore,
      consistencyScore,
      note,
    } = body;

    // Validate scores (1-10)
    if (!clarityScore || clarityScore < 1 || clarityScore > 10) {
      return NextResponse.json({ error: 'Clarity score must be between 1 and 10' }, { status: 400 });
    }
    if (!beliefScore || beliefScore < 1 || beliefScore > 10) {
      return NextResponse.json({ error: 'Belief score must be between 1 and 10' }, { status: 400 });
    }
    if (!consistencyScore || consistencyScore < 1 || consistencyScore > 10) {
      return NextResponse.json({ error: 'Consistency score must be between 1 and 10' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const totalScore = (clarityScore + beliefScore + consistencyScore) * 10;

    // Determine prompts triggered based on scores
    const promptsTriggered: string[] = [];
    if (clarityScore < 7) promptsTriggered.push('low_clarity');
    if (beliefScore < 7) promptsTriggered.push('low_belief');
    if (consistencyScore < 7) promptsTriggered.push('low_consistency');

    // Check for existing check-in today
    const { data: existingCheckIn } = await supabase
      .from('daily_checkins')
      .select('id')
      .eq('user_id', userId)
      .eq('check_in_date', today)
      .eq('project_id', projectId || null)
      .single();

    let checkIn;
    let isNewCheckIn = false;

    if (existingCheckIn) {
      // Update existing check-in
      const { data, error } = await supabase
        .from('daily_checkins')
        .update({
          clarity_score: clarityScore,
          belief_score: beliefScore,
          consistency_score: consistencyScore,
          total_score: totalScore,
          note: note || null,
          prompts_triggered: promptsTriggered,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCheckIn.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: sanitizeErrorForClient(error, 'update check-in') }, { status: 500 });
      }

      checkIn = data;
    } else {
      // Create new check-in
      isNewCheckIn = true;

      const { data, error } = await supabase
        .from('daily_checkins')
        .insert({
          user_id: userId,
          project_id: projectId || null,
          check_in_date: today,
          clarity_score: clarityScore,
          belief_score: beliefScore,
          consistency_score: consistencyScore,
          total_score: totalScore,
          note: note || null,
          prompts_triggered: promptsTriggered,
          xp_awarded: 0,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: sanitizeErrorForClient(error, 'create check-in') }, { status: 500 });
      }

      checkIn = data;
    }

    // Award XP and update streak (only for new check-ins)
    let gamificationResult = null;
    let streakUpdated = false;
    let newStreakLength = 0;

    if (isNewCheckIn) {
      try {
        // Get current check-in streak for bonus
        const { data: streakData } = await supabase
          .from('streaks_v2')
          .select('current_streak')
          .eq('user_id', userId)
          .eq('streak_type', 'check_in')
          .single();

        const currentStreak = streakData?.current_streak || 0;
        const isPerfect300 = totalScore === 300;

        gamificationResult = await awardXpV2(userId, 'DAILY_CHECKIN', {
          currentStreak,
          isPerfect300,
          projectId,
        });

        // Update check-in with XP awarded
        await supabase
          .from('daily_checkins')
          .update({ xp_awarded: gamificationResult.totalXp })
          .eq('id', checkIn.id);

        // Update check-in streak
        const streaksUpdated = await updateStreakV2(userId, 'checkin_completed', {
          projectId,
        });

        streakUpdated = streaksUpdated.length > 0;

        // Get new streak length
        const { data: newStreakData } = await supabase
          .from('streaks_v2')
          .select('current_streak')
          .eq('user_id', userId)
          .eq('streak_type', 'check_in')
          .single();

        newStreakLength = newStreakData?.current_streak || 0;
      } catch (xpError) {
        console.error('Failed to award XP or update streak:', xpError);
      }
    }

    // Update project's 300% scores (latest values)
    if (projectId) {
      await supabase
        .from('projects')
        .update({
          clarity_score: clarityScore,
          belief_score: beliefScore,
          consistency_score: consistencyScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);
    }

    return NextResponse.json({
      checkIn,
      xpAwarded: gamificationResult?.totalXp || 0,
      promptsTriggered,
      streakUpdated,
      newStreakLength,
      gamification: gamificationResult,
    }, { status: isNewCheckIn ? 201 : 200 });
  } catch (error) {
    console.error('POST /api/daily-checkins error:', error);
    return NextResponse.json({ error: 'Failed to create check-in' }, { status: 500 });
  }
}
