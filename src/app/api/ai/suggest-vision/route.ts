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

    const { context } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are an expert vision and goal-setting coach specializing in Dan Martell's "Buy Back Your Time" methodology.

Generate an inspiring, specific vision statement for someone based on the following context:
${context ? `Context: "${context}"` : 'No specific context provided - create a general business/life vision.'}

Guidelines for the vision:
1. Make it specific and measurable (include numbers when possible)
2. Make it time-bound (typically 1-3 years)
3. Make it inspiring and exciting
4. Focus on transformation and lifestyle, not just financial metrics
5. Include elements of freedom, impact, and fulfillment
6. Make it achievable but stretching

Example great visions:
- "Build a $500K/year coaching business while working 4 days a week, with the freedom to travel 3 months annually"
- "Scale my agency to $2M revenue with a team of 10, while maintaining 50% profit margins and taking every Friday off"
- "Launch a successful SaaS product generating $50K MRR within 18 months, creating passive income and location independence"

Respond ONLY with valid JSON in this exact format:
{
  "vision": "The vision statement (one powerful sentence)",
  "description": "2-3 sentences explaining why this vision is compelling and how it will transform their life"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert vision coach. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content;
    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/suggest-vision',
      model: 'gpt-4o-mini',
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      requestType: 'suggest-vision',
      success: true,
      responseTimeMs,
    });

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    const result = JSON.parse(responseText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Vision Suggestion Error:', error);
    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/suggest-vision',
      model: 'gpt-4o-mini',
      promptTokens: 0,
      completionTokens: 0,
      requestType: 'suggest-vision',
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
      { error: 'Failed to generate vision suggestion' },
      { status: 500 }
    );
  }
}
