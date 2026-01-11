import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { logAIUsage } from '@/lib/utils/ai-usage';
import { differenceInMonths, parseISO, format, addMonths } from 'date-fns';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

interface MonthlyProject {
  month: number;
  monthName: string;
  year: number;
  title: string;
  description: string;
  keyMilestone: string;
  successMetric: string;
  targetValue: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId = DEMO_USER_ID;

  try {
    const supabase = await createClient();
    userId = await getUserId(supabase);

    const body = await request.json();
    const {
      visionId,
      visionTitle,
      deadline,
      oneYearGoal,
      smartGoals,
    } = body as {
      visionId?: string;
      visionTitle: string;
      deadline: string;
      oneYearGoal: string;
      smartGoals?: {
        specific?: string;
        measurable?: string;
        attainable?: string;
        realistic?: string;
        timeBound?: string;
      };
    };

    if (!deadline || !oneYearGoal) {
      return NextResponse.json(
        { error: 'Deadline and 1-year goal are required' },
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

    // Calculate months until deadline
    const today = new Date();
    const deadlineDate = parseISO(deadline);
    const monthsUntilDeadline = Math.max(1, differenceInMonths(deadlineDate, today));

    // Generate month names for the period
    const monthsList: Array<{ month: number; monthName: string; year: number }> = [];
    for (let i = 0; i < monthsUntilDeadline; i++) {
      const monthDate = addMonths(today, i);
      monthsList.push({
        month: monthDate.getMonth() + 1,
        monthName: format(monthDate, 'MMMM'),
        year: monthDate.getFullYear(),
      });
    }

    const prompt = `You are an expert project planner helping someone achieve their 1-year goal using Dan Martell's Achievement Roadmap methodology.

The user has a vision and a 1-year SMART goal. Generate monthly projects that progressively build toward achieving the goal.

Vision: "${visionTitle}"
1-Year Goal: "${oneYearGoal}"
Deadline: ${format(deadlineDate, 'MMMM d, yyyy')} (${monthsUntilDeadline} months from now)

${smartGoals ? `SMART Goals Context:
- Specific: ${smartGoals.specific || 'Not specified'}
- Measurable: ${smartGoals.measurable || 'Not specified'}
- Attainable: ${smartGoals.attainable || 'Not specified'}
- Realistic: ${smartGoals.realistic || 'Not specified'}
- Time-bound: ${smartGoals.timeBound || deadline}` : ''}

Generate exactly ${monthsUntilDeadline} monthly projects (one per month) starting from ${format(today, 'MMMM yyyy')}.

Guidelines:
1. Each month should have a clear focus and milestone
2. Projects should build progressively toward the final goal
3. Early months focus on foundation/research/planning
4. Middle months focus on execution and building momentum
5. Final months focus on completion, refinement, and hitting the goal
6. Each project should be achievable within 30 days
7. Include specific success metrics that are measurable

Respond ONLY with valid JSON in this exact format:
{
  "projects": [
    {
      "month": 1,
      "monthName": "${monthsList[0]?.monthName || 'January'}",
      "year": ${monthsList[0]?.year || today.getFullYear()},
      "title": "Project title (action-oriented, 5-10 words)",
      "description": "What this month accomplishes and why it matters (1-2 sentences)",
      "keyMilestone": "The main deliverable or achievement for this month",
      "successMetric": "How to measure success (e.g., 'Complete X', 'Achieve Y%')",
      "targetValue": "The specific target number or milestone"
    }
  ],
  "summary": "Brief overview of the progression from month 1 to month ${monthsUntilDeadline}",
  "criticalPath": ["Key milestone in early months", "Key milestone in middle months", "Final goal achievement"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
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

    logAIUsage({
      userId,
      endpoint: '/api/ai/generate-monthly-projects',
      model: 'claude-sonnet-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'generate-monthly-projects',
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
    let result;
    try {
      // Find JSON in the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Validate and enrich the projects with correct dates
    const projects: MonthlyProject[] = (result.projects || []).map((project: MonthlyProject, index: number) => {
      const monthInfo = monthsList[index] || monthsList[monthsList.length - 1];
      return {
        ...project,
        month: monthInfo.month,
        monthName: monthInfo.monthName,
        year: monthInfo.year,
      };
    });

    return NextResponse.json({
      visionId,
      visionTitle,
      deadline,
      oneYearGoal,
      monthsUntilDeadline,
      projects,
      summary: result.summary,
      criticalPath: result.criticalPath,
    });
  } catch (error) {
    console.error('AI Monthly Projects Generation Error:', error);
    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/generate-monthly-projects',
      model: 'claude-sonnet-4-20250514',
      promptTokens: 0,
      completionTokens: 0,
      requestType: 'generate-monthly-projects',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs,
    });

    return NextResponse.json(
      { error: 'Failed to generate monthly projects' },
      { status: 500 }
    );
  }
}
