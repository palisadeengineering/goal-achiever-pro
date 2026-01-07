import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { logAIUsage } from '@/lib/utils/ai-usage';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId = DEMO_USER_ID;

  try {
    const supabase = await createClient();
    userId = await getUserId(supabase);

    const body = await request.json();
    const {
      currentValue,
      kpiLevel,
      visionTitle,
      visionDescription,
      context,
      targetValue,
      trackingMethod,
    } = body;

    if (!currentValue && !context) {
      return NextResponse.json(
        { error: 'Current value or context is required' },
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

    const prompt = `You are an expert in OKRs and KPIs, helping someone improve their key performance indicator.

${visionTitle ? `Vision: "${visionTitle}"` : ''}
${visionDescription ? `Description: "${visionDescription}"` : ''}
${kpiLevel ? `KPI Level: ${kpiLevel}` : ''}
${currentValue ? `Current KPI: "${currentValue}"` : ''}
${targetValue ? `Current Target: "${targetValue}"` : ''}
${trackingMethod ? `Tracking Method: ${trackingMethod}` : ''}
${context ? `User's request: "${context}"` : ''}

Improve or suggest a better KPI that:
1. Is SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
2. Has a clear, quantifiable target
3. Is actionable and within the person's control
4. Directly contributes to their vision
5. Is appropriate for the ${kpiLevel || 'specified'} timeframe

For ${kpiLevel || 'this'} KPIs:
- Daily: Focus on specific actions (e.g., "Complete 3 deep work sessions")
- Weekly: Focus on outputs/deliverables (e.g., "Publish 2 blog posts")
- Monthly: Focus on outcomes (e.g., "Increase revenue by 10%")
- Quarterly: Focus on major milestones (e.g., "Launch new product line")

Return ONLY the improved KPI text, no explanations. Format: "[KPI Title]: [Target/Description]"`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const suggestion = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/edit-kpi',
      model: 'claude-opus-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'edit-kpi',
      success: true,
      responseTimeMs,
    });

    return NextResponse.json({ suggestion, kpi: suggestion });
  } catch (error) {
    console.error('Error editing KPI:', error);
    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/edit-kpi',
      model: 'claude-opus-4-20250514',
      promptTokens: 0,
      completionTokens: 0,
      requestType: 'edit-kpi',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs,
    });

    return NextResponse.json(
      { error: 'Failed to edit KPI' },
      { status: 500 }
    );
  }
}
