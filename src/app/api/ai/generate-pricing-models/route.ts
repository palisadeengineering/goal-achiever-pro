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
import type {
  GeneratePricingModelsRequest,
  GeneratePricingModelsResponse,
  BusinessType,
  DynamicPricingOption,
} from '@/types/strategic-discovery';

function buildPrompt(request: GeneratePricingModelsRequest): string {
  const { targetRevenue, revenueType, targetDate, positioning, visionContext } = request;

  // Calculate months remaining
  const today = new Date();
  const target = new Date(targetDate);
  const monthsRemaining = Math.max(
    1,
    Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30))
  );

  return `You are an expert business pricing strategist. Analyze the following business context and generate appropriate pricing models tailored to this SPECIFIC business type.

## Business Context
- Target Customer: ${positioning.targetCustomer}
- Problem Solved: ${positioning.problemSolved}
- Competitors: ${positioning.competitors || 'Not specified'}
- Differentiator: ${positioning.differentiator || 'Not specified'}
${visionContext ? `- Vision: ${visionContext}` : ''}

## Revenue Target
- Target: $${targetRevenue.toLocaleString()} (${revenueType.toUpperCase()})
- Target Date: ${targetDate}
- Months Remaining: ${monthsRemaining}

## Instructions

1. FIRST, analyze the business context to determine the business type:
   - "saas" - Software as a Service (recurring software subscriptions)
   - "service" - Professional services (consulting, engineering, legal, medical, etc.)
   - "agency" - Creative or marketing agency work
   - "ecommerce" - Product sales (physical or digital products)
   - "marketplace" - Platform connecting buyers and sellers
   - "hybrid" - Combination of multiple models

2. THEN, generate 3-5 pricing models that are ACTUALLY APPROPRIATE for this business type:

   For SERVICE businesses (consulting, engineering, legal, medical):
   - Project-based pricing ($5K - $500K+ per project depending on scope)
   - Hourly rates ($100 - $500+/hour for professionals)
   - Monthly retainer ($2K - $50K/month)
   - Value-based pricing (% of client outcome)

   For SaaS businesses:
   - Monthly subscription tiers ($10 - $500+/month)
   - Usage-based pricing
   - Freemium + premium
   - Annual contracts

   For AGENCY businesses:
   - Project-based ($5K - $100K+ per project)
   - Monthly retainer ($3K - $30K/month)
   - Hourly rates ($75 - $250/hour)

   For E-COMMERCE:
   - Per-unit pricing with margins
   - Subscription boxes
   - Wholesale vs retail

3. For EACH pricing model, calculate:
   - How many clients/projects/units needed to hit the revenue target
   - Whether this is realistic given the timeframe
   - Why this model does or doesn't fit this business

4. Recommend the OPTIMAL model with clear rationale

## Important
- DO NOT suggest "$29/month subscriptions" for a structural engineering firm
- DO NOT suggest "per-project pricing" for a consumer SaaS app
- Match the pricing structure to how THIS specific industry actually prices

Respond ONLY with valid JSON in this exact structure:
{
  "detectedBusinessType": "service" | "saas" | "agency" | "ecommerce" | "marketplace" | "hybrid",
  "businessTypeRationale": "Why this business type was detected based on the context",
  "pricingOptions": [
    {
      "name": "Model Name (e.g., 'Mid-Size Commercial Projects')",
      "structure": "project" | "subscription" | "hourly" | "retainer" | "value_based" | "tiered" | "freemium",
      "baseAmount": number,
      "maxAmount": number | null,
      "unit": "per project" | "per month" | "per hour" | "per year" | "per unit",
      "clientsNeeded": number,
      "description": "What this pricing model covers",
      "recommended": boolean,
      "rationale": "Why this does/doesn't work for their business and target"
    }
  ],
  "recommendation": "Clear recommendation on which model to pursue and why, including the path to hitting the target",
  "mathBreakdown": "Show the math: $X target / $Y per [unit] = Z [units] needed over N months"
}`;
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

    // Apply rate limiting (standard operation - generates pricing analysis)
    rateLimitResult = applyMultipleRateLimits(userId, getAIRateLimits(auth.tier, 'standard'));

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const body: GeneratePricingModelsRequest = await request.json();
    const { targetRevenue, revenueType, targetDate, positioning } = body;

    // Validation
    if (!targetRevenue || targetRevenue <= 0) {
      return NextResponse.json(
        { error: 'Valid target revenue is required' },
        { status: 400 }
      );
    }

    if (!targetDate) {
      return NextResponse.json(
        { error: 'Target date is required' },
        { status: 400 }
      );
    }

    if (!positioning?.targetCustomer || !positioning?.problemSolved) {
      return NextResponse.json(
        { error: 'Target customer and problem solved are required for AI pricing generation. Please fill out the Positioning section first.' },
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

    const prompt = buildPrompt(body);

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

    // Log AI usage
    logAIUsage({
      userId,
      endpoint: '/api/ai/generate-pricing-models',
      model: 'claude-opus-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'generate-pricing-models',
      success: true,
      responseTimeMs,
    });

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Extract JSON from response
    let jsonText = responseText;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    // Parse the JSON response
    let aiResult;
    try {
      aiResult = JSON.parse(jsonText);
    } catch {
      console.error('JSON parse error. Response text:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: responseText.substring(0, 500) },
        { status: 500 }
      );
    }

    // Validate and type the response
    const response: GeneratePricingModelsResponse = {
      detectedBusinessType: aiResult.detectedBusinessType as BusinessType,
      businessTypeRationale: aiResult.businessTypeRationale || '',
      pricingOptions: (aiResult.pricingOptions || []).map((opt: DynamicPricingOption) => ({
        name: opt.name,
        structure: opt.structure,
        baseAmount: opt.baseAmount,
        maxAmount: opt.maxAmount || undefined,
        unit: opt.unit,
        clientsNeeded: opt.clientsNeeded,
        description: opt.description,
        recommended: opt.recommended || false,
        rationale: opt.rationale || '',
      })),
      recommendation: aiResult.recommendation || '',
      mathBreakdown: aiResult.mathBreakdown || '',
    };

    return NextResponse.json(response, {
      headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
    });
  } catch (error) {
    console.error('Generate Pricing Models AI Error:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure (only if we have a userId)
    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/generate-pricing-models',
        model: 'claude-opus-4-20250514',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'generate-pricing-models',
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
      { error: 'Failed to generate pricing models' },
      { status: 500 }
    );
  }
}
