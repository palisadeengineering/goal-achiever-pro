import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CreateKeyResultInput } from '@/types/team';

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

// GET /api/key-results - List all key results
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);
    const { searchParams } = new URL(request.url);
    const visionId = searchParams.get('visionId');
    const quarter = searchParams.get('quarter');
    const year = searchParams.get('year');
    const assigneeId = searchParams.get('assigneeId');

    let query = adminClient
      .from('key_results')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (visionId) {
      query = query.eq('vision_id', visionId);
    }
    if (quarter && year) {
      query = query.eq('quarter', parseInt(quarter)).eq('year', parseInt(year));
    }
    if (assigneeId) {
      query = query.eq('assignee_id', assigneeId);
    }

    const { data: keyResults, error } = await query;

    if (error) {
      console.error('Error fetching key results:', error);
      return NextResponse.json(
        { error: 'Failed to fetch key results' },
        { status: 500 }
      );
    }

    const transformedResults = (keyResults || []).map(transformKeyResult);
    return NextResponse.json(transformedResults);
  } catch (error) {
    console.error('Error fetching key results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch key results' },
      { status: 500 }
    );
  }
}

// POST /api/key-results - Create a new key result
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);
    const body: CreateKeyResultInput = await request.json();

    if (!body.visionId || !body.title || !body.targetValue || !body.unit) {
      return NextResponse.json(
        { error: 'visionId, title, targetValue, and unit are required' },
        { status: 400 }
      );
    }

    // Calculate initial progress percentage
    const startValue = body.startValue || 0;
    const progressPercentage = body.targetValue > startValue
      ? Math.round(((0 - startValue) / (body.targetValue - startValue)) * 100)
      : 0;

    const { data: keyResult, error } = await adminClient
      .from('key_results')
      .insert({
        user_id: userId,
        vision_id: body.visionId,
        power_goal_id: body.powerGoalId || null,
        title: body.title,
        description: body.description || null,
        target_value: body.targetValue,
        current_value: 0,
        start_value: startValue,
        unit: body.unit,
        assignee_id: body.assigneeId || null,
        assignee_name: body.assigneeName || null,
        quarter: body.quarter || null,
        year: body.year || null,
        due_date: body.dueDate || null,
        status: 'on_track',
        progress_percentage: Math.max(0, progressPercentage),
        confidence_level: 70,
        success_criteria: body.successCriteria || null,
        notes: body.notes || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating key result:', error);
      return NextResponse.json(
        { error: 'Failed to create key result' },
        { status: 500 }
      );
    }

    return NextResponse.json(transformKeyResult(keyResult), { status: 201 });
  } catch (error) {
    console.error('Error creating key result:', error);
    return NextResponse.json(
      { error: 'Failed to create key result' },
      { status: 500 }
    );
  }
}
