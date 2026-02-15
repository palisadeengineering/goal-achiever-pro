import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { sanitizeErrorForClient } from '@/lib/utils/api-errors';

// GET /api/project-key-results - List key results (optionally filtered by project)
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
    const status = searchParams.get('status');

    let query = supabase
      .from('project_key_results')
      .select(`
        *,
        projects (
          id,
          title,
          color
        )
      `)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'fetch key results') }, { status: 500 });
    }

    return NextResponse.json({ keyResults: data });
  } catch (error) {
    console.error('GET /api/project-key-results error:', error);
    return NextResponse.json({ error: 'Failed to fetch key results' }, { status: 500 });
  }
}

// POST /api/project-key-results - Create a new key result
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
      name,
      description,
      targetValue,
      startingValue,
      unitType,
      unitLabel,
      weight,
      sortOrder,
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (targetValue === undefined || targetValue === null) {
      return NextResponse.json({ error: 'Target value is required' }, { status: 400 });
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
    const { data: existingKRs } = await supabase
      .from('project_key_results')
      .select('sort_order')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const maxSortOrder = existingKRs?.[0]?.sort_order ?? -1;

    const { data, error } = await supabase
      .from('project_key_results')
      .insert({
        user_id: userId,
        project_id: projectId,
        name: name.trim(),
        description: description || null,
        target_value: targetValue,
        current_value: startingValue || 0,
        starting_value: startingValue || 0,
        unit_type: unitType || 'number',
        unit_label: unitLabel || null,
        weight: weight || 1,
        progress_percentage: 0,
        status: 'not_started',
        sort_order: sortOrder ?? maxSortOrder + 1,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'create key result') }, { status: 500 });
    }

    return NextResponse.json({ keyResult: data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/project-key-results error:', error);
    return NextResponse.json({ error: 'Failed to create key result' }, { status: 500 });
  }
}
