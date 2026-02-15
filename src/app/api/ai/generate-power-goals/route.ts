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
import type { StrategicDiscoveryData } from '@/types/strategic-discovery';

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
    rateLimitResult = applyMultipleRateLimits(userId, getAIRateLimits(auth.tier, 'standard'));

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const { vision, smartGoals, targetDate, count = 4, strategicDiscovery } = await request.json() as {
      vision: string;
      smartGoals?: {
        specific?: string;
        measurable?: string;
        attainable?: string;
        realistic?: string;
      };
      targetDate?: string;
      count?: number;
      strategicDiscovery?: StrategicDiscoveryData;
    };

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

    // Build strategic context if discovery data is available
    let strategicContext = '';
    if (strategicDiscovery && strategicDiscovery.completionScore > 0) {
      const { revenueMath, positioning, product, acquisition } = strategicDiscovery;

      strategicContext = `
STRATEGIC DISCOVERY DATA (Use these specific numbers in your goals):

REVENUE MATH:
- Revenue Target: $${revenueMath?.revenueTarget?.toLocaleString() || 0} ${revenueMath?.revenueType?.toUpperCase() || 'ARR'}
- Monthly Target: $${revenueMath?.revenueType === 'arr' ? Math.round((revenueMath?.revenueTarget || 0) / 12).toLocaleString() : (revenueMath?.revenueTarget || 0).toLocaleString()} MRR
- Price Point: $${revenueMath?.basePrice || 0}/month
- Target Customers: ${revenueMath?.targetCustomerCount?.toLocaleString() || 0}
- Pricing Model: ${revenueMath?.pricingModel || 'Not specified'}

POSITIONING:
- Target Customer: ${positioning?.targetCustomer || 'Not specified'}
- Problem Solved: ${positioning?.problemSolved || 'Not specified'}
- Differentiator: ${positioning?.differentiator || 'Not specified'}
- Market Size: ${positioning?.marketSize || 'Not specified'}

PRODUCT:
- Core Features: ${product?.coreFeatures?.join(', ') || 'Not specified'}
- Retention Strategy: ${product?.retentionStrategy || 'Not specified'}
- Pricing Tiers: ${product?.pricingTiers?.map(t => `${t.name}: $${t.price}`).join(', ') || 'Not specified'}

ACQUISITION:
- Primary Channels: ${acquisition?.primaryChannels?.map(c => c.name).join(', ') || 'Not specified'}
- Estimated CAC: $${acquisition?.estimatedCAC || 0}
- Launch Date: ${acquisition?.launchDate || 'Not specified'}
- Milestones: ${acquisition?.milestones?.map(m => `${m.title} by ${m.targetDate}`).join('; ') || 'Not specified'}

IMPORTANT: Generate Impact Projects that use SPECIFIC NUMBERS from this data. For example:
- "Reach $5,000 MRR" instead of "Grow revenue"
- "Acquire 150 paying customers at $29/mo" instead of "Get more customers"
- "Launch content marketing to reach 500 qualified leads" instead of "Build marketing funnel"
`;
    }

    const prompt = `You are an expert goal-setting coach specializing in strategic Impact Projects methodology for achieving ambitious visions.

Given the following vision and SMART goals, generate ${count} Impact Projects that will directly help achieve this vision.

Vision: "${vision}"

SMART Goals:
- Specific: ${smartGoals?.specific || 'Not specified'}
- Measurable: ${smartGoals?.measurable || 'Not specified'}
- Attainable: ${smartGoals?.attainable || 'Not specified'}
- Realistic: ${smartGoals?.realistic || 'Not specified'}
${targetDate ? `Target Completion Date: ${targetDate}` : ''}
${strategicContext}
Impact Projects are:
1. High-impact projects that move you closer to your vision
2. Specific and measurable with real numbers
3. Achievable within a quarter (90 days)
4. Directly derived from the SMART goal breakdown${strategicDiscovery ? ' and strategic discovery data' : ''}

Generate ${count} Impact Projects distributed across the 4 quarters. Each project should:
- Be action-oriented (start with a verb)
- Have clear success criteria with SPECIFIC NUMBERS (revenue targets, customer counts, etc.)
- Build on the previous quarter's progress
- Align with the measurable targets in the SMART goals${strategicDiscovery ? ' and use the exact numbers from strategic discovery' : ''}

Categories to assign:
- business: Systems, products, marketing, sales, revenue
- career: Skills, credentials, positioning
- health: Physical/mental wellness
- wealth: Financial targets
- relationships: Network, team, partnerships
- personal: Development, habits, mindset

Respond ONLY with valid JSON in this exact format:
{
  "impactProjects": [
    {
      "title": "Action-oriented project title with specific number",
      "description": "What this achieves and why it matters",
      "quarter": 1,
      "category": "business",
      "metrics": ["Specific metric with target number", "Another specific metric"]
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 1500,
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
      endpoint: '/api/ai/generate-power-goals',
      model: 'claude-opus-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'generate-impact-projects',
      success: true,
      responseTimeMs,
    });

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Extract JSON from response (in case AI includes extra text)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(jsonText);
    } catch {
      console.error('JSON parse error. Response text:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    return NextResponse.json(result, {
      headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
    });
  } catch (error) {
    console.error('AI Impact Projects Generation Error:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure (only if we have a userId)
    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/generate-power-goals',
        model: 'claude-opus-4-20250514',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'generate-impact-projects',
        success: false,
        errorMessage: sanitizeErrorForClient(error, 'generate impact projects'),
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
      { error: 'Failed to generate Impact Projects' },
      { status: 500 }
    );
  }
}
