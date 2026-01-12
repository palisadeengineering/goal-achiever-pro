import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// GET /api/targets/weekly/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { id } = await params;

    const { data: target, error } = await supabase
      .from('weekly_targets')
      .select(`
        *,
        daily_actions(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching weekly target:', error);
      return NextResponse.json({ error: 'Failed to fetch target' }, { status: 500 });
    }

    return NextResponse.json({ target });
  } catch (error) {
    console.error('Get weekly target error:', error);
    return NextResponse.json({ error: 'Failed to fetch target' }, { status: 500 });
  }
}

// PUT /api/targets/weekly/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.keyMetric !== undefined) updateData.key_metric = body.keyMetric;
    if (body.targetValue !== undefined) updateData.target_value = body.targetValue;
    if (body.currentValue !== undefined) updateData.current_value = body.currentValue;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.assigneeId !== undefined) {
      // Handle "self" assignment by using the current user's ID
      updateData.assignee_id = body.assigneeId === 'self' ? userId : body.assigneeId;
    }
    if (body.assigneeName !== undefined) updateData.assignee_name = body.assigneeName;

    const { data: target, error } = await supabase
      .from('weekly_targets')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating weekly target:', error);
      return NextResponse.json({ error: 'Failed to update target' }, { status: 500 });
    }

    return NextResponse.json({ target });
  } catch (error) {
    console.error('Update weekly target error:', error);
    return NextResponse.json({ error: 'Failed to update target' }, { status: 500 });
  }
}

// DELETE /api/targets/weekly/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { id } = await params;

    const { error } = await supabase
      .from('weekly_targets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting weekly target:', error);
      return NextResponse.json({ error: 'Failed to delete target' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete weekly target error:', error);
    return NextResponse.json({ error: 'Failed to delete target' }, { status: 500 });
  }
}
