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
import type {
  StrategicDiscoveryRequest,
  StrategicDiscoveryResponse,
  CategoryQuestion,
  DiscoveryCategory,
} from '@/types/strategic-discovery';

// Generate initial questions for strategic discovery
function getInitialQuestions(): CategoryQuestion[] {
  return [
    // Revenue Math
    {
      id: 'revenue-target',
      category: 'revenue',
      question: 'What is your revenue target?',
      type: 'number',
      placeholder: '500000',
      helperText: 'Annual or monthly target in dollars',
      required: true,
    },
    {
      id: 'revenue-type',
      category: 'revenue',
      question: 'Is this MRR, ARR, or a one-time target?',
      type: 'select',
      options: ['MRR (Monthly Recurring)', 'ARR (Annual Recurring)', 'One-time revenue'],
      required: true,
    },
    {
      id: 'target-date',
      category: 'revenue',
      question: 'By when do you need to hit this target?',
      type: 'date',
      required: true,
    },
    {
      id: 'pricing-model',
      category: 'revenue',
      question: 'What pricing model fits your product?',
      type: 'select',
      options: ['Mass Market ($5-15/mo)', 'Prosumer ($25-50/mo)', 'SMB ($75-150/mo)', 'Enterprise ($200+/mo)', 'Hybrid/Tiered'],
      helperText: 'This determines how many customers you need',
      required: true,
    },
    // Positioning
    {
      id: 'target-customer',
      category: 'positioning',
      question: 'Who is your ideal customer? Be specific.',
      type: 'text',
      placeholder: 'e.g., SaaS founders with $10K-100K MRR who struggle with time management',
      required: true,
    },
    {
      id: 'problem-solved',
      category: 'positioning',
      question: 'What painful problem do you solve?',
      type: 'text',
      placeholder: 'e.g., Founders waste 20+ hours/week on low-value tasks because they lack a system',
      required: true,
    },
    {
      id: 'competitors',
      category: 'positioning',
      question: 'Who are your main competitors? What alternatives exist?',
      type: 'text',
      placeholder: 'e.g., Notion, Asana, pen and paper, hiring an assistant',
      required: false,
    },
    {
      id: 'differentiator',
      category: 'positioning',
      question: 'Why would someone choose you over alternatives?',
      type: 'text',
      placeholder: 'e.g., Only tool that integrates DRIP methodology with automated time tracking',
      required: true,
    },
    // Product
    {
      id: 'core-features',
      category: 'product',
      question: 'What are the 3-5 core features that deliver your value?',
      type: 'text',
      placeholder: 'e.g., Time audit, DRIP matrix, Power Goals tracking, AI coaching',
      required: true,
    },
    {
      id: 'retention-strategy',
      category: 'product',
      question: 'What keeps users coming back daily/weekly?',
      type: 'text',
      placeholder: 'e.g., Daily review habit, progress tracking, accountability reminders',
      required: true,
    },
    // Acquisition
    {
      id: 'primary-channel',
      category: 'acquisition',
      question: 'What is your primary customer acquisition channel?',
      type: 'select',
      options: ['Content marketing (blog, YouTube, podcast)', 'Social media (Twitter, LinkedIn)', 'Paid ads (Google, Facebook)', 'Partnerships/affiliates', 'Direct outreach/sales', 'Product-led growth/referrals'],
      required: true,
    },
    {
      id: 'launch-date',
      category: 'acquisition',
      question: 'When do you plan to launch or when did you launch?',
      type: 'date',
      required: false,
    },
  ];
}

