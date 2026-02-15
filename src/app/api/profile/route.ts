import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    // Get profile from database including gamification fields
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      profile: {
        id: userId,
        email: profile?.email,
        full_name: profile?.full_name || profile?.email?.split('@')[0],
        avatar_url: profile?.avatar_url,
        total_xp: profile?.total_xp || 0,
        current_level: profile?.current_level || 1,
        current_streak: profile?.current_streak || 0,
        longest_streak: profile?.longest_streak || 0,
        created_at: profile?.created_at,
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
