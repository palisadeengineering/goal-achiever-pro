import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { logAIUsage } from '@/lib/utils/ai-usage';
import { sanitizeErrorForClient } from '@/lib/utils/api-errors';
import { getAuthenticatedUserWithTier } from '@/lib/auth/api-auth';
import {
  applyMultipleRateLimits,
  rateLimitExceededResponse,
  rateLimitHeaders,
  getAIRateLimits,
} from '@/lib/rate-limit';

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

    // Apply rate limiting (light operation - short text generation)
    rateLimitResult = applyMultipleRateLimits(userId, getAIRateLimits(auth.tier, 'light'));

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const body = await request.json();
    const { visionTitle, visionDescription, smartGoals } = body;

    if (!visionTitle) {
      return NextResponse.json(
        { error: 'Vision title is required' },
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

    const prompt = `You are an expert in personal development and goal achievement, specializing in proven time optimization methodologies.

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
      model: 'claude-opus-4-20250514',
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
      model: 'claude-opus-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'generate-affirmation',
      success: true,
      responseTimeMs,
    });

    return NextResponse.json({ affirmation: responseText.trim() }, {
      headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
    });
  } catch (error) {
    console.error('AI Affirmation Generation Error:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure (only if we have a userId)
    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/generate-affirmation',
        model: 'claude-opus-4-20250514',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'generate-affirmation',
        success: false,
        errorMessage: sanitizeErrorForClient(error, 'generate affirmation'),
        responseTimeMs,
      });
    }

    return NextResponse.json(
      { error: 'Failed to generate affirmation' },
      { status: 500 }
    );
  }
}
