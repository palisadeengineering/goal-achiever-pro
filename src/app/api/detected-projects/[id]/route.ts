import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/detected-projects/[id] - Get a specific project with stats
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

    const { data: project, error } = await adminClient
      .from('detected_projects')
      .select(`
        id,
        name,
        normalized_name,
        color,
        power_goal_id,
        total_minutes,
        event_count,
        is_archived,
        created_at,
        updated_at,
        power_goals (
          title
        )
      `)
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const powerGoals = project.power_goals as any;
    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        normalizedName: project.normalized_name,
        color: project.color,
        powerGoalId: project.power_goal_id,
        powerGoalTitle: powerGoals?.title || null,
        totalMinutes: project.total_minutes,
        eventCount: project.event_count,
        isArchived: project.is_archived,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      }
    });
  } catch (error) {
    console.error('Error fetching detected project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detected project' },
      { status: 500 }
    );
  }
}

// PUT /api/detected-projects/[id] - Update a project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, color, powerGoalId, isArchived } = body;

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Verify project belongs to user
    const { data: existing } = await adminClient
      .from('detected_projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Validate power goal belongs to user if provided
    if (powerGoalId) {
      const { data: goal } = await adminClient
        .from('power_goals')
        .select('id')
        .eq('id', powerGoalId)
        .eq('user_id', auth.userId)
        .single();

      if (!goal) {
        return NextResponse.json(
          { error: 'Power goal not found' },
          { status: 404 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      updateData.name = name.trim();
      updateData.normalized_name = name.trim().toLowerCase();
    }
    if (color !== undefined) updateData.color = color;
    if (powerGoalId !== undefined) updateData.power_goal_id = powerGoalId || null;
    if (isArchived !== undefined) updateData.is_archived = isArchived;

    const { data: project, error } = await adminClient
      .from('detected_projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating detected project:', error);
      return NextResponse.json(
        { error: 'Failed to update detected project' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        normalizedName: project.normalized_name,
        color: project.color,
        powerGoalId: project.power_goal_id,
        totalMinutes: project.total_minutes,
        eventCount: project.event_count,
        isArchived: project.is_archived,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      }
    });
  } catch (error) {
    console.error('Error updating detected project:', error);
    return NextResponse.json(
      { error: 'Failed to update detected project' },
      { status: 500 }
    );
  }
}

// DELETE /api/detected-projects/[id] - Archive a project (soft delete)
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

    // Verify project belongs to user
    const { data: existing } = await adminClient
      .from('detected_projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Soft delete by archiving
    const { error: updateError } = await adminClient
      .from('detected_projects')
      .update({
        is_archived: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error archiving detected project:', updateError);
      return NextResponse.json(
        { error: 'Failed to delete detected project' },
        { status: 500 }
      );
    }

    // Unlink time blocks from this project
    await adminClient
      .from('time_blocks')
      .update({ detected_project_id: null })
      .eq('detected_project_id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting detected project:', error);
    return NextResponse.json(
      { error: 'Failed to delete detected project' },
      { status: 500 }
    );
  }
}
