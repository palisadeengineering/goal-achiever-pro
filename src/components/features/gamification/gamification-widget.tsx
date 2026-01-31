'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, Zap, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGamificationStats } from '@/lib/hooks/use-gamification';

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];

function getLevelProgress(totalXp: number, currentLevel: number): { progress: number; xpToNext: number } {
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || currentThreshold + 1000;
  const xpInLevel = totalXp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  return {
    progress: Math.round((xpInLevel / xpNeeded) * 100),
    xpToNext: nextThreshold - totalXp,
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

interface GamificationWidgetProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export function GamificationWidget({ variant = 'full', className }: GamificationWidgetProps) {
  const { data: stats, isLoading } = useGamificationStats();

  if (isLoading || !stats) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardContent className="pt-6">
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const { progress, xpToNext } = getLevelProgress(stats.totalXp, stats.currentLevel);
  const streakBadge = getStreakBadge(stats.currentStreak);

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">{stats.totalXp} XP</span>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">Lv.{stats.currentLevel}</span>
        </div>
        {stats.currentStreak > 0 && (
          <Badge className={cn('text-white', streakBadge.color)}>
            <Flame className="h-3 w-3 mr-1" />
            {stats.currentStreak}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level & XP */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">Level {stats.currentLevel}</span>
            <span className="text-sm font-medium">{stats.totalXp} XP</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {xpToNext} XP to level {stats.currentLevel + 1}
          </p>
        </div>

        {/* Streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center text-white',
              stats.currentStreak > 0 ? streakBadge.color : 'bg-gray-300'
            )}>
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {stats.currentStreak > 0 ? `${stats.currentStreak} day streak` : 'No streak'}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.currentStreak > 0 ? streakBadge.label : 'Complete a task to start!'}
              </p>
            </div>
          </div>
          {stats.longestStreak > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Best</p>
              <p className="text-sm font-medium">{stats.longestStreak} days</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-muted/50 rounded-lg text-center">
            <Target className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold">{stats.kpisCompleted}</p>
            <p className="text-xs text-muted-foreground">KPIs Completed</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-bold">{stats.visionsCreated}</p>
            <p className="text-xs text-muted-foreground">Visions Created</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
