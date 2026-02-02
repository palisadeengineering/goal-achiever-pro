import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

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

async function getTokensFromDatabase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
} | null> {
  if (!supabase) return null;

  try {
    const { data: integration, error } = await supabase
      .from('user_integrations')
      .select('access_token, refresh_token, token_expiry, is_active')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .single();

    if (error || !integration || !integration.is_active) {
      return null;
    }

    if (!integration.access_token || !integration.refresh_token) {
      return null;
    }

    const tokens = {
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      expiry_date: new Date(integration.token_expiry).getTime(),
    };

    // Refresh if needed and update database
    const refreshedTokens = await refreshTokenIfNeeded(tokens);

    if (refreshedTokens && refreshedTokens.access_token !== tokens.access_token) {
      // Token was refreshed, update the database
      await supabase
        .from('user_integrations')
        .update({
          access_token: refreshedTokens.access_token,
          token_expiry: new Date(refreshedTokens.expiry_date).toISOString(),
        })
        .eq('user_id', userId)
        .eq('provider', 'google_calendar');
    }

    return refreshedTokens;
  } catch {
    return null;
  }
}

interface DailyAction {
  id: string;
  title: string;
  description: string | null;
  action_date: string;
  estimated_minutes: number | null;
  status: string;
  scheduled_start_time: string | null;
  calendar_event_id: string | null;
  weekly_targets: {
    id: string;
    title: string;
    monthly_targets: {
      power_goals: {
        title: string;
        category: string;
        visions: {
          title: string;
          color: string | null;
        } | null;
      } | null;
    } | null;
  } | null;
}

