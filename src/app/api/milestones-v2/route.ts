import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { sanitizeErrorForClient } from '@/lib/utils/api-errors';

// GET /api/milestones-v2 - List milestones (optionally filtered)
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const quarter = searchParams.get('quarter');
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    let query = supabase
      .from('milestones_v2')
      .select(`
        *,
        projects (
          id,
          title,
          color
        )
      `)
      .eq('user_id', userId)
      .order('year', { ascending: true })
      .order('quarter', { ascending: true })
      .order('sort_order', { ascending: true });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (quarter) {
      query = query.eq('quarter', parseInt(quarter, 10));
    }

    if (year) {
      query = query.eq('year', parseInt(year, 10));
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'fetch milestones') }, { status: 500 });
    }

    return NextResponse.json({ milestones: data });
  } catch (error) {
    console.error('GET /api/milestones-v2 error:', error);
    return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
  }
}

// POST /api/milestones-v2 - Create a new milestone
export async function POST(request: NextRequest) {
  try {
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

    const {
      projectId,
      title,
      description,
      quarter,
      year,
      targetDate,
      linkedKeyResultIds,
      sortOrder,
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Verify project belongs to user
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get max sort order for this project
    const { data: existingMilestones } = await supabase
      .from('milestones_v2')
      .select('sort_order')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const maxSortOrder = existingMilestones?.[0]?.sort_order ?? -1;

    const { data, error } = await supabase
      .from('milestones_v2')
      .insert({
        user_id: userId,
        project_id: projectId,
        title: title.trim(),
        description: description || null,
        quarter: quarter || null,
        year: year || null,
        target_date: targetDate || null,
        linked_key_result_ids: linkedKeyResultIds || [],
        progress_percentage: 0,
        status: 'pending',
        sort_order: sortOrder ?? maxSortOrder + 1,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'create milestone') }, { status: 500 });
    }

    return NextResponse.json({ milestone: data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/milestones-v2 error:', error);
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
  }
}
