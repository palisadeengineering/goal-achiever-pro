import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { logAIUsage } from '@/lib/utils/ai-usage';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { generateSmartSchema, parseWithErrors } from '@/lib/validations';
import {
  applyMultipleRateLimits,
  rateLimitExceededResponse,
  rateLimitHeaders,
  RateLimits,
} from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;

  try {
    // Authenticate user
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    userId = auth.userId;

    // Apply rate limiting (per-minute and daily limits)
    const rateLimitResult = applyMultipleRateLimits(userId, [
      RateLimits.ai.standard,
      RateLimits.ai.daily,
    ]);

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    // Validate request body
    const body = await request.json();
    const validation = parseWithErrors(generateSmartSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, validationErrors: validation.errors },
        { status: 400 }
      );
    }

    const { vision, context } = validation.data;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `You are an expert goal-setting coach specializing in proven productivity methodologies. Given the following vision statement, generate SMART goal components.

Vision: "${vision}"
${context ? `Additional Context: "${context}"` : ''}

Generate the following SMART components in JSON format:
1. specific: A clear, detailed description of exactly what the user wants to achieve (2-3 sentences)
2. measurable: Specific metrics and KPIs to track progress and success (include numbers where possible)
3. attainable: What skills, resources, or knowledge make this goal achievable (be encouraging but realistic)
4. realistic: Why this goal matters now and how it aligns with the user's life priorities
5. timeBound: A suggested deadline and milestones (if not already specified, suggest a reasonable timeframe)

Important guidelines:
- Be specific and actionable
- Use the user's own language and context
- Make metrics concrete and trackable
- Be encouraging but realistic
- Focus on the transformation they want to achieve

Respond ONLY with valid JSON in this exact format:
{
  "specific": "...",
  "measurable": "...",
  "attainable": "...",
  "realistic": "...",
  "suggestedDeadline": "YYYY-MM-DD"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 1000,
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
      endpoint: '/api/ai/generate-smart',
      model: 'claude-opus-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'generate-smart',
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

    let smartGoals;
    try {
      smartGoals = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('AI response JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'AI returned invalid response format. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(smartGoals, {
      headers: rateLimitHeaders(rateLimitResult),
    });
  } catch (error) {
    console.error('AI Generation Error:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure (only if we have a userId)
    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/generate-smart',
        model: 'claude-opus-4-20250514',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'generate-smart',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
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
      { error: 'Failed to generate SMART goals' },
      { status: 500 }
    );
  }
}
