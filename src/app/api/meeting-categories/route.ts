import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// Default categories to create for new users
const DEFAULT_CATEGORIES = [
  { name: '1:1', color: '#3b82f6', description: 'One-on-one meetings', sort_order: 0 },
  { name: 'Team Meeting', color: '#10b981', description: 'Team syncs and standups', sort_order: 1 },
  { name: 'Client Call', color: '#f59e0b', description: 'External client meetings', sort_order: 2 },
  { name: 'Interview', color: '#8b5cf6', description: 'Hiring interviews', sort_order: 3 },
  { name: 'Training', color: '#ec4899', description: 'Learning and training sessions', sort_order: 4 },
  { name: 'Ad-hoc', color: '#6b7280', description: 'Unscheduled discussions', sort_order: 5 },
];

// GET /api/meeting-categories - List all meeting categories for the user
export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const result = await adminClient
      .from('meeting_categories')
      .select('*')
      .eq('user_id', auth.userId)
      .order('sort_order', { ascending: true });
    const { error } = result;
    let categories = result.data;

    if (error) {
      console.error('Error fetching meeting categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // If user has no categories, create defaults
    if (!categories || categories.length === 0) {
      const { data: inserted, error: insertError } = await adminClient
        .from('meeting_categories')
        .insert(
          DEFAULT_CATEGORIES.map((cat) => ({
            user_id: auth.userId,
            ...cat,
            is_default: true,
          }))
        )
        .select();

      if (insertError) {
        console.error('Error creating default categories:', insertError);
        return NextResponse.json({ error: 'Failed to create default categories' }, { status: 500 });
      }
      categories = inserted;
    }

    // Transform to camelCase for frontend
    const transformedCategories = (categories || []).map((c: {
      id: string;
      name: string;
      color: string;
      description: string | null;
      is_default: boolean;
      sort_order: number;
      created_at: string;
      updated_at: string;
    }) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      description: c.description,
      isDefault: c.is_default,
      sortOrder: c.sort_order,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    return NextResponse.json(transformedCategories);
  } catch (error) {
    console.error('Error fetching meeting categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting categories' },
      { status: 500 }
    );
  }
}

// POST /api/meeting-categories - Create a new meeting category
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { name, color, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Check if category with same name already exists
    const { data: existing } = await adminClient
      .from('meeting_categories')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('name', name.trim())
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    // Get max sort order
    const { data: maxOrderData } = await adminClient
      .from('meeting_categories')
      .select('sort_order')
      .eq('user_id', auth.userId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const { data: category, error } = await adminClient
      .from('meeting_categories')
      .insert({
        user_id: auth.userId,
        name: name.trim(),
        color: color || '#6b7280',
        description: description || null,
        is_default: false,
        sort_order: (maxOrderData?.sort_order || 0) + 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating meeting category:', error);
      return NextResponse.json(
        { error: 'Failed to create meeting category' },
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
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating meeting category:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting category' },
      { status: 500 }
    );
  }
}
