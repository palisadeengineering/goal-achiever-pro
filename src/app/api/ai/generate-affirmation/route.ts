import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visionTitle, visionDescription, smartGoals } = body;

    if (!visionTitle) {
      return NextResponse.json(
        { error: 'Vision title is required' },
        { status: 400 }
      );
    }

    // Check for Anthropic API key first, fallback to OpenAI
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const prompt = `You are an expert in personal development and goal achievement, specializing in Dan Martell's "Buy Back Your Time" methodology.

Create a powerful, personalized affirmation for someone with this vision:

Vision: "${visionTitle}"
${visionDescription ? `Description: "${visionDescription}"` : ''}
${smartGoals?.specific ? `Specific Goal: "${smartGoals.specific}"` : ''}
${smartGoals?.measurable ? `Success Metrics: "${smartGoals.measurable}"` : ''}

Guidelines for the affirmation:
1. Write in first person, present tense ("I am..." not "I will be...")
2. Be specific to their vision and goals
3. Include emotional elements - how success feels
4. Make it inspiring but believable
5. Keep it 2-4 sentences
6. Focus on identity and capability ("I am the type of person who...")
7. Include references to action and consistency

Respond with ONLY the affirmation text, no quotes or additional commentary.`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      if (!responseText) {
        return NextResponse.json(
          { error: 'No response from AI' },
          { status: 500 }
        );
      }

      return NextResponse.json({ affirmation: responseText.trim() });
    }

    // Fallback to OpenAI if no Anthropic key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI API key not configured' },
        { status: 500 }
      );
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are an expert in personal development and goal achievement, specializing in Dan Martell's "Buy Back Your Time" methodology.

Create a powerful, personalized affirmation for someone with this vision:

Vision: "${visionTitle}"
${visionDescription ? `Description: "${visionDescription}"` : ''}
${smartGoals?.specific ? `Specific Goal: "${smartGoals.specific}"` : ''}
${smartGoals?.measurable ? `Success Metrics: "${smartGoals.measurable}"` : ''}

Guidelines for the affirmation:
1. Write in first person, present tense ("I am..." not "I will be...")
2. Be specific to their vision and goals
3. Include emotional elements - how success feels
4. Make it inspiring but believable
5. Keep it 2-4 sentences
6. Focus on identity and capability ("I am the type of person who...")
7. Include references to action and consistency

Respond with ONLY the affirmation text, no quotes or additional commentary.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ affirmation: responseText.trim() });
  } catch (error) {
    console.error('AI Affirmation Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate affirmation' },
      { status: 500 }
    );
  }
}
