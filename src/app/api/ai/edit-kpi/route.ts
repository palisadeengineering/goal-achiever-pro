import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    const suggestion = completion.choices[0]?.message?.content?.trim() || '';

    return NextResponse.json({ suggestion, kpi: suggestion });
  } catch (error) {
    console.error('Error editing KPI:', error);
    return NextResponse.json(
      { error: 'Failed to edit KPI' },
      { status: 500 }
    );
  }
}
