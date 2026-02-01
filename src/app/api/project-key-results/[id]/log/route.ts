import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { awardXpV2 } from '@/lib/services/gamification-v2';

// POST /api/project-key-results/[id]/log - Log progress for a key result
export async function POST(
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
    const { newValue, note, source } = body;

    if (newValue === undefined || newValue === null) {
      return NextResponse.json({ error: 'New value is required' }, { status: 400 });
    }

    // Get current key result
    const { data: keyResult, error: krError } = await supabase
      .from('project_key_results')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (krError || !keyResult) {
      return NextResponse.json({ error: 'Key result not found' }, { status: 404 });
    }

    const previousValue = Number(keyResult.current_value) || 0;

    // Create log entry
    const { data: log, error: logError } = await supabase
      .from('project_key_result_logs')
      .insert({
        user_id: userId,
        key_result_id: id,
        previous_value: previousValue,
        new_value: newValue,
        note: note || null,
        source: source || 'manual',
        logged_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating log:', logError);
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    // Calculate new progress
    const startVal = Number(keyResult.starting_value) || 0;
    const targetVal = Number(keyResult.target_value);
    const currentVal = Number(newValue);
    const range = targetVal - startVal;

    let progressPercentage = 0;
    if (range !== 0) {
      progressPercentage = Math.round(((currentVal - startVal) / range) * 100);
      progressPercentage = Math.max(0, Math.min(100, progressPercentage));
    }

    // Determine status
    let newStatus = keyResult.status;
    const wasCompleted = keyResult.status === 'completed';
    const isNowCompleted = progressPercentage >= 100;

    if (isNowCompleted && !wasCompleted) {
      newStatus = 'completed';
    } else if (progressPercentage > 0 && newStatus === 'not_started') {
      newStatus = 'in_progress';
    }

    // Update key result
    const updateData: Record<string, unknown> = {
      current_value: newValue,
      progress_percentage: progressPercentage,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (isNowCompleted && !wasCompleted) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedKR, error: updateError } = await supabase
      .from('project_key_results')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating key result:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update parent project progress
    await updateProjectProgress(supabase, keyResult.project_id);

    // Award XP for KR progress
    let gamificationResult = null;
    try {
      const valueImproved = Number(newValue) > previousValue;
      if (valueImproved) {
        gamificationResult = await awardXpV2(userId, 'KEY_RESULT_PROGRESS', {
          milestoneUnlocked: isNowCompleted && !wasCompleted,
          projectId: keyResult.project_id,
        });
      }
    } catch (xpError) {
      console.error('Failed to award XP:', xpError);
    }

    return NextResponse.json({
      log,
      keyResult: updatedKR,
      gamification: gamificationResult,
    });
  } catch (error) {
    console.error('POST /api/project-key-results/[id]/log error:', error);
    return NextResponse.json({ error: 'Failed to log progress' }, { status: 500 });
  }
}

// GET /api/project-key-results/[id]/log - Get progress history
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Verify key result belongs to user
    const { data: keyResult } = await supabase
      .from('project_key_results')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!keyResult) {
      return NextResponse.json({ error: 'Key result not found' }, { status: 404 });
    }

    const { data: logs, error } = await supabase
      .from('project_key_result_logs')
      .select('*')
      .eq('key_result_id', id)
      .order('logged_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('GET /api/project-key-results/[id]/log error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

// Helper function to update project progress
async function updateProjectProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string
) {
  if (!supabase) return;

  const { data: keyResults } = await supabase
    .from('project_key_results')
    .select('progress_percentage, weight')
    .eq('project_id', projectId);

  if (!keyResults || keyResults.length === 0) {
    await supabase
      .from('projects')
      .update({ progress_percentage: 0, updated_at: new Date().toISOString() })
      .eq('id', projectId);
    return;
  }

  const totalWeight = keyResults.reduce((sum, kr) => sum + (Number(kr.weight) || 1), 0);
  const weightedProgress = keyResults.reduce((sum, kr) => {
    const weight = Number(kr.weight) || 1;
    const progress = Number(kr.progress_percentage) || 0;
    return sum + (progress * weight);
  }, 0);

  const progressPercentage = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

  await supabase
    .from('projects')
    .update({ progress_percentage: progressPercentage, updated_at: new Date().toISOString() })
    .eq('id', projectId);
}
