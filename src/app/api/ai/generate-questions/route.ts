import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vision, description } = body;

    if (!vision && !description) {
      return NextResponse.json(
        { error: 'Vision or description required' },
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

    const prompt = `Analyze this vision/goal and identify any metrics or measurable targets that would benefit from clarifying questions.

Vision: ${vision || 'Not provided'}
Description: ${description || 'Not provided'}

Look for:
1. Revenue/financial targets (e.g., "$10k MRR", "make $1M")
2. User/customer targets (e.g., "100 customers", "10k users")
3. Growth metrics (e.g., "grow by 50%", "double revenue")
4. Time-based commitments (e.g., "workout daily", "read 50 books")
5. Business metrics (e.g., "launch a course", "build a team")

For each metric found, generate 1-3 smart clarifying questions that would help make KPIs more realistic and mathematically grounded.

Respond with a JSON object:
{
  "metricsFound": [
    {
      "metric": "The metric or target mentioned",
      "type": "revenue|users|growth|habit|business",
      "questions": [
        {
          "id": "unique_id",
          "question": "The clarifying question",
          "placeholder": "Example answer or hint",
          "helperText": "Why this matters for realistic goal-setting"
        }
      ]
    }
  ],
  "hasMetrics": true/false
}

If no clear metrics are found, return: { "metricsFound": [], "hasMetrics": false }

Make questions specific and helpful. For revenue, ask about customer count and pricing. For users, ask about acquisition channels. For habits, ask about current baseline.`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 800,
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
    console.error('AI question generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
