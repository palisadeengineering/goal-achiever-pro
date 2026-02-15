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

    // Apply rate limiting (light operation - simple suggestion)
    rateLimitResult = applyMultipleRateLimits(userId, getAIRateLimits(auth.tier, 'light'));

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const { context } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `You are an expert vision and goal-setting coach specializing in proven time optimization methodologies.

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

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 500,
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
      endpoint: '/api/ai/suggest-vision',
      model: 'claude-opus-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
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

    // Strip markdown code blocks if present
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

    let result;
    try {
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('AI response JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'AI returned invalid response format. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(result, {
      headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
    });
  } catch (error) {
    console.error('AI Vision Suggestion Error:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure (only if we have a userId)
    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/suggest-vision',
        model: 'claude-opus-4-20250514',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'suggest-vision',
        success: false,
        errorMessage: sanitizeErrorForClient(error, 'suggest vision'),
        responseTimeMs,
      });
    }

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
