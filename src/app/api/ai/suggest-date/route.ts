import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vision, description, context } = body;

    if (!vision && !description) {
      return NextResponse.json(
        { error: 'Vision title or description required' },
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

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const prompt = `Analyze this vision/goal and suggest a realistic target date.

Vision: ${vision || 'Not provided'}
Description: ${description || 'Not provided'}
Additional Context: ${context || 'None'}

Today's date: ${todayStr}

Consider:
1. The complexity and scope of the goal
2. Typical timelines for similar achievements
3. The need for sustainable progress (not too rushed)
4. Milestones that would need to be achieved along the way

Respond with a JSON object:
{
  "suggestedDate": "YYYY-MM-DD",
  "reasoning": "Brief explanation of why this timeline is realistic (1-2 sentences)",
  "timeframe": "Description like '18 months' or '2 years'",
  "keyMilestones": ["milestone 1", "milestone 2", "milestone 3"]
}

Be realistic but ambitious. For business goals, consider typical growth curves. For personal goals, consider the time needed for sustainable habit change.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI date suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to suggest date' },
      { status: 500 }
    );
  }
}
