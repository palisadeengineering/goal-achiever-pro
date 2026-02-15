import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { sanitizeErrorForClient } from '@/lib/utils/api-errors';

// GET /api/projects-v2/[id] - Get single project with all relations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Fetch project with all related data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch key results
    const { data: keyResults } = await supabase
      .from('project_key_results')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true });

    // Fetch milestones
    const { data: milestones } = await supabase
      .from('milestones_v2')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true });

    // Fetch tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .neq('status', 'cancelled')
      .order('scheduled_date', { ascending: true })
      .order('sort_order', { ascending: true });

    // Fetch today's check-in
    const today = new Date().toISOString().split('T')[0];
    const { data: todayCheckIn } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', id)
      .eq('check_in_date', today)
      .single();

    // Fetch streaks
    const { data: streaks } = await supabase
      .from('streaks_v2')
      .select('*')
      .eq('user_id', userId)
      .or(`project_id.eq.${id},project_id.is.null`);

    // Fetch rewards linked to this project's milestones/KRs
    const milestoneIds = (milestones || []).map(m => m.id);
    const krIds = (keyResults || []).map(kr => kr.id);

    let rewards: unknown[] = [];
    if (milestoneIds.length > 0 || krIds.length > 0) {
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', userId)
        .or(
          `trigger_id.in.(${[...milestoneIds, ...krIds].join(',')}),trigger_type.eq.xp_threshold`
        );
      rewards = rewardsData || [];
    }

    return NextResponse.json({
      project: {
        ...project,
        keyResults: keyResults || [],
        milestones: milestones || [],
        tasks: tasks || [],
        todayCheckIn: todayCheckIn || null,
        streaks: streaks || [],
        rewards: rewards || [],
      },
    });
  } catch (error) {
    console.error('GET /api/projects-v2/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// PUT /api/projects-v2/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map camelCase to snake_case
    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      color: 'color',
      specific: 'specific',
      measurable: 'measurable',
      attainable: 'attainable',
      realistic: 'realistic',
      timeBound: 'time_bound',
      startDate: 'start_date',
      targetDate: 'target_date',
      clarityScore: 'clarity_score',
      beliefScore: 'belief_score',
      consistencyScore: 'consistency_score',
      revenueMath: 'revenue_math',
      isFocused: 'is_focused',
      priority: 'priority',
      progressPercentage: 'progress_percentage',
      coverImageUrl: 'cover_image_url',
      affirmationText: 'affirmation_text',
      status: 'status',
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) {
        updateData[snake] = body[camel];
      }
    }

    // Handle status changes
    if (body.status === 'completed' && !body.completedAt) {
      updateData.completed_at = new Date().toISOString();
    } else if (body.status === 'archived' && !body.archivedAt) {
      updateData.archived_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: sanitizeErrorForClient(error, 'update project') }, { status: 500 });
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('PUT /api/projects-v2/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects-v2/[id] - Delete or archive project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    if (hardDelete) {
      // Hard delete - cascades via foreign keys
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        return NextResponse.json({ error: sanitizeErrorForClient(error, 'delete project') }, { status: 500 });
      }

      return NextResponse.json({ success: true, deleted: true });
    } else {
      // Soft delete - archive the project
      const { error } = await supabase
        .from('projects')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        return NextResponse.json({ error: sanitizeErrorForClient(error, 'archive project') }, { status: 500 });
      }

      return NextResponse.json({ success: true, archived: true });
    }
  } catch (error) {
    console.error('DELETE /api/projects-v2/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
