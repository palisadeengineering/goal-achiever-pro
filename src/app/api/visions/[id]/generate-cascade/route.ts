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

interface GeneratedPowerGoal {
  title: string;
  description: string;
  quarter: number;
  category: string;
  monthlyTargets: {
    month: number;
    monthName: string;
    title: string;
    description: string;
    keyMetric: string;
    targetValue: number;
    weeklyTargets: {
      weekNumber: number;
      title: string;
      description: string;
      keyMetric: string;
      targetValue: number;
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
  summary: string;
  totalEstimatedHours: number;
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

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 });
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

Generate a COMPLETE action plan from a vision down to daily actions.

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

For EACH Power Goal, generate:
- 3 monthly targets (for the 3 months in that quarter)
- 4 weekly targets per month
- 5 daily actions per week (weekdays only)

IMPORTANT GUIDELINES:
1. Make daily actions SPECIFIC and ACTIONABLE (30-90 minutes each)
2. Build progressive momentum (earlier weeks = foundation, later = execution)
3. Use Grant Cardone's 10X thinking for ambitious targets
4. Use Dan Martell's DRIP categorization mindset (focus on Production and Investment activities)
5. Use Alex Hormozi's focus on value delivery and measurable outcomes
6. Ensure each daily action directly contributes to weekly → monthly → quarterly goals
7. Total daily time should be realistic (2-4 hours per day for this vision)

Respond ONLY with valid JSON in this exact format:
{
  "powerGoals": [
    {
      "title": "Q1 Power Goal Title",
      "description": "What this achieves",
      "quarter": 1,
      "category": "business|health|wealth|relationships|career|personal",
      "monthlyTargets": [
        {
          "month": 1,
          "monthName": "January",
          "title": "Month 1 Target",
          "description": "What to achieve this month",
          "keyMetric": "Metric name",
          "targetValue": 10,
          "weeklyTargets": [
            {
              "weekNumber": 1,
              "title": "Week 1 Target",
              "description": "What to achieve this week",
              "keyMetric": "Metric name",
              "targetValue": 3,
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
  "summary": "Overview of the complete plan",
  "totalEstimatedHours": 480
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
    };

    for (const pg of cascadeData.powerGoals) {
      // 1. Create Power Goal
      const { data: savedPowerGoal, error: pgError } = await supabase
        .from('power_goals')
        .insert({
          user_id: userId,
          vision_id: visionId,
          title: pg.title,
          description: pg.description,
          quarter: pg.quarter,
          category: pg.category,
          status: 'pending',
          progress_percentage: 0,
        })
        .select('id')
        .single();

      if (pgError || !savedPowerGoal) {
        console.error('Error creating power goal:', pgError);
        continue;
      }
      savedStats.powerGoals++;

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
          continue;
        }
        savedStats.monthlyTargets++;

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
            continue;
          }
          savedStats.weeklyTargets++;

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

    return NextResponse.json({
      success: true,
      visionId,
      summary: cascadeData.summary,
      totalEstimatedHours: cascadeData.totalEstimatedHours,
      saved: savedStats,
      message: `Created ${savedStats.powerGoals} Power Goals, ${savedStats.monthlyTargets} Monthly Targets, ${savedStats.weeklyTargets} Weekly Targets, and ${savedStats.dailyActions} Daily Actions`,
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
