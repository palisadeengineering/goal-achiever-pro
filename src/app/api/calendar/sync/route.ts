import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { format, startOfQuarter, endOfQuarter, addDays, startOfMonth, startOfWeek } from 'date-fns';
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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const newTokens = await response.json();
    if (!response.ok) return null;

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
  if (!tokensCookie) return null;

  try {
    const tokens = JSON.parse(tokensCookie.value);
    return await refreshTokenIfNeeded(tokens);
  } catch {
    return null;
  }
}

// Color IDs for Google Calendar (1-11)
const LEVEL_COLORS: Record<string, string> = {
  quarterly: '5', // Yellow
  monthly: '9', // Blue
  weekly: '10', // Green
  daily: '1', // Lavender
};

interface SyncResult {
  entityType: string;
  entityId: string;
  eventId?: string;
  success: boolean;
  error?: string;
}

// POST: Full sync for all goal levels
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

    const tokens = await getTokensFromCookie();
    if (!tokens) {
      return NextResponse.json(
        { error: 'Not connected to Google Calendar. Please connect first.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      visionId,
      levels = ['quarterly', 'monthly', 'weekly', 'daily'],
      startDate,
      endDate,
    } = body;

    // Get sync settings
    const { data: settings } = await supabase
      .from('calendar_sync_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const results: SyncResult[] = [];
    let syncedCount = 0;
    let failedCount = 0;

    // Sync Quarterly Targets
    if (levels.includes('quarterly') && settings?.sync_quarterly_targets !== false) {
      const { data: quarterlyTargets } = await supabase
        .from('quarterly_targets')
        .select('*, visions(title, color)')
        .eq('user_id', userId)
        .neq('status', 'completed');

      if (quarterlyTargets) {
        for (const target of quarterlyTargets) {
          if (visionId && target.vision_id !== visionId) continue;

          const quarterStart = startOfQuarter(new Date(target.year, (target.quarter - 1) * 3, 1));
          const quarterEnd = endOfQuarter(quarterStart);

          const result = await createCalendarEvent(tokens.access_token, {
            summary: `[GAP Q${target.quarter}] ${target.title}`,
            description: buildDescription(target, 'quarterly'),
            start: { date: format(quarterStart, 'yyyy-MM-dd') },
            end: { date: format(addDays(quarterEnd, 1), 'yyyy-MM-dd') },
            colorId: settings?.quarterly_color_id || LEVEL_COLORS.quarterly,
          });

          results.push({
            entityType: 'quarterly_target',
            entityId: target.id,
            eventId: result.eventId,
            success: result.success,
            error: result.error,
          });

          if (result.success) {
            syncedCount++;
            // Store sync record
            await supabase.from('calendar_sync_records').upsert({
              user_id: userId,
              entity_type: 'quarterly_target',
              entity_id: target.id,
              google_event_id: result.eventId,
              google_calendar_id: 'primary',
              sync_status: 'synced',
              last_synced_at: new Date().toISOString(),
            });
          } else {
            failedCount++;
          }
        }
      }
    }

    // Sync Monthly Targets
    if (levels.includes('monthly') && settings?.sync_monthly_targets !== false) {
      const { data: monthlyTargets } = await supabase
        .from('monthly_targets')
        .select('*, power_goals(title, visions(title, color))')
        .eq('user_id', userId)
        .neq('status', 'completed');

      if (monthlyTargets) {
        for (const target of monthlyTargets) {
          const monthStart = startOfMonth(new Date(target.target_year, target.target_month - 1, 1));
          const monthEnd = addDays(monthStart, 30);

          const result = await createCalendarEvent(tokens.access_token, {
            summary: `[GAP Monthly] ${target.title}`,
            description: buildDescription(target, 'monthly'),
            start: { date: format(monthStart, 'yyyy-MM-dd') },
            end: { date: format(monthEnd, 'yyyy-MM-dd') },
            colorId: settings?.monthly_color_id || LEVEL_COLORS.monthly,
          });

          results.push({
            entityType: 'monthly_target',
            entityId: target.id,
            eventId: result.eventId,
            success: result.success,
            error: result.error,
          });

          if (result.success) {
            syncedCount++;
            await supabase.from('calendar_sync_records').upsert({
              user_id: userId,
              entity_type: 'monthly_target',
              entity_id: target.id,
              google_event_id: result.eventId,
              google_calendar_id: 'primary',
              sync_status: 'synced',
              last_synced_at: new Date().toISOString(),
            });
          } else {
            failedCount++;
          }
        }
      }
    }

    // Sync Weekly Targets
    if (levels.includes('weekly') && settings?.sync_weekly_targets !== false) {
      const { data: weeklyTargets } = await supabase
        .from('weekly_targets')
        .select('*, monthly_targets(title, power_goals(title, visions(title, color)))')
        .eq('user_id', userId)
        .neq('status', 'completed');

      if (weeklyTargets) {
        for (const target of weeklyTargets) {
          const weekStart = new Date(target.week_start_date);
          const weekEnd = new Date(target.week_end_date);

          // Create 2-hour focus block on Monday morning
          const focusBlockStart = startOfWeek(weekStart, { weekStartsOn: 1 });
          focusBlockStart.setHours(9, 0, 0, 0);
          const focusBlockEnd = new Date(focusBlockStart);
          focusBlockEnd.setHours(11, 0, 0, 0);

          const result = await createCalendarEvent(tokens.access_token, {
            summary: `[GAP Weekly] ${target.title}`,
            description: buildDescription(target, 'weekly'),
            start: { dateTime: focusBlockStart.toISOString(), timeZone },
            end: { dateTime: focusBlockEnd.toISOString(), timeZone },
            colorId: settings?.weekly_color_id || LEVEL_COLORS.weekly,
          });

          results.push({
            entityType: 'weekly_target',
            entityId: target.id,
            eventId: result.eventId,
            success: result.success,
            error: result.error,
          });

          if (result.success) {
            syncedCount++;
            await supabase.from('calendar_sync_records').upsert({
              user_id: userId,
              entity_type: 'weekly_target',
              entity_id: target.id,
              google_event_id: result.eventId,
              google_calendar_id: 'primary',
              sync_status: 'synced',
              last_synced_at: new Date().toISOString(),
            });
          } else {
            failedCount++;
          }
        }
      }
    }

    // Sync Daily Actions (existing logic)
    if (levels.includes('daily') && settings?.sync_daily_actions !== false) {
      const targetDate = startDate || format(new Date(), 'yyyy-MM-dd');

      let query = supabase
        .from('daily_actions')
        .select(`
          id, title, description, action_date, estimated_minutes, status,
          weekly_targets(title, monthly_targets(power_goals(title, visions(title, color))))
        `)
        .eq('user_id', userId)
        .neq('status', 'completed');

      if (startDate && endDate) {
        query = query.gte('action_date', startDate).lte('action_date', endDate);
      } else {
        query = query.eq('action_date', targetDate);
      }

      const { data: dailyActions } = await query;

      if (dailyActions) {
        for (let i = 0; i < dailyActions.length; i++) {
          const action = dailyActions[i];
          const actionDate = new Date(action.action_date);
          const startHour = 9 + (i % 8);
          actionDate.setHours(startHour, 0, 0, 0);

          const endDate = new Date(actionDate);
          endDate.setMinutes(endDate.getMinutes() + (action.estimated_minutes || 30));

          const result = await createCalendarEvent(tokens.access_token, {
            summary: `[GAP] ${action.title}`,
            description: buildDescription(action, 'daily'),
            start: { dateTime: actionDate.toISOString(), timeZone },
            end: { dateTime: endDate.toISOString(), timeZone },
            colorId: settings?.daily_color_id || LEVEL_COLORS.daily,
          });

          results.push({
            entityType: 'daily_action',
            entityId: action.id,
            eventId: result.eventId,
            success: result.success,
            error: result.error,
          });

          if (result.success) {
            syncedCount++;
            await supabase.from('calendar_sync_records').upsert({
              user_id: userId,
              entity_type: 'daily_action',
              entity_id: action.id,
              google_event_id: result.eventId,
              google_calendar_id: 'primary',
              sync_status: 'synced',
              last_synced_at: new Date().toISOString(),
            });
          } else {
            failedCount++;
          }
        }
      }
    }

    // Update last synced timestamp
    await supabase
      .from('calendar_sync_settings')
      .upsert({
        user_id: userId,
        last_synced_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      failed: failedCount,
      total: results.length,
      results,
      message: `Synced ${syncedCount} of ${results.length} items to Google Calendar`,
    });
  } catch (error) {
    console.error('Full calendar sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync to calendar' },
      { status: 500 }
    );
  }
}

