import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { format, subDays } from 'date-fns';

// GET - Fetch today's 300% score and 7-day history
export async function GET() {
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

    const today = format(new Date(), 'yyyy-MM-dd');
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

    // Get today's check-ins
    const { data: todayCheckins, error: todayError } = await supabase
      .from('daily_reviews')
      .select('clarity_today, belief_today, consistency_today, review_type, created_at')
      .eq('user_id', userId)
      .eq('review_date', today)
      .order('created_at', { ascending: false });

    if (todayError) {
      console.error('Error fetching today check-ins:', todayError);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Find the most recent check-in with 300% data
    const todayData = todayCheckins?.find(
      (c) =>
        c.clarity_today !== null &&
        c.belief_today !== null &&
        c.consistency_today !== null
    );

    // Get 7-day history
    const { data: history, error: historyError } = await supabase
      .from('daily_reviews')
      .select('review_date, clarity_today, belief_today, consistency_today')
      .eq('user_id', userId)
      .gte('review_date', sevenDaysAgo)
      .order('review_date', { ascending: true });

    if (historyError) {
      console.error('Error fetching history:', historyError);
    }

    // Aggregate by date (take max scores per day)
    const dailyScores = new Map<string, { clarity: number; belief: number; consistency: number }>();

    if (history) {
      for (const entry of history) {
        if (
          entry.clarity_today !== null &&
          entry.belief_today !== null &&
          entry.consistency_today !== null
        ) {
          const existing = dailyScores.get(entry.review_date);
          const total = entry.clarity_today + entry.belief_today + entry.consistency_today;
          if (!existing || total > existing.clarity + existing.belief + existing.consistency) {
            dailyScores.set(entry.review_date, {
              clarity: entry.clarity_today,
              belief: entry.belief_today,
              consistency: entry.consistency_today,
            });
          }
        }
      }
    }

    // Calculate 7-day average
    const scores = Array.from(dailyScores.values());
    const weeklyAverage =
      scores.length > 0
        ? Math.round(
            scores.reduce((acc, s) => acc + s.clarity + s.belief + s.consistency, 0) /
              scores.length
          )
        : null;

    return NextResponse.json({
      today: todayData
        ? {
            clarity: todayData.clarity_today,
            belief: todayData.belief_today,
            consistency: todayData.consistency_today,
            total:
              (todayData.clarity_today || 0) +
              (todayData.belief_today || 0) +
              (todayData.consistency_today || 0),
          }
        : null,
      weeklyAverage,
      history: Array.from(dailyScores.entries()).map(([date, scores]) => ({
        date,
        total: scores.clarity + scores.belief + scores.consistency,
      })),
    });
  } catch (error) {
    console.error('Error fetching 300% scores:', error);
    return NextResponse.json({ error: 'Failed to fetch 300% scores' }, { status: 500 });
  }
}

// POST - Save today's 300% score
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
    const { clarity, belief, consistency } = body;

    // Validate inputs
    if (
      typeof clarity !== 'number' ||
      typeof belief !== 'number' ||
      typeof consistency !== 'number' ||
      clarity < 0 ||
      clarity > 100 ||
      belief < 0 ||
      belief > 100 ||
      consistency < 0 ||
      consistency > 100
    ) {
      return NextResponse.json(
        { error: 'Invalid scores. Each must be 0-100.' },
        { status: 400 }
      );
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const reviewType = getReviewType();

    // Check if a review exists for today with this type
    const { data: existing, error: fetchError } = await supabase
      .from('daily_reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('review_date', today)
      .eq('review_type', reviewType)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found
      console.error('Error checking existing review:', fetchError);
    }

    if (existing) {
      // Update existing
      const { error: updateError } = await supabase
        .from('daily_reviews')
        .update({
          clarity_today: clarity,
          belief_today: belief,
          consistency_today: consistency,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating review:', updateError);
        return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
      }
    } else {
      // Insert new
      const { error: insertError } = await supabase.from('daily_reviews').insert({
        user_id: userId,
        review_date: today,
        review_type: reviewType,
        clarity_today: clarity,
        belief_today: belief,
        consistency_today: consistency,
      });

      if (insertError) {
        console.error('Error inserting review:', insertError);
        return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      total: clarity + belief + consistency,
    });
  } catch (error) {
    console.error('Error saving 300% score:', error);
    return NextResponse.json({ error: 'Failed to save 300% score' }, { status: 500 });
  }
}

// Determine review type based on current time
function getReviewType(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'midday';
  return 'evening';
}
