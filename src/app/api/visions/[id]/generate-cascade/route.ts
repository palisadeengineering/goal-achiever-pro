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

interface DailyKpi {
  title: string;
  description: string;
  targetValue: string;
  unit: string;
  trackingMethod: 'checkbox' | 'numeric';
  bestTime: 'morning' | 'afternoon' | 'evening';
  timeRequired: string;
  whyItMatters: string;
}

interface WeeklyKpi {
  title: string;
  description: string;
  targetValue: string;
  unit: string;
  trackingMethod: 'checkbox' | 'numeric';
  category: 'activity' | 'output';
  leadsTo: string;
}

interface MonthlyKpi {
  title: string;
  description: string;
  targetValue: string;
  unit: string;
  keyMetric: string;
}

interface QuarterlyKpi {
  title: string;
  description: string;
  targetValue: string;
  unit: string;
  outcome: string;
}

interface GeneratedPowerGoal {
  title: string;
  description: string;
  quarter: number;
  category: string;
  quarterlyKpi: QuarterlyKpi;
  monthlyTargets: {
    month: number;
    monthName: string;
    title: string;
    description: string;
    keyMetric: string;
    targetValue: number;
    monthlyKpi: MonthlyKpi;
    weeklyTargets: {
      weekNumber: number;
      title: string;
      description: string;
      keyMetric: string;
      targetValue: number;
      weeklyKpis: WeeklyKpi[];
      dailyActions: {
        dayOfWeek: string;
        title: string;
        description: string;
        estimatedMinutes: number;
      }[];
    }[];
  }[];
}

interface CascadeResponse {
  powerGoals: GeneratedPowerGoal[];
  dailyKpis: DailyKpi[];
  summary: string;
  totalEstimatedHours: number;
  successFormula: string;
}

