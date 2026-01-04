'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayActivity {
  date: string;
  score: number; // 0-100 composite score
  affirmations: number;
  nonNegotiables: number;
  kpiLogs: number;
  reviews: number;
  goalsCompleted: number;
  clarity?: number;
  belief?: number;
  consistency?: number;
}

interface VisionActivityHeatmapProps {
  visionId?: string; // If provided, filter to specific vision
  className?: string;
}

// Generate dates for the last 365 days
function generateDateRange(): string[] {
  const dates: string[] = [];
  const today = new Date();

  // Start from 364 days ago to include today
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}

// Get week day (0 = Sunday, 6 = Saturday)
function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay();
}

// Get month label for a date
function getMonthLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' });
}

// Calculate color intensity based on score (0-4 levels)
function getIntensityLevel(score: number): number {
  if (score === 0) return 0;
  if (score <= 25) return 1;
  if (score <= 50) return 2;
  if (score <= 75) return 3;
  return 4;
}

// Get CSS class for intensity level - uses app's primary color
function getIntensityClass(level: number): string {
  switch (level) {
    case 0: return 'bg-muted/50 dark:bg-muted/30';
    case 1: return 'bg-primary/20 dark:bg-primary/20';
    case 2: return 'bg-primary/40 dark:bg-primary/40';
    case 3: return 'bg-primary/70 dark:bg-primary/70';
    case 4: return 'bg-primary dark:bg-primary';
    default: return 'bg-muted/50';
  }
}

// Calculate streak from activity data
function calculateStreak(activityMap: Map<string, DayActivity>): { current: number; longest: number } {
  const today = new Date().toISOString().split('T')[0];
  const dates = Array.from(activityMap.keys()).sort().reverse();

  let current = 0;
  let longest = 0;
  let tempStreak = 0;
  let countingCurrent = true;

  // Check if today has activity
  const todayActivity = activityMap.get(today);
  if (!todayActivity || todayActivity.score === 0) {
    // Check yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayActivity = activityMap.get(yesterdayStr);
    if (!yesterdayActivity || yesterdayActivity.score === 0) {
      countingCurrent = false;
    }
  }

  for (let i = 0; i < 365; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const activity = activityMap.get(dateStr);

    if (activity && activity.score > 0) {
      tempStreak++;
      if (countingCurrent) {
        current = tempStreak;
      }
    } else {
      longest = Math.max(longest, tempStreak);
      tempStreak = 0;
      countingCurrent = false;
    }
  }

  longest = Math.max(longest, tempStreak);

  return { current, longest };
}

