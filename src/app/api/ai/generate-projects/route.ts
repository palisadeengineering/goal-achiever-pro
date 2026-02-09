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

    // Apply rate limiting (heavy operation - generates 12-month project plan)
    rateLimitResult = applyMultipleRateLimits(userId, getAIRateLimits(auth.tier, 'heavy'));

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

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

    const prompt = `You are an expert project planner specializing in the 12 Impact Projects methodology. Given the following vision and SMART goals, create a 12-month project plan broken into quarterly Impact Projects.

Vision: "${vision}"

SMART Goals:
- Specific: ${smartGoals?.specific || 'Not specified'}
- Measurable: ${smartGoals?.measurable || 'Not specified'}
- Attainable: ${smartGoals?.attainable || 'Not specified'}
- Realistic: ${smartGoals?.realistic || 'Not specified'}
${targetDate ? `Target Completion Date: ${targetDate}` : 'Target: Within 12 months'}

Create a structured 12-month plan with:
1. 12 Impact Projects (3 per quarter) that build progressively toward the vision
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

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2000,
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
      endpoint: '/api/ai/generate-projects',
      model: 'claude-opus-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
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

    const projectPlan = JSON.parse(cleanedResponse);

    return NextResponse.json(projectPlan, {
      headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
    });
  } catch (error) {
    console.error('AI Generation Error:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure (only if we have a userId)
    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/generate-projects',
        model: 'claude-opus-4-20250514',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'generate-projects',
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
      { error: 'Failed to generate project plan' },
      { status: 500 }
    );
  }
}
