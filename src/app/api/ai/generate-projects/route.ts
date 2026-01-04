import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are an expert project planner specializing in Dan Martell's 12 Power Goals methodology. Given the following vision and SMART goals, create a 12-month project plan broken into quarterly Power Goals.

Vision: "${vision}"

SMART Goals:
- Specific: ${smartGoals?.specific || 'Not specified'}
- Measurable: ${smartGoals?.measurable || 'Not specified'}
- Attainable: ${smartGoals?.attainable || 'Not specified'}
- Realistic: ${smartGoals?.realistic || 'Not specified'}
${targetDate ? `Target Completion Date: ${targetDate}` : 'Target: Within 12 months'}

Create a structured 12-month plan with:
1. 12 Power Goals (3 per quarter) that build progressively toward the vision
2. Each goal should be specific, actionable, and completable within its quarter
3. Consider dependencies - earlier goals should enable later ones
4. Include a mix of: foundation work, skill building, implementation, and scaling

Categories to consider:
- health: Physical/mental wellness that supports productivity
- wealth: Financial targets and business metrics
- relationships: Network, team building, partnerships
- career: Skills, credentials, positioning
- business: Systems, products, marketing, sales
- personal: Personal development, habits, mindset

Respond ONLY with valid JSON in this exact format:
{
  "projects": [
    {
      "title": "Goal title (action-oriented)",
      "description": "Brief description of what this achieves",
      "quarter": 1,
      "category": "business",
      "dependencies": [],
      "keyMilestones": ["Milestone 1", "Milestone 2"]
    }
  ],
  "summary": "Brief overview of the 12-month strategy",
  "criticalPath": ["Most important goal IDs in order"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert project planner and goal-setting coach. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content;
    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/generate-projects',
      model: 'gpt-4o-mini',
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      requestType: 'generate-projects',
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
    const projectPlan = JSON.parse(responseText);

    return NextResponse.json(projectPlan);
  } catch (error) {
    console.error('AI Generation Error:', error);
    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/generate-projects',
      model: 'gpt-4o-mini',
      promptTokens: 0,
      completionTokens: 0,
      requestType: 'generate-projects',
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
      { error: 'Failed to generate project plan' },
      { status: 500 }
    );
  }
}
