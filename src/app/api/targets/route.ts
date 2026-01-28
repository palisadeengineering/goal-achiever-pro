import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { bulkSaveTargetsSchema, parseWithErrors } from '@/lib/validations';

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
    const validation = parseWithErrors(bulkSaveTargetsSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, validationErrors: validation.errors },
        { status: 400 }
      );
    }

    const { impactProjectId, year, monthlyTargets } = validation.data;

    // Start a transaction-like operation
    const savedTargets = {
      monthlyTargets: [] as { id: string; title: string }[],
      weeklyTargets: [] as { id: string; title: string }[],
      dailyActions: [] as { id: string; title: string }[],
    };

    // Save monthly targets
    for (const monthly of monthlyTargets) {
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_targets')
        .insert({
          user_id: userId,
          power_goal_id: impactProjectId, // DB column unchanged
          title: monthly.title,
          description: monthly.description || null,
          target_month: monthly.month,
          target_year: year,
          key_metric: monthly.keyMetric || null,
          target_value: monthly.targetValue || null,
          status: 'pending',
        })
        .select('id, title')
        .single();

      if (monthlyError) {
        console.error('Error saving monthly target:', monthlyError);
        continue;
      }

      savedTargets.monthlyTargets.push(monthlyData);

      // Save weekly targets for this month
      for (const weekly of monthly.weeklyTargets || []) {
        // Calculate week dates based on month and week number
        const weekDates = getWeekDates(year, monthly.month, weekly.weekNumber);

        const { data: weeklyData, error: weeklyError } = await supabase
          .from('weekly_targets')
          .insert({
            user_id: userId,
            monthly_target_id: monthlyData.id,
            title: weekly.title,
            description: weekly.description || null,
            week_number: weekly.weekNumber,
            week_start_date: weekDates.start,
            week_end_date: weekDates.end,
            key_metric: weekly.keyMetric || null,
            target_value: weekly.targetValue || null,
            status: 'pending',
          })
          .select('id, title')
          .single();

        if (weeklyError) {
          console.error('Error saving weekly target:', weeklyError);
          continue;
        }

        savedTargets.weeklyTargets.push(weeklyData);

        // Save daily actions for this week
        for (let i = 0; i < (weekly.dailyActions || []).length; i++) {
          const daily = weekly.dailyActions[i];
          const actionDate = getActionDate(weekDates.start, daily.dayOfWeek);

          const { data: dailyData, error: dailyError } = await supabase
            .from('daily_actions')
            .insert({
              user_id: userId,
              weekly_target_id: weeklyData.id,
              title: daily.title,
              description: daily.description || null,
              action_date: actionDate,
              estimated_minutes: daily.estimatedMinutes || 30,
              key_metric: daily.keyMetric || null,
              target_value: daily.targetValue || null,
              status: 'pending',
              sort_order: i,
            })
            .select('id, title')
            .single();

          if (dailyError) {
            console.error('Error saving daily action:', dailyError);
            continue;
          }

          savedTargets.dailyActions.push(dailyData);
        }
      }
    }

    return NextResponse.json({
      success: true,
      saved: {
        monthlyTargets: savedTargets.monthlyTargets.length,
        weeklyTargets: savedTargets.weeklyTargets.length,
        dailyActions: savedTargets.dailyActions.length,
      },
    });
  } catch (error) {
    console.error('Save targets error:', error);
    return NextResponse.json(
      { error: 'Failed to save targets' },
      { status: 500 }
    );
  }
}

// Helper function to calculate week dates
function getWeekDates(year: number, month: number, weekNumber: number): { start: string; end: string } {
  // Get the first day of the month
  const firstDay = new Date(year, month - 1, 1);

  // Calculate the start of the week
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);

  // Adjust to Monday if not already
  const dayOfWeek = startDate.getDay();
  if (dayOfWeek !== 1) {
    startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  }

  // End date is 6 days after start (Sunday)
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
}

// Helper function to get action date from week start and day name
function getActionDate(weekStart: string, dayOfWeek: string): string {
  const dayMap: Record<string, number> = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6,
  };

  const startDate = new Date(weekStart);
  startDate.setDate(startDate.getDate() + (dayMap[dayOfWeek] || 0));

  return startDate.toISOString().split('T')[0];
}
