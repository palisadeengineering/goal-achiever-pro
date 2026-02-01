import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET /api/project-key-results/[id] - Get single key result with logs
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

    const { data: keyResult, error } = await supabase
      .from('project_key_results')
      .select(`
        *,
        projects (
          id,
          title,
          color
        ),
        project_key_result_logs (
          id,
          previous_value,
          new_value,
          note,
          source,
          logged_at,
          created_at
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !keyResult) {
      return NextResponse.json({ error: 'Key result not found' }, { status: 404 });
    }

    return NextResponse.json({ keyResult });
  } catch (error) {
    console.error('GET /api/project-key-results/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch key result' }, { status: 500 });
  }
}

// PUT /api/project-key-results/[id] - Update key result
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
      name: 'name',
      description: 'description',
      targetValue: 'target_value',
      currentValue: 'current_value',
      startingValue: 'starting_value',
      unitType: 'unit_type',
      unitLabel: 'unit_label',
      weight: 'weight',
      sortOrder: 'sort_order',
      status: 'status',
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) {
        updateData[snake] = body[camel];
      }
    }

    // Calculate progress if currentValue changed
    if (body.currentValue !== undefined) {
      // Get current KR to calculate progress
      const { data: currentKR } = await supabase
        .from('project_key_results')
        .select('starting_value, target_value')
        .eq('id', id)
        .single();

      if (currentKR) {
        const startVal = Number(currentKR.starting_value) || 0;
        const targetVal = Number(currentKR.target_value);
        const currentVal = Number(body.currentValue);
        const range = targetVal - startVal;

        let progressPercentage = 0;
        if (range !== 0) {
          progressPercentage = Math.round(((currentVal - startVal) / range) * 100);
          progressPercentage = Math.max(0, Math.min(100, progressPercentage));
        }

        updateData.progress_percentage = progressPercentage;

        // Update status based on progress
        if (progressPercentage >= 100) {
          updateData.status = 'completed';
          updateData.completed_at = new Date().toISOString();
        } else if (progressPercentage > 0) {
          // Don't override explicit status, but default to in_progress
          if (!body.status) {
            updateData.status = 'in_progress';
          }
        }
      }
    }

    // Handle explicit completion
    if (body.status === 'completed' && !updateData.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('project_key_results')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating key result:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update parent project progress
    await updateProjectProgress(supabase, data.project_id);

    return NextResponse.json({ keyResult: data });
  } catch (error) {
    console.error('PUT /api/project-key-results/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update key result' }, { status: 500 });
  }
}

// DELETE /api/project-key-results/[id] - Delete key result
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

    // Get project ID before deletion for progress update
    const { data: kr } = await supabase
      .from('project_key_results')
      .select('project_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    const { error } = await supabase
      .from('project_key_results')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting key result:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update parent project progress
    if (kr?.project_id) {
      await updateProjectProgress(supabase, kr.project_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/project-key-results/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete key result' }, { status: 500 });
  }
}

// Helper function to update project progress based on weighted KR average
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

  // Calculate weighted average progress
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
