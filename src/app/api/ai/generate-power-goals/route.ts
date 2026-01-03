import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { vision, smartGoals, targetDate, count = 4 } = await request.json();

    if (!vision) {
      return NextResponse.json(
        { error: 'Vision statement is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are an expert goal-setting coach specializing in Dan Martell's Power Goals methodology from "Buy Back Your Time".

Given the following vision and SMART goals, generate ${count} Power Goals that will directly help achieve this vision.

Vision: "${vision}"

SMART Goals:
- Specific: ${smartGoals?.specific || 'Not specified'}
- Measurable: ${smartGoals?.measurable || 'Not specified'}
- Attainable: ${smartGoals?.attainable || 'Not specified'}
- Realistic: ${smartGoals?.realistic || 'Not specified'}
${targetDate ? `Target Completion Date: ${targetDate}` : ''}

Power Goals are:
1. High-impact goals that move you closer to your vision
2. Specific and measurable
3. Achievable within a quarter (90 days)
4. Directly derived from the SMART goal breakdown

Generate ${count} Power Goals distributed across the 4 quarters. Each goal should:
- Be action-oriented (start with a verb)
- Have clear success criteria
- Build on the previous quarter's progress
- Align with the measurable targets in the SMART goals

Categories to assign:
- business: Systems, products, marketing, sales, revenue
- career: Skills, credentials, positioning
- health: Physical/mental wellness
- wealth: Financial targets
- relationships: Network, team, partnerships
- personal: Development, habits, mindset

Respond ONLY with valid JSON in this exact format:
{
  "powerGoals": [
    {
      "title": "Action-oriented goal title",
      "description": "What this achieves and why it matters",
      "quarter": 1,
      "category": "business",
      "metrics": ["Specific metric 1", "Specific metric 2"]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert goal-setting coach. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const result = JSON.parse(responseText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Power Goals Generation Error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate Power Goals' },
      { status: 500 }
    );
  }
}