export function VisionActivityHeatmap({ visionId, className }: VisionActivityHeatmapProps) {
  const [activityData, setActivityData] = useState<DayActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const params = new URLSearchParams();
        if (visionId) params.set('visionId', visionId);

        const response = await fetch(`/api/vision-activity?${params}`);
        if (response.ok) {
          const data = await response.json();
          setActivityData(data.activity || []);
        }
      } catch (error) {
        console.error('Failed to fetch vision activity:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivity();
  }, [visionId]);

  // Create activity map for quick lookup
  const activityMap = useMemo(() => {
    const map = new Map<string, DayActivity>();
    activityData.forEach(day => map.set(day.date, day));
    return map;
  }, [activityData]);

  // Generate the date grid
  const dates = useMemo(() => generateDateRange(), []);

  // Calculate streaks
  const streaks = useMemo(() => calculateStreak(activityMap), [activityMap]);

  // Group dates by week for rendering
  const weeks = useMemo(() => {
    const result: string[][] = [];
    let currentWeek: string[] = [];

    // Pad the first week with empty slots
    const firstDayOfWeek = getDayOfWeek(dates[0]);
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push('');
    }

    dates.forEach(date => {
      currentWeek.push(date);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add remaining days
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [dates]);

  // Get month labels for header
  const monthLabels = useMemo(() => {
    const labels: { month: string; colStart: number }[] = [];
    let lastMonth = '';

    weeks.forEach((week, weekIndex) => {
      const firstDate = week.find(d => d !== '');
      if (firstDate) {
        const month = getMonthLabel(firstDate);
        if (month !== lastMonth) {
          labels.push({ month, colStart: weekIndex });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [weeks]);

  // Calculate total activity days
  const totalActiveDays = useMemo(() => {
    return activityData.filter(d => d.score > 0).length;
  }, [activityData]);

  // Calculate average 300% score
  const avg300Score = useMemo(() => {
    const withScores = activityData.filter(d =>
      d.clarity !== undefined && d.belief !== undefined && d.consistency !== undefined
    );
    if (withScores.length === 0) return null;

    const total = withScores.reduce((sum, d) => {
      return sum + ((d.clarity || 0) + (d.belief || 0) + (d.consistency || 0)) / 3;
    }, 0);

    return Math.round(total / withScores.length);
  }, [activityData]);

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="pb-2">
          <div className="h-6 bg-muted rounded w-32" />
        </CardHeader>
        <CardContent>
          <div className="h-[140px] bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Your Progress
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-semibold">{streaks.current}</span>
              <span className="text-muted-foreground">day streak</span>
            </div>
            {avg300Score !== null && (
              <div className="text-muted-foreground">
                <span className="font-semibold text-foreground">{avg300Score}%</span> avg 300%
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Stats row */}
        <div className="flex items-center gap-6 mb-4 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{totalActiveDays}</span> active days in the last year
          </span>
          {streaks.longest > 0 && (
            <span>
              Longest streak: <span className="font-semibold text-foreground">{streaks.longest}</span> days
            </span>
          )}
        </div>

        {/* Heat map grid */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[750px]">
            {/* Month labels */}
            <div className="flex mb-1 text-xs text-muted-foreground">
              <div className="w-8" /> {/* Spacer for day labels */}
              <div className="flex-1 flex relative h-4">
                {monthLabels.map(({ month, colStart }, idx) => (
                  <div
                    key={`${month}-${idx}`}
                    className="absolute"
                    style={{ left: `${(colStart / weeks.length) * 100}%` }}
                  >
                    {month}
                  </div>
                ))}
              </div>
            </div>

            {/* Day labels and grid */}
            <div className="flex">
              {/* Day of week labels */}
              <div className="flex flex-col justify-around w-8 text-xs text-muted-foreground pr-2">
                <span></span>
                <span>Mon</span>
                <span></span>
                <span>Wed</span>
                <span></span>
                <span>Fri</span>
                <span></span>
              </div>

              {/* Grid */}
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {week.map((date, dayIndex) => {
                      if (!date) {
                        return <div key={dayIndex} className="w-[11px] h-[11px]" />;
                      }

                      const activity = activityMap.get(date);
                      const score = activity?.score || 0;
                      const level = getIntensityLevel(score);

                      // Tooltip content
                      const tooltipParts = [];
                      if (activity) {
                        if (activity.goalsCompleted > 0) tooltipParts.push(`${activity.goalsCompleted} goal${activity.goalsCompleted > 1 ? 's' : ''} completed`);
                        if (activity.affirmations > 0) tooltipParts.push(`${activity.affirmations} affirmation${activity.affirmations > 1 ? 's' : ''}`);
                        if (activity.nonNegotiables > 0) tooltipParts.push(`${activity.nonNegotiables} non-negotiable${activity.nonNegotiables > 1 ? 's' : ''}`);
                        if (activity.kpiLogs > 0) tooltipParts.push(`${activity.kpiLogs} KPI log${activity.kpiLogs > 1 ? 's' : ''}`);
                        if (activity.reviews > 0) tooltipParts.push(`${activity.reviews} review${activity.reviews > 1 ? 's' : ''}`);
                      }
                      const tooltip = tooltipParts.length > 0
                        ? `${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}: ${tooltipParts.join(', ')}`
                        : `${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}: No activity`;

                      return (
                        <div
                          key={date}
                          className={cn(
                            "w-[11px] h-[11px] rounded-sm transition-colors cursor-pointer hover:ring-1 hover:ring-foreground/20",
                            getIntensityClass(level)
                          )}
                          title={tooltip}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={cn(
                    "w-[11px] h-[11px] rounded-sm",
                    getIntensityClass(level)
                  )}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
