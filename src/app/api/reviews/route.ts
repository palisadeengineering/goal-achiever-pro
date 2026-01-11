import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';

// Demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// GET - Fetch reviews for a date range (defaults to today)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('daily_reviews')
      .select('*')
      .eq('user_id', userId);

    if (startDate && endDate) {
      // Date range query
      query = query.gte('review_date', startDate).lte('review_date', endDate);
    } else {
      // Single date query
      query = query.eq('review_date', date);
    }

    const { data: reviews, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Transform to match frontend interface
    const transformedReviews = reviews?.map(review => ({
      id: review.id,
      date: review.review_date,
      type: review.review_type as 'morning' | 'midday' | 'evening',
      wins: review.wins || [],
      challenges: review.challenges || [],
      gratitude: review.gratitude || [],
      clarityScore: review.clarity_today || 70,
      beliefScore: review.belief_today || 70,
      consistencyScore: review.consistency_today || 70,
      energyLevel: review.energy_level || 70,
      moodScore: review.mood_score || 70,
      tomorrowFocus: review.tomorrow_focus || '',
      notes: review.lessons_learned || '',
      completedAt: review.created_at,
    })) || [];

    return NextResponse.json(transformedReviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST - Create or update a review
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const body = await request.json();

    const {
      date,
      type,
      wins,
      challenges,
      gratitude,
      clarityScore,
      beliefScore,
      consistencyScore,
      energyLevel,
      moodScore,
      tomorrowFocus,
      notes,
    } = body;

    // Validate required fields
    if (!date || !type) {
      return NextResponse.json(
        { error: 'Date and type are required' },
        { status: 400 }
      );
    }

    // Check if review exists for this date/type
    const { data: existing, error: fetchError } = await supabase
      .from('daily_reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('review_date', date)
      .eq('review_type', type)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing review:', fetchError);
    }

    const reviewData = {
      user_id: userId,
      review_date: date,
      review_type: type,
      wins: wins || [],
      challenges: challenges || [],
      gratitude: gratitude || [],
      clarity_today: clarityScore || 70,
      belief_today: beliefScore || 70,
      consistency_today: consistencyScore || 70,
      energy_level: energyLevel || 70,
      mood_score: moodScore || 70,
      tomorrow_focus: tomorrowFocus || '',
      lessons_learned: notes || '',
    };

    if (existing) {
      // Update existing review
      const { data: updated, error: updateError } = await supabase
        .from('daily_reviews')
        .update(reviewData)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating review:', updateError);
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
      }

      return NextResponse.json({
        id: updated.id,
        date: updated.review_date,
        type: updated.review_type,
        wins: updated.wins || [],
        challenges: updated.challenges || [],
        gratitude: updated.gratitude || [],
        clarityScore: updated.clarity_today,
        beliefScore: updated.belief_today,
        consistencyScore: updated.consistency_today,
        energyLevel: updated.energy_level,
        moodScore: updated.mood_score,
        tomorrowFocus: updated.tomorrow_focus,
        notes: updated.lessons_learned,
        completedAt: updated.created_at,
      });
    } else {
      // Insert new review
      const { data: created, error: insertError } = await supabase
        .from('daily_reviews')
        .insert(reviewData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating review:', insertError);
        return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
      }

      return NextResponse.json({
        id: created.id,
        date: created.review_date,
        type: created.review_type,
        wins: created.wins || [],
        challenges: created.challenges || [],
        gratitude: created.gratitude || [],
        clarityScore: created.clarity_today,
        beliefScore: created.belief_today,
        consistencyScore: created.consistency_today,
        energyLevel: created.energy_level,
        moodScore: created.mood_score,
        tomorrowFocus: created.tomorrow_focus,
        notes: created.lessons_learned,
        completedAt: created.created_at,
      });
    }
  } catch (error) {
    console.error('Error saving review:', error);
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
  }
}