// POST: Sync all daily actions for a backtrack plan to Google Calendar
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Try to get tokens from database first, then fall back to cookie
    let tokens = await getTokensFromDatabase(supabase, userId);
    if (!tokens) {
      tokens = await getTokensFromCookie();
    }

    if (!tokens) {
      return NextResponse.json(
        { error: 'Not connected to Google Calendar. Please connect first.', needsAuth: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { backtrackPlanId, visionId, syncAll = false, onlyFuture = true } = body;

    if (!backtrackPlanId && !visionId && !syncAll) {
      return NextResponse.json(
        { error: 'Either backtrackPlanId, visionId, or syncAll must be provided' },
        { status: 400 }
      );
    }

    // Get today's date for filtering future actions
    const today = new Date().toISOString().split('T')[0];

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
        scheduled_start_time,
        calendar_event_id,
        weekly_targets!inner (
          id,
          title,
          monthly_targets!inner (
            power_goals!inner (
              title,
              category,
              backtrack_plan_id,
              visions (
                title,
                color
              )
            )
          )
        )
      `)
      .eq('user_id', userId)
      .is('calendar_event_id', null) // Only sync unsynced actions
      .neq('status', 'completed');

    // Filter by backtrack plan or vision
    if (backtrackPlanId) {
      query = query.eq('weekly_targets.monthly_targets.power_goals.backtrack_plan_id', backtrackPlanId);
    } else if (visionId) {
      query = query.eq('weekly_targets.monthly_targets.power_goals.vision_id', visionId);
    }

    // Only sync future actions if requested
    if (onlyFuture) {
      query = query.gte('action_date', today);
    }

    // Order by date for sequential time slot assignment
    query = query.order('action_date', { ascending: true });

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
        message: 'No new actions to sync',
      });
    }

    // Get user's timezone
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Track which actions are on which dates for time slot assignment
    const dateSlots: Record<string, number> = {};

    // Create calendar events for each action
    const results: Array<{
      actionId: string;
      eventId?: string;
      success: boolean;
      error?: string;
    }> = [];
    let syncedCount = 0;
    let failedCount = 0;

    // Batch process to avoid rate limiting (max 10 concurrent)
    const batchSize = 10;
    for (let i = 0; i < actions.length; i += batchSize) {
      const batch = actions.slice(i, i + batchSize) as unknown as DailyAction[];

      const batchPromises = batch.map(async (action) => {
        // Calculate start time (spread throughout the day)
        const actionDate = new Date(action.action_date + 'T00:00:00');

        // Get slot for this date
        if (!dateSlots[action.action_date]) {
          dateSlots[action.action_date] = 0;
        }
        const slot = dateSlots[action.action_date];
        dateSlots[action.action_date]++;

        // Use scheduled time if available, otherwise spread throughout day
        let startHour = 9;
        let startMinute = 0;

        if (action.scheduled_start_time) {
          const [h, m] = action.scheduled_start_time.split(':').map(Number);
          startHour = h;
          startMinute = m;
        } else {
          // Spread actions: 9 AM start, 1 hour slots
          startHour = 9 + Math.floor(slot);
          startMinute = (slot % 1) * 60;

          // If we've gone past 5 PM, wrap to next day's morning
          if (startHour >= 17) {
            startHour = 9 + (startHour - 17);
          }
        }

        actionDate.setHours(startHour, startMinute, 0, 0);

        const endDate = new Date(actionDate);
        endDate.setMinutes(endDate.getMinutes() + (action.estimated_minutes || 30));

        // Build event description with hierarchy info
        const weeklyTarget = action.weekly_targets;
        const monthlyTarget = weeklyTarget?.monthly_targets;
        const powerGoal = monthlyTarget?.power_goals;
        const vision = powerGoal?.visions;

        let description = action.description || '';
        if (vision || powerGoal || weeklyTarget) {
          description += '\n\n---\nGoal Achiever Pro:\n';
          if (vision) description += `🎯 Vision: ${vision.title}\n`;
          if (powerGoal) description += `💪 Power Goal: ${powerGoal.title}\n`;
          if (weeklyTarget) description += `📅 Weekly Target: ${weeklyTarget.title}\n`;
          description += `\n🔗 Track at: ${process.env.NEXT_PUBLIC_APP_URL || 'https://goalachieverpro.com'}/today`;
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
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 10 },
            ],
          },
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

            // Update the daily action with calendar info
            await supabase
              .from('daily_actions')
              .update({
                calendar_event_id: createdEvent.id,
                calendar_sync_status: 'synced',
                calendar_synced_at: new Date().toISOString(),
                scheduled_start_time: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`,
                scheduled_end_time: `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:00`,
              })
              .eq('id', action.id);

            return {
              actionId: action.id,
              eventId: createdEvent.id,
              success: true,
            };
          } else {
            const errorData = await response.json();
            console.error('Failed to create event:', errorData);

            // Update action with error
            await supabase
              .from('daily_actions')
              .update({
                calendar_sync_status: 'error',
                calendar_sync_error: errorData.message || 'Failed to create event',
              })
              .eq('id', action.id);

            return {
              actionId: action.id,
              success: false,
              error: errorData.message,
            };
          }
        } catch (err) {
          console.error('Error creating calendar event:', err);

          // Update action with error
          await supabase
            .from('daily_actions')
            .update({
              calendar_sync_status: 'error',
              calendar_sync_error: 'Network error',
            })
            .eq('id', action.id);

          return {
            actionId: action.id,
            success: false,
            error: 'Network error',
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      batchResults.forEach(r => {
        if (r.success) syncedCount++;
        else failedCount++;
      });

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < actions.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
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

// GET: Check sync status for a backtrack plan
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const backtrackPlanId = searchParams.get('backtrackPlanId');
    const visionId = searchParams.get('visionId');

    if (!backtrackPlanId && !visionId) {
      return NextResponse.json(
        { error: 'Either backtrackPlanId or visionId is required' },
        { status: 400 }
      );
    }

    // Get sync statistics
    let query = supabase
      .from('daily_actions')
      .select(`
        id,
        calendar_sync_status,
        weekly_targets!inner (
          monthly_targets!inner (
            power_goals!inner (
              backtrack_plan_id,
              vision_id
            )
          )
        )
      `)
      .eq('user_id', userId);

    if (backtrackPlanId) {
      query = query.eq('weekly_targets.monthly_targets.power_goals.backtrack_plan_id', backtrackPlanId);
    } else if (visionId) {
      query = query.eq('weekly_targets.monthly_targets.power_goals.vision_id', visionId);
    }

    const { data: actions, error } = await query;

    if (error) {
      console.error('Error fetching sync status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sync status' },
        { status: 500 }
      );
    }

    const stats = {
      total: actions?.length || 0,
      synced: actions?.filter(a => a.calendar_sync_status === 'synced').length || 0,
      pending: actions?.filter(a => a.calendar_sync_status === 'pending').length || 0,
      notSynced: actions?.filter(a => a.calendar_sync_status === 'not_synced' || !a.calendar_sync_status).length || 0,
      error: actions?.filter(a => a.calendar_sync_status === 'error').length || 0,
    };

    // Check if Google Calendar is connected
    const cookieStore = await cookies();
    const tokensCookie = cookieStore.get('google_calendar_tokens');
    const isConnected = !!tokensCookie;

    return NextResponse.json({
      ...stats,
      isConnected,
      syncPercentage: stats.total > 0 ? Math.round((stats.synced / stats.total) * 100) : 0,
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
