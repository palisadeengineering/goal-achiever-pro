'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Flame,
  Trophy,
  Target,
  Zap,
  TrendingUp,
  Clock,
  Sun,
  Sunset,
  Moon,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
  Award,
  Star,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface KpiStreak {
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
}

interface DailyKpi {
  id: string;
  title: string;
  description: string | null;
  target_value: string | null;
  unit: string | null;
  tracking_method: 'checkbox' | 'numeric';
  best_time: 'morning' | 'afternoon' | 'evening' | null;
  time_required: string | null;
  why_it_matters: string | null;
  is_completed_today: boolean;
  today_value: number | null;
  streak?: KpiStreak;
  vision_id: string;
  vision_title?: string;
  vision_color?: string;
}

interface WeeklyKpi {
  id: string;
  title: string;
  target_value: string | null;
  unit: string | null;
  category: string | null;
  current_week_value: number;
  numeric_target: number | null;
}

interface KpiSummary {
  totalDailyKpis: number;
  completedToday: number;
  bestStreak: number;
  totalStreakDays: number;
  weeklyProgress: number;
  monthlyProgress: number;
  quarterlyProgress: number;
}

interface DailyKpiDashboardProps {
  className?: string;
}

const TIME_ICONS = {
  morning: Sun,
  afternoon: Sunset,
  evening: Moon,
};

const TIME_COLORS = {
  morning: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
  afternoon: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  evening: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
};

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365];

