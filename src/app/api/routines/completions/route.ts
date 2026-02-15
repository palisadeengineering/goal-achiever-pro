import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { validateDateParam } from '@/lib/validations/common';
import { format } from 'date-fns';

// GET - Fetch completions for a date or date range
export async function GET(request: NextRequest) {
  try {
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
    const date = validateDateParam(searchParams.get('date')) || format(new Date(), 'yyyy-MM-dd');
    const routineId = searchParams.get('routineId');
    const startDate = validateDateParam(searchParams.get('startDate'));
    const endDate = validateDateParam(searchParams.get('endDate'));

    let query = supabase
      .from('routine_completions')
      .select('*')
      .eq('user_id', userId);

    if (routineId) {
      query = query.eq('routine_id', routineId);
    }

    if (startDate && endDate) {
      query = query.gte('completion_date', startDate).lte('completion_date', endDate);
    } else {
      query = query.eq('completion_date', date);
    }

    const { data: completions, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching completions:', error);
      return NextResponse.json({ error: 'Failed to fetch completions' }, { status: 500 });
    }

    // Transform to frontend format
    const transformedCompletions = completions?.map(completion => ({
      id: completion.id,
      routineId: completion.routine_id,
      date: completion.completion_date,
      stepsCompleted: completion.steps_completed || [],
      completionPercentage: completion.completion_percentage || 0,
      startedAt: completion.started_at,
      completedAt: completion.completed_at,
      notes: completion.notes,
    })) || [];

    return NextResponse.json(transformedCompletions);
  } catch (error) {
    console.error('Error fetching completions:', error);
    return NextResponse.json({ error: 'Failed to fetch completions' }, { status: 500 });
  }
}

// POST - Create or update a completion (toggle step completion)
export async function POST(request: NextRequest) {
  try {
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

    const {
      routineId,
      date,
      stepId,
      completed,
      stepsCompleted, // Alternative: pass full array of completed step IDs
      totalSteps,
    } = body;

    // Validate required fields
    if (!routineId || !date) {
      return NextResponse.json(
        { error: 'routineId and date are required' },
        { status: 400 }
      );
    }

    // Check if completion record exists for this routine/date
    const { data: existing, error: fetchError } = await supabase
      .from('routine_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('routine_id', routineId)
      .eq('completion_date', date)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing completion:', fetchError);
    }

    let updatedStepsCompleted: string[];

    if (stepsCompleted !== undefined) {
      // Full array provided
      updatedStepsCompleted = stepsCompleted;
    } else if (stepId !== undefined) {
      // Toggle a single step
      const currentSteps = (existing?.steps_completed as string[]) || [];
      if (completed) {
        updatedStepsCompleted = [...currentSteps, stepId].filter((v, i, a) => a.indexOf(v) === i);
      } else {
        updatedStepsCompleted = currentSteps.filter(id => id !== stepId);
      }
    } else {
      return NextResponse.json(
        { error: 'Either stepId or stepsCompleted is required' },
        { status: 400 }
      );
    }

    // Calculate completion percentage
    const completionPercentage = totalSteps > 0
      ? Math.round((updatedStepsCompleted.length / totalSteps) * 100)
      : 0;

    const completionData = {
      user_id: userId,
      routine_id: routineId,
      completion_date: date,
      steps_completed: updatedStepsCompleted,
      completion_percentage: completionPercentage,
      started_at: existing?.started_at || new Date().toISOString(),
      completed_at: completionPercentage === 100 ? new Date().toISOString() : null,
    };

    if (existing) {
      // Update existing completion
      const { data: updated, error: updateError } = await supabase
        .from('routine_completions')
        .update({
          steps_completed: completionData.steps_completed,
          completion_percentage: completionData.completion_percentage,
          completed_at: completionData.completed_at,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating completion:', updateError);
        return NextResponse.json({ error: 'Failed to update completion' }, { status: 500 });
      }

      return NextResponse.json({
        id: updated.id,
        routineId: updated.routine_id,
        date: updated.completion_date,
        stepsCompleted: updated.steps_completed || [],
        completionPercentage: updated.completion_percentage || 0,
        startedAt: updated.started_at,
        completedAt: updated.completed_at,
        notes: updated.notes,
      });
    } else {
      // Create new completion
      const { data: created, error: insertError } = await supabase
        .from('routine_completions')
        .insert(completionData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating completion:', insertError);
        return NextResponse.json({ error: 'Failed to create completion' }, { status: 500 });
      }

      return NextResponse.json({
        id: created.id,
        routineId: created.routine_id,
        date: created.completion_date,
        stepsCompleted: created.steps_completed || [],
        completionPercentage: created.completion_percentage || 0,
        startedAt: created.started_at,
        completedAt: created.completed_at,
        notes: created.notes,
      });
    }
  } catch (error) {
    console.error('Error saving completion:', error);
    return NextResponse.json({ error: 'Failed to save completion' }, { status: 500 });
  }
}
