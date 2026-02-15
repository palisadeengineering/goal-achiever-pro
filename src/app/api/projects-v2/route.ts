import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { sanitizeErrorForClient } from '@/lib/utils/api-errors';

// GET /api/projects-v2 - List all projects for user
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
    const status = searchParams.get('status'); // 'active', 'paused', 'completed', 'archived'
    const focused = searchParams.get('focused'); // 'true' or 'false'

    let query = supabase
      .from('projects')
      .select(`
        *,
        project_key_results (
          id,
          name,
          target_value,
          current_value,
          progress_percentage,
          status
        ),
        milestones_v2 (
          id,
          title,
          description,
          quarter,
          target_date,
          status,
          completed_at
        )
      `)
      .eq('user_id', userId)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    } else {
      // Default: exclude archived
      query = query.neq('status', 'archived');
    }

    if (focused === 'true') {
      query = query.eq('is_focused', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'fetch projects') }, { status: 500 });
    }

    return NextResponse.json({ projects: data });
  } catch (error) {
    console.error('GET /api/projects-v2 error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects-v2 - Create a new project
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
      color,
      specific,
      measurable,
      attainable,
      realistic,
      timeBound,
      startDate,
      targetDate,
      revenueMath,
      isFocused,
      priority,
      coverImageUrl,
      affirmationText,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        title: title.trim(),
        description: description || null,
        color: color || '#6366f1',
        specific: specific || null,
        measurable: measurable || null,
        attainable: attainable || null,
        realistic: realistic || null,
        time_bound: timeBound || null,
        start_date: startDate || null,
        target_date: targetDate || null,
        revenue_math: revenueMath || {},
        is_focused: isFocused || false,
        priority: priority || 1,
        cover_image_url: coverImageUrl || null,
        affirmation_text: affirmationText || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'create project') }, { status: 500 });
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects-v2 error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
