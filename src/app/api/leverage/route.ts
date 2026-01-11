import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// GET - Fetch all leverage items for user
export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);

    const { data: items, error } = await supabase
      .from('leverage_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leverage items:', error);
      return NextResponse.json({ error: 'Failed to fetch leverage items' }, { status: 500 });
    }

    // Transform to match frontend interface
    const transformedItems = (items || []).map(item => ({
      id: item.id,
      type: item.leverage_type,
      title: item.title,
      description: item.description || '',
      status: item.status || 'idea',
      estimatedHoursSaved: parseFloat(item.estimated_hours_saved_weekly) || 0,
      actualHoursSaved: parseFloat(item.actual_hours_saved_weekly) || 0,
      notes: item.implementation_notes || '',
      createdAt: item.created_at,
    }));

    return NextResponse.json(transformedItems);
  } catch (error) {
    console.error('Error fetching leverage items:', error);
    return NextResponse.json({ error: 'Failed to fetch leverage items' }, { status: 500 });
  }
}

// POST - Create a new leverage item
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const body = await request.json();

    const {
      type,
      title,
      description,
      status,
      estimatedHoursSaved,
      notes,
    } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    // Map frontend type to action_type (required field)
    const actionType = type === 'capital' ? 'delegate' : type === 'code' ? 'automate' : 'duplicate';

    const { data: item, error } = await supabase
      .from('leverage_items')
      .insert({
        user_id: userId,
        leverage_type: type,
        action_type: actionType,
        title,
        description: description || null,
        status: status || 'idea',
        estimated_hours_saved_weekly: estimatedHoursSaved || null,
        implementation_notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating leverage item:', error);
      return NextResponse.json({ error: 'Failed to create leverage item' }, { status: 500 });
    }

    return NextResponse.json({
      id: item.id,
      type: item.leverage_type,
      title: item.title,
      description: item.description || '',
      status: item.status || 'idea',
      estimatedHoursSaved: parseFloat(item.estimated_hours_saved_weekly) || 0,
      actualHoursSaved: parseFloat(item.actual_hours_saved_weekly) || 0,
      notes: item.implementation_notes || '',
      createdAt: item.created_at,
    });
  } catch (error) {
    console.error('Error creating leverage item:', error);
    return NextResponse.json({ error: 'Failed to create leverage item' }, { status: 500 });
  }
}

// PUT - Update a leverage item
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const body = await request.json();

    const {
      id,
      type,
      title,
      description,
      status,
      estimatedHoursSaved,
      actualHoursSaved,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const actionType = type === 'capital' ? 'delegate' : type === 'code' ? 'automate' : 'duplicate';

    const { data: item, error } = await supabase
      .from('leverage_items')
      .update({
        leverage_type: type,
        action_type: actionType,
        title,
        description: description || null,
        status: status || 'idea',
        estimated_hours_saved_weekly: estimatedHoursSaved || null,
        actual_hours_saved_weekly: actualHoursSaved || null,
        implementation_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating leverage item:', error);
      return NextResponse.json({ error: 'Failed to update leverage item' }, { status: 500 });
    }

    return NextResponse.json({
      id: item.id,
      type: item.leverage_type,
      title: item.title,
      description: item.description || '',
      status: item.status || 'idea',
      estimatedHoursSaved: parseFloat(item.estimated_hours_saved_weekly) || 0,
      actualHoursSaved: parseFloat(item.actual_hours_saved_weekly) || 0,
      notes: item.implementation_notes || '',
      createdAt: item.created_at,
    });
  } catch (error) {
    console.error('Error updating leverage item:', error);
    return NextResponse.json({ error: 'Failed to update leverage item' }, { status: 500 });
  }
}

// DELETE - Delete a leverage item
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('leverage_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting leverage item:', error);
      return NextResponse.json({ error: 'Failed to delete leverage item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting leverage item:', error);
    return NextResponse.json({ error: 'Failed to delete leverage item' }, { status: 500 });
  }
}
