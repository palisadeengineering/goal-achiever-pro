import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { awardXpV2 } from '@/lib/services/gamification-v2';
import { checkRewardTriggers } from '@/lib/services/rewards';

// GET /api/milestones-v2/[id] - Get single milestone with related tasks
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

    const { data: milestone, error } = await supabase
      .from('milestones_v2')
      .select(`
        *,
        projects (
          id,
          title,
          color
        ),
        tasks (
          id,
          title,
          status,
          scheduled_date,
          priority
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    return NextResponse.json({ milestone });
  } catch (error) {
    console.error('GET /api/milestones-v2/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch milestone' }, { status: 500 });
  }
}

// PUT /api/milestones-v2/[id] - Update milestone
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

    // Get current milestone for comparison
    const { data: currentMilestone } = await supabase
      .from('milestones_v2')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!currentMilestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map camelCase to snake_case
    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      quarter: 'quarter',
      year: 'year',
      targetDate: 'target_date',
      linkedKeyResultIds: 'linked_key_result_ids',
      progressPercentage: 'progress_percentage',
      status: 'status',
      sortOrder: 'sort_order',
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) {
        updateData[snake] = body[camel];
      }
    }

    // Handle completion
    const wasCompleted = currentMilestone.status === 'completed';
    const isNowCompleted = body.status === 'completed';

    if (isNowCompleted && !wasCompleted) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('milestones_v2')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating milestone:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Award XP and check rewards if milestone was just completed
    let gamificationResult = null;
    let rewardsUnlocked: string[] = [];

    if (isNowCompleted && !wasCompleted) {
      try {
        // Count improved KRs for bonus
        const linkedKRIds = data.linked_key_result_ids || [];
        let improvedKRCount = 0;

        if (linkedKRIds.length > 0) {
          const { data: krs } = await supabase
            .from('project_key_results')
            .select('progress_percentage')
            .in('id', linkedKRIds)
            .gt('progress_percentage', 0);

          improvedKRCount = krs?.length || 0;
        }

        gamificationResult = await awardXpV2(userId, 'MILESTONE_COMPLETE', {
          improvedKRCount,
          projectId: currentMilestone.project_id,
        });

        // Check for reward triggers
        rewardsUnlocked = await checkRewardTriggers(userId, 'milestone', id);
      } catch (xpError) {
        console.error('Failed to award XP or check rewards:', xpError);
      }
    }

    return NextResponse.json({
      milestone: data,
      gamification: gamificationResult,
      rewardsUnlocked,
    });
  } catch (error) {
    console.error('PUT /api/milestones-v2/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
  }
}

// DELETE /api/milestones-v2/[id] - Delete milestone
export async function DELETE(
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

    const { error } = await supabase
      .from('milestones_v2')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting milestone:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/milestones-v2/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
  }
}
