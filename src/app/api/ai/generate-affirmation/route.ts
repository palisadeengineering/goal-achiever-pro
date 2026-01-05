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
    const { visionTitle, visionDescription, smartGoals } = body;

    if (!visionTitle) {
      return NextResponse.json(
        { error: 'Vision title is required' },
        { status: 400 }
      );
    }

    // Check for Anthropic API key first, fallback to OpenAI
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const prompt = `You are an expert in personal development and goal achievement, specializing in Dan Martell's "Buy Back Your Time" methodology.

Create a powerful, personalized affirmation for someone with this vision:

Vision: "${visionTitle}"
${visionDescription ? `Description: "${visionDescription}"` : ''}
${smartGoals?.specific ? `Specific Goal: "${smartGoals.specific}"` : ''}
${smartGoals?.measurable ? `Success Metrics: "${smartGoals.measurable}"` : ''}

Guidelines for the affirmation:
1. Write in first person, present tense ("I am..." not "I will be...")
2. Be specific to their vision and goals
3. Include emotional elements - how success feels
4. Make it inspiring but believable
5. Keep it 2-4 sentences
6. Focus on identity and capability ("I am the type of person who...")
7. Include references to action and consistency

Respond with ONLY the affirmation text, no quotes or additional commentary.`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      if (!responseText) {
        return NextResponse.json(
          { error: 'No response from AI' },
          { status: 500 }
        );
      }

      const responseTimeMs = Date.now() - startTime;

      logAIUsage({
        userId,
        endpoint: '/api/ai/generate-affirmation',
        model: 'claude-sonnet-4-20250514',
        promptTokens: message.usage?.input_tokens || 0,
        completionTokens: message.usage?.output_tokens || 0,
        requestType: 'generate-affirmation',
        success: true,
        responseTimeMs,
      });

      return NextResponse.json({ affirmation: responseText.trim() });
    }

    // Fallback to OpenAI if no Anthropic key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI API key not configured' },
        { status: 500 }
      );
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are an expert in personal development and goal achievement, specializing in Dan Martell's "Buy Back Your Time" methodology.

Create a powerful, personalized affirmation for someone with this vision:

Vision: "${visionTitle}"
${visionDescription ? `Description: "${visionDescription}"` : ''}
${smartGoals?.specific ? `Specific Goal: "${smartGoals.specific}"` : ''}
${smartGoals?.measurable ? `Success Metrics: "${smartGoals.measurable}"` : ''}

Guidelines for the affirmation:
1. Write in first person, present tense ("I am..." not "I will be...")
2. Be specific to their vision and goals
3. Include emotional elements - how success feels
4. Make it inspiring but believable
5. Keep it 2-4 sentences
6. Focus on identity and capability ("I am the type of person who...")
7. Include references to action and consistency

Respond with ONLY the affirmation text, no quotes or additional commentary.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const responseText = completion.choices[0]?.message?.content;
    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/generate-affirmation',
      model: 'gpt-4o-mini',
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      requestType: 'generate-affirmation',
      success: true,
      responseTimeMs,
    });

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ affirmation: responseText.trim() });
  } catch (error) {
    console.error('AI Affirmation Generation Error:', error);
    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/generate-affirmation',
      model: 'unknown',
      promptTokens: 0,
      completionTokens: 0,
      requestType: 'generate-affirmation',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs,
    });

    return NextResponse.json(
      { error: 'Failed to generate affirmation' },
      { status: 500 }
    );
  }
}
