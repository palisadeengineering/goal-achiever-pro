import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'system',
  notifications: true,
  emailReminders: false,
  weekStartsOn: 'sunday',
  timeFormat: '12h',
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  calendarStartHour: 5,
  calendarEndHour: 23,
  aiProvider: 'anthropic',
};

// GET - Fetch user settings
export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = user.id;

    // Try to get settings from user_settings table
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine for new users
      console.error('Error fetching user settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    if (!settings) {
      // Return defaults for new users
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    // Transform to match frontend interface
    return NextResponse.json({
      theme: settings.theme || DEFAULT_SETTINGS.theme,
      notifications: settings.notifications ?? DEFAULT_SETTINGS.notifications,
      emailReminders: settings.email_reminders ?? DEFAULT_SETTINGS.emailReminders,
      weekStartsOn: settings.week_starts_on || DEFAULT_SETTINGS.weekStartsOn,
      timeFormat: settings.time_format || DEFAULT_SETTINGS.timeFormat,
      pomodoroWorkMinutes: settings.pomodoro_work_minutes ?? DEFAULT_SETTINGS.pomodoroWorkMinutes,
      pomodoroBreakMinutes: settings.pomodoro_break_minutes ?? DEFAULT_SETTINGS.pomodoroBreakMinutes,
      calendarStartHour: settings.calendar_start_hour ?? DEFAULT_SETTINGS.calendarStartHour,
      calendarEndHour: settings.calendar_end_hour ?? DEFAULT_SETTINGS.calendarEndHour,
      aiProvider: settings.ai_provider || DEFAULT_SETTINGS.aiProvider,
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = user.id;

    const body = await request.json();

    const {
      theme,
      notifications,
      emailReminders,
      weekStartsOn,
      timeFormat,
      pomodoroWorkMinutes,
      pomodoroBreakMinutes,
      calendarStartHour,
      calendarEndHour,
      aiProvider,
    } = body;

    // Upsert settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        theme: theme || DEFAULT_SETTINGS.theme,
        notifications: notifications ?? DEFAULT_SETTINGS.notifications,
        email_reminders: emailReminders ?? DEFAULT_SETTINGS.emailReminders,
        week_starts_on: weekStartsOn || DEFAULT_SETTINGS.weekStartsOn,
        time_format: timeFormat || DEFAULT_SETTINGS.timeFormat,
        pomodoro_work_minutes: pomodoroWorkMinutes ?? DEFAULT_SETTINGS.pomodoroWorkMinutes,
        pomodoro_break_minutes: pomodoroBreakMinutes ?? DEFAULT_SETTINGS.pomodoroBreakMinutes,
        calendar_start_hour: calendarStartHour ?? DEFAULT_SETTINGS.calendarStartHour,
        calendar_end_hour: calendarEndHour ?? DEFAULT_SETTINGS.calendarEndHour,
        ai_provider: aiProvider || DEFAULT_SETTINGS.aiProvider,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({
      theme: settings.theme,
      notifications: settings.notifications,
      emailReminders: settings.email_reminders,
      weekStartsOn: settings.week_starts_on,
      timeFormat: settings.time_format,
      pomodoroWorkMinutes: settings.pomodoro_work_minutes,
      pomodoroBreakMinutes: settings.pomodoro_break_minutes,
      calendarStartHour: settings.calendar_start_hour,
      calendarEndHour: settings.calendar_end_hour,
      aiProvider: settings.ai_provider,
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
