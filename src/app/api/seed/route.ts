import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// POST - Seed demo data (development only)
export async function POST() {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Check if demo user exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', DEMO_USER_ID)
      .single();

    if (existingProfile) {
      return NextResponse.json({ message: 'Demo user already exists', userId: DEMO_USER_ID });
    }

    // Create demo user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: DEMO_USER_ID,
        email: 'demo@example.com',
        full_name: 'Demo User',
        subscription_tier: 'elite',
        subscription_status: 'active',
        onboarding_completed: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating demo profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to create demo user', details: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Demo user created successfully',
      profile
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
