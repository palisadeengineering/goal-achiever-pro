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

interface DripBreakdown {
  production: number;
  investment: number;
  replacement: number;
  delegation: number;
}

interface TopActivity {
  title: string;
  hours: number;
  quadrant: string;
}

interface CoachingNudgeRequest {
  drip: DripBreakdown;
  previousDrip: DripBreakdown;
  totalHours: number;
  topActivities: TopActivity[];
}

type NudgeType = 'production_change' | 'delegation_opportunity' | 'pattern_insight' | 'positive_trend';

interface CoachingNudge {
  message: string;
  type: NudgeType;
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

    // Apply rate limiting
    rateLimitResult = applyMultipleRateLimits(userId, getAIRateLimits(auth.tier, 'light'));

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const body: CoachingNudgeRequest = await request.json();
    const { drip, previousDrip, totalHours, topActivities } = body;

    if (!drip || !previousDrip) {
      return NextResponse.json(
        { error: 'drip and previousDrip are required' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    // Format top activities for the prompt
    const activitiesSummary = (topActivities || [])
      .slice(0, 10)
      .map((a) => `- "${a.title}": ${a.hours}h (${a.quadrant})`)
      .join('\n');

    // Calculate changes
    const prodChange = drip.production - previousDrip.production;
    const investChange = drip.investment - previousDrip.investment;
    const replChange = drip.replacement - previousDrip.replacement;
    const delegChange = drip.delegation - previousDrip.delegation;

    const totalDrip = drip.production + drip.investment + drip.replacement + drip.delegation;
    const prodPct = totalDrip > 0 ? Math.round((drip.production / totalDrip) * 100) : 0;
    const investPct = totalDrip > 0 ? Math.round((drip.investment / totalDrip) * 100) : 0;
    const replPct = totalDrip > 0 ? Math.round((drip.replacement / totalDrip) * 100) : 0;
    const delegPct = totalDrip > 0 ? Math.round((drip.delegation / totalDrip) * 100) : 0;

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `You are a concise productivity coach. Analyze this person's time data and generate 1-2 specific, actionable coaching nudges.

TIME BREAKDOWN (Value Matrix / DRIP):
- Production (revenue-generating work): ${drip.production}h (${prodPct}% of total, ${prodChange >= 0 ? '+' : ''}${prodChange.toFixed(1)}h vs previous period)
- Investment (skill-building, strategy): ${drip.investment}h (${investPct}%, ${investChange >= 0 ? '+' : ''}${investChange.toFixed(1)}h vs previous)
- Replacement (tasks someone else could do): ${drip.replacement}h (${replPct}%, ${replChange >= 0 ? '+' : ''}${replChange.toFixed(1)}h vs previous)
- Delegation (already delegated): ${drip.delegation}h (${delegPct}%, ${delegChange >= 0 ? '+' : ''}${delegChange.toFixed(1)}h vs previous)
Total tracked: ${totalHours}h

TOP ACTIVITIES:
${activitiesSummary || 'No activities tracked yet.'}

RULES:
1. Reference specific activities or patterns from the data above
2. Suggest concrete actions (e.g. "Block 2 hours for X", "Delegate Y to a VA", "Your Z time increased — keep that momentum")
3. Be encouraging but direct — no fluff
4. Each nudge is 1-2 sentences max
5. Classify each nudge as one of: production_change, delegation_opportunity, pattern_insight, positive_trend

Respond with ONLY valid JSON in this exact format:
{
  "nudges": [
    { "message": "Your coaching nudge here.", "type": "production_change" }
  ]
}`;

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

    // Parse JSON response
    let parsed: { nudges: CoachingNudge[] };
    try {
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      parsed = JSON.parse(jsonText);
    } catch {
      console.error('Failed to parse AI coaching nudge response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Validate nudge types
    const validTypes: NudgeType[] = ['production_change', 'delegation_opportunity', 'pattern_insight', 'positive_trend'];
    const nudges = (parsed.nudges || []).map((n) => ({
      message: String(n.message || ''),
      type: validTypes.includes(n.type) ? n.type : 'pattern_insight' as NudgeType,
    }));

    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/generate-coaching-nudge',
      model: 'claude-sonnet-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'coaching-nudge',
      success: true,
      responseTimeMs,
    });

    return NextResponse.json(
      { nudges },
      {
        headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
      }
    );
  } catch (error) {
    console.error('AI Coaching Nudge Error:', error);
    const responseTimeMs = Date.now() - startTime;

    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/generate-coaching-nudge',
        model: 'claude-sonnet-4-20250514',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'coaching-nudge',
        success: false,
        errorMessage: sanitizeErrorForClient(error, 'generate coaching nudge'),
        responseTimeMs,
      });
    }

    return NextResponse.json(
      { error: 'Failed to generate coaching nudge' },
      { status: 500 }
    );
  }
}