async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description: string;
    start: { date?: string; dateTime?: string; timeZone?: string };
    end: { date?: string; dateTime?: string; timeZone?: string };
    colorId?: string;
  }
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (response.ok) {
      const createdEvent = await response.json();
      return { success: true, eventId: createdEvent.id };
    } else {
      await response.json(); // consume response body
      return { success: false, error: 'Failed to create event' };
    }
  } catch (err) {
    return { success: false, error: 'Network error' };
  }
}

function buildDescription(entity: Record<string, unknown>, level: string): string {
  let description = (entity.description as string) || '';

  description += '\n\n---\nGoal Achiever Pro\n';
  description += `Level: ${level.charAt(0).toUpperCase() + level.slice(1)}\n`;

  if (entity.key_metric) {
    description += `Key Metric: ${entity.key_metric}`;
    if (entity.target_value) {
      description += ` → ${entity.target_value}`;
    }
    description += '\n';
  }

  // Add hierarchy info if available
  const weeklyTargets = entity.weekly_targets as Record<string, unknown> | undefined;
  const monthlyTargets = entity.monthly_targets as Record<string, unknown> | undefined ||
    (weeklyTargets?.monthly_targets as Record<string, unknown> | undefined);
  const powerGoals = entity.power_goals as Record<string, unknown> | undefined ||
    (monthlyTargets?.power_goals as Record<string, unknown> | undefined);
  const visions = entity.visions as Record<string, unknown> | undefined ||
    (powerGoals?.visions as Record<string, unknown> | undefined);

  if (visions?.title) description += `Vision: ${visions.title}\n`;
  if (powerGoals?.title) description += `Power Goal: ${powerGoals.title}\n`;
  if (monthlyTargets?.title) description += `Monthly: ${monthlyTargets.title}\n`;
  if (weeklyTargets?.title) description += `Weekly: ${weeklyTargets.title}\n`;

  return description.trim();
}
