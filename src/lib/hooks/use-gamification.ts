import { useQuery } from '@tanstack/react-query';
import type { UserGamification, Achievement } from '@/types/gamification';

export interface AchievementWithProgress extends Achievement {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

export function useGamificationStats() {
  return useQuery<UserGamification>({
    queryKey: ['gamification', 'stats'],
    queryFn: async () => {
      const res = await fetch('/api/gamification/stats');
      if (!res.ok) throw new Error('Failed to fetch gamification stats');
      return res.json();
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useAchievements() {
  return useQuery<AchievementWithProgress[]>({
    queryKey: ['gamification', 'achievements'],
    queryFn: async () => {
      const res = await fetch('/api/gamification/achievements');
      if (!res.ok) throw new Error('Failed to fetch achievements');
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

// Query key factory for cache invalidation
export const gamificationKeys = {
  all: ['gamification'] as const,
  stats: () => [...gamificationKeys.all, 'stats'] as const,
  achievements: () => [...gamificationKeys.all, 'achievements'] as const,
};
