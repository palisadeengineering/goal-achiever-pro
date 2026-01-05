import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// GET /api/milestones/[id] - Get a single milestone with its vision
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    // Get the milestone with its vision
    const { data: milestone, error } = await supabase
      .from('power_goals')
      .select(`
        *,
        vision:visions(
          id,
          title,
          description,
          specific,
          measurable,
          attainable,
          realistic,
          time_bound,
          clarity_score,
          belief_score,
          consistency_score
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching milestone:', error);
      return NextResponse.json({ error: 'Failed to fetch milestone' }, { status: 500 });
    }

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    return NextResponse.json({ milestone });
  } catch (error) {
    console.error('Get milestone error:', error);
    return NextResponse.json({ error: 'Failed to fetch milestone' }, { status: 500 });
  }
}

// PUT /api/milestones/[id] - Update a milestone
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map camelCase to snake_case
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.targetDate !== undefined) updateData.target_date = body.targetDate;
    if (body.quarter !== undefined) updateData.quarter = body.quarter;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.milestonePeriod !== undefined) updateData.milestone_period = body.milestonePeriod;
    if (body.assigneeId !== undefined) updateData.assignee_id = body.assigneeId;
    if (body.assigneeName !== undefined) updateData.assignee_name = body.assigneeName;
    if (body.progressPercentage !== undefined) updateData.progress_percentage = body.progressPercentage;
    if (body.status !== undefined) updateData.status = body.status;

    const { data: milestone, error } = await supabase
      .from('power_goals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating milestone:', error);
      return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
    }

    return NextResponse.json({ milestone });
  } catch (error) {
    console.error('Update milestone error:', error);
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
  }
}
