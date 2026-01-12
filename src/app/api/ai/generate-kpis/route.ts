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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId = DEMO_USER_ID;

  try {
    const supabase = await createClient();
    userId = await getUserId(supabase);

    const { vision, smartGoals, targetDate } = await request.json();

    if (!vision) {
      return NextResponse.json(
        { error: 'Vision statement is required' },
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

    const prompt = `You are an expert goal-setting and accountability coach specializing in Dan Martell's "Buy Back Your Time" methodology. Your job is to create a comprehensive system of KPIs and metrics that makes it UNREASONABLE for someone to fail at achieving their vision.

Vision: "${vision}"
${smartGoals ? `
SMART Goals:
- Specific: ${smartGoals.specific || 'Not provided'}
- Measurable: ${smartGoals.measurable || 'Not provided'}
- Attainable: ${smartGoals.attainable || 'Not provided'}
- Realistic: ${smartGoals.realistic || 'Not provided'}
` : ''}
Target Date: ${targetDate || 'Not specified'}

Create a comprehensive accountability system with:

1. QUARTERLY GOALS (4 major milestones per year)
   - Each quarter should have 2-3 major outcomes that stack toward the vision
   - Include specific revenue/metric targets where applicable

2. MONTHLY TARGETS (what needs to happen each month)
   - 3-4 specific, measurable outcomes per month
   - Should directly contribute to quarterly goals

3. WEEKLY KPIS (leading indicators to track)
   - 5-7 specific metrics to track every week
   - Include both activity metrics (inputs) and result metrics (outputs)
   - Make them specific enough to be tracked in a spreadsheet

4. DAILY HABITS (non-negotiable daily actions)
   - 3-5 specific daily actions that drive the weekly KPIs
   - Include time estimates for each
   - Make them so clear that success/failure is obvious

The system should be designed so that if someone follows the daily habits consistently, hits their weekly KPIs, and achieves their monthly targets, it becomes MATHEMATICALLY UNREASONABLE for them to not achieve the quarterly and annual goals.

Respond ONLY with valid JSON in this exact format:
{
  "quarterlyGoals": [
    {
      "quarter": 1,
      "title": "Q1 Theme/Focus",
      "outcomes": [
        { "metric": "Revenue", "target": "$X", "description": "Why this matters" },
        { "metric": "Customers", "target": "X", "description": "Why this matters" }
      ]
    }
  ],
  "monthlyTargets": [
    {
      "month": 1,
      "monthName": "January",
      "targets": [
        { "title": "Target name", "metric": "X units/dollars/etc", "description": "How to achieve" }
      ]
    }
  ],
  "weeklyKPIs": [
    {
      "category": "Activity/Output",
      "kpi": "KPI Name",
      "target": "X per week",
      "trackingMethod": "How to measure",
      "leadingTo": "What this drives"
    }
  ],
  "dailyHabits": [
    {
      "habit": "Specific action",
      "timeRequired": "X minutes",
      "bestTime": "Morning/Afternoon/Evening",
      "whyItMatters": "Connection to vision"
    }
  ],
  "successFormula": "A brief statement explaining why this system makes failure unreasonable"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 3000,
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
      endpoint: '/api/ai/generate-kpis',
      model: 'claude-opus-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'generate-kpis',
      success: true,
      responseTimeMs,
    });

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response - strip markdown code blocks if present
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

    const kpis = JSON.parse(cleanedResponse);

    return NextResponse.json(kpis);
  } catch (error) {
    console.error('AI KPI Generation Error:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure
    logAIUsage({
      userId,
      endpoint: '/api/ai/generate-kpis',
      model: 'claude-opus-4-20250514',
      promptTokens: 0,
      completionTokens: 0,
      requestType: 'generate-kpis',
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
      { error: 'Failed to generate KPIs' },
      { status: 500 }
    );
  }
}
