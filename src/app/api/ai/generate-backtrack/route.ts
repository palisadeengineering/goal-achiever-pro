import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

interface QuarterlyTarget {
  quarter: number;
  title: string;
  description: string;
  keyMetric: string;
  targetValue: number;
  estimatedHours: number;
}

interface PowerGoal {
  title: string;
  description: string;
  quarter: number;
  category: string;
  estimatedHours: number;
  milestones: string[];
}

interface MonthlyTarget {
  month: number;
  title: string;
  description: string;
  keyMetric: string;
  targetValue: number;
  powerGoalIndex: number;
}

interface WeeklyTarget {
  weekNumber: number;
  month: number;
  title: string;
  description: string;
  keyMetric: string;
  targetValue: number;
  monthlyTargetIndex: number;
}

interface DailyAction {
  dayOfWeek: number;
  weekNumber: number;
  month: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  keyMetric: string;
  targetValue: number;
  weeklyTargetIndex: number;
}

interface BacktrackPlanResponse {
  summary: string;
  criticalPath: string[];
  quarterlyTargets: QuarterlyTarget[];
  powerGoals: PowerGoal[];
  monthlyTargets: MonthlyTarget[];
  weeklyTargets: WeeklyTarget[];
  dailyActions: DailyAction[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      visionId,
      vision,
      smartGoals,
      targetDate,
      startDate,
      availableHoursPerWeek,
      saveToDatabase = false,
    } = body;

    if (!vision) {
      return NextResponse.json(
        { error: 'Vision statement is required' },
        { status: 400 }
      );
    }

    if (!targetDate || !startDate) {
      return NextResponse.json(
        { error: 'Start date and target date are required' },
        { status: 400 }
      );
    }

