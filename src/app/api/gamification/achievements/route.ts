import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrCreateUserGamification } from '@/lib/services/gamification';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get all achievements
    const { data: achievements } = await adminClient
      .from('achievements')
      .select('*')
      .order('category', { ascending: true });

    // Get user's unlocked achievements
    const { data: userAchievements } = await adminClient
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId);

    // Get user stats for progress calculation
    const stats = await getOrCreateUserGamification(userId);

    const unlockedMap = new Map(
      userAchievements?.map(ua => [ua.achievement_id, ua.unlocked_at]) || []
    );

    // Map achievements with unlock status and progress
    const result = achievements?.map(a => ({
      id: a.id,
      key: a.key,
      name: a.name,
      description: a.description,
      category: a.category,
      iconName: a.icon_name,
      xpReward: a.xp_reward,
      requiredValue: a.required_value,
      isSecret: a.is_secret,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id) || null,
      progress: calculateProgress(a.key, a.required_value, stats),
    })) || [];

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

function calculateProgress(
  key: string,
  requiredValue: number | null,
  stats: { kpisCompleted: number; visionsCreated: number; longestStreak: number; currentLevel: number }
): number {
  if (!requiredValue) return 0;

  let current = 0;
  if (key.startsWith('kpi_') || key === 'first_kpi') {
    current = stats.kpisCompleted;
  } else if (key.startsWith('streak_')) {
    current = stats.longestStreak;
  } else if (key === 'first_vision') {
    current = stats.visionsCreated;
  } else if (key.startsWith('level_')) {
    current = stats.currentLevel;
  }

  return Math.min(100, Math.round((current / requiredValue) * 100));
}