// Build the strategic discovery prompt based on action
function buildPrompt(request: StrategicDiscoveryRequest): string {
  const { action, visionTitle, visionDescription, smartGoals, currentData, category, userMessage } = request;

  const baseContext = `You are an expert business strategist conducting a strategic discovery session. Your style is direct, numbers-focused, and reality-grounding. Always provide specific numbers, percentages, and timelines.

Vision: "${visionTitle}"
${visionDescription ? `Description: "${visionDescription}"` : ''}
${smartGoals ? `
SMART Goals:
- Specific: ${smartGoals.specific || 'Not specified'}
- Measurable: ${smartGoals.measurable || 'Not specified'}
- Attainable: ${smartGoals.attainable || 'Not specified'}
- Realistic: ${smartGoals.realistic || 'Not specified'}
- Time-bound: ${smartGoals.timeBound || 'Not specified'}
` : ''}`;

  switch (action) {
    case 'analyze':
      return `${baseContext}

Analyze this vision and generate strategic insights. Based on any numerical targets detected:

1. REVENUE MATH - If a revenue target is mentioned, break it down:
   - Convert to monthly target
   - Show 3-4 pricing model options with exact customer counts needed
   - Recommend the most realistic option

2. POSITIONING ANALYSIS - Identify:
   - Likely target customer profile
   - Probable problem being solved
   - Market positioning considerations

3. KEY QUESTIONS - Generate 3-5 probing follow-up questions that will help clarify:
   - Revenue model specifics
   - Customer acquisition approach
   - Product differentiation

Respond ONLY with valid JSON:
{
  "revenueAnalysis": {
    "detectedTarget": number or null,
    "monthlyTarget": number or null,
    "options": [
      {
        "name": "Model Name",
        "pricePerMonth": number,
        "customersNeeded": number,
        "description": "Why this works or doesn't",
        "recommended": boolean
      }
    ],
    "recommendation": "Which option and why"
  },
  "positioningAnalysis": {
    "likelyCustomer": "Description",
    "likelyProblem": "Description",
    "marketNotes": "Considerations"
  },
  "followUpQuestions": [
    "Question 1?",
    "Question 2?",
    "Question 3?"
  ],
  "insights": ["Insight 1", "Insight 2"]
}`;

    case 'follow-up':
      return `${baseContext}

Current Strategic Discovery Data:
${JSON.stringify(currentData, null, 2)}

The user said: "${userMessage}"

Based on their response, provide:
1. Acknowledgment of what they shared
2. 1-2 deeper follow-up questions that drill into specifics
3. Any immediate insights or concerns
4. What category to explore next if current one is complete

Respond ONLY with valid JSON:
{
  "acknowledgment": "Brief acknowledgment of their answer",
  "followUpQuestions": ["Question 1?", "Question 2?"],
  "insights": ["Insight based on their answer"],
  "concerns": ["Any red flags or things to consider"],
  "nextCategory": "${category === 'revenue' ? 'positioning' : category === 'positioning' ? 'product' : category === 'product' ? 'acquisition' : 'complete'}" or null,
  "categoryComplete": boolean
}`;

    case 'summarize':
      return `${baseContext}

Complete Strategic Discovery Data:
${JSON.stringify(currentData, null, 2)}

Synthesize all the discovery information into a comprehensive business model summary.

Respond ONLY with valid JSON:
{
  "businessModel": "2-3 sentence description of the business model",
  "keyMetrics": {
    "monthlyRevenue": "Target",
    "customerCount": "Target",
    "avgPrice": "Price point",
    "cac": "Estimated CAC"
  },
  "criticalPath": [
    "Step 1 to achieve goal",
    "Step 2",
    "Step 3"
  ],
  "estimatedTimeToGoal": "X months",
  "riskFactors": ["Risk 1", "Risk 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    case 'generate-insights':
      return `${baseContext}

Complete Strategic Discovery Data:
${JSON.stringify(currentData, null, 2)}

Generate comprehensive AI insights and Power Goal recommendations.

Respond ONLY with valid JSON:
{
  "aiInsights": {
    "revenueAnalysis": "Detailed analysis of revenue path",
    "riskFactors": ["Risk 1", "Risk 2", "Risk 3"],
    "recommendations": ["Rec 1", "Rec 2", "Rec 3"],
    "successProbability": 75,
    "strengthAreas": ["Strength 1", "Strength 2"],
    "gapAreas": ["Gap 1", "Gap 2"]
  },
  "powerGoalRecommendations": [
    {
      "title": "Q1: Goal Title",
      "description": "What to achieve",
      "quarter": 1,
      "category": "business",
      "linkedToDiscovery": {
        "section": "revenue",
        "metric": "MRR",
        "target": "$10,000"
      }
    },
    {
      "title": "Q2: Goal Title",
      "description": "What to achieve",
      "quarter": 2,
      "category": "business",
      "linkedToDiscovery": {
        "section": "acquisition",
        "metric": "customers",
        "target": "100"
      }
    }
  ]
}`;

    case 'calculate-revenue':
      const revData = currentData?.revenueMath;
      return `Given a revenue target of $${revData?.revenueTarget || 0} ${revData?.revenueType || 'ARR'} by ${revData?.targetTimeframe || 'end of year'}:

Calculate and present:
1. Monthly target breakdown
2. 4 pricing model options with exact customer counts
3. Recommended approach based on typical solo founder constraints

Respond ONLY with valid JSON:
{
  "monthlyTarget": number,
  "yearlyTarget": number,
  "monthsRemaining": number,
  "options": [
    {
      "name": "Model Name",
      "pricePerMonth": number,
      "customersNeeded": number,
      "description": "Analysis",
      "recommended": boolean
    }
  ],
  "recommendation": "Clear recommendation with reasoning",
  "mathBreakdown": "Show the math: $X / $Y = Z customers"
}`;

    default:
      return baseContext;
  }
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

    // Apply rate limiting (heavy operation - generates strategic insights)
    rateLimitResult = applyMultipleRateLimits(userId, [
      RateLimits.ai.heavy,
      RateLimits.ai.daily,
    ]);

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const body: StrategicDiscoveryRequest = await request.json();
    const { action, visionTitle } = body;

    if (!visionTitle) {
      return NextResponse.json(
        { error: 'Vision title is required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required (analyze, follow-up, summarize, generate-insights, calculate-revenue)' },
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
      endpoint: '/api/ai/strategic-discovery',
      model: 'claude-opus-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: `strategic-discovery-${action}`,
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

    // Build response based on action
    const response: StrategicDiscoveryResponse = {};

    switch (action) {
      case 'analyze':
        response.revenueOptions = aiResult.revenueAnalysis?.options;
        response.followUpQuestions = aiResult.followUpQuestions;
        response.insights = aiResult.insights;
        response.initialQuestions = getInitialQuestions();
        break;

      case 'follow-up':
        response.followUpQuestions = aiResult.followUpQuestions;
        response.insights = aiResult.insights || [];
        if (aiResult.concerns) {
          response.insights = [...(response.insights || []), ...aiResult.concerns];
        }
        response.nextCategory = aiResult.nextCategory as DiscoveryCategory;
        break;

      case 'summarize':
        response.summary = {
          businessModel: aiResult.businessModel,
          keyMetrics: aiResult.keyMetrics,
          criticalPath: aiResult.criticalPath,
          estimatedTimeToGoal: aiResult.estimatedTimeToGoal,
        };
        break;

      case 'generate-insights':
        response.aiInsights = aiResult.aiInsights;
        response.powerGoalRecommendations = aiResult.powerGoalRecommendations;
        break;

      case 'calculate-revenue':
        response.revenueBreakdown = {
          monthlyTarget: aiResult.monthlyTarget,
          yearlyTarget: aiResult.yearlyTarget,
          options: aiResult.options,
          recommendation: aiResult.recommendation,
        };
        break;
    }

    return NextResponse.json(response, {
      headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
    });
  } catch (error) {
    console.error('Strategic Discovery AI Error:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure (only if we have a userId)
    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/strategic-discovery',
        model: 'claude-opus-4-20250514',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'strategic-discovery',
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
      { error: 'Failed to process strategic discovery' },
      { status: 500 }
    );
  }
}
