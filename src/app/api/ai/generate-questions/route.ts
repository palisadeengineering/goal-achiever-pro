import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert business coach who helps people set realistic, data-driven goals. You ask smart questions to uncover the math behind ambitious targets.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
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
