import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { vision, smartGoals, targetDate } = await request.json();

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

    const prompt = `You are an expert project planner specializing in Dan Martell's 12 Power Goals methodology. Given the following vision and SMART goals, create a 12-month project plan broken into quarterly Power Goals.

Vision: "${vision}"

SMART Goals:
- Specific: ${smartGoals?.specific || 'Not specified'}
- Measurable: ${smartGoals?.measurable || 'Not specified'}
- Attainable: ${smartGoals?.attainable || 'Not specified'}
- Realistic: ${smartGoals?.realistic || 'Not specified'}
${targetDate ? `Target Completion Date: ${targetDate}` : 'Target: Within 12 months'}

Create a structured 12-month plan with:
1. 12 Power Goals (3 per quarter) that build progressively toward the vision
2. Each goal should be specific, actionable, and completable within its quarter
3. Consider dependencies - earlier goals should enable later ones
4. Include a mix of: foundation work, skill building, implementation, and scaling

Categories to consider:
- health: Physical/mental wellness that supports productivity
- wealth: Financial targets and business metrics
- relationships: Network, team building, partnerships
- career: Skills, credentials, positioning
- business: Systems, products, marketing, sales
- personal: Personal development, habits, mindset

Respond ONLY with valid JSON in this exact format:
{
  "projects": [
    {
      "title": "Goal title (action-oriented)",
      "description": "Brief description of what this achieves",
      "quarter": 1,
      "category": "business",
      "dependencies": [],
      "keyMilestones": ["Milestone 1", "Milestone 2"]
    }
  ],
  "summary": "Brief overview of the 12-month strategy",
  "criticalPath": ["Most important goal IDs in order"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert project planner and goal-setting coach. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const projectPlan = JSON.parse(responseText);

    return NextResponse.json(projectPlan);
  } catch (error) {
    console.error('AI Generation Error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate project plan' },
      { status: 500 }
    );
  }
}
