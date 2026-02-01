'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Flame,
  Trophy,
  Zap,
  Target,
  TrendingUp,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Streak {
  id: string;
  streak_type: 'daily_execution' | 'check_in' | 'production' | 'project';
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  recovery_used_at: string | null;
}

interface GamificationStats {
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  levelProgress: number;
}

// Level thresholds matching gamification-v2.ts
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000, 20000, 26000, 33000, 41000, 50000,
];

function calculateLevelFromXp(totalXp: number): GamificationStats {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 5000;
  const xpInLevel = totalXp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const progress = Math.round((xpInLevel / xpNeeded) * 100);

  return {
    totalXp,
    currentLevel: level,
    xpToNextLevel: nextThreshold - totalXp,
    levelProgress: progress,
  };
}

function getStreakBadge(streak: number): { color: string; label: string } {
  if (streak >= 365) return { color: 'bg-gradient-to-r from-yellow-400 to-orange-500', label: 'Legendary' };
  if (streak >= 90) return { color: 'bg-gradient-to-r from-purple-500 to-pink-500', label: 'Master' };
  if (streak >= 30) return { color: 'bg-gradient-to-r from-blue-500 to-cyan-500', label: 'Champion' };
  if (streak >= 14) return { color: 'bg-gradient-to-r from-green-500 to-emerald-500', label: 'Consistent' };
  if (streak >= 7) return { color: 'bg-cyan-500', label: 'On Fire' };
  if (streak >= 3) return { color: 'bg-orange-500', label: 'Building' };
  return { color: 'bg-gray-400', label: 'Starting' };
}

function getStreakIcon(streakType: string) {
  switch (streakType) {
    case 'daily_execution':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'check_in':
      return <Target className="h-4 w-4" />;
    case 'production':
      return <Clock className="h-4 w-4" />;
    case 'project':
      return <Calendar className="h-4 w-4" />;
    default:
      return <Flame className="h-4 w-4" />;
  }
}

function getStreakLabel(streakType: string) {
  switch (streakType) {
    case 'daily_execution':
      return 'Task Streak';
    case 'check_in':
      return 'Check-in Streak';
    case 'production':
      return 'Production Streak';
    case 'project':
      return 'Project Streak';
    default:
      return 'Streak';
  }
}

export function MomentumStatsWidget() {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch streaks
      const streaksResponse = await fetch('/api/streaks-v2');
      if (streaksResponse.ok) {
        const streaksResult = await streaksResponse.json();
        setStreaks(streaksResult.streaks || []);
      }

      // Fetch XP from profile
      const profileResponse = await fetch('/api/profile');
      if (profileResponse.ok) {
        const profileResult = await profileResponse.json();
        const profile = profileResult.profile || profileResult;
        const totalXp = profile.total_xp || 0;
        setStats(calculateLevelFromXp(totalXp));
      }
    } catch (error) {
      console.error('Error fetching momentum data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreakRecovery = async (streakType: string) => {
    setIsRecovering(streakType);
    try {
      const response = await fetch('/api/streaks-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recover', streak_type: streakType }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to recover streak');
      }

      const result = await response.json();
      toast.success(`Streak recovered! Now at ${result.streak.current_streak} days`);

      // Update local state
      setStreaks((prev) =>
        prev.map((s) =>
          s.streak_type === streakType
            ? { ...s, current_streak: result.streak.current_streak, recovery_used_at: new Date().toISOString() }
            : s
        )
      );
    } catch (error) {
      console.error('Error recovering streak:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to recover streak');
    } finally {
      setIsRecovering(null);
    }
  };

  // Check if a streak is broken (no activity in last 24 hours)
  const isStreakBroken = (streak: Streak): boolean => {
    if (!streak.last_activity_date) return true;
    const lastActivity = new Date(streak.last_activity_date);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 1;
  };

  // Check if recovery is available (not used in last 7 days)
  const canRecover = (streak: Streak): boolean => {
    if (!streak.recovery_used_at) return true;
    const lastRecovery = new Date(streak.recovery_used_at);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastRecovery.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 7;
  };

  // Get the main streak (daily_execution is primary)
  const mainStreak = streaks.find((s) => s.streak_type === 'daily_execution') || streaks[0];
  const mainStreakBadge = mainStreak ? getStreakBadge(mainStreak.current_streak) : null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Momentum
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level & XP */}
        {stats && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Level {stats.currentLevel}</span>
              <span className="text-sm font-medium flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                {stats.totalXp.toLocaleString()} XP
              </span>
            </div>
            <Progress value={stats.levelProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.xpToNextLevel.toLocaleString()} XP to level {stats.currentLevel + 1}
            </p>
          </div>
        )}

        {/* Main Streak */}
        {mainStreak && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center text-white',
                  mainStreak.current_streak > 0 && !isStreakBroken(mainStreak)
                    ? mainStreakBadge?.color
                    : 'bg-gray-300 dark:bg-gray-600'
                )}
              >
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {mainStreak.current_streak > 0 && !isStreakBroken(mainStreak)
                    ? `${mainStreak.current_streak} day streak`
                    : isStreakBroken(mainStreak) && canRecover(mainStreak)
                    ? 'Streak broken!'
                    : 'No streak'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {mainStreak.current_streak > 0 && !isStreakBroken(mainStreak)
                    ? mainStreakBadge?.label
                    : isStreakBroken(mainStreak) && canRecover(mainStreak)
                    ? 'Complete 3 tasks to recover'
                    : 'Complete a task to start!'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {isStreakBroken(mainStreak) && canRecover(mainStreak) && mainStreak.current_streak > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStreakRecovery(mainStreak.streak_type)}
                  disabled={isRecovering === mainStreak.streak_type}
                  className="text-xs"
                >
                  {isRecovering === mainStreak.streak_type ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Recover
                    </>
                  )}
                </Button>
              ) : mainStreak.longest_streak > 0 ? (
                <div>
                  <p className="text-xs text-muted-foreground">Best</p>
                  <p className="text-sm font-medium">{mainStreak.longest_streak} days</p>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Other Streaks (compact view) */}
        {streaks.filter((s) => s.streak_type !== 'daily_execution').length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            {streaks
              .filter((s) => s.streak_type !== 'daily_execution')
              .slice(0, 3)
              .map((streak) => {
                const badge = getStreakBadge(streak.current_streak);
                const broken = isStreakBroken(streak);
                return (
                  <div
                    key={streak.id}
                    className="p-2 bg-muted/50 rounded-lg text-center"
                  >
                    <div
                      className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center mx-auto mb-1 text-white',
                        streak.current_streak > 0 && !broken ? badge.color : 'bg-gray-300 dark:bg-gray-600'
                      )}
                    >
                      {getStreakIcon(streak.streak_type)}
                    </div>
                    <p className="text-lg font-bold">
                      {broken && streak.current_streak > 0 ? (
                        <span className="text-red-500">!</span>
                      ) : (
                        streak.current_streak
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getStreakLabel(streak.streak_type)}
                    </p>
                  </div>
                );
              })}
          </div>
        )}

        {/* Quick Stats */}
        {stats && (
          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
            <span>Today's potential: +100 XP</span>
            <Badge variant="secondary" className="text-xs">
              {mainStreak && mainStreak.current_streak >= 7 && !isStreakBroken(mainStreak) ? (
                <>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{Math.min(100, mainStreak.current_streak * 10)}% streak bonus
                </>
              ) : (
                <>
                  <Flame className="h-3 w-3 mr-1" />
                  Build streak for bonuses
                </>
              )}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
