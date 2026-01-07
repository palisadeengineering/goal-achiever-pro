import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { logAIUsage } from '@/lib/utils/ai-usage';

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
  const startTime = Date.now();
  let userId = DEMO_USER_ID;

  try {
    // Get user ID early for logging
    const supabase = await createClient();
    userId = await getUserId(supabase);

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

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
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
    const numQuarters = Math.min(totalQuarters, 4);
    const hoursPerQuarter = Math.round(totalHours / numQuarters);
    const hoursPerPowerGoal = Math.round(totalHours / Math.min(numQuarters * 3, 12));
    const dailyMinutes = Math.round(availableHoursPerWeek / 5 * 60);
    const targetDailyActions = Math.min(totalWeeks * 3, 50);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `You are an expert goal-setting and accountability coach using Dan Martell's "Buy Back Your Time" methodology. Create a comprehensive BACKTRACK PLAN.

## BACKTRACKING PLANNING METHOD
Start with the END VISION, then work BACKWARDS to determine what must be accomplished at each level:
Vision → Quarterly Targets → Power Goals → Monthly Targets → Weekly Targets → Daily Actions

## INPUT DATA

**VISION:** "${vision}"

**SMART GOALS:**
- Specific: ${smartGoals?.specific || 'Not specified'}
- Measurable: ${smartGoals?.measurable || 'Not specified'}
- Attainable: ${smartGoals?.attainable || 'Not specified'}
- Realistic: ${smartGoals?.realistic || 'Not specified'}

**TIME CONSTRAINTS:**
- Start Date: ${startDate}
- Target Date: ${targetDate}
- Total Weeks Available: ${totalWeeks}
- Hours Per Week: ${availableHoursPerWeek}
- Total Hours: ${totalHours}
- Number of Quarters: ${numQuarters}

## GENERATION REQUIREMENTS

1. **Quarterly Targets** (${numQuarters} targets):
   - Each with clear theme, metric, and target value
   - Estimated hours: ~${hoursPerQuarter} hours each

2. **Power Goals** (${Math.min(numQuarters * 3, 12)} goals, ~3 per quarter):
   - Specific project-based goals
   - Category: business, career, health, wealth, relationships, or personal
   - Estimated hours: ~${hoursPerPowerGoal} hours each

3. **Monthly Targets** (at least ${Math.min(totalMonths, 6)} targets):
   - Link each to a power goal via powerGoalIndex (0-based)
   - Clear monthly outcomes

4. **Weekly Targets** (at least ${Math.min(totalWeeks, 8)} targets):
   - Link each to a monthly target via monthlyTargetIndex (0-based)
   - Specific weekly focus

5. **Daily Actions** (at least ${targetDailyActions} actions for first ${Math.min(totalWeeks, 8)} weeks):
   - CRITICAL: Make each action SPECIFIC and ACTIONABLE
   - Good: "Write 500 words for blog post on productivity"
   - Bad: "Work on content"
   - dayOfWeek: 1=Monday through 5=Friday
   - estimatedMinutes: 15-60 minutes each
   - Link to weekly target via weeklyTargetIndex (0-based)
   - Total daily minutes should be ~${dailyMinutes} per day

## OUTPUT FORMAT

Return ONLY valid JSON with this exact structure:
{
  "summary": "2-3 sentence overview of the plan strategy",
  "criticalPath": ["Milestone 1", "Milestone 2", "Milestone 3", "Milestone 4"],
  "quarterlyTargets": [
    {
      "quarter": 1,
      "title": "Q1: [Theme]",
      "description": "What success looks like",
      "keyMetric": "Primary metric name",
      "targetValue": 100,
      "estimatedHours": ${hoursPerQuarter}
    }
  ],
  "powerGoals": [
    {
      "title": "Specific Goal Title",
      "description": "Clear deliverable",
      "quarter": 1,
      "category": "business",
      "estimatedHours": ${hoursPerPowerGoal},
      "milestones": ["Milestone 1", "Milestone 2"]
    }
  ],
  "monthlyTargets": [
    {
      "month": 1,
      "title": "Month 1: [Focus]",
      "description": "Monthly outcome",
      "keyMetric": "Metric name",
      "targetValue": 25,
      "powerGoalIndex": 0
    }
  ],
  "weeklyTargets": [
    {
      "weekNumber": 1,
      "month": 1,
      "title": "Week 1: [Focus]",
      "description": "Weekly deliverable",
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
      "title": "Specific action with measurable outcome",
      "description": "Context or instructions",
      "estimatedMinutes": 45,
      "keyMetric": "action_metric",
      "targetValue": 1,
      "weeklyTargetIndex": 0
    }
  ]
}

IMPORTANT RULES:
- Index references (powerGoalIndex, monthlyTargetIndex, weeklyTargetIndex) must be valid 0-based indices
- Distribute daily actions evenly across weekdays (Mon-Fri)
- Make EVERY daily action specific and measurable
- Total hours must fit within the ${totalHours} hour budget`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const responseTimeMs = Date.now() - startTime;

    // Log AI usage
    logAIUsage({
      userId,
      endpoint: '/api/ai/generate-backtrack',
      model: 'claude-opus-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'generate-backtrack',
      success: true,
      responseTimeMs,
    });

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let plan: BacktrackPlanResponse;
    try {
      let jsonText = responseText;

      // Try to extract JSON if wrapped in code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else {
        // Try to find JSON object by looking for first { and last }
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonText = responseText.substring(firstBrace, lastBrace + 1);
        }
      }

      // Clean up any potential issues
      jsonText = jsonText.trim();

      plan = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText.substring(0, 500));
      console.error('Parse error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // If saveToDatabase is true, save everything to the database
    if (saveToDatabase && visionId) {
      if (!supabase) {
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        );
      }

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
    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/generate-backtrack',
      model: 'claude-opus-4-20250514',
      promptTokens: 0,
      completionTokens: 0,
      requestType: 'generate-backtrack',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs,
    });

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