    if (!availableHoursPerWeek || availableHoursPerWeek <= 0) {
      return NextResponse.json(
        { error: 'Available hours per week must be greater than 0' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Calculate time available
    const start = new Date(startDate);
    const end = new Date(targetDate);
    const totalWeeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const totalHours = totalWeeks * availableHoursPerWeek;
    const totalMonths = Math.ceil(totalWeeks / 4);
    const totalQuarters = Math.ceil(totalMonths / 3);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are an expert goal-setting and accountability coach using Dan Martell's "Buy Back Your Time" methodology and backtracking planning technique.

BACKTRACKING PLANNING: Start with the end vision, then work backwards to determine what must be accomplished quarterly, monthly, weekly, and daily to achieve it.

VISION: "${vision}"

SMART GOALS:
- Specific: ${smartGoals?.specific || 'Not provided'}
- Measurable: ${smartGoals?.measurable || 'Not provided'}
- Attainable: ${smartGoals?.attainable || 'Not provided'}
- Realistic: ${smartGoals?.realistic || 'Not provided'}

TIME CONSTRAINTS:
- Start Date: ${startDate}
- Target Date: ${targetDate}
- Total Weeks: ${totalWeeks}
- Available Hours Per Week: ${availableHoursPerWeek}
- Total Available Hours: ${totalHours}
- Total Months: ${totalMonths}
- Total Quarters: ${Math.min(totalQuarters, 4)}

REQUIREMENTS:
1. Generate a COMPLETE backtrack plan that cascades from Vision → Quarterly → Monthly → Weekly → Daily
2. Make every task SPECIFIC and ACTIONABLE (e.g., "Write 500 words for blog post" not "Work on content")
3. Ensure hours allocated match the available time budget
4. Each daily action should take 15-60 minutes and be completable in one sitting
5. Focus on the 20% of activities that drive 80% of results (Pareto principle)
6. Include measurable metrics at each level

Generate ${Math.min(totalQuarters, 4)} quarterly targets, 3 power goals per quarter (max 12 total), monthly targets, weekly targets, and specific daily actions.

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief overview of the plan strategy (2-3 sentences)",
  "criticalPath": ["List of 3-5 must-achieve milestones in order"],
  "quarterlyTargets": [
    {
      "quarter": 1,
      "title": "Q1 Focus Theme",
      "description": "What success looks like this quarter",
      "keyMetric": "Primary metric to track",
      "targetValue": 100,
      "estimatedHours": ${Math.round(totalHours / Math.min(totalQuarters, 4))}
    }
  ],
  "powerGoals": [
    {
      "title": "Specific Power Goal Title",
      "description": "Clear description of what will be accomplished",
      "quarter": 1,
      "category": "business|career|health|wealth|relationships|personal",
      "estimatedHours": ${Math.round(totalHours / 12)},
      "milestones": ["Key milestone 1", "Key milestone 2"]
    }
  ],
  "monthlyTargets": [
    {
      "month": 1,
      "title": "Month 1 Target Title",
      "description": "Specific outcome for this month",
      "keyMetric": "What to measure",
      "targetValue": 25,
      "powerGoalIndex": 0
    }
  ],
  "weeklyTargets": [
    {
      "weekNumber": 1,
      "month": 1,
      "title": "Week 1 Focus",
      "description": "What must be done this week",
      "keyMetric": "Weekly metric",
      "targetValue": 5,
      "monthlyTargetIndex": 0
    }
  ],
  "dailyActions": [
    {
      "dayOfWeek": 1,
      "weekNumber": 1,
      "month": 1,
      "title": "Specific action (e.g., 'Write 500 words for blog post')",
      "description": "Brief context or instructions",
      "estimatedMinutes": 45,
      "keyMetric": "words_written",
      "targetValue": 500,
      "weeklyTargetIndex": 0
    }
  ]
}

IMPORTANT:
- dayOfWeek: 1=Monday through 5=Friday (no weekends unless explicitly needed)
- Distribute daily actions evenly across the week
- Each day should have 2-4 actions totaling roughly ${Math.round(availableHoursPerWeek / 5 * 60)} minutes
- Generate at least ${Math.min(totalWeeks * 3, 50)} daily actions for the first ${Math.min(totalWeeks, 8)} weeks
- Make actions SPECIFIC: "Call 5 potential clients" not "Do outreach"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert goal-setting coach specializing in Dan Martell\'s "Buy Back Your Time" methodology. Create specific, actionable backtrack plans. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let plan: BacktrackPlanResponse;
    try {
      // Try to extract JSON if wrapped in code blocks
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      plan = JSON.parse(jsonText);
    } catch {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // If saveToDatabase is true, save everything to the database
    if (saveToDatabase && visionId) {
      const supabase = await createClient();
      if (!supabase) {
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        );
      }

      const userId = await getUserId(supabase);

      // Create backtrack plan record
      const { data: backtrackPlan, error: planError } = await supabase
        .from('backtrack_plans')
        .insert({
          user_id: userId,
          vision_id: visionId,
          available_hours_per_week: availableHoursPerWeek,
          start_date: startDate,
          end_date: targetDate,
          status: 'active',
          ai_generated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (planError) {
        console.error('Error creating backtrack plan:', planError);
        return NextResponse.json(
          { error: 'Failed to save backtrack plan' },
          { status: 500 }
        );
      }

      const backtrackPlanId = backtrackPlan.id;
      const currentYear = new Date().getFullYear();

      // Save quarterly targets
      const quarterlyInserts = plan.quarterlyTargets.map(qt => ({
        user_id: userId,
        vision_id: visionId,
        backtrack_plan_id: backtrackPlanId,
        quarter: qt.quarter,
        year: currentYear,
        title: qt.title,
        description: qt.description,
        key_metric: qt.keyMetric,
        target_value: qt.targetValue,
        estimated_hours_total: qt.estimatedHours,
        status: 'pending',
      }));

      const { data: quarterlyTargets, error: qtError } = await supabase
        .from('quarterly_targets')
        .insert(quarterlyInserts)
        .select();

      if (qtError) {
        console.error('Error saving quarterly targets:', qtError);
      }

      // Save power goals
      const powerGoalInserts = plan.powerGoals.map((pg, index) => ({
        user_id: userId,
        vision_id: visionId,
        backtrack_plan_id: backtrackPlanId,
        quarterly_target_id: quarterlyTargets?.[Math.floor(index / 3)]?.id || null,
        title: pg.title,
        description: pg.description,
        year: currentYear,
        quarter: pg.quarter,
        category: pg.category,
        estimated_hours: pg.estimatedHours,
        sort_order: index,
        status: 'active',
      }));

      const { data: powerGoals, error: pgError } = await supabase
        .from('power_goals')
        .insert(powerGoalInserts)
        .select();

      if (pgError) {
        console.error('Error saving power goals:', pgError);
      }

      // Save monthly targets
      const monthlyInserts = plan.monthlyTargets.map((mt, index) => ({
        user_id: userId,
        power_goal_id: powerGoals?.[mt.powerGoalIndex]?.id || powerGoals?.[0]?.id,
        quarterly_target_id: quarterlyTargets?.[Math.floor((mt.month - 1) / 3)]?.id || null,
        title: mt.title,
        description: mt.description,
        target_month: mt.month,
        target_year: currentYear,
        key_metric: mt.keyMetric,
        target_value: mt.targetValue,
        status: 'pending',
        sort_order: index,
      }));

      const { data: monthlyTargets, error: mtError } = await supabase
        .from('monthly_targets')
        .insert(monthlyInserts)
        .select();

      if (mtError) {
        console.error('Error saving monthly targets:', mtError);
      }

      // Save weekly targets
      const weeklyInserts = plan.weeklyTargets.map((wt, index) => {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + (wt.weekNumber - 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        return {
          user_id: userId,
          monthly_target_id: monthlyTargets?.[wt.monthlyTargetIndex]?.id || monthlyTargets?.[0]?.id,
          title: wt.title,
          description: wt.description,
          week_number: wt.weekNumber,
          week_start_date: weekStart.toISOString().split('T')[0],
          week_end_date: weekEnd.toISOString().split('T')[0],
          key_metric: wt.keyMetric,
          target_value: wt.targetValue,
          status: 'pending',
          sort_order: index,
        };
      });

      const { data: weeklyTargets, error: wtError } = await supabase
        .from('weekly_targets')
        .insert(weeklyInserts)
        .select();

      if (wtError) {
        console.error('Error saving weekly targets:', wtError);
      }

      // Save daily actions
      const dailyInserts = plan.dailyActions.map((da, index) => {
        const actionDate = new Date(startDate);
        actionDate.setDate(actionDate.getDate() + (da.weekNumber - 1) * 7 + (da.dayOfWeek - 1));

        return {
          user_id: userId,
          weekly_target_id: weeklyTargets?.[da.weeklyTargetIndex]?.id || weeklyTargets?.[0]?.id,
          title: da.title,
          description: da.description,
          action_date: actionDate.toISOString().split('T')[0],
          estimated_minutes: da.estimatedMinutes,
          key_metric: da.keyMetric,
          target_value: da.targetValue,
          status: 'pending',
          sort_order: index,
        };
      });

      const { error: daError } = await supabase
        .from('daily_actions')
        .insert(dailyInserts);

      if (daError) {
        console.error('Error saving daily actions:', daError);
      }

      return NextResponse.json({
        ...plan,
        backtrackPlanId,
        saved: true,
        totalWeeks,
        totalHours,
      });
    }

    return NextResponse.json({
      ...plan,
      saved: false,
      totalWeeks,
      totalHours,
    });
  } catch (error) {
    console.error('AI Backtrack Generation Error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate backtrack plan' },
      { status: 500 }
    );
  }
}
