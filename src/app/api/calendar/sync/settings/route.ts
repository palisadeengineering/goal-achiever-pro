import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET: Fetch sync settings
export async function GET() {
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

    const { data: settings, error } = await supabase
      .from('calendar_sync_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching sync settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Return default settings if none exist
    const defaultSettings = {
      sync_quarterly_targets: true,
      sync_monthly_targets: true,
      sync_weekly_targets: true,
      sync_daily_actions: true,
      quarterly_color_id: '5',
      monthly_color_id: '9',
      weekly_color_id: '10',
      daily_color_id: '1',
      auto_sync_enabled: false,
      sync_interval_minutes: 60,
      two_way_sync_enabled: false,
      conflict_resolution: 'app_wins',
      last_synced_at: null,
    };

    return NextResponse.json({
      settings: settings || defaultSettings,
    });
  } catch (error) {
    console.error('Get sync settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST/PUT: Update sync settings
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
    const body = await request.json();

    const {
      syncQuarterlyTargets,
      syncMonthlyTargets,
      syncWeeklyTargets,
      syncDailyActions,
      quarterlyColorId,
      monthlyColorId,
      weeklyColorId,
      dailyColorId,
      autoSyncEnabled,
      syncIntervalMinutes,
      twoWaySyncEnabled,
      conflictResolution,
    } = body;

    const updateData: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (syncQuarterlyTargets !== undefined) updateData.sync_quarterly_targets = syncQuarterlyTargets;
    if (syncMonthlyTargets !== undefined) updateData.sync_monthly_targets = syncMonthlyTargets;
    if (syncWeeklyTargets !== undefined) updateData.sync_weekly_targets = syncWeeklyTargets;
    if (syncDailyActions !== undefined) updateData.sync_daily_actions = syncDailyActions;
    if (quarterlyColorId !== undefined) updateData.quarterly_color_id = quarterlyColorId;
    if (monthlyColorId !== undefined) updateData.monthly_color_id = monthlyColorId;
    if (weeklyColorId !== undefined) updateData.weekly_color_id = weeklyColorId;
    if (dailyColorId !== undefined) updateData.daily_color_id = dailyColorId;
    if (autoSyncEnabled !== undefined) updateData.auto_sync_enabled = autoSyncEnabled;
    if (syncIntervalMinutes !== undefined) updateData.sync_interval_minutes = syncIntervalMinutes;
    if (twoWaySyncEnabled !== undefined) updateData.two_way_sync_enabled = twoWaySyncEnabled;
    if (conflictResolution !== undefined) updateData.conflict_resolution = conflictResolution;

    const { data: settings, error } = await supabase
      .from('calendar_sync_settings')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error updating sync settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Update sync settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
