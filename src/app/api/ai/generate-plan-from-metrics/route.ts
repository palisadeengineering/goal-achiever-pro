import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { logAIUsage } from '@/lib/utils/ai-usage';
import {
  applyMultipleRateLimits,
  rateLimitExceededResponse,
  rateLimitHeaders,
  RateLimits,
} from '@/lib/rate-limit';

interface MetricAnswer {
  questionId: string;
  question: string;
  answer: string | number;
  type: 'number' | 'text' | 'currency' | 'percentage' | 'time';
  category: 'outcome' | 'activity';
  unit?: string;
}

interface GeneratedKpi {
  title: string;
  description: string;
  currentValue: string;
  targetValue: string;
  unit: string;
  whyItMatters: string;
}

interface GeneratedQuarterlyTarget {
  quarter: number;
  title: string;
  description: string;
  kpi: GeneratedKpi;
  monthlyTargets: GeneratedMonthlyTarget[];
}

interface GeneratedMonthlyTarget {
  month: number;
  monthName: string;
  title: string;
  description: string;
  kpi: GeneratedKpi;
  weeklyTargets: GeneratedWeeklyTarget[];
}

interface GeneratedWeeklyTarget {
  weekNumber: number;
  title: string;
  description: string;
  kpis: GeneratedKpi[];
  dailyActions: GeneratedDailyAction[];
}

interface GeneratedDailyAction {
  title: string;
  description: string;
  bestTime: 'morning' | 'afternoon' | 'evening';
  timeRequired: string;
  whyItMatters: string;
}

interface GeneratedPlan {
  quarterlyTargets: GeneratedQuarterlyTarget[];
  dailyHabits: GeneratedDailyAction[];
  smartSummary: {
    specific: string;
    measurable: string;
    attainable: string;
    realistic: string;
    timeBound: string;
  };
  suggestedAffirmation: string;
  successFormula: string;
  totalEstimatedHours: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;
  let rateLimitResult: ReturnType<typeof applyMultipleRateLimits> | null = null;

