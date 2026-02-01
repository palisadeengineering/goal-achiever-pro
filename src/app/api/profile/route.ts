import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Demo user for development
const DEMO_PROFILE = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@example.com',
  full_name: 'Demo User',
  avatar_url: null,
  total_xp: 0,
  current_level: 1,
  created_at: new Date().toISOString(),
};

export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ profile: DEMO_PROFILE });
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ profile: DEMO_PROFILE });
    }

    // Get profile from database including gamification fields
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({
        profile: {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url,
          total_xp: 0,
          current_level: 1,
          created_at: user.created_at,
        },
      });
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email || profile?.email,
        full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
        total_xp: profile?.total_xp || 0,
        current_level: profile?.current_level || 1,
        current_streak: profile?.current_streak || 0,
        longest_streak: profile?.longest_streak || 0,
        created_at: user.created_at,
        updated_at: profile?.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
