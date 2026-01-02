import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { vision, context } = await request.json();

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

    const prompt = `You are an expert goal-setting coach specializing in Dan Martell's methodology. Given the following vision statement, generate SMART goal components.

Vision: "${vision}"
${context ? `Additional Context: "${context}"` : ''}

Generate the following SMART components in JSON format:
1. specific: A clear, detailed description of exactly what the user wants to achieve (2-3 sentences)
2. measurable: Specific metrics and KPIs to track progress and success (include numbers where possible)
3. attainable: What skills, resources, or knowledge make this goal achievable (be encouraging but realistic)
4. realistic: Why this goal matters now and how it aligns with the user's life priorities
5. timeBound: A suggested deadline and milestones (if not already specified, suggest a reasonable timeframe)

Important guidelines:
- Be specific and actionable
- Use the user's own language and context
- Make metrics concrete and trackable
- Be encouraging but realistic
- Focus on the transformation they want to achieve

Respond ONLY with valid JSON in this exact format:
{
  "specific": "...",
  "measurable": "...",
  "attainable": "...",
  "realistic": "...",
  "suggestedDeadline": "YYYY-MM-DD"
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
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const smartGoals = JSON.parse(responseText);

    return NextResponse.json(smartGoals);
  } catch (error) {
    console.error('AI Generation Error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate SMART goals' },
      { status: 500 }
    );
  }
}
