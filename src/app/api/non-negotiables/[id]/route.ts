import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { sanitizeErrorForClient } from '@/lib/utils/api-errors';

// GET /api/non-negotiables/[id] - Get a single non-negotiable
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const { id } = await params;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('non_negotiables')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Non-negotiable not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching non-negotiable:', error);
    return NextResponse.json({ error: 'Failed to fetch non-negotiable' }, { status: 500 });
  }
}

// PUT /api/non-negotiables/[id] - Update a non-negotiable
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const { id } = await params;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { title, description, frequency, targetCount, sortOrder, isActive } = body;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (targetCount !== undefined) updateData.target_count = targetCount;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabase
      .from('non_negotiables')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'update non-negotiable') }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Non-negotiable not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating non-negotiable:', error);
    return NextResponse.json({ error: 'Failed to update non-negotiable' }, { status: 500 });
  }
}

// DELETE /api/non-negotiables/[id] - Soft delete a non-negotiable
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const { id } = await params;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('non_negotiables')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'delete non-negotiable') }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting non-negotiable:', error);
    return NextResponse.json({ error: 'Failed to delete non-negotiable' }, { status: 500 });
  }
}
