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

interface PowerGoalInput {
  id: string;
  title: string;
  description?: string;
  quarter: number;
  category?: string;
  keyMilestones?: string[];
}

interface SmartGoalsInput {
  specific?: string;
  measurable?: string;
  attainable?: string;
  realistic?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId = DEMO_USER_ID;

  try {
    const supabase = await createClient();
    userId = await getUserId(supabase);

    const { powerGoal, vision, smartGoals, targetDate } = await request.json() as {
      powerGoal: PowerGoalInput;
      vision: string;
      smartGoals?: SmartGoalsInput;
      targetDate?: string;
    };

    if (!powerGoal || !powerGoal.title) {
      return NextResponse.json(
        { error: 'Power Goal is required' },
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

    // Calculate quarter months
    const quarterMonths = getQuarterMonths(powerGoal.quarter);

    const prompt = `You are an expert project planner specializing in breaking down quarterly goals into actionable monthly, weekly, and daily targets using Dan Martell's methodology.

Given the following Power Goal for Q${powerGoal.quarter}, create a detailed breakdown:

Power Goal: "${powerGoal.title}"
Description: "${powerGoal.description || 'No description provided'}"
Quarter: Q${powerGoal.quarter} (${quarterMonths.join(', ')})
Category: ${powerGoal.category || 'general'}
${powerGoal.keyMilestones?.length ? `Key Milestones: ${powerGoal.keyMilestones.join(', ')}` : ''}

Vision Context: "${vision || 'Not specified'}"
${smartGoals ? `SMART Goals:
- Specific: ${smartGoals.specific || 'Not specified'}
- Measurable: ${smartGoals.measurable || 'Not specified'}` : ''}
${targetDate ? `Target Date: ${targetDate}` : ''}

Create a structured breakdown with:

1. MONTHLY TARGETS (3 months for the quarter):
   - Each month should have 1-2 key targets
   - Include specific, measurable outcomes
   - Build progressively (month 1 foundations, month 2 execution, month 3 completion)

2. WEEKLY TARGETS (4 weeks per month):
   - 1-2 weekly targets per week
   - Clear deliverables or milestones
   - Include a key metric to track

3. DAILY ACTIONS (5 weekdays per week):
   - 1-3 specific actions per day
   - Each action should be completable in 30-90 minutes
   - Include estimated time in minutes

Important guidelines:
- Make targets specific and measurable
- Ensure logical progression from daily -> weekly -> monthly
- Total estimated time should be realistic (2-4 hours daily max for this goal)
- Use action verbs (Create, Complete, Review, Build, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "monthlyTargets": [
    {
      "month": 1,
      "monthName": "January",
      "title": "Month 1 main target",
      "description": "What this month accomplishes",
      "keyMetric": "Metric name",
      "targetValue": 100,
      "weeklyTargets": [
        {
          "weekNumber": 1,
          "title": "Week 1 target",
          "description": "What this week accomplishes",
          "keyMetric": "Metric name",
          "targetValue": 25,
          "dailyActions": [
            {
              "dayOfWeek": "Monday",
              "title": "Action title",
              "description": "Brief description",
              "estimatedMinutes": 45,
              "keyMetric": "Metric name",
              "targetValue": 5
            }
          ]
        }
      ]
    }
  ],
  "summary": "Brief overview of the 3-month execution plan",
  "totalEstimatedHours": 120,
  "criticalMilestones": ["Week 2: First milestone", "Week 8: Second milestone"]
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
      endpoint: '/api/ai/generate-targets',
      model: 'claude-sonnet-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'generate-targets',
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
    const targetPlan = JSON.parse(responseText);

    // Add power goal context to response
    return NextResponse.json({
      ...targetPlan,
      powerGoalId: powerGoal.id,
      powerGoalTitle: powerGoal.title,
      quarter: powerGoal.quarter,
    });
  } catch (error) {
    console.error('AI Target Generation Error:', error);
    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/generate-targets',
      model: 'claude-sonnet-4-20250514',
      promptTokens: 0,
      completionTokens: 0,
      requestType: 'generate-targets',
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
      { error: 'Failed to generate target plan' },
      { status: 500 }
    );
  }
}

// Helper function to get month names for a quarter
function getQuarterMonths(quarter: number): string[] {
  const months = [
    ['January', 'February', 'March'],
    ['April', 'May', 'June'],
    ['July', 'August', 'September'],
    ['October', 'November', 'December'],
  ];
  return months[quarter - 1] || months[0];
}
