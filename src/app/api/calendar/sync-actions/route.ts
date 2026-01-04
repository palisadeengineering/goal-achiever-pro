import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// Refresh access token if expired
async function refreshTokenIfNeeded(tokens: {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}): Promise<{ access_token: string; refresh_token: string; expiry_date: number } | null> {
  if (Date.now() < tokens.expiry_date - 60000) {
    return tokens;
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const newTokens = await response.json();

    if (!response.ok) {
      return null;
    }

    return {
      access_token: newTokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: Date.now() + (newTokens.expires_in * 1000),
    };
  } catch {
    return null;
  }
}

async function getTokensFromCookie(): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
} | null> {
  const cookieStore = await cookies();
  const tokensCookie = cookieStore.get('google_calendar_tokens');

  if (!tokensCookie) {
    return null;
  }

  try {
    const tokens = JSON.parse(tokensCookie.value);
    return await refreshTokenIfNeeded(tokens);
  } catch {
    return null;
  }
}

// POST: Sync daily actions to Google Calendar
export async function POST(request: NextRequest) {
  try {
    const tokens = await getTokensFromCookie();

    if (!tokens) {
      return NextResponse.json(
        { error: 'Not connected to Google Calendar. Please connect first.' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);
    const body = await request.json();
    const { date, actionIds } = body;

    // Get the target date (default to today)
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Build query for daily actions
    let query = supabase
      .from('daily_actions')
      .select(`
        id,
        title,
        description,
        action_date,
        estimated_minutes,
        status,
        weekly_targets (
          id,
          title,
          monthly_targets (
            power_goals (
              title,
              category,
              visions (
                title,
                color
              )
            )
          )
        )
      `)
      .eq('user_id', userId)
      .neq('status', 'completed');

    // Filter by specific action IDs or date
    if (actionIds && actionIds.length > 0) {
      query = query.in('id', actionIds);
    } else {
      query = query.eq('action_date', targetDate);
    }

    const { data: actions, error } = await query;

    if (error) {
      console.error('Error fetching daily actions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch daily actions' },
        { status: 500 }
      );
    }

    if (!actions || actions.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'No actions to sync',
      });
    }

    // Get user's timezone
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Create calendar events for each action
    const results = [];
    let syncedCount = 0;
    let failedCount = 0;

    for (const action of actions) {
      // Calculate start time (spread throughout the day)
      const actionDate = new Date(action.action_date);
      const startHour = 9 + (results.length % 8); // Start at 9 AM, spread across 8 hours
      actionDate.setHours(startHour, 0, 0, 0);

      const endDate = new Date(actionDate);
      endDate.setMinutes(endDate.getMinutes() + (action.estimated_minutes || 30));

      // Build event description with hierarchy info
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const weeklyTarget = action.weekly_targets as any;
      const monthlyTarget = weeklyTarget?.monthly_targets;
      const powerGoal = monthlyTarget?.power_goals;
      const vision = powerGoal?.visions;

      let description = action.description || '';
      if (vision || powerGoal || weeklyTarget) {
        description += '\n\n---\nGoal Achiever Pro:\n';
        if (vision) description += `Vision: ${vision.title}\n`;
        if (powerGoal) description += `Power Goal: ${powerGoal.title}\n`;
        if (weeklyTarget) description += `Weekly Target: ${weeklyTarget.title}\n`;
      }

      const event = {
        summary: `[GAP] ${action.title}`,
        description: description.trim(),
        start: {
          dateTime: actionDate.toISOString(),
          timeZone,
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone,
        },
        colorId: '9', // Blue color for Goal Achiever Pro events
      };

      try {
        const response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          }
        );

        if (response.ok) {
          const createdEvent = await response.json();
          results.push({
            actionId: action.id,
            eventId: createdEvent.id,
            success: true,
          });
          syncedCount++;
        } else {
          const error = await response.json();
          console.error('Failed to create event:', error);
          results.push({
            actionId: action.id,
            success: false,
            error: error.message,
          });
          failedCount++;
        }
      } catch (err) {
        console.error('Error creating calendar event:', err);
        results.push({
          actionId: action.id,
          success: false,
          error: 'Network error',
        });
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      failed: failedCount,
      total: actions.length,
      results,
      message: `Synced ${syncedCount} of ${actions.length} actions to Google Calendar`,
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync actions to calendar' },
      { status: 500 }
    );
  }
}
