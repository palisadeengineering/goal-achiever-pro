import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { sanitizeErrorForClient } from '@/lib/utils/api-errors';

// GET /api/tasks-v2 - List tasks with filters
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
    const milestoneId = searchParams.get('milestoneId');
    const keyResultId = searchParams.get('keyResultId');
    const scheduledDate = searchParams.get('scheduledDate');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const unscheduled = searchParams.get('unscheduled');

    let query = supabase
      .from('tasks')
      .select(`
        *,
        projects (
          id,
          title,
          color
        ),
        milestones_v2 (
          id,
          title
        ),
        project_key_results (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: true, nullsFirst: false })
      .order('priority', { ascending: false })
      .order('sort_order', { ascending: true });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (milestoneId) {
      query = query.eq('milestone_id', milestoneId);
    }

    if (keyResultId) {
      query = query.eq('key_result_id', keyResultId);
    }

    if (scheduledDate) {
      query = query.eq('scheduled_date', scheduledDate);
    }

    if (unscheduled === 'true') {
      query = query.is('scheduled_date', null);
    }

    if (status) {
      query = query.eq('status', status);
    } else {
      // Default: exclude cancelled
      query = query.neq('status', 'cancelled');
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'fetch tasks') }, { status: 500 });
    }

    return NextResponse.json({ tasks: data });
  } catch (error) {
    console.error('GET /api/tasks-v2 error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks-v2 - Create a new task
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
      title,
      description,
      projectId,
      milestoneId,
      keyResultId,
      estimatedMinutes,
      scheduledDate,
      scheduledStartTime,
      scheduledEndTime,
      dueDate,
      priority,
      valueQuadrant,
      fourCsTag,
      recurrence,
      recurrenceRule,
      sortOrder,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Verify project belongs to user (if provided)
    if (projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    // Get max sort order
    const sortQuery = supabase
      .from('tasks')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1);

    if (scheduledDate) {
      sortQuery.eq('scheduled_date', scheduledDate);
    }

    const { data: existingTasks } = await sortQuery;
    const maxSortOrder = existingTasks?.[0]?.sort_order ?? -1;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: title.trim(),
        description: description || null,
        project_id: projectId || null,
        milestone_id: milestoneId || null,
        key_result_id: keyResultId || null,
        estimated_minutes: estimatedMinutes || 30,
        scheduled_date: scheduledDate || null,
        scheduled_start_time: scheduledStartTime || null,
        scheduled_end_time: scheduledEndTime || null,
        due_date: dueDate || null,
        priority: priority || 'medium',
        value_quadrant: valueQuadrant || null,
        four_cs_tag: fourCsTag || null,
        recurrence: recurrence || 'none',
        recurrence_rule: recurrenceRule || null,
        status: 'pending',
        sort_order: sortOrder ?? maxSortOrder + 1,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'create task') }, { status: 500 });
    }

    return NextResponse.json({ task: data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks-v2 error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
