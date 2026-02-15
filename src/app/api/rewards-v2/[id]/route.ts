import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { sanitizeErrorForClient } from '@/lib/utils/api-errors';

// GET /api/rewards-v2/[id] - Get single reward with claims
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { data: reward, error } = await supabase
      .from('rewards')
      .select(`
        *,
        reward_claims (
          id,
          claimed_at,
          reward_name,
          reward_description,
          reward_value,
          note,
          created_at
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    return NextResponse.json({ reward });
  } catch (error) {
    console.error('GET /api/rewards-v2/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch reward' }, { status: 500 });
  }
}

// PUT /api/rewards-v2/[id] - Update reward
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map camelCase to snake_case
    const fieldMap: Record<string, string> = {
      name: 'name',
      description: 'description',
      imageUrl: 'image_url',
      estimatedValue: 'estimated_value',
      triggerType: 'trigger_type',
      triggerId: 'trigger_id',
      triggerValue: 'trigger_value',
      sortOrder: 'sort_order',
      status: 'status',
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) {
        updateData[snake] = body[camel];
      }
    }

    // Handle unlock
    if (body.status === 'unlocked') {
      updateData.unlocked_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('rewards')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'update reward') }, { status: 500 });
    }

    return NextResponse.json({ reward: data });
  } catch (error) {
    console.error('PUT /api/rewards-v2/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update reward' }, { status: 500 });
  }
}

// DELETE /api/rewards-v2/[id] - Delete reward
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'delete reward') }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/rewards-v2/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete reward' }, { status: 500 });
  }
}
