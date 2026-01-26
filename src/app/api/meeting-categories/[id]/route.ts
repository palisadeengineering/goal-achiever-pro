import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/meeting-categories/[id] - Get a specific category
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { data: category, error } = await adminClient
      .from('meeting_categories')
      .select('*')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single();

    if (error || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        color: category.color,
        description: category.description,
        isDefault: category.is_default,
        sortOrder: category.sort_order,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
      }
    });
  } catch (error) {
    console.error('Error fetching meeting category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting category' },
      { status: 500 }
    );
  }
}

// PUT /api/meeting-categories/[id] - Update a category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, color, description, sortOrder } = body;

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Verify category belongs to user
    const { data: existing } = await adminClient
      .from('meeting_categories')
      .select('id')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check for duplicate name if updating name
    if (name) {
      const { data: duplicate } = await adminClient
        .from('meeting_categories')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('name', name.trim())
        .neq('id', id)
        .limit(1)
        .single();

      if (duplicate) {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color;
    if (description !== undefined) updateData.description = description;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;

    const { data: category, error } = await adminClient
      .from('meeting_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating meeting category:', error);
      return NextResponse.json(
        { error: 'Failed to update meeting category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        color: category.color,
        description: category.description,
        isDefault: category.is_default,
        sortOrder: category.sort_order,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
      }
    });
  } catch (error) {
    console.error('Error updating meeting category:', error);
    return NextResponse.json(
      { error: 'Failed to update meeting category' },
      { status: 500 }
    );
  }
}

// DELETE /api/meeting-categories/[id] - Delete a category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Verify category belongs to user
    const { data: existing } = await adminClient
      .from('meeting_categories')
      .select('id, is_default')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Unlink meeting details from this category first
    await adminClient
      .from('time_block_meeting_details')
      .update({ meeting_category_id: null })
      .eq('meeting_category_id', id);

    // Delete the category
    const { error } = await adminClient
      .from('meeting_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting meeting category:', error);
      return NextResponse.json(
        { error: 'Failed to delete meeting category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meeting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete meeting category' },
      { status: 500 }
    );
  }
}
