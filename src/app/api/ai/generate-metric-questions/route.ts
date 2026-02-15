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

export interface MetricQuestion {
  id: string;
  question: string;
  type: 'number' | 'text' | 'currency' | 'percentage' | 'time';
  context: string;
  category: 'outcome' | 'activity';
  placeholder?: string;
  unit?: string;
}

export interface GenerateMetricQuestionsResponse {
  questions: MetricQuestion[];
  visionSummary: string;
  suggestedTimeframe: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;
  let rateLimitResult: ReturnType<typeof applyMultipleRateLimits> | null = null;

  try {
    // Authenticate user
    const auth = await getAuthenticatedUserWithTier();
    if (!auth.isAuthenticated) {
      console.error('Auth failed:', auth.error, 'Status:', auth.status);
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    userId = auth.userId;
    console.log('Authenticated user:', userId);

    // Apply rate limiting (standard operation)
    rateLimitResult = applyMultipleRateLimits(userId, getAIRateLimits(auth.tier, 'standard'));

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const { vision } = await request.json();

    if (!vision || typeof vision !== 'string' || vision.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a vision description (at least 10 characters)' },
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

    const prompt = `You are an expert goal-setting coach. A user has described their vision/goal. Your job is to generate 5-10 targeted questions that will help understand their CURRENT metrics and capabilities, so we can create a realistic plan.

USER'S VISION:
"${vision}"

Generate questions that ask about:
1. OUTCOME METRICS (2-4 questions) - Current state of results they care about
   - Revenue, customers, followers, weight, savings, etc.
   - Where they are NOW, not where they want to be

2. ACTIVITY METRICS (3-6 questions) - Current capacity and inputs
   - How much time they have available
   - What activities they currently do
   - Resources they have access to
   - Skills/team they have

The questions should:
- Be specific and quantifiable (ask for numbers)
- Help determine realistic targets based on their current baseline
- Uncover potential bottlenecks or constraints
- Be relevant to their specific vision

Respond ONLY with valid JSON in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "question": "What is your current monthly revenue?",
      "type": "currency",
      "context": "This helps us set realistic revenue targets based on your baseline.",
      "category": "outcome",
      "placeholder": "e.g., 5000",
      "unit": "USD"
    },
    {
      "id": "q2",
      "question": "How many hours per week can you dedicate to this goal?",
      "type": "number",
      "context": "Understanding your available time helps create an achievable plan.",
      "category": "activity",
      "placeholder": "e.g., 20",
      "unit": "hours"
    }
  ],
  "visionSummary": "A brief 1-2 sentence summary capturing the essence of their vision",
  "suggestedTimeframe": "12 months"
}

Question types:
- "number": General numeric value
- "currency": Money values
- "percentage": Percentage values (0-100)
- "time": Time duration
- "text": Short text answer (use sparingly, prefer quantifiable)

Generate between 5-10 questions total. Focus on what's MOST important for creating their plan.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
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

    // Log AI usage
    logAIUsage({
      userId,
      endpoint: '/api/ai/generate-metric-questions',
      model: 'claude-sonnet-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'generate-metric-questions',
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

    const result: GenerateMetricQuestionsResponse = JSON.parse(cleanedResponse);

    // Validate response structure
    if (!result.questions || !Array.isArray(result.questions) || result.questions.length < 5) {
      return NextResponse.json(
        { error: 'Invalid AI response: insufficient questions generated' },
        { status: 500 }
      );
    }

    return NextResponse.json(result, {
      headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
    });
  } catch (error) {
    console.error('Generate metric questions error:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure
    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/generate-metric-questions',
        model: 'claude-sonnet-4-20250514',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'generate-metric-questions',
        success: false,
        errorMessage: sanitizeErrorForClient(error, 'generate metric questions'),
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
      { error: 'Failed to generate metric questions' },
      { status: 500 }
    );
  }
}