// POST: Generate full cascade from Vision to Daily Actions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  let userId: string | null = null;
  let rateLimitResult: ReturnType<typeof applyMultipleRateLimits> | null = null;

  try {
    const { id: visionId } = await params;

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

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Get vision details
    const { data: vision, error: visionError } = await supabase
      .from('visions')
      .select('*')
      .eq('id', visionId)
      .eq('user_id', userId)
      .single();

    if (visionError || !vision) {
      return NextResponse.json({ error: 'Vision not found' }, { status: 404 });
    }

    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const { quarters = [1, 2, 3, 4], goalsPerQuarter = 3 } = body;

    // Check for Anthropic API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured. Please set ANTHROPIC_API_KEY.' }, { status: 500 });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Calculate dates and current quarter
    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    const currentYear = now.getFullYear();
    const targetDate = vision.time_bound ? new Date(vision.time_bound) : null;

    const prompt = `You are an expert goal-setting coach combining methodologies from Dan Martell (Buy Back Your Time), Alex Hormozi ($100M Offers), and Grant Cardone (10X Rule).

Generate a COMPLETE KPI-driven action plan from a vision down to daily actions. The key principle: If daily KPIs are hit → weekly KPIs are hit → monthly KPIs are hit → quarterly KPIs are hit → VISION IS ACHIEVED. Make it MATHEMATICALLY UNREASONABLE TO FAIL.

VISION:
- Title: "${vision.title}"
- Description: "${vision.description || 'No description'}"
- SMART Goals:
  - Specific: ${vision.specific || 'Not defined'}
  - Measurable: ${vision.measurable || 'Not defined'}
  - Attainable: ${vision.attainable || 'Not defined'}
  - Realistic: ${vision.realistic || 'Not defined'}
  - Time-bound: ${targetDate ? targetDate.toISOString().split('T')[0] : 'Not defined'}

Current Quarter: Q${currentQuarter} ${currentYear}
Target Date: ${targetDate ? targetDate.toISOString().split('T')[0] : '12 months from now'}

Generate ${goalsPerQuarter} Power Goals for each quarter (${quarters.join(', ').replace(/(\d)/g, 'Q$1')}), totaling ${quarters.length * goalsPerQuarter} Power Goals.

KEY REQUIREMENTS:
1. Each level MUST have trackable KPIs with specific numeric targets
2. KPIs must cascade: daily→weekly→monthly→quarterly→vision
3. Daily KPIs are the atomic habits that compound into success
4. Weekly KPIs track both Activities (inputs) and Outputs (results)
5. Monthly KPIs are milestone markers
6. Quarterly KPIs are major outcome checkpoints
7. Use Grant Cardone's 10X thinking for ambitious but achievable targets
8. Use Dan Martell's "Buy Back Your Time" focus on high-value activities
9. Use Alex Hormozi's value equation (Dream Outcome × Perceived Likelihood ÷ Time × Effort)

DAILY KPIS (3-5 non-negotiable habits):
- These are DAILY habits that DIRECTLY drive weekly targets
- Include best time (morning/afternoon/evening), time required, and why it matters
- Must be trackable via checkbox or numeric value
- Example: "Complete 3 deep work sessions (90 min each)" or "Review metrics dashboard"

WEEKLY KPIS:
- Mix of Activity KPIs (inputs you control) and Output KPIs (results you measure)
- Activity example: "Complete 20 sales calls" (you control this)
- Output example: "Book 5 demos" (result of activity)
- Each weekly KPI should "lead to" something specific

MONTHLY KPIS:
- Major milestones that indicate you're on track
- Cumulative results of weekly execution

QUARTERLY KPIS:
- Big picture outcomes that prove progress toward vision
- Should be exciting and motivating

Respond ONLY with valid JSON in this exact format:
{
  "powerGoals": [
    {
      "title": "Q1 Power Goal Title",
      "description": "What this achieves and why it matters",
      "quarter": 1,
      "category": "business|health|wealth|relationships|career|personal",
      "quarterlyKpi": {
        "title": "Q1 Success Metric",
        "description": "What achieving this looks like",
        "targetValue": "10000",
        "unit": "dollars|customers|hours|count",
        "outcome": "What this unlocks for you"
      },
      "monthlyTargets": [
        {
          "month": 1,
          "monthName": "January",
          "title": "Month 1 Target",
          "description": "What to achieve this month",
          "keyMetric": "Metric name",
          "targetValue": 10,
          "monthlyKpi": {
            "title": "January KPI",
            "description": "Monthly success metric",
            "targetValue": "3000",
            "unit": "dollars|customers|count",
            "keyMetric": "Primary metric to track"
          },
          "weeklyTargets": [
            {
              "weekNumber": 1,
              "title": "Week 1 Target",
              "description": "What to achieve this week",
              "keyMetric": "Metric name",
              "targetValue": 3,
              "weeklyKpis": [
                {
                  "title": "Activity KPI",
                  "description": "Input metric you control",
                  "targetValue": "20",
                  "unit": "calls|sessions|hours",
                  "trackingMethod": "numeric",
                  "category": "activity",
                  "leadsTo": "What this activity produces"
                },
                {
                  "title": "Output KPI",
                  "description": "Result metric you measure",
                  "targetValue": "5",
                  "unit": "demos|sales|completions",
                  "trackingMethod": "numeric",
                  "category": "output",
                  "leadsTo": "What this output enables"
                }
              ],
              "dailyActions": [
                {
                  "dayOfWeek": "Monday",
                  "title": "Specific action",
                  "description": "Brief details",
                  "estimatedMinutes": 45
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "dailyKpis": [
    {
      "title": "Daily Habit Title",
      "description": "What this habit is",
      "targetValue": "1",
      "unit": "completion|sessions|minutes",
      "trackingMethod": "checkbox|numeric",
      "bestTime": "morning|afternoon|evening",
      "timeRequired": "30 minutes",
      "whyItMatters": "How this drives your vision"
    }
  ],
  "summary": "Overview of the complete plan",
  "totalEstimatedHours": 480,
  "successFormula": "If you do X daily → Y weekly → Z monthly → you WILL achieve your vision because..."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/visions/[id]/generate-cascade',
      model: 'claude-sonnet-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'generate-cascade',
      success: true,
      responseTimeMs,
    });

    if (!responseText) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Parse JSON response
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

    const cascadeData: CascadeResponse = JSON.parse(cleanedResponse);

    // Now save everything to the database
    const savedStats = {
      powerGoals: 0,
      monthlyTargets: 0,
      weeklyTargets: 0,
      dailyActions: 0,
      quarterlyKpis: 0,
      monthlyKpis: 0,
      weeklyKpis: 0,
      dailyKpis: 0,
    };

    // First, save Daily KPIs (these are global habits for the vision)
    let dailyKpiSortOrder = 0;
    for (const dk of cascadeData.dailyKpis || []) {
      const { error: dkError } = await supabase
        .from('vision_kpis')
        .insert({
          user_id: userId,
          vision_id: visionId,
          level: 'daily',
          title: dk.title,
          description: dk.description,
          target_value: dk.targetValue,
          unit: dk.unit,
          tracking_method: dk.trackingMethod || 'checkbox',
          best_time: dk.bestTime,
          time_required: dk.timeRequired,
          why_it_matters: dk.whyItMatters,
          sort_order: dailyKpiSortOrder++,
          is_active: true,
        });

      if (!dkError) {
        savedStats.dailyKpis++;
      } else {
        console.error('Error creating daily KPI:', dkError);
      }
    }

    for (const pg of cascadeData.powerGoals) {
      // 1. Create Power Goal
      // Calculate year based on quarter
      const powerGoalYear = pg.quarter >= currentQuarter ? currentYear : currentYear + 1;

      const { data: savedPowerGoal, error: pgError } = await supabase
        .from('power_goals')
        .insert({
          user_id: userId,
          vision_id: visionId,
          title: pg.title,
          description: pg.description,
          quarter: pg.quarter,
          year: powerGoalYear,
          category: pg.category,
          status: 'pending',
          progress_percentage: 0,
        })
        .select('id')
        .single();

      if (pgError || !savedPowerGoal) {
        console.error('Error creating power goal:', pgError);
        // Return detailed error instead of silently continuing
        return NextResponse.json({
          error: 'Failed to save power goal',
          details: pgError?.message || 'Unknown database error',
          powerGoal: pg.title,
        }, { status: 500 });
      }
      savedStats.powerGoals++;

      // 1b. Create Quarterly KPI for this Power Goal
      if (pg.quarterlyKpi) {
        const { error: qkError } = await supabase
          .from('vision_kpis')
          .insert({
            user_id: userId,
            vision_id: visionId,
            level: 'quarterly',
            quarter: pg.quarter,
            title: pg.quarterlyKpi.title,
            description: pg.quarterlyKpi.description,
            target_value: pg.quarterlyKpi.targetValue,
            unit: pg.quarterlyKpi.unit,
            tracking_method: 'numeric',
            why_it_matters: pg.quarterlyKpi.outcome,
            sort_order: pg.quarter,
            is_active: true,
          });

        if (!qkError) {
          savedStats.quarterlyKpis++;
        } else {
          console.error('Error creating quarterly KPI:', qkError);
        }
      }

      // 2. Create Monthly Targets
      for (const mt of pg.monthlyTargets) {
        const targetYear = pg.quarter <= 2 ? currentYear : (pg.quarter > currentQuarter ? currentYear : currentYear + 1);

        const { data: savedMonthly, error: mtError } = await supabase
          .from('monthly_targets')
          .insert({
            user_id: userId,
            power_goal_id: savedPowerGoal.id,
            title: mt.title,
            description: mt.description,
            target_month: mt.month,
            target_year: targetYear,
            key_metric: mt.keyMetric,
            target_value: mt.targetValue,
            status: 'pending',
          })
          .select('id')
          .single();

        if (mtError || !savedMonthly) {
          console.error('Error creating monthly target:', mtError);
          return NextResponse.json({
            error: 'Failed to save monthly target',
            details: mtError?.message || 'Unknown database error',
            monthlyTarget: mt.title,
          }, { status: 500 });
        }
        savedStats.monthlyTargets++;

        // 2b. Create Monthly KPI
        if (mt.monthlyKpi) {
          const { error: mkError } = await supabase
            .from('vision_kpis')
            .insert({
              user_id: userId,
              vision_id: visionId,
              level: 'monthly',
              month: mt.month,
              quarter: pg.quarter,
              title: mt.monthlyKpi.title,
              description: mt.monthlyKpi.description,
              target_value: mt.monthlyKpi.targetValue,
              unit: mt.monthlyKpi.unit,
              tracking_method: 'numeric',
              sort_order: mt.month,
              is_active: true,
            });

          if (!mkError) {
            savedStats.monthlyKpis++;
          } else {
            console.error('Error creating monthly KPI:', mkError);
          }
        }

        // 3. Create Weekly Targets
        for (const wt of mt.weeklyTargets) {
          // Calculate week dates
          const weekDates = getWeekDates(targetYear, mt.month, wt.weekNumber);

          const { data: savedWeekly, error: wtError } = await supabase
            .from('weekly_targets')
            .insert({
              user_id: userId,
              monthly_target_id: savedMonthly.id,
              title: wt.title,
              description: wt.description,
              week_number: wt.weekNumber,
              week_start_date: weekDates.start,
              week_end_date: weekDates.end,
              key_metric: wt.keyMetric,
              target_value: wt.targetValue,
              status: 'pending',
            })
            .select('id')
            .single();

          if (wtError || !savedWeekly) {
            console.error('Error creating weekly target:', wtError);
            return NextResponse.json({
              error: 'Failed to save weekly target',
              details: wtError?.message || 'Unknown database error',
              weeklyTarget: wt.title,
            }, { status: 500 });
          }
          savedStats.weeklyTargets++;

          // 3b. Create Weekly KPIs
          let weeklyKpiSortOrder = 0;
          for (const wk of wt.weeklyKpis || []) {
            const { error: wkError } = await supabase
              .from('vision_kpis')
              .insert({
                user_id: userId,
                vision_id: visionId,
                level: 'weekly',
                quarter: pg.quarter,
                month: mt.month,
                title: wk.title,
                description: wk.description,
                target_value: wk.targetValue,
                unit: wk.unit,
                tracking_method: wk.trackingMethod || 'numeric',
                category: wk.category === 'activity' ? 'Activity' : 'Output',
                leads_to: wk.leadsTo,
                sort_order: weeklyKpiSortOrder++,
                is_active: true,
              });

            if (!wkError) {
              savedStats.weeklyKpis++;
            } else {
              console.error('Error creating weekly KPI:', wkError);
            }
          }

          // 4. Create Daily Actions
          for (let i = 0; i < wt.dailyActions.length; i++) {
            const da = wt.dailyActions[i];
            const actionDate = getActionDate(weekDates.start, da.dayOfWeek);

            const { error: daError } = await supabase
              .from('daily_actions')
              .insert({
                user_id: userId,
                weekly_target_id: savedWeekly.id,
                title: da.title,
                description: da.description,
                action_date: actionDate,
                estimated_minutes: da.estimatedMinutes,
                status: 'pending',
                sort_order: i,
              });

            if (daError) {
              console.error('Error creating daily action:', daError);
              continue;
            }
            savedStats.dailyActions++;
          }
        }
      }
    }

    const totalKpis = savedStats.quarterlyKpis + savedStats.monthlyKpis + savedStats.weeklyKpis + savedStats.dailyKpis;

    return NextResponse.json({
      success: true,
      visionId,
      summary: cascadeData.summary,
      successFormula: cascadeData.successFormula,
      totalEstimatedHours: cascadeData.totalEstimatedHours,
      saved: savedStats,
      message: `Created complete plan: ${savedStats.powerGoals} Power Goals, ${totalKpis} KPIs (${savedStats.dailyKpis} Daily, ${savedStats.weeklyKpis} Weekly, ${savedStats.monthlyKpis} Monthly, ${savedStats.quarterlyKpis} Quarterly), ${savedStats.monthlyTargets} Monthly Targets, ${savedStats.weeklyTargets} Weekly Targets, and ${savedStats.dailyActions} Daily Actions`,
    }, {
      headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
    });

  } catch (error) {
    console.error('Generate cascade error:', error);
    const responseTimeMs = Date.now() - startTime;

    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/visions/[id]/generate-cascade',
        model: 'claude-sonnet-4-20250514',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'generate-cascade',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs,
      });
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate cascade', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate week dates
function getWeekDates(year: number, month: number, weekNumber: number): { start: string; end: string } {
  const firstDay = new Date(year, month - 1, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);

  // Adjust to Monday if not already
  const dayOfWeek = startDate.getDay();
  if (dayOfWeek !== 1) {
    startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  }

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
