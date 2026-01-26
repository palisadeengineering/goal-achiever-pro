import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET /api/detected-projects - List all detected projects for the user
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    let query = adminClient
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
      .eq('user_id', auth.userId)
      .order('total_minutes', { ascending: false });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('Error fetching detected projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Transform to camelCase for frontend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedProjects = (projects || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      normalizedName: p.normalized_name,
      color: p.color,
      powerGoalId: p.power_goal_id,
      powerGoalTitle: p.power_goals?.title || null,
      totalMinutes: p.total_minutes,
      eventCount: p.event_count,
      isArchived: p.is_archived,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({ projects: transformedProjects });
  } catch (error) {
    console.error('Error fetching detected projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detected projects' },
      { status: 500 }
    );
  }
}

// POST /api/detected-projects - Create a new detected project
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { name, color, powerGoalId } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const normalizedName = name.trim().toLowerCase();

    // Check if project with same normalized name already exists
    const { data: existing } = await adminClient
      .from('detected_projects')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('normalized_name', normalizedName)
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A project with this name already exists', existingId: existing.id },
        { status: 409 }
      );
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

    const { data: project, error } = await adminClient
      .from('detected_projects')
      .insert({
        user_id: auth.userId,
        name: name.trim(),
        normalized_name: normalizedName,
        color: color || '#6366f1',
        power_goal_id: powerGoalId || null,
        total_minutes: 0,
        event_count: 0,
        is_archived: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating detected project:', error);
      return NextResponse.json(
        { error: 'Failed to create detected project' },
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
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating detected project:', error);
    return NextResponse.json(
      { error: 'Failed to create detected project' },
      { status: 500 }
    );
  }
}
