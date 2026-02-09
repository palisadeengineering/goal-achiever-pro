import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { logAIUsage } from '@/lib/utils/ai-usage';
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

    // Apply rate limiting (light operation - short suggestion)
    rateLimitResult = applyMultipleRateLimits(userId, getAIRateLimits(auth.tier, 'light'));

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

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
      model: 'claude-opus-4-20250514',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });

    const suggestion = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/suggest-non-negotiables',
      model: 'claude-opus-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'suggest-non-negotiables',
      success: true,
      responseTimeMs,
    });

    return NextResponse.json({ suggestion }, {
      headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
    });
  } catch (error) {
    console.error('Error suggesting non-negotiable:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure (only if we have a userId)
    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/suggest-non-negotiables',
        model: 'claude-opus-4-20250514',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'suggest-non-negotiables',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs,
      });
    }

    return NextResponse.json(
      { error: 'Failed to suggest non-negotiable' },
      { status: 500 }
    );
  }
}
