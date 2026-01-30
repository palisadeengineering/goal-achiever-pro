import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { logAIUsage } from '@/lib/utils/ai-usage';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';
import {
  applyMultipleRateLimits,
  rateLimitExceededResponse,
  rateLimitHeaders,
  RateLimits,
} from '@/lib/rate-limit';

interface TimeBlockInput {
  date: string;
  startTime: string;
  endTime: string;
  activityName: string;
  valueQuadrant: string;
  energyRating: string;
  durationMinutes: number;
}

interface Insight {
  type: 'optimization' | 'pattern' | 'goal_alignment' | 'energy';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  metric?: string;
}

interface InsightsResponse {
  insights: Insight[];
  summary: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;
  let rateLimitResult: ReturnType<typeof applyMultipleRateLimits> | null = null;

  try {
    // Authenticate user
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    userId = auth.userId;

    // Apply rate limiting
    rateLimitResult = applyMultipleRateLimits(userId, [
      RateLimits.ai.standard,
      RateLimits.ai.daily,
    ]);

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const { timeBlocks, dateRange } = await request.json() as {
      timeBlocks: TimeBlockInput[];
      dateRange: { start: string; end: string };
    };

    if (!timeBlocks || !Array.isArray(timeBlocks) || timeBlocks.length === 0) {
      return NextResponse.json(
        { error: 'Time blocks array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    // Fetch user's Impact Projects for goal alignment analysis
    const supabase = await createClient();
    let impactProjects: { id: string; title: string; quarter: number }[] = [];

    if (supabase) {
      const { data: projects } = await supabase
        .from('power_goals')
        .select('id, title, quarter')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('quarter', { ascending: true });

      impactProjects = projects || [];
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Calculate summary statistics for the prompt
    const totalMinutes = timeBlocks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    // Group by value quadrant
    const valueBreakdown: Record<string, number> = {};
    timeBlocks.forEach(b => {
      valueBreakdown[b.valueQuadrant] = (valueBreakdown[b.valueQuadrant] || 0) + b.durationMinutes;
    });

    // Group by energy rating
    const energyBreakdown: Record<string, number> = {};
    timeBlocks.forEach(b => {
      energyBreakdown[b.energyRating] = (energyBreakdown[b.energyRating] || 0) + b.durationMinutes;
    });

    // Group by hour of day for energy patterns
    const hourlyEnergy: Record<number, { green: number; yellow: number; red: number }> = {};
    timeBlocks.forEach(b => {
      const hour = parseInt(b.startTime.split(':')[0]);
      if (!hourlyEnergy[hour]) {
        hourlyEnergy[hour] = { green: 0, yellow: 0, red: 0 };
      }
      if (b.energyRating === 'green' || b.energyRating === 'yellow' || b.energyRating === 'red') {
        hourlyEnergy[hour][b.energyRating] += b.durationMinutes;
      }
    });

    // Group by day of week
    const dayOfWeekBreakdown: Record<string, number> = {};
    timeBlocks.forEach(b => {
      const date = new Date(b.date);
      const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
      dayOfWeekBreakdown[day] = (dayOfWeekBreakdown[day] || 0) + b.durationMinutes;
    });

    // Top activities by time
    const activityTime: Record<string, number> = {};
    timeBlocks.forEach(b => {
      const name = b.activityName.toLowerCase().trim();
      activityTime[name] = (activityTime[name] || 0) + b.durationMinutes;
    });
    const topActivities = Object.entries(activityTime)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, minutes]) => ({ name, hours: (minutes / 60).toFixed(1) }));

    const prompt = `You are a productivity coach analyzing time tracking data. Generate personalized, actionable insights based on the data below.

## Time Tracking Data Summary
- Date Range: ${dateRange.start} to ${dateRange.end}
- Total Time Tracked: ${totalHours} hours across ${timeBlocks.length} time blocks

## Value Quadrant Breakdown (minutes)
${Object.entries(valueBreakdown).map(([q, m]) => `- ${q}: ${(m/60).toFixed(1)} hours (${Math.round(m/totalMinutes*100)}%)`).join('\n')}

## Energy Rating Breakdown (minutes)
${Object.entries(energyBreakdown).map(([r, m]) => `- ${r === 'green' ? 'Energizing' : r === 'yellow' ? 'Neutral' : 'Draining'}: ${(m/60).toFixed(1)} hours (${Math.round(m/totalMinutes*100)}%)`).join('\n')}

## Top 10 Activities by Time
${topActivities.map((a, i) => `${i+1}. ${a.name}: ${a.hours} hours`).join('\n')}

## Day of Week Distribution
${Object.entries(dayOfWeekBreakdown).map(([d, m]) => `- ${d}: ${(m/60).toFixed(1)} hours`).join('\n')}

## Hourly Energy Patterns
${Object.entries(hourlyEnergy)
  .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  .map(([h, e]) => {
    const total = e.green + e.yellow + e.red;
    if (total === 0) return null;
    const dominant = e.green >= e.yellow && e.green >= e.red ? 'Energizing' :
                     e.red >= e.yellow ? 'Draining' : 'Neutral';
    return `- ${h}:00: ${dominant} (${Math.round(total/60*10)/10}h tracked)`;
  })
  .filter(Boolean)
  .join('\n')}

${impactProjects.length > 0 ? `## User's Impact Projects (Active Goals)
${impactProjects.map(p => `- Q${p.quarter}: ${p.title}`).join('\n')}` : ''}

## Your Task
Generate 3-5 specific, actionable insights covering:
1. **Optimization tips**: Specific suggestions to improve productivity based on patterns
2. **Pattern detection**: Notable trends or anomalies in the data
3. **Goal alignment**: How time aligns with their Impact Projects (if any)
4. **Energy coaching**: Recommendations based on energy patterns

Prioritize insights that are:
- Specific and data-driven (reference actual numbers)
- Actionable (the user can do something about it)
- Personalized to THIS user's patterns

Respond ONLY with valid JSON in this exact format:
{
  "insights": [
    {
      "type": "optimization" | "pattern" | "goal_alignment" | "energy",
      "title": "Short actionable title (5-10 words)",
      "description": "Detailed explanation with specific recommendations (2-3 sentences)",
      "priority": "high" | "medium" | "low",
      "metric": "Key supporting statistic (optional)"
    }
  ],
  "summary": "1-2 sentence overview of the most important finding"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Parse the JSON response
    let insightsResponse: InsightsResponse;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, responseText];
      const jsonStr = jsonMatch[1]?.trim() || responseText.trim();
      insightsResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI insights' },
        { status: 500 }
      );
    }

    // Log AI usage
    const durationMs = Date.now() - startTime;
    logAIUsage({
      userId,
      endpoint: '/api/ai/generate-time-insights',
      model: 'claude-3-5-haiku-20241022',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'generate-time-insights',
      success: true,
      responseTimeMs: durationMs,
    });

    return NextResponse.json({
      ...insightsResponse,
      dataQuality: {
        totalHoursAnalyzed: parseFloat(totalHours),
        timeBlocksAnalyzed: timeBlocks.length,
        dateRange,
      },
    }, {
      headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
    });
  } catch (error) {
    console.error('Error generating time insights:', error);
    const responseTimeMs = Date.now() - startTime;

    // Log the failure
    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/generate-time-insights',
        model: 'claude-3-5-haiku-20241022',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'generate-time-insights',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs,
      });
    }

    return NextResponse.json(
      { error: 'Failed to generate time insights' },
      { status: 500 }
    );
  }
}
