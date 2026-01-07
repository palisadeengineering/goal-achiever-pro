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

    const { vision, smartGoals, targetDate, count = 4 } = await request.json();

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

    const prompt = `You are an expert goal-setting coach specializing in Dan Martell's Power Goals methodology from "Buy Back Your Time".

Given the following vision and SMART goals, generate ${count} Power Goals that will directly help achieve this vision.

Vision: "${vision}"

SMART Goals:
- Specific: ${smartGoals?.specific || 'Not specified'}
- Measurable: ${smartGoals?.measurable || 'Not specified'}
- Attainable: ${smartGoals?.attainable || 'Not specified'}
- Realistic: ${smartGoals?.realistic || 'Not specified'}
${targetDate ? `Target Completion Date: ${targetDate}` : ''}

Power Goals are:
1. High-impact goals that move you closer to your vision
2. Specific and measurable
3. Achievable within a quarter (90 days)
4. Directly derived from the SMART goal breakdown

Generate ${count} Power Goals distributed across the 4 quarters. Each goal should:
- Be action-oriented (start with a verb)
- Have clear success criteria
- Build on the previous quarter's progress
- Align with the measurable targets in the SMART goals

Categories to assign:
- business: Systems, products, marketing, sales, revenue
- career: Skills, credentials, positioning
- health: Physical/mental wellness
- wealth: Financial targets
- relationships: Network, team, partnerships
- personal: Development, habits, mindset

Respond ONLY with valid JSON in this exact format:
{
  "powerGoals": [
    {
      "title": "Action-oriented goal title",
      "description": "What this achieves and why it matters",
      "quarter": 1,
      "category": "business",
      "metrics": ["Specific metric 1", "Specific metric 2"]
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 1500,
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
      endpoint: '/api/ai/generate-power-goals',
      model: 'claude-opus-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'generate-power-goals',
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
    const result = JSON.parse(responseText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Power Goals Generation Error:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure
    logAIUsage({
      userId,
      endpoint: '/api/ai/generate-power-goals',
      model: 'claude-opus-4-20250514',
      promptTokens: 0,
      completionTokens: 0,
      requestType: 'generate-power-goals',
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
      { error: 'Failed to generate Power Goals' },
      { status: 500 }
    );
  }
}
