import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { logAIUsage } from '@/lib/utils/ai-usage';
import { sanitizeErrorForClient } from '@/lib/utils/api-errors';
import { getAuthenticatedUserWithTier } from '@/lib/auth/api-auth';
import {
  applyMultipleRateLimits,
  rateLimitExceededResponse,
  rateLimitHeaders,
  getAIRateLimits,
} from '@/lib/rate-limit';

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
  let userId: string | null = null;
  let rateLimitResult: ReturnType<typeof applyMultipleRateLimits> | null = null;

  try {
    // Authenticate user
    const auth = await getAuthenticatedUserWithTier();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    userId = auth.userId;

    // Apply rate limiting (heavy operation - generates lots of content)
    rateLimitResult = applyMultipleRateLimits(userId, getAIRateLimits(auth.tier, 'heavy'));

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    // Get supabase client for database operations
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

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
    // Reduce daily actions to avoid massive JSON and parsing errors
    const targetDailyActions = Math.min(Math.ceil(totalWeeks * 2), 15);
    // Reduce weekly targets to keep response smaller
    const targetWeeklyTargets = Math.min(totalWeeks, 4);
    // Reduce monthly targets
    const targetMonthlyTargets = Math.min(totalMonths, 4);

    // Debug info object to track what's happening
    const debugInfo: {
      requestParams: Record<string, unknown>;
      calculatedLimits: Record<string, number>;
      aiResponse?: {
        rawLength: number;
        firstChars: string;
        lastChars: string;
        tokensUsed: { input: number; output: number };
        stopReason: string | null;
      };
      parseAttempt?: {
        method: string;
        jsonLength: number;
        repairAttempted: boolean;
        bracketCounts: { openBraces: number; closeBraces: number; openBrackets: number; closeBrackets: number };
      };
      resultCounts?: Record<string, number>;
      errors?: string[];
    } = {
      requestParams: {
        visionId,
        visionLength: vision?.length || 0,
        targetDate,
        startDate,
        availableHoursPerWeek,
        saveToDatabase,
      },
      calculatedLimits: {
        totalWeeks,
        totalHours,
        totalMonths,
        numQuarters,
        targetDailyActions,
        targetWeeklyTargets,
        targetMonthlyTargets,
      },
      errors: [],
    };

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `You are an expert goal-setting and accountability coach using proven time optimization methodologies. Create a comprehensive BACKTRACK PLAN.

## BACKTRACKING PLANNING METHOD
Start with the END VISION, then work BACKWARDS to determine what must be accomplished at each level:
Vision → Quarterly Targets → Impact Projects → Monthly Targets → Weekly Targets → Daily Actions

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

2. **Impact Projects** (${Math.min(numQuarters * 3, 12)} goals, ~3 per quarter):
   - Specific project-based goals
   - Category: business, career, health, wealth, relationships, or personal
   - Estimated hours: ~${hoursPerPowerGoal} hours each

3. **Monthly Targets** (exactly ${targetMonthlyTargets} targets):
   - Link each to a power goal via powerGoalIndex (0-based)
   - Clear monthly outcomes

4. **Weekly Targets** (exactly ${targetWeeklyTargets} targets):
   - Link each to a monthly target via monthlyTargetIndex (0-based)
   - Specific weekly focus

5. **Daily Actions** (${targetDailyActions} actions for the first few weeks):
   - CRITICAL: Make each action SPECIFIC and ACTIONABLE
   - Good: "Write 500 words for blog post on productivity"
   - Bad: "Work on content"
   - dayOfWeek: 1=Monday through 5=Friday
   - estimatedMinutes: 15-60 minutes each
   - Link to weekly target via weeklyTargetIndex (0-based)
   - Keep this section CONCISE - quality over quantity

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

CRITICAL RULES:
- Return ONLY valid JSON - no markdown, no explanations, no code blocks
- Index references (powerGoalIndex, monthlyTargetIndex, weeklyTargetIndex) must be valid 0-based indices
- Distribute daily actions evenly across weekdays (Mon-Fri)
- Make EVERY daily action specific and measurable
- Total hours must fit within the ${totalHours} hour budget
- Your entire response must be a single JSON object starting with { and ending with }`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const responseTimeMs = Date.now() - startTime;

    // Populate debug info with AI response details
    debugInfo.aiResponse = {
      rawLength: responseText.length,
      firstChars: responseText.substring(0, 200),
      lastChars: responseText.substring(Math.max(0, responseText.length - 200)),
      tokensUsed: {
        input: message.usage?.input_tokens || 0,
        output: message.usage?.output_tokens || 0,
      },
      stopReason: message.stop_reason || null,
    };

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
    let extractionMethod = 'direct';

    try {
      let jsonText = responseText;

      // Log the raw response for debugging (first 1000 chars)
      console.log('Raw AI response (first 1000 chars):', responseText.substring(0, 1000));

      // Try to extract JSON if wrapped in code blocks (multiple patterns)
      const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
        extractionMethod = 'code_block';
        console.log('Extracted JSON from code block');
      } else {
        // Try to find JSON object by looking for first { and last }
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonText = responseText.substring(firstBrace, lastBrace + 1);
          extractionMethod = 'brace_matching';
          console.log('Extracted JSON by brace matching');
        }
      }

      // Clean up any potential issues
      jsonText = jsonText.trim();

      // Remove any trailing commas before } or ]
      jsonText = jsonText.replace(/,\s*([\]}])/g, '$1');

      // Remove any BOM or invisible characters
      jsonText = jsonText.replace(/^\uFEFF/, '');

      // Try to repair truncated JSON by closing open brackets
      const openBraces = (jsonText.match(/\{/g) || []).length;
      const closeBraces = (jsonText.match(/\}/g) || []).length;
      const openBrackets = (jsonText.match(/\[/g) || []).length;
      const closeBrackets = (jsonText.match(/\]/g) || []).length;

      // Track bracket counts in debug info
      debugInfo.parseAttempt = {
        method: extractionMethod,
        jsonLength: jsonText.length,
        repairAttempted: false,
        bracketCounts: { openBraces, closeBraces, openBrackets, closeBrackets },
      };

      // If JSON appears truncated, try to close it
      if (openBrackets > closeBrackets || openBraces > closeBraces) {
        console.log('Attempting to repair truncated JSON...');
        debugInfo.parseAttempt.repairAttempted = true;

        // Remove any trailing incomplete object/array
        jsonText = jsonText.replace(/,\s*$/, '');
        jsonText = jsonText.replace(/,\s*\{[^}]*$/, '');
        jsonText = jsonText.replace(/:\s*$/, ': null');

        // Close remaining open brackets
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          jsonText += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          jsonText += '}';
        }
      }

      console.log('JSON text to parse (first 500 chars):', jsonText.substring(0, 500));
      console.log('JSON text to parse (last 500 chars):', jsonText.substring(Math.max(0, jsonText.length - 500)));

      plan = JSON.parse(jsonText);

      // Track result counts
      debugInfo.resultCounts = {
        quarterlyTargets: plan.quarterlyTargets?.length || 0,
        powerGoals: plan.powerGoals?.length || 0,
        monthlyTargets: plan.monthlyTargets?.length || 0,
        weeklyTargets: plan.weeklyTargets?.length || 0,
        dailyActions: plan.dailyActions?.length || 0,
      };

      console.log('Successfully parsed JSON with', debugInfo.resultCounts);
    } catch (parseError) {
      console.error('Failed to parse AI response. Full response:', responseText);
      console.error('Parse error:', parseError);

      // Add error to debug info
      debugInfo.errors?.push(sanitizeErrorForClient(parseError, 'parse backtrack AI response'));

      // Return sanitized error - do not expose raw parse details to client
      return NextResponse.json(
        {
          error: sanitizeErrorForClient(parseError, 'parse backtrack AI response'),
        },
        { status: 500 }
      );
    }

    // If saveToDatabase is true, save everything to the database
    if (saveToDatabase && visionId) {
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
        debug: debugInfo,
      }, {
        headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
      });
    }

    return NextResponse.json({
      ...plan,
      saved: false,
      totalWeeks,
      totalHours,
      debug: debugInfo,
    }, {
      headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
    });
  } catch (error) {
    console.error('AI Backtrack Generation Error:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure (only if we have a userId)
    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/generate-backtrack',
        model: 'claude-opus-4-20250514',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'generate-backtrack',
        success: false,
        errorMessage: sanitizeErrorForClient(error, 'generate backtrack plan'),
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
      { error: 'Failed to generate backtrack plan' },
      { status: 500 }
    );
  }
}
