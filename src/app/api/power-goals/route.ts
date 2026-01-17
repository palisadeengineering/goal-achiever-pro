import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import {
  bulkCreatePowerGoalsSchema,
  updatePowerGoalSchema,
  deletePowerGoalSchema,
  parseWithErrors,
} from '@/lib/validations';

export async function GET() {
  try {
    // Authenticate user
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const currentYear = new Date().getFullYear();

    const { data: powerGoals, error } = await supabase
      .from('power_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('year', currentYear)
      .order('quarter', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching power goals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch power goals' },
        { status: 500 }
      );
    }

    return NextResponse.json({ powerGoals: powerGoals || [] });
  } catch (error) {
    console.error('Get power goals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch power goals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = parseWithErrors(bulkCreatePowerGoalsSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, validationErrors: validation.errors },
        { status: 400 }
      );
    }

    const { powerGoals, visionId } = validation.data;

    const currentYear = new Date().getFullYear();
    const savedGoals = [];

    // Get current max sort order for user's goals this year
    const { data: existingGoals } = await supabase
      .from('power_goals')
      .select('sort_order')
      .eq('user_id', userId)
      .eq('year', currentYear)
      .order('sort_order', { ascending: false })
      .limit(1);

    let sortOrder = (existingGoals?.[0]?.sort_order || 0) + 1;

    for (const goal of powerGoals) {
      const { data: savedGoal, error } = await supabase
        .from('power_goals')
        .insert({
          user_id: userId,
          vision_id: visionId || null,
          title: goal.title,
          description: goal.description || null,
          target_date: goal.targetDate || null,
          year: currentYear,
          quarter: goal.quarter,
          category: goal.category || null,
          progress_percentage: 0,
          status: 'active',
          sort_order: sortOrder++,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving power goal:', error);
        continue;
      }

      savedGoals.push(savedGoal);
    }

    return NextResponse.json({
      success: true,
      saved: savedGoals.length,
      powerGoals: savedGoals,
    });
  } catch (error) {
    console.error('Create power goals error:', error);
    return NextResponse.json(
      { error: 'Failed to create power goals' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = parseWithErrors(updatePowerGoalSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, validationErrors: validation.errors },
        { status: 400 }
      );
    }

    const { id, title, description, quarter, category, targetDate, progressPercentage, status } = validation.data;

    const { data: powerGoal, error } = await supabase
      .from('power_goals')
      .update({
        title,
        description: description || null,
        quarter,
        category: category || null,
        target_date: targetDate || null,
        progress_percentage: progressPercentage,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating power goal:', error);
      return NextResponse.json(
        { error: 'Failed to update power goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ powerGoal });
  } catch (error) {
    console.error('Update power goal error:', error);
    return NextResponse.json(
      { error: 'Failed to update power goal' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Validate query params
    const { searchParams } = new URL(request.url);
    const validation = parseWithErrors(deletePowerGoalSchema, {
      id: searchParams.get('id'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, validationErrors: validation.errors },
        { status: 400 }
      );
    }

    const { id } = validation.data;

    const { error } = await supabase
      .from('power_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting power goal:', error);
      return NextResponse.json(
        { error: 'Failed to delete power goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete power goal error:', error);
    return NextResponse.json(
      { error: 'Failed to delete power goal' },
      { status: 500 }
    );
  }
}
