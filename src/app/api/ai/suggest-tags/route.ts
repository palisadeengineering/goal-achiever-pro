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

interface TagInfo {
  name: string;
  id: string;
  color: string;
}

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

    // Apply rate limiting (light operation - quick suggestion)
    rateLimitResult = applyMultipleRateLimits(userId, getAIRateLimits(auth.tier, 'light'));

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const { activityName, description, existingTags } = await request.json();

    if (!activityName) {
      return NextResponse.json(
        { error: 'Activity name is required' },
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

    const tagList = (existingTags as TagInfo[])?.map((t) => t.name).join(', ') || 'None defined';

    const prompt = `You are a productivity assistant helping categorize work activities with relevant tags.

Given this time tracking activity:
- Activity Name: "${activityName}"
${description ? `- Description: "${description}"` : ''}

Available tags: ${tagList}

Analyze the activity and suggest the most relevant tags. Consider:
1. BUSINESS CONTEXT (highest priority):
   - Is this Personal time (gym, family, hobbies, self-care)?
   - Is this Main Business work (core job duties, primary company)?
   - Is this Side Business (freelance, side projects, secondary ventures)?
   - Is this Client Work (billable work, client meetings, deliverables)?
2. The type of work (meetings, deep work, admin, creative, etc.)
3. The project or client it might relate to

ALWAYS suggest a business context tag if one exists in the available tags (Personal, Main Business, Side Business, Client Work, or similar).

If existing tags fit well, prefer those. Only suggest new tags if no existing tags are appropriate.

Respond with ONLY valid JSON in this exact format:
{
  "suggestedExistingTags": ["exact tag name 1", "exact tag name 2"],
  "suggestedNewTags": ["new tag if needed"],
  "confidence": 0.8,
  "reasoning": "Brief explanation of why these tags fit"
}

Rules:
- suggestedExistingTags must contain EXACT names from the available tags list
- Always include a business context tag first if available
- suggestedNewTags should only have 0-2 items, only when truly needed
- confidence: 0.0-1.0 based on how well the tags match
- Keep reasoning under 50 words`;

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

    // Parse JSON response
    let result;
    try {
      // Try to extract JSON if wrapped in code blocks
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      result = JSON.parse(jsonText);
    } catch {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Map suggested tag names back to tag IDs
    const suggestedTagIds = (result.suggestedExistingTags || [])
      .map((name: string) => {
        const tag = (existingTags as TagInfo[])?.find(
          (t) => t.name.toLowerCase() === name.toLowerCase()
        );
        return tag?.id;
      })
      .filter(Boolean);

    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/suggest-tags',
      model: 'claude-opus-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'suggest-tags',
      success: true,
      responseTimeMs,
    });

    return NextResponse.json({
      suggestedExistingTags: result.suggestedExistingTags || [],
      suggestedNewTags: result.suggestedNewTags || [],
      suggestedTagIds,
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || '',
    }, {
      headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
    });
  } catch (error) {
    console.error('AI Tag Suggestion Error:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure (only if we have a userId)
    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/suggest-tags',
        model: 'claude-opus-4-20250514',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'suggest-tags',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs,
      });
    }

    return NextResponse.json(
      { error: 'Failed to generate tag suggestions' },
      { status: 500 }
    );
  }
}
