import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET: Fetch user's tags (supports ?query= for autocomplete search, ?limit= for max results)
export async function GET(request: NextRequest) {
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
    const query = searchParams.get('query')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 100);

    let dbQuery = supabase
      .from('time_block_tags')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(limit);

    if (query) {
      dbQuery = dbQuery.ilike('name', `%${query}%`);
    }

    const { data: tags, error } = await dbQuery;

    if (error) {
      console.error('Error fetching tags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tags' },
        { status: 500 }
      );
    }

    // Transform to camelCase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformed = (tags || []).map((tag: any) => ({
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

    // Idempotent: return existing tag if name matches (case-insensitive)
    const { data: existing } = await supabase
      .from('time_block_tags')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', name.trim())
      .eq('is_active', true)
      .single();

    if (existing) {
      const existingTransformed = {
        id: existing.id,
        userId: existing.user_id,
        name: existing.name,
        color: existing.color,
        description: existing.description,
        isActive: existing.is_active,
        createdAt: existing.created_at,
        updatedAt: existing.updated_at,
      };
      return NextResponse.json({ tag: existingTransformed, existing: true });
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
