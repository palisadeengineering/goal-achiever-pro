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

    const body = await request.json();
    const { visionTitle, visionDescription, currentValue, context } = body;

    if (!visionTitle && !currentValue) {
      return NextResponse.json(
        { error: 'Vision title or current value is required' },
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

    const prompt = `You are an expert life coach helping someone create a powerful daily non-negotiable habit.

${visionTitle ? `Their vision is: "${visionTitle}"` : ''}
${visionDescription ? `Description: "${visionDescription}"` : ''}
${currentValue ? `They want to improve this non-negotiable: "${currentValue}"` : ''}
${context ? `Additional context: "${context}"` : ''}

Create a specific, actionable daily non-negotiable that:
1. Directly supports their vision
2. Is measurable and trackable
3. Can be completed in 5-30 minutes daily
4. Builds momentum and confidence
5. Is specific enough to be clear when it's done

Examples of good non-negotiables:
- "Read for 20 minutes every morning before checking email"
- "Do a 10-minute evening reflection and journal 3 wins"
- "Exercise for 30 minutes first thing in the morning"
- "Review vision board and affirmations twice daily"

Return ONLY the non-negotiable title/description, no explanations.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });

    const suggestion = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/suggest-non-negotiables',
      model: 'claude-sonnet-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'suggest-non-negotiables',
      success: true,
      responseTimeMs,
    });

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Error suggesting non-negotiable:', error);
    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/suggest-non-negotiables',
      model: 'claude-sonnet-4-20250514',
      promptTokens: 0,
      completionTokens: 0,
      requestType: 'suggest-non-negotiables',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs,
    });

    return NextResponse.json(
      { error: 'Failed to suggest non-negotiable' },
      { status: 500 }
    );
  }
}
