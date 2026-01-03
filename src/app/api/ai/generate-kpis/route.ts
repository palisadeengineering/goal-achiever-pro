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

    const prompt = `You are an expert goal-setting and accountability coach specializing in Dan Martell's "Buy Back Your Time" methodology. Your job is to create a comprehensive system of KPIs and metrics that makes it UNREASONABLE for someone to fail at achieving their vision.

Vision: "${vision}"
${smartGoals ? `
SMART Goals:
- Specific: ${smartGoals.specific || 'Not provided'}
- Measurable: ${smartGoals.measurable || 'Not provided'}
- Attainable: ${smartGoals.attainable || 'Not provided'}
- Realistic: ${smartGoals.realistic || 'Not provided'}
` : ''}
Target Date: ${targetDate || 'Not specified'}

Create a comprehensive accountability system with:

1. QUARTERLY GOALS (4 major milestones per year)
   - Each quarter should have 2-3 major outcomes that stack toward the vision
   - Include specific revenue/metric targets where applicable

2. MONTHLY TARGETS (what needs to happen each month)
   - 3-4 specific, measurable outcomes per month
   - Should directly contribute to quarterly goals

3. WEEKLY KPIS (leading indicators to track)
   - 5-7 specific metrics to track every week
   - Include both activity metrics (inputs) and result metrics (outputs)
   - Make them specific enough to be tracked in a spreadsheet

4. DAILY HABITS (non-negotiable daily actions)
   - 3-5 specific daily actions that drive the weekly KPIs
   - Include time estimates for each
   - Make them so clear that success/failure is obvious

The system should be designed so that if someone follows the daily habits consistently, hits their weekly KPIs, and achieves their monthly targets, it becomes MATHEMATICALLY UNREASONABLE for them to not achieve the quarterly and annual goals.

Respond ONLY with valid JSON in this exact format:
{
  "quarterlyGoals": [
    {
      "quarter": 1,
      "title": "Q1 Theme/Focus",
      "outcomes": [
        { "metric": "Revenue", "target": "$X", "description": "Why this matters" },
        { "metric": "Customers", "target": "X", "description": "Why this matters" }
      ]
    }
  ],
  "monthlyTargets": [
    {
      "month": 1,
      "monthName": "January",
      "targets": [
        { "title": "Target name", "metric": "X units/dollars/etc", "description": "How to achieve" }
      ]
    }
  ],
  "weeklyKPIs": [
    {
      "category": "Activity/Output",
      "kpi": "KPI Name",
      "target": "X per week",
      "trackingMethod": "How to measure",
      "leadingTo": "What this drives"
    }
  ],
  "dailyHabits": [
    {
      "habit": "Specific action",
      "timeRequired": "X minutes",
      "bestTime": "Morning/Afternoon/Evening",
      "whyItMatters": "Connection to vision"
    }
  ],
  "successFormula": "A brief statement explaining why this system makes failure unreasonable"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert accountability and goal-setting coach. Create specific, measurable, and actionable KPIs. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const kpis = JSON.parse(responseText);

    return NextResponse.json(kpis);
  } catch (error) {
    console.error('AI KPI Generation Error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate KPIs' },
      { status: 500 }
    );
  }
}