function getStreakLevel(streak: number): { level: number; nextMilestone: number; progress: number } {
  let level = 0;
  let nextMilestone = STREAK_MILESTONES[0];

  for (let i = 0; i < STREAK_MILESTONES.length; i++) {
    if (streak >= STREAK_MILESTONES[i]) {
      level = i + 1;
      nextMilestone = STREAK_MILESTONES[i + 1] || STREAK_MILESTONES[i] * 2;
    } else {
      nextMilestone = STREAK_MILESTONES[i];
      break;
    }
  }

  const prevMilestone = level > 0 ? STREAK_MILESTONES[level - 1] : 0;
  const progress = ((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;

  return { level, nextMilestone, progress };
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

export function DailyKpiDashboard({ className }: DailyKpiDashboardProps) {
  const [dailyKpis, setDailyKpis] = useState<DailyKpi[]>([]);
  const [weeklyKpis, setWeeklyKpis] = useState<WeeklyKpi[]>([]);
  const [summary, setSummary] = useState<KpiSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingKpis, setLoadingKpis] = useState<Set<string>>(new Set());
  const [numericInputs, setNumericInputs] = useState<Record<string, string>>({});

  const fetchKpis = useCallback(async () => {
    try {
      const response = await fetch('/api/kpi-dashboard');
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      const data = await response.json();

      setDailyKpis(data.dailyKpis || []);
      setWeeklyKpis(data.weeklyKpis || []);
      setSummary(data.summary || null);

      // Initialize numeric inputs
      const inputs: Record<string, string> = {};
      for (const kpi of data.dailyKpis || []) {
        if (kpi.tracking_method === 'numeric' && kpi.today_value) {
          inputs[kpi.id] = String(kpi.today_value);
        }
      }
      setNumericInputs(inputs);
    } catch (err) {
      console.error('Error fetching KPIs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  const handleToggleKpi = async (kpi: DailyKpi) => {
    if (kpi.tracking_method !== 'checkbox') return;

    setLoadingKpis((prev) => new Set(prev).add(kpi.id));

    try {
      const response = await fetch(`/api/vision-kpis/${kpi.id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCompleted: !kpi.is_completed_today,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) throw new Error('Failed to update KPI');

      // Optimistic update
      setDailyKpis((prev) =>
        prev.map((k) =>
          k.id === kpi.id
            ? {
                ...k,
                is_completed_today: !k.is_completed_today,
                streak: k.streak
                  ? {
                      ...k.streak,
                      current_streak: !kpi.is_completed_today
                        ? k.streak.current_streak + 1
                        : Math.max(0, k.streak.current_streak - 1),
                    }
                  : undefined,
              }
            : k
        )
      );

      if (!kpi.is_completed_today) {
        const newStreak = (kpi.streak?.current_streak || 0) + 1;
        const { level } = getStreakLevel(newStreak);
        const prevLevel = getStreakLevel(kpi.streak?.current_streak || 0).level;

        if (level > prevLevel && level > 0) {
          toast.success(`Level Up! You've reached streak level ${level}!`, {
            icon: <Trophy className="h-5 w-5 text-yellow-500" />,
          });
        } else {
          toast.success(`${kpi.title} completed! ${newStreak} day streak!`);
        }
      }

      // Refetch to get accurate data
      setTimeout(() => fetchKpis(), 500);
    } catch (err) {
      console.error('Error toggling KPI:', err);
      toast.error('Failed to update KPI');
    } finally {
      setLoadingKpis((prev) => {
        const next = new Set(prev);
        next.delete(kpi.id);
        return next;
      });
    }
  };

  const handleNumericSubmit = async (kpi: DailyKpi) => {
    const value = parseFloat(numericInputs[kpi.id] || '0');
    if (isNaN(value)) return;

    setLoadingKpis((prev) => new Set(prev).add(kpi.id));

    try {
      const response = await fetch(`/api/vision-kpis/${kpi.id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) throw new Error('Failed to update KPI');

      toast.success(`Logged ${value} ${kpi.unit || ''} for ${kpi.title}`);
      fetchKpis();
    } catch (err) {
      console.error('Error logging KPI:', err);
      toast.error('Failed to log value');
    } finally {
      setLoadingKpis((prev) => {
        const next = new Set(prev);
        next.delete(kpi.id);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (dailyKpis.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Daily KPIs
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            No daily KPIs set up yet. Generate KPIs from your Vision to track daily progress.
          </p>
          <Link href="/vision">
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Set Up KPIs
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const completionPercentage = summary
    ? Math.round((summary.completedToday / summary.totalDailyKpis) * 100)
    : 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Gamification Summary Card */}
      <Card className="bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-cyan-200 dark:border-cyan-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-500" />
              Daily Progress
            </CardTitle>
            <Badge
              variant="outline"
              className={cn(
                'text-sm font-bold',
                completionPercentage >= 100
                  ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300'
                  : completionPercentage >= 50
                  ? 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300'
                  : ''
              )}
            >
              {summary?.completedToday || 0}/{summary?.totalDailyKpis || 0} Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Streak Level Badge - PROMINENT GAMIFICATION */}
          {summary && summary.bestStreak > 0 && (() => {
            const badge = getStreakBadge(summary.bestStreak);
            const { level, nextMilestone, progress } = getStreakLevel(summary.bestStreak);
            return (
              <div className={cn(
                'p-4 rounded-xl text-white',
                badge.color
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      {summary.bestStreak >= 90 ? (
                        <Star className="h-6 w-6" />
                      ) : summary.bestStreak >= 30 ? (
                        <Trophy className="h-6 w-6" />
                      ) : summary.bestStreak >= 7 ? (
                        <Award className="h-6 w-6" />
                      ) : (
                        <Flame className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className="text-lg font-bold">{badge.label}</div>
                      <div className="text-sm opacity-90">Level {level} • {summary.bestStreak} day streak</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black">{summary.bestStreak}</div>
                    <div className="text-xs opacity-75">days</div>
                  </div>
                </div>
                {/* Progress to next level */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs opacity-90">
                    <span>Progress to next level</span>
                    <span>{nextMilestone - summary.bestStreak} days to go</span>
                  </div>
                  <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Show encouragement for new users */}
          {(!summary || summary.bestStreak === 0) && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/50 rounded-lg">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold">Start Your Streak!</div>
                  <div className="text-sm opacity-75">Complete a KPI to begin your journey</div>
                </div>
              </div>
              <div className="mt-3 text-xs opacity-75">
                Levels: Building → On Fire → Consistent → Champion → Master → Legendary
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={completionPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completionPercentage}% of daily KPIs</span>
              {completionPercentage >= 100 && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  All done!
                </span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 rounded-lg bg-background/50">
              <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                <Flame className="h-3 w-3" />
                <span className="text-base font-bold">{summary?.bestStreak || 0}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Streak</span>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <div className="flex items-center justify-center gap-1 text-cyan-500 mb-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-base font-bold">{summary?.weeklyProgress || 0}%</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Weekly</span>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
                <Trophy className="h-3 w-3" />
                <span className="text-base font-bold">{summary?.monthlyProgress || 0}%</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Monthly</span>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                <Calendar className="h-3 w-3" />
                <span className="text-base font-bold">{summary?.quarterlyProgress || 0}%</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Quarterly</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily KPIs List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Today&apos;s KPIs
          </CardTitle>
          <CardDescription>
            Track your daily habits to hit your weekly, monthly, and quarterly goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {dailyKpis.map((kpi) => {
            const TimeIcon = (kpi.best_time && TIME_ICONS[kpi.best_time as keyof typeof TIME_ICONS]) || Clock;
            const timeColor = kpi.best_time ? TIME_COLORS[kpi.best_time] : '';
            const streak = kpi.streak?.current_streak || 0;
            const { level, nextMilestone, progress } = getStreakLevel(streak);
            const badge = getStreakBadge(streak);

            return (
              <div
                key={kpi.id}
                className={cn(
                  'p-4 rounded-lg border transition-all',
                  kpi.is_completed_today
                    ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800'
                    : 'bg-background hover:border-primary/30'
                )}
              >
                <div className="flex items-start gap-3">
                  {kpi.tracking_method === 'checkbox' ? (
                    <Checkbox
                      checked={kpi.is_completed_today}
                      onCheckedChange={() => handleToggleKpi(kpi)}
                      disabled={loadingKpis.has(kpi.id)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={cn(
                            'font-medium',
                            kpi.is_completed_today && 'line-through text-muted-foreground'
                          )}
                        >
                          {kpi.title}
                        </p>
                        {kpi.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {kpi.description}
                          </p>
                        )}
                      </div>

                      {/* Streak Badge */}
                      {streak > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className={cn('shrink-0 text-white', badge.color)}>
                                <Flame className="h-3 w-3 mr-1" />
                                {streak}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <p className="font-medium">{badge.label} - Level {level}</p>
                                <p className="text-xs">
                                  {nextMilestone - streak} days to next milestone
                                </p>
                                <Progress value={progress} className="h-1.5 w-24" />
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>

                    {/* Time and Why badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {kpi.best_time && (
                        <Badge variant="outline" className={cn('text-xs', timeColor)}>
                          <TimeIcon className="h-3 w-3 mr-1" />
                          {kpi.best_time.charAt(0).toUpperCase() + kpi.best_time.slice(1)}
                        </Badge>
                      )}
                      {kpi.time_required && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {kpi.time_required}
                        </Badge>
                      )}
                      {kpi.vision_title && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: kpi.vision_color || undefined,
                            color: kpi.vision_color || undefined,
                          }}
                        >
                          {kpi.vision_title}
                        </Badge>
                      )}
                    </div>

                    {/* Why it matters */}
                    {kpi.why_it_matters && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        &ldquo;{kpi.why_it_matters}&rdquo;
                      </p>
                    )}

                    {/* Numeric Input */}
                    {kpi.tracking_method === 'numeric' && (
                      <div className="flex items-center gap-2 mt-3">
                        <Input
                          type="number"
                          placeholder={`Enter ${kpi.unit || 'value'}`}
                          value={numericInputs[kpi.id] || ''}
                          onChange={(e) =>
                            setNumericInputs((prev) => ({
                              ...prev,
                              [kpi.id]: e.target.value,
                            }))
                          }
                          className="w-32 h-8"
                        />
                        <span className="text-sm text-muted-foreground">
                          {kpi.unit} (target: {kpi.target_value})
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleNumericSubmit(kpi)}
                          disabled={loadingKpis.has(kpi.id) || !numericInputs[kpi.id]}
                          className="h-8"
                        >
                          {loadingKpis.has(kpi.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Log'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Weekly KPIs Preview */}
      {weeklyKpis.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-500" />
                This Week&apos;s KPIs
              </CardTitle>
              <Link href="/vision">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View All <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {weeklyKpis.slice(0, 5).map((kpi) => {
              const progress = kpi.numeric_target
                ? Math.min(100, (kpi.current_week_value / kpi.numeric_target) * 100)
                : 0;
              return (
                <div key={kpi.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{kpi.title}</span>
                      {kpi.category && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            kpi.category === 'Activity'
                              ? 'text-blue-600 border-blue-300'
                              : 'text-green-600 border-green-300'
                          )}
                        >
                          {kpi.category}
                        </Badge>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {kpi.current_week_value}/{kpi.target_value} {kpi.unit}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
