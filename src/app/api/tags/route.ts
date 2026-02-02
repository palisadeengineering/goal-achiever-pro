import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET: Fetch user's tags
export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { data: tags, error } = await supabase
      .from('time_block_tags')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching tags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tags' },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const transformed = (tags || []).map(tag => ({
      id: tag.id,
      userId: tag.user_id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      isActive: tag.is_active,
      createdAt: tag.created_at,
      updatedAt: tag.updated_at,
    }));

    return NextResponse.json({ tags: transformed });
  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// POST: Create a new tag
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const body = await request.json();

    const { name, color, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Check if tag with same name already exists
    const { data: existing } = await supabase
      .from('time_block_tags')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 400 }
      );
    }

    const { data: tag, error } = await supabase
      .from('time_block_tags')
      .insert({
        user_id: userId,
        name: name.trim(),
        color: color || '#6366f1',
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tag:', error);
      return NextResponse.json(
        { error: 'Failed to create tag' },
        { status: 500 }
      );
    }

    const transformed = {
      id: tag.id,
      userId: tag.user_id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      isActive: tag.is_active,
      createdAt: tag.created_at,
      updatedAt: tag.updated_at,
    };

    return NextResponse.json({ tag: transformed });
  } catch (error) {
    console.error('Create tag error:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing tag
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const body = await request.json();

    const { id, name, color, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color;
    if (description !== undefined) updateData.description = description;

    const { data: tag, error } = await supabase
      .from('time_block_tags')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tag:', error);
      return NextResponse.json(
        { error: 'Failed to update tag' },
        { status: 500 }
      );
    }

    const transformed = {
      id: tag.id,
      userId: tag.user_id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      isActive: tag.is_active,
      createdAt: tag.created_at,
      updatedAt: tag.updated_at,
    };

    return NextResponse.json({ tag: transformed });
  } catch (error) {
    console.error('Update tag error:', error);
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete a tag (set is_active = false)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from('time_block_tags')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting tag:', error);
      return NextResponse.json(
        { error: 'Failed to delete tag' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tag error:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
