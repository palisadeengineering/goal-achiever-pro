import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UpdateKeyResultInput } from '@/types/team';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// Transform snake_case to camelCase
function transformKeyResult(kr: Record<string, unknown>) {
  return {
    id: kr.id,
    userId: kr.user_id,
    visionId: kr.vision_id,
    powerGoalId: kr.power_goal_id,
    title: kr.title,
    description: kr.description,
    targetValue: Number(kr.target_value),
    currentValue: Number(kr.current_value),
    startValue: Number(kr.start_value),
    unit: kr.unit,
    assigneeId: kr.assignee_id,
    assigneeName: kr.assignee_name,
    quarter: kr.quarter,
    year: kr.year,
    dueDate: kr.due_date,
    status: kr.status,
    progressPercentage: kr.progress_percentage,
    confidenceLevel: kr.confidence_level,
    successCriteria: kr.success_criteria,
    notes: kr.notes,
    isActive: kr.is_active,
    createdAt: kr.created_at,
    updatedAt: kr.updated_at,
  };
}

function transformUpdate(update: Record<string, unknown>) {
  return {
    id: update.id,
    keyResultId: update.key_result_id,
    previousValue: update.previous_value ? Number(update.previous_value) : null,
    newValue: Number(update.new_value),
    previousStatus: update.previous_status,
    newStatus: update.new_status,
    notes: update.notes,
    updatedBy: update.updated_by,
    updatedByName: update.updated_by_name,
    createdAt: update.created_at,
  };
}

// GET /api/key-results/[id] - Get a single key result with updates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const { id } = await params;

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    // Get the key result
    const { data: keyResult, error: krError } = await adminClient
      .from('key_results')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (krError || !keyResult) {
      return NextResponse.json(
        { error: 'Key result not found' },
        { status: 404 }
      );
    }

    // Get updates history
    const { data: updates } = await adminClient
      .from('key_result_updates')
      .select('*')
      .eq('key_result_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      ...transformKeyResult(keyResult),
      updates: (updates || []).map(transformUpdate),
    });
  } catch (error) {
    console.error('Error fetching key result:', error);
    return NextResponse.json(
      { error: 'Failed to fetch key result' },
      { status: 500 }
    );
  }
}

// PUT /api/key-results/[id] - Update a key result
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const { id } = await params;

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);
    const body: UpdateKeyResultInput & { updateNotes?: string } = await request.json();

    // Get current values for history
    const { data: current, error: currentError } = await adminClient
      .from('key_results')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (currentError || !current) {
      return NextResponse.json(
        { error: 'Key result not found' },
        { status: 404 }
      );
    }

    // Get user profile for update record
    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    // Build update object with snake_case keys
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.targetValue !== undefined) updateData.target_value = body.targetValue;
    if (body.currentValue !== undefined) updateData.current_value = body.currentValue;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.assigneeId !== undefined) updateData.assignee_id = body.assigneeId;
    if (body.assigneeName !== undefined) updateData.assignee_name = body.assigneeName;
    if (body.quarter !== undefined) updateData.quarter = body.quarter;
    if (body.year !== undefined) updateData.year = body.year;
    if (body.dueDate !== undefined) updateData.due_date = body.dueDate;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.confidenceLevel !== undefined) updateData.confidence_level = body.confidenceLevel;
    if (body.successCriteria !== undefined) updateData.success_criteria = body.successCriteria;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;

    // Recalculate progress if currentValue or targetValue changed
    if (body.currentValue !== undefined || body.targetValue !== undefined) {
      const newCurrentValue = body.currentValue ?? Number(current.current_value);
      const newTargetValue = body.targetValue ?? Number(current.target_value);
      const startValue = Number(current.start_value);

      if (newTargetValue > startValue) {
        updateData.progress_percentage = Math.min(100, Math.max(0,
          Math.round(((newCurrentValue - startValue) / (newTargetValue - startValue)) * 100)
        ));
      }
    }

    const { data: keyResult, error: updateError } = await adminClient
      .from('key_results')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError || !keyResult) {
      console.error('Error updating key result:', updateError);
      return NextResponse.json(
        { error: 'Failed to update key result' },
        { status: 500 }
      );
    }

    // Create update record if value or status changed
    if (body.currentValue !== undefined || body.status !== undefined) {
      await adminClient.from('key_result_updates').insert({
        key_result_id: id,
        previous_value: current.current_value,
        new_value: body.currentValue ?? current.current_value,
        previous_status: current.status,
        new_status: body.status ?? current.status,
        notes: body.updateNotes || null,
        updated_by: userId,
        updated_by_name: profile?.full_name || profile?.email || 'Unknown',
      });
    }

    return NextResponse.json(transformKeyResult(keyResult));
  } catch (error) {
    console.error('Error updating key result:', error);
    return NextResponse.json(
      { error: 'Failed to update key result' },
      { status: 500 }
    );
  }
}

// DELETE /api/key-results/[id] - Soft delete a key result
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const { id } = await params;

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    const { error } = await adminClient
      .from('key_results')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json(
        { error: 'Key result not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting key result:', error);
    return NextResponse.json(
      { error: 'Failed to delete key result' },
      { status: 500 }
    );
  }
}
