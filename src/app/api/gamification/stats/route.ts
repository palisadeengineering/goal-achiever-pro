import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateUserGamification } from '@/lib/services/gamification';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function GET() {
  try {
    const supabase = await createClient();
    let userId = DEMO_USER_ID;

    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        userId = user.id;
      }
    }

    const gamification = await getOrCreateUserGamification(userId);

    return NextResponse.json(gamification);
  } catch (error) {
    console.error('Error fetching gamification stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gamification stats' },
      { status: 500 }
    );
  }
}