  try {
    // Authenticate user
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    userId = auth.userId;

    // Apply rate limiting (heavy operation)
    rateLimitResult = applyMultipleRateLimits(userId, [
      RateLimits.ai.heavy,
      RateLimits.ai.daily,
    ]);

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const { vision, metrics, targetDate, visionId } = await request.json();

    if (!vision || typeof vision !== 'string') {
      return NextResponse.json(
        { error: 'Vision description is required' },
        { status: 400 }
      );
    }

    if (!metrics || !Array.isArray(metrics) || metrics.length < 3) {
      return NextResponse.json(
        { error: 'At least 3 metric answers are required' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Format metrics for the prompt
    const outcomeMetrics = (metrics as MetricAnswer[])
      .filter(m => m.category === 'outcome')
      .map(m => `- ${m.question}: ${m.answer}${m.unit ? ` ${m.unit}` : ''}`)
      .join('\n');

    const activityMetrics = (metrics as MetricAnswer[])
      .filter(m => m.category === 'activity')
      .map(m => `- ${m.question}: ${m.answer}${m.unit ? ` ${m.unit}` : ''}`)
      .join('\n');

    // Calculate dates
    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    const currentYear = now.getFullYear();
    const targetDateStr = targetDate || new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];

    const prompt = `You are an expert goal-setting coach. Based on the user's CURRENT METRICS, create a realistic plan to achieve their vision. The key is that targets should be ACHIEVABLE based on where they are NOW.

VISION:
"${vision}"

CURRENT OUTCOME METRICS (where they are now):
${outcomeMetrics || 'No outcome metrics provided'}

CURRENT ACTIVITY METRICS (what they can do):
${activityMetrics || 'No activity metrics provided'}

Target Date: ${targetDateStr}
Current Quarter: Q${currentQuarter} ${currentYear}

CRITICAL RULES:
1. Targets MUST be realistic based on their current metrics
2. If they're at $5,000/month revenue, don't suggest $100,000/month in 3 months
3. Use compound growth - small daily improvements lead to big results
4. Account for their available time when setting activity targets
5. Create a "success ladder" where each level builds on the previous

Generate a complete plan with:
1. 4 QUARTERLY TARGETS - Major milestones that build toward the vision
2. 3 MONTHS PER QUARTER - Monthly breakdown for the first quarter
3. 4 WEEKS PER MONTH - Weekly targets for month 1
4. DAILY HABITS - 3-5 non-negotiable daily actions

For each KPI, include:
- currentValue: Their starting point
- targetValue: The realistic target for that time period
- whyItMatters: How this drives their vision

Also generate:
- SMART summary (derived from the plan, not the original vision)
- An inspiring affirmation based on their journey
- A "success formula" explaining why this plan makes failure unreasonable

Respond ONLY with valid JSON in this exact format:
{
  "quarterlyTargets": [
    {
      "quarter": 1,
      "title": "Q1 Theme",
      "description": "What this quarter achieves",
      "kpi": {
        "title": "Primary Q1 Metric",
        "description": "What we're measuring",
        "currentValue": "5000",
        "targetValue": "7500",
        "unit": "dollars",
        "whyItMatters": "Why this moves the needle"
      },
      "monthlyTargets": [
        {
          "month": 1,
          "monthName": "January",
          "title": "Month 1 Focus",
          "description": "What to achieve",
          "kpi": {
            "title": "Monthly metric",
            "description": "What we're measuring",
            "currentValue": "5000",
            "targetValue": "5800",
            "unit": "dollars",
            "whyItMatters": "Why this matters"
          },
          "weeklyTargets": [
            {
              "weekNumber": 1,
              "title": "Week 1 Focus",
              "description": "What to achieve",
              "kpis": [
                {
                  "title": "Activity KPI",
                  "description": "Input metric",
                  "currentValue": "0",
                  "targetValue": "10",
                  "unit": "calls",
                  "whyItMatters": "Drives results"
                },
                {
                  "title": "Output KPI",
                  "description": "Result metric",
                  "currentValue": "0",
                  "targetValue": "2",
                  "unit": "sales",
                  "whyItMatters": "Revenue driver"
                }
              ],
              "dailyActions": [
                {
                  "title": "Specific action",
                  "description": "What to do",
                  "bestTime": "morning",
                  "timeRequired": "30 minutes",
                  "whyItMatters": "Connection to goal"
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "dailyHabits": [
    {
      "title": "Daily Habit",
      "description": "Non-negotiable daily action",
      "bestTime": "morning",
      "timeRequired": "30 minutes",
      "whyItMatters": "How this drives success"
    }
  ],
  "smartSummary": {
    "specific": "Exactly what they will achieve",
    "measurable": "The key metrics and targets",
    "attainable": "Why this is achievable based on their current state",
    "realistic": "How this fits their available time and resources",
    "timeBound": "The timeline and milestones"
  },
  "suggestedAffirmation": "I am... (inspiring affirmation based on their journey)",
  "successFormula": "If you [daily habits] → [weekly results] → [monthly milestones] → you WILL achieve [vision] because...",
  "totalEstimatedHours": 480
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
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
      endpoint: '/api/ai/generate-plan-from-metrics',
      model: 'claude-sonnet-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'generate-plan-from-metrics',
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
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.slice(7);
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();

    const plan: GeneratedPlan = JSON.parse(cleanedResponse);

    // If visionId is provided, save the plan to the database
    if (visionId) {
      const supabase = await createClient();
      if (supabase) {
        await savePlanToDatabase(supabase, userId, visionId, plan, currentYear, currentQuarter);
      }
    }

    return NextResponse.json({
      success: true,
      plan,
      visionId: visionId || null,
    }, {
      headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
    });
  } catch (error) {
    console.error('Generate plan from metrics error:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure
    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/generate-plan-from-metrics',
        model: 'claude-sonnet-4-20250514',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'generate-plan-from-metrics',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs,
      });
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    );
  }
}

// Helper function to save the generated plan to the database
async function savePlanToDatabase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  visionId: string,
  plan: GeneratedPlan,
  currentYear: number,
  currentQuarter: number
): Promise<void> {
  if (!supabase) return;

  // Track KPI IDs for hierarchical linking
  const quarterlyKpiMap: Record<number, string> = {};
  const monthlyKpiMap: Record<string, string> = {};

  // Save daily habits first (no parent)
  let dailyHabitOrder = 0;
  for (const habit of plan.dailyHabits || []) {
    const { data: savedHabit } = await supabase
      .from('vision_kpis')
      .insert({
        user_id: userId,
        vision_id: visionId,
        level: 'daily',
        title: habit.title,
        description: habit.description,
        best_time: habit.bestTime,
        time_required: habit.timeRequired,
        why_it_matters: habit.whyItMatters,
        sort_order: dailyHabitOrder++,
        is_active: true,
      })
      .select('id')
      .single();

    if (savedHabit) {
      await initializeKpiProgressCache(supabase, savedHabit.id, null);
    }
  }

  // Save quarterly targets
  for (const qt of plan.quarterlyTargets) {
    const year = qt.quarter >= currentQuarter ? currentYear : currentYear + 1;

    // Save quarterly KPI (root node)
    const { data: savedQuarterlyKpi } = await supabase
      .from('vision_kpis')
      .insert({
        user_id: userId,
        vision_id: visionId,
        level: 'quarterly',
        quarter: qt.quarter,
        title: qt.kpi.title,
        description: qt.kpi.description,
        target_value: qt.kpi.targetValue,
        unit: qt.kpi.unit,
        numeric_target: parseFloat(qt.kpi.targetValue) || null,
        why_it_matters: qt.kpi.whyItMatters,
        sort_order: qt.quarter,
        is_active: true,
      })
      .select('id')
      .single();

    if (savedQuarterlyKpi) {
      quarterlyKpiMap[qt.quarter] = savedQuarterlyKpi.id;
      await initializeKpiProgressCache(
        supabase,
        savedQuarterlyKpi.id,
        parseFloat(qt.kpi.targetValue) || null
      );
    }

    // Save monthly targets
    for (const mt of qt.monthlyTargets || []) {
      const quarterlyParentId = quarterlyKpiMap[qt.quarter] || null;

      const { data: savedMonthlyKpi } = await supabase
        .from('vision_kpis')
        .insert({
          user_id: userId,
          vision_id: visionId,
          level: 'monthly',
          parent_kpi_id: quarterlyParentId,
          quarter: qt.quarter,
          month: mt.month,
          title: mt.kpi.title,
          description: mt.kpi.description,
          target_value: mt.kpi.targetValue,
          unit: mt.kpi.unit,
          numeric_target: parseFloat(mt.kpi.targetValue) || null,
          why_it_matters: mt.kpi.whyItMatters,
          sort_order: mt.month,
          is_active: true,
        })
        .select('id')
        .single();

      if (savedMonthlyKpi) {
        monthlyKpiMap[`${qt.quarter}-${mt.month}`] = savedMonthlyKpi.id;
        await initializeKpiProgressCache(
          supabase,
          savedMonthlyKpi.id,
          parseFloat(mt.kpi.targetValue) || null
        );
      }

      // Save weekly targets
      for (const wt of mt.weeklyTargets || []) {
        const monthlyParentId = monthlyKpiMap[`${qt.quarter}-${mt.month}`] || null;

        // Save weekly KPIs
        let weeklyKpiOrder = 0;
        for (const wk of wt.kpis || []) {
          const { data: savedWeeklyKpi } = await supabase
            .from('vision_kpis')
            .insert({
              user_id: userId,
              vision_id: visionId,
              level: 'weekly',
              parent_kpi_id: monthlyParentId,
              quarter: qt.quarter,
              month: mt.month,
              title: wk.title,
              description: wk.description,
              target_value: wk.targetValue,
              unit: wk.unit,
              numeric_target: parseFloat(wk.targetValue) || null,
              why_it_matters: wk.whyItMatters,
              sort_order: weeklyKpiOrder++,
              is_active: true,
            })
            .select('id')
            .single();

          if (savedWeeklyKpi) {
            await initializeKpiProgressCache(
              supabase,
              savedWeeklyKpi.id,
              parseFloat(wk.targetValue) || null
            );
          }
        }
      }
    }
  }

  // Update vision with SMART summary and affirmation
  await supabase
    .from('visions')
    .update({
      specific: plan.smartSummary.specific,
      measurable: plan.smartSummary.measurable,
      attainable: plan.smartSummary.attainable,
      realistic: plan.smartSummary.realistic,
      affirmation_text: plan.suggestedAffirmation,
      updated_at: new Date().toISOString(),
    })
    .eq('id', visionId)
    .eq('user_id', userId);
}

// Helper function to initialize progress cache for a newly created KPI
async function initializeKpiProgressCache(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kpiId: string,
  numericTarget: number | null
): Promise<void> {
  if (!supabase) return;

  await supabase
    .from('kpi_progress_cache')
    .upsert({
      kpi_id: kpiId,
      current_value: 0,
      target_value: numericTarget,
      progress_percentage: 0,
      child_count: 0,
      completed_child_count: 0,
      weighted_progress: 0,
      total_weight: 1,
      status: 'not_started',
      calculation_method: 'auto',
      last_calculated_at: new Date().toISOString(),
    }, { onConflict: 'kpi_id' });
}
