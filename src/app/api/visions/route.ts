import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Demo user ID for development - replace with real auth later
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    // Fetch user's visions (active one first)
    const { data: visions, error } = await supabase
      .from('visions')
      .select('*')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching visions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch visions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ visions: visions || [] });
  } catch (error) {
    console.error('Get visions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    const body = await request.json();
    const {
      title,
      description,
      specific,
      measurable,
      attainable,
      realistic,
      timeBound,
      targetDate,
      clarityScore,
      beliefScore,
      consistencyScore,
      color,
      affirmationText,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Vision title is required' },
        { status: 400 }
      );
    }

    // If this is the first vision, or we want to set it as active,
    // deactivate other visions first
    await supabase
      .from('visions')
      .update({ is_active: false })
      .eq('user_id', userId);

    // Create new vision
    // Note: time_bound is a date column, use targetDate (YYYY-MM-DD format)
    // The timeBound text field from SMART goals is for display only
    const { data: vision, error } = await supabase
      .from('visions')
      .insert({
        user_id: userId,
        title,
        description: description || null,
        specific: specific || null,
        measurable: measurable || null,
        attainable: attainable || null,
        realistic: realistic || null,
        time_bound: targetDate || null,
        clarity_score: clarityScore || 0,
        belief_score: beliefScore || 0,
        consistency_score: consistencyScore || 0,
        color: color || '#6366f1',
        affirmation_text: affirmationText || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating vision:', error);
      return NextResponse.json(
        { error: 'Failed to create vision' },
        { status: 500 }
      );
    }

    return NextResponse.json({ vision });
  } catch (error) {
    console.error('Create vision error:', error);
    return NextResponse.json(
      { error: 'Failed to create vision' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    const body = await request.json();
    const {
      id,
      title,
      description,
      specific,
      measurable,
      attainable,
      realistic,
      timeBound,
      targetDate,
      clarityScore,
      beliefScore,
      consistencyScore,
      color,
      affirmationText,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Vision ID is required' },
        { status: 400 }
      );
    }

    // Update vision (only if it belongs to the user)
    // Note: time_bound is a date column, use targetDate (YYYY-MM-DD format)
    const { data: vision, error } = await supabase
      .from('visions')
      .update({
        title,
        description: description || null,
        specific: specific || null,
        measurable: measurable || null,
        attainable: attainable || null,
        realistic: realistic || null,
        time_bound: targetDate || null,
        clarity_score: clarityScore ?? undefined,
        belief_score: beliefScore ?? undefined,
        consistency_score: consistencyScore ?? undefined,
        color: color ?? undefined,
        affirmation_text: affirmationText ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating vision:', error);
      return NextResponse.json(
        { error: 'Failed to update vision' },
        { status: 500 }
      );
    }

    return NextResponse.json({ vision });
  } catch (error) {
    console.error('Update vision error:', error);
    return NextResponse.json(
      { error: 'Failed to update vision' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Vision ID is required' },
        { status: 400 }
      );
    }

    // Archive the vision instead of hard delete
    const { error } = await supabase
      .from('visions')
      .update({
        is_active: false,
        archived_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error archiving vision:', error);
      return NextResponse.json(
        { error: 'Failed to archive vision' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Archive vision error:', error);
    return NextResponse.json(
      { error: 'Failed to archive vision' },
      { status: 500 }
    );
  }
}
