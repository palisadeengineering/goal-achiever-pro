import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { logAIUsage } from '@/lib/utils/ai-usage';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import {
  applyMultipleRateLimits,
  rateLimitExceededResponse,
  rateLimitHeaders,
  RateLimits,
} from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';

// Activity types that can be detected
export type ActivityType = 'project' | 'meeting' | 'commute' | 'deep_work' | 'admin' | 'break' | 'other';

interface ClassifyActivityRequest {
  activityName: string;
  description?: string;
  attendeeCount?: number;
  calendarMetadata?: {
    eventType?: string;
    organizer?: string;
    isRecurring?: boolean;
  };
}

interface ClassifyActivityResponse {
  activityType: ActivityType;
  projectName?: string;
  meetingCategory?: string;
  confidence: number;
  reasoning: string;
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
      RateLimits.ai.light,
      RateLimits.ai.daily,
    ]);

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const body: ClassifyActivityRequest = await request.json();
    const { activityName, description, attendeeCount, calendarMetadata } = body;

    if (!activityName) {
      return NextResponse.json(
        { error: 'Activity name is required' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    // Fetch user's existing detected projects for context
    const adminClient = createAdminClient();
    let projectNames = 'None yet';

    if (adminClient) {
      const { data: existingProjects } = await adminClient
        .from('detected_projects')
        .select('name')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .limit(50);

      if (existingProjects && existingProjects.length > 0) {
        projectNames = existingProjects.map((p: { name: string }) => p.name).join(', ');
      }
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `You are a productivity assistant helping classify work activities for time tracking analytics.

Given this time tracking activity:
- Activity Name: "${activityName}"
${description ? `- Description: "${description}"` : ''}
${attendeeCount !== undefined ? `- Attendee Count: ${attendeeCount}` : ''}
${calendarMetadata?.eventType ? `- Calendar Event Type: "${calendarMetadata.eventType}"` : ''}
${calendarMetadata?.isRecurring ? '- This is a recurring event' : ''}

User's existing projects: ${projectNames}

Classify this activity into one of these types:
- meeting: Scheduled time with other people (syncs, standups, 1:1s, client calls, interviews)
- project: Focused work on a specific initiative or deliverable
- deep_work: Uninterrupted focused work (coding, writing, designing, strategic thinking)
- commute: Travel time (driving, public transit, walking to work)
- admin: Administrative tasks (email, scheduling, expense reports, invoicing, paperwork)
- break: Rest time (lunch, coffee, personal break)
- other: Doesn't fit other categories

Classification rules:
1. If attendeeCount > 1 OR activity mentions "meeting", "sync", "standup", "call", "1:1", "interview" → likely meeting
2. If activity mentions a proper noun project name or "[Client Name]" pattern → likely project, extract project name
3. If activity mentions "drive", "commute", "travel to", "Uber", "train" → commute
4. If activity mentions "focus", "deep work", "writing", "coding", "design session" → deep_work
5. If activity mentions "email", "admin", "expense", "invoice", "scheduling", "slack cleanup" → admin
6. If activity mentions "lunch", "break", "coffee", "personal" → break

For meetings, also suggest a category: "1:1", "Team Meeting", "Client Call", "Interview", "Training", or "Ad-hoc"

Respond with ONLY valid JSON in this exact format:
{
  "activityType": "meeting",
  "projectName": "Project Name if detected, or null",
  "meetingCategory": "1:1 or Team Meeting etc, or null if not a meeting",
  "confidence": 0.85,
  "reasoning": "Brief explanation (under 30 words)"
}

Important:
- projectName should only be set if you detect a clear project/initiative name
- meetingCategory should only be set if activityType is "meeting"
- confidence: 0.0-1.0 based on how certain you are`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
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

    // Parse JSON response
    let result: ClassifyActivityResponse;
    try {
      // Try to extract JSON if wrapped in code blocks
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      result = JSON.parse(jsonText);
    } catch {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Validate and normalize activity type
    const validTypes: ActivityType[] = ['project', 'meeting', 'commute', 'deep_work', 'admin', 'break', 'other'];
    if (!validTypes.includes(result.activityType)) {
      result.activityType = 'other';
    }

    // Clean up response
    if (result.projectName === 'null' || result.projectName === null) {
      result.projectName = undefined;
    }
    if (result.meetingCategory === 'null' || result.meetingCategory === null) {
      result.meetingCategory = undefined;
    }

    const responseTimeMs = Date.now() - startTime;

    logAIUsage({
      userId,
      endpoint: '/api/ai/classify-activity',
      model: 'claude-opus-4-20250514',
      promptTokens: message.usage?.input_tokens || 0,
      completionTokens: message.usage?.output_tokens || 0,
      requestType: 'classify-activity',
      success: true,
      responseTimeMs,
    });

    return NextResponse.json({
      activityType: result.activityType,
      projectName: result.projectName,
      meetingCategory: result.meetingCategory,
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || '',
    }, {
      headers: rateLimitResult ? rateLimitHeaders(rateLimitResult) : {},
    });
  } catch (error) {
    console.error('AI Activity Classification Error:', error);
    const responseTimeMs = Date.now() - startTime;

    if (userId) {
      logAIUsage({
        userId,
        endpoint: '/api/ai/classify-activity',
        model: 'claude-opus-4-20250514',
        promptTokens: 0,
        completionTokens: 0,
        requestType: 'classify-activity',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        responseTimeMs,
      });
    }

    return NextResponse.json(
      { error: 'Failed to classify activity' },
      { status: 500 }
    );
  }
}
