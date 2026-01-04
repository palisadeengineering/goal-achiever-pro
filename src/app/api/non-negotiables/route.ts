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

// GET /api/non-negotiables - List all non-negotiables for user
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

    let query = supabase
      .from('non_negotiables')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (visionId) {
      query = query.eq('vision_id', visionId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching non-negotiables:', error);
    return NextResponse.json({ error: 'Failed to fetch non-negotiables' }, { status: 500 });
  }
}

// POST /api/non-negotiables - Create a new non-negotiable
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    const userId = await getUserId(supabase);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { visionId, title, description, frequency, targetCount, sortOrder } = body;

    if (!visionId || !title) {
      return NextResponse.json(
        { error: 'visionId and title are required' },
        { status: 400 }
      );
    }

    // Verify vision belongs to user
    const { data: vision } = await supabase
      .from('visions')
      .select('id')
      .eq('id', visionId)
      .eq('user_id', userId)
      .single();

    if (!vision) {
      return NextResponse.json({ error: 'Vision not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('non_negotiables')
      .insert({
        user_id: userId,
        vision_id: visionId,
        title,
        description: description || null,
        frequency: frequency || 'daily',
        target_count: targetCount || 1,
        sort_order: sortOrder || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating non-negotiable:', error);
    return NextResponse.json({ error: 'Failed to create non-negotiable' }, { status: 500 });
  }
}
