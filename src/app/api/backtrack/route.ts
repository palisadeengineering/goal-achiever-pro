import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    // Fetch all backtrack plans with their associated vision
    const { data: plans, error } = await supabase
      .from('backtrack_plans')
      .select(`
        *,
        visions (
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
          consistency_score,
          color
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching backtrack plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch backtrack plans' },
        { status: 500 }
      );
    }

    return NextResponse.json({ plans: plans || [] });
  } catch (error) {
    console.error('Get backtrack plans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backtrack plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    const body = await request.json();
    const {
      visionId,
      availableHoursPerWeek,
      startDate,
      endDate,
      status = 'draft',
    } = body;

    if (!visionId) {
      return NextResponse.json(
        { error: 'Vision ID is required' },
        { status: 400 }
      );
    }

    if (!availableHoursPerWeek || availableHoursPerWeek <= 0) {
      return NextResponse.json(
        { error: 'Available hours per week must be greater than 0' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Verify the vision belongs to the user
    const { data: vision, error: visionError } = await supabase
      .from('visions')
      .select('id')
      .eq('id', visionId)
      .eq('user_id', userId)
      .single();

    if (visionError || !vision) {
      return NextResponse.json(
        { error: 'Vision not found' },
        { status: 404 }
      );
    }

    // Create the backtrack plan
    const { data: plan, error } = await supabase
      .from('backtrack_plans')
      .insert({
        user_id: userId,
        vision_id: visionId,
        available_hours_per_week: availableHoursPerWeek,
        start_date: startDate,
        end_date: endDate,
        status,
      })
      .select(`
        *,
        visions (
          id,
          title,
          description,
          specific,
          measurable,
          attainable,
          realistic,
          time_bound
        )
      `)
      .single();

    if (error) {
      console.error('Error creating backtrack plan:', error);
      return NextResponse.json(
        { error: 'Failed to create backtrack plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Create backtrack plan error:', error);
    return NextResponse.json(
      { error: 'Failed to create backtrack plan' },
      { status: 500 }
    );
  }
}
