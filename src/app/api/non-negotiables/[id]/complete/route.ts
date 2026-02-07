import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// POST /api/non-negotiables/[id]/complete - Mark non-negotiable as complete for a date
export async function POST(
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
    const { date, notes } = body;

    // Use today's date if not provided
    const completionDate = date || new Date().toISOString().split('T')[0];

    // Verify non-negotiable belongs to user
    const { data: nonNegotiable } = await supabase
      .from('non_negotiables')
      .select('id, target_count')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!nonNegotiable) {
      return NextResponse.json({ error: 'Non-negotiable not found' }, { status: 404 });
    }

    // Check if already completed today
    const { data: existing } = await supabase
      .from('non_negotiable_completions')
      .select('*')
      .eq('non_negotiable_id', id)
      .eq('completion_date', completionDate)
      .single();

    if (existing) {
      // Increment completion count if target allows multiple completions
      const newCount = (existing.completion_count || 1) + 1;

      if (newCount > nonNegotiable.target_count) {
        return NextResponse.json({
          message: 'Already completed maximum times for today',
          completion: existing
        });
      }

      const { data, error } = await supabase
        .from('non_negotiable_completions')
        .update({
          completion_count: newCount,
          notes: notes || existing.notes,
          completed_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    // Create new completion
    const { data, error } = await supabase
      .from('non_negotiable_completions')
      .insert({
        user_id: userId,
        non_negotiable_id: id,
        completion_date: completionDate,
        completion_count: 1,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error completing non-negotiable:', error);
    return NextResponse.json({ error: 'Failed to complete non-negotiable' }, { status: 500 });
  }
}

// DELETE /api/non-negotiables/[id]/complete - Remove completion for a date
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

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('non_negotiable_completions')
      .delete()
      .eq('non_negotiable_id', id)
      .eq('user_id', userId)
      .eq('completion_date', date);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing completion:', error);
    return NextResponse.json({ error: 'Failed to remove completion' }, { status: 500 });
  }
}
