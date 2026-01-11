import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// Default routines based on Dan Martell's framework
const DEFAULT_ROUTINES = [
  {
    name: 'Morning Routine',
    type: 'morning',
    description: 'Start your day with intention and clarity',
    steps: [
      { title: 'Wake up & hydrate', durationMinutes: 5, sortOrder: 0 },
      { title: 'Visualize your vision & goals', durationMinutes: 10, sortOrder: 1 },
      { title: 'Review your MINS for today', durationMinutes: 5, sortOrder: 2 },
      { title: 'Exercise or movement', durationMinutes: 30, sortOrder: 3 },
      { title: 'Healthy breakfast', durationMinutes: 15, sortOrder: 4 },
      { title: 'Start first Pomodoro on #1 priority', durationMinutes: 25, sortOrder: 5 },
    ],
  },
  {
    name: 'Evening Routine',
    type: 'evening',
    description: 'Wind down and prepare for tomorrow',
    steps: [
      { title: 'Review today\'s accomplishments', durationMinutes: 10, sortOrder: 0 },
      { title: 'Log time blocks & DRIP categories', durationMinutes: 10, sortOrder: 1 },
      { title: 'Set MINS for tomorrow', durationMinutes: 10, sortOrder: 2 },
      { title: 'Gratitude journaling (3 things)', durationMinutes: 5, sortOrder: 3 },
      { title: 'Screen-free wind down', durationMinutes: 30, sortOrder: 4 },
      { title: 'Sleep by target bedtime', durationMinutes: 0, sortOrder: 5 },
    ],
  },
];

// GET - Fetch all routines with steps for user
export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);

    // Fetch routines with steps
    const { data: routines, error } = await supabase
      .from('routines')
      .select(`
        id,
        name,
        type,
        description,
        target_duration_minutes,
        is_active,
        sort_order,
        created_at,
        routine_steps (
          id,
          title,
          description,
          duration_minutes,
          sort_order,
          is_optional
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching routines:', error);
      return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 });
    }

    // If no routines exist, create default ones for the user
    if (!routines || routines.length === 0) {
      const createdRoutines = [];

      for (const defaultRoutine of DEFAULT_ROUTINES) {
        // Create the routine
        const { data: routine, error: routineError } = await supabase
          .from('routines')
          .insert({
            user_id: userId,
            name: defaultRoutine.name,
            type: defaultRoutine.type,
            description: defaultRoutine.description,
            is_active: true,
            sort_order: defaultRoutine.type === 'morning' ? 0 : 1,
          })
          .select()
          .single();

        if (routineError || !routine) {
          console.error('Error creating default routine:', routineError);
          continue;
        }

        // Create steps for the routine
        const stepsToInsert = defaultRoutine.steps.map(step => ({
          routine_id: routine.id,
          title: step.title,
          duration_minutes: step.durationMinutes,
          sort_order: step.sortOrder,
          is_optional: false,
        }));

        const { data: steps, error: stepsError } = await supabase
          .from('routine_steps')
          .insert(stepsToInsert)
          .select();

        if (stepsError) {
          console.error('Error creating routine steps:', stepsError);
        }

        createdRoutines.push({
          ...routine,
          routine_steps: steps || [],
        });
      }

      // Transform and return the created routines
      const transformedRoutines = createdRoutines.map(routine => ({
        id: routine.id,
        name: routine.name,
        type: routine.type as 'morning' | 'evening' | 'custom',
        description: routine.description || '',
        isActive: routine.is_active,
        steps: (routine.routine_steps || [])
          .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
          .map((step: { id: string; title: string; duration_minutes: number }) => ({
            id: step.id,
            title: step.title,
            durationMinutes: step.duration_minutes,
            completed: false,
          })),
      }));

      return NextResponse.json(transformedRoutines);
    }

    // Transform to match frontend interface
    const transformedRoutines = routines.map(routine => ({
      id: routine.id,
      name: routine.name,
      type: routine.type as 'morning' | 'evening' | 'custom',
      description: routine.description || '',
      isActive: routine.is_active,
      steps: (routine.routine_steps || [])
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((step: { id: string; title: string; duration_minutes: number }) => ({
          id: step.id,
          title: step.title,
          durationMinutes: step.duration_minutes,
          completed: false, // Completion state comes from completions endpoint
        })),
    }));

    return NextResponse.json(transformedRoutines);
  } catch (error) {
    console.error('Error fetching routines:', error);
    return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 });
  }
}

// POST - Create a new routine
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const body = await request.json();

    const {
      name,
      type,
      description,
      steps,
    } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // Get the highest sort order
    const { data: existingRoutines } = await supabase
      .from('routines')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = existingRoutines && existingRoutines.length > 0
      ? (existingRoutines[0].sort_order || 0) + 1
      : 0;

    // Create the routine
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .insert({
        user_id: userId,
        name,
        type,
        description: description || '',
        is_active: true,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (routineError || !routine) {
      console.error('Error creating routine:', routineError);
      return NextResponse.json({ error: 'Failed to create routine' }, { status: 500 });
    }

    // Create steps if provided
    let createdSteps: Array<{ id: string; title: string; duration_minutes: number; sort_order: number }> = [];
    if (steps && Array.isArray(steps) && steps.length > 0) {
      const stepsToInsert = steps.map((step: { title: string; durationMinutes?: number }, index: number) => ({
        routine_id: routine.id,
        title: step.title,
        duration_minutes: step.durationMinutes || 5,
        sort_order: index,
        is_optional: false,
      }));

      const { data: stepsData, error: stepsError } = await supabase
        .from('routine_steps')
        .insert(stepsToInsert)
        .select();

      if (stepsError) {
        console.error('Error creating routine steps:', stepsError);
      } else {
        createdSteps = stepsData || [];
      }
    }

    // Return transformed routine
    return NextResponse.json({
      id: routine.id,
      name: routine.name,
      type: routine.type,
      description: routine.description || '',
      isActive: routine.is_active,
      steps: createdSteps
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(step => ({
          id: step.id,
          title: step.title,
          durationMinutes: step.duration_minutes,
          completed: false,
        })),
    });
  } catch (error) {
    console.error('Error creating routine:', error);
    return NextResponse.json({ error: 'Failed to create routine' }, { status: 500 });
  }
}
