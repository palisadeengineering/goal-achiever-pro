import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { logAIUsage } from '@/lib/utils/ai-usage';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import {
  applyMultipleRateLimits,
  rateLimitExceededResponse,
  rateLimitHeaders,
  RateLimits,
} from '@/lib/rate-limit';

interface EventInput {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  activityName: string;
  valueQuadrant?: string;
  energyRating?: string;
}

interface CleanupCategory {
  name: string;
  description: string;
  reasoning: string;
  eventIds: string[];
  sampleEvents: string[];
  priority: 'high' | 'medium' | 'low';
}

interface CleanupSuggestions {
  categories: CleanupCategory[];
  summary: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;
  let rateLimitResult: ReturnType<typeof applyMultipleRateLimits> | null = null;

  try {
    // Authenticate user
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    userId = auth.userId;

    // Apply rate limiting (standard operation - analyzing events)
    rateLimitResult = applyMultipleRateLimits(userId, [
      RateLimits.ai.standard,
      RateLimits.ai.daily,
    ]);

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const { events } = await request.json() as { events: EventInput[] };

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required and must not be empty' },
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

    // Prepare event list for analysis
    const eventList = events.map(e => ({
      id: e.id,
      name: e.activityName,
      date: e.date,
      time: `${e.startTime}-${e.endTime}`,
      value: e.valueQuadrant || 'unknown',
      energy: e.energyRating || 'unknown',
    }));

    const today = new Date().toISOString().split('T')[0];

    const prompt = `You are a productivity expert helping a user clean up their calendar. Analyze the following list of calendar events and suggest categories of events that the user might want to delete.

Today's date: ${today}

Events to analyze:
${JSON.stringify(eventList, null, 2)}

Identify patterns and suggest cleanup categories. Consider:
1. **Past Events**: Events that have already occurred and are no longer relevant
2. **Recurring Meetings No Longer Needed**: Regular meetings that may be outdated (standups for old projects, etc.)
3. **Low-Value Activities**: Events marked as "delegation" Value quadrant that should be delegated instead of attended
4. **Energy Drains**: Events marked with "red" energy rating that the user might want to eliminate
5. **Duplicate Events**: Similar events that might be duplicates
6. **Administrative Tasks**: Routine admin tasks that could be batched or eliminated

For each category you identify, provide:
- A clear name for the category
- A description of what types of events are in this category
- Reasoning for why these events might be candidates for deletion
- The IDs of events that fall into this category
- 2-3 sample event names from the category
- Priority level (high/medium/low) based on potential time savings

Respond ONLY with valid JSON in this exact format:
{
  "categories": [
    {
      "name": "Category Name",
      "description": "Brief description of this category",
      "reasoning": "Why these events are candidates for deletion",
      "eventIds": ["id1", "id2", ...],
      "sampleEvents": ["Event Name 1", "Event Name 2"],
      "priority": "high" | "medium" | "low"
    }
  ],
  "summary": "A brief 1-2 sentence summary of the cleanup suggestions"
}

Only include categories that have at least 1 event. If no cleanup suggestions are found, return an empty categories array with an appropriate summary.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Parse the JSON response
    let suggestions: CleanupSuggestions;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, responseText];
      const jsonStr = jsonMatch[1]?.trim() || responseText.trim();
      suggestions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI suggestions' },
        { status: 500 }
      );
    }

    // Log AI usage
    const durationMs = Date.now() - startTime;
    logAIUsage({
      userId,
      endpoint: '/api/ai/suggest-event-cleanup',
      model: 'claude-3-5-haiku-20241022',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'suggest-event-cleanup',
      success: true,
      responseTimeMs: durationMs,
    });

    return NextResponse.json({
      suggestions,
      eventCount: events.length,
      categoriesFound: suggestions.categories.length,
    }, {
      headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
    });
  } catch (error) {
    console.error('Error generating cleanup suggestions:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure (only if we have a userId)
    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/suggest-event-cleanup',
        model: 'claude-3-5-haiku-20241022',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'suggest-event-cleanup',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs,
      });
    }

    return NextResponse.json(
      { error: 'Failed to generate cleanup suggestions' },
      { status: 500 }
    );
  }
}
