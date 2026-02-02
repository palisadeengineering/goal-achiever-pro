import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET - Fetch reminders for a vision
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
    const visionId = searchParams.get('visionId');

    let query = supabase
      .from('vision_review_reminders')
      .select('*')
      .eq('user_id', userId);

    if (visionId) {
      query = query.eq('vision_id', visionId);
    }

    const { data: reminders, error } = await query;

    if (error) {
      console.error('Error fetching reminders:', error);
      return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
    }

    // Transform to frontend format
    const transformedReminders = reminders?.map(reminder => ({
      id: reminder.id,
      visionId: reminder.vision_id,
      reminderType: reminder.reminder_type,
      reminderTime: reminder.reminder_time,
      dayOfWeek: reminder.day_of_week,
      isActive: reminder.is_active,
    })) || [];

    return NextResponse.json(transformedReminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

// POST - Save reminders for a vision
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
      visionId,
      reminders, // Array of reminder objects
    } = body;

    if (!visionId) {
      return NextResponse.json({ error: 'visionId is required' }, { status: 400 });
    }

    // Delete existing reminders for this vision
    await supabase
      .from('vision_review_reminders')
      .delete()
      .eq('user_id', userId)
      .eq('vision_id', visionId);

    // Insert new reminders
    const savedReminders = [];

    if (reminders && Array.isArray(reminders)) {
      for (const reminder of reminders) {
        const { data: saved, error } = await supabase
          .from('vision_review_reminders')
          .insert({
            user_id: userId,
            vision_id: visionId,
            reminder_type: reminder.reminderType,
            reminder_time: reminder.reminderTime || null,
            day_of_week: reminder.dayOfWeek !== undefined ? reminder.dayOfWeek : null,
            is_active: reminder.isActive !== false,
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving reminder:', error);
        } else {
          savedReminders.push({
            id: saved.id,
            visionId: saved.vision_id,
            reminderType: saved.reminder_type,
            reminderTime: saved.reminder_time,
            dayOfWeek: saved.day_of_week,
            isActive: saved.is_active,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      reminders: savedReminders,
    });
  } catch (error) {
    console.error('Error saving reminders:', error);
    return NextResponse.json({ error: 'Failed to save reminders' }, { status: 500 });
  }
}
