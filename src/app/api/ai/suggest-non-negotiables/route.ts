import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visionTitle, visionDescription, currentValue, context } = body;

    if (!visionTitle && !currentValue) {
      return NextResponse.json(
        { error: 'Vision title or current value is required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are an expert life coach helping someone create a powerful daily non-negotiable habit.

${visionTitle ? `Their vision is: "${visionTitle}"` : ''}
${visionDescription ? `Description: "${visionDescription}"` : ''}
${currentValue ? `They want to improve this non-negotiable: "${currentValue}"` : ''}
${context ? `Additional context: "${context}"` : ''}

Create a specific, actionable daily non-negotiable that:
1. Directly supports their vision
2. Is measurable and trackable
3. Can be completed in 5-30 minutes daily
4. Builds momentum and confidence
5. Is specific enough to be clear when it's done

Examples of good non-negotiables:
- "Read for 20 minutes every morning before checking email"
- "Do a 10-minute evening reflection and journal 3 wins"
- "Exercise for 30 minutes first thing in the morning"
- "Review vision board and affirmations twice daily"

Return ONLY the non-negotiable title/description, no explanations.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    const suggestion = completion.choices[0]?.message?.content?.trim() || '';

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Error suggesting non-negotiable:', error);
    return NextResponse.json(
      { error: 'Failed to suggest non-negotiable' },
      { status: 500 }
    );
  }
}
