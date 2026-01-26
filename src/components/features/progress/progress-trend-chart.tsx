'use client';

/**
 * Progress Trend Chart Component
 *
 * Displays progress over time using Recharts.
 * Shows composite scores and completion trends with date range selector.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { format, subDays, subMonths, parseISO, isAfter } from 'date-fns';
import { TrendingUp, Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DayActivity {
  date: string;
  score: number;
  kpiLogs: number;
  goalsCompleted: number;
}

interface ProgressTrendChartProps {
  visionId?: string | null;
  className?: string;
}

type DateRangeOption = '7d' | '30d' | '90d' | '365d';

const DATE_RANGES: { value: DateRangeOption; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '365d', label: '1 Year' },
];

function formatDateLabel(dateStr: string, range: DateRangeOption): string {
  const date = parseISO(dateStr);
  if (range === '7d') {
    return format(date, 'EEE');
  } else if (range === '30d') {
    return format(date, 'MMM d');
  } else if (range === '90d') {
    return format(date, 'MMM d');
  }
  return format(date, 'MMM');
}

export function ProgressTrendChart({ visionId, className }: ProgressTrendChartProps) {
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vision-activity', visionId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (visionId) params.set('visionId', visionId);

      const response = await fetch(`/api/vision-activity?${params}`);
      if (!response.ok) throw new Error('Failed to fetch activity');
      return response.json();
    },
  });

  // Filter and format data based on date range
  const chartData = useMemo(() => {
    if (!data?.activity) return [];

    const now = new Date();
    let cutoffDate: Date;

    switch (dateRange) {
      case '7d':
        cutoffDate = subDays(now, 7);
        break;
      case '30d':
        cutoffDate = subDays(now, 30);
        break;
      case '90d':
        cutoffDate = subDays(now, 90);
        break;
      case '365d':
        cutoffDate = subMonths(now, 12);
        break;
      default:
        cutoffDate = subDays(now, 30);
    }

    const activities = (data.activity as DayActivity[])
      .filter(a => isAfter(parseISO(a.date), cutoffDate))
      .sort((a, b) => a.date.localeCompare(b.date));

    // For longer ranges, aggregate by week
    if (dateRange === '365d' && activities.length > 52) {
      const weeklyData: { [key: string]: { score: number; count: number; date: string } } = {};

      activities.forEach(a => {
        const weekStart = format(parseISO(a.date), 'yyyy-ww');
        if (!weeklyData[weekStart]) {
          weeklyData[weekStart] = { score: 0, count: 0, date: a.date };
        }
        weeklyData[weekStart].score += a.score;
        weeklyData[weekStart].count += 1;
      });

      return Object.entries(weeklyData)
        .map(([, val]) => ({
          date: val.date,
          label: format(parseISO(val.date), 'MMM'),
          score: Math.round(val.score / val.count),
          completions: val.count,
        }))
        .slice(-52);
    }

    return activities.map(a => ({
      date: a.date,
      label: formatDateLabel(a.date, dateRange),
      score: a.score,
      completions: a.kpiLogs + a.goalsCompleted,
    }));
  }, [data?.activity, dateRange]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[250px]">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">Failed to load chart</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Trend
          </CardTitle>
          <div className="flex gap-1">
            {DATE_RANGES.map(range => (
              <Button
                key={range.value}
                variant={dateRange === range.value ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setDateRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={dateRange === '7d' ? 0 : 'preserveStartEnd'}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value, name) => {
                  if (name === 'score') return [`${value}%`, 'Daily Score'];
                  return [value, 'Completions'];
                }}
                labelFormatter={(label, payload) => {
                  if (payload?.[0]?.payload?.date) {
                    return format(parseISO(payload[0].payload.date), 'MMM d, yyyy');
                  }
                  return label;
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#scoreGradient)"
              />
              <Bar
                dataKey="completions"
                fill="hsl(var(--primary))"
                opacity={0.3}
                radius={[2, 2, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px]">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium mb-1">No data yet</p>
            <p className="text-xs text-muted-foreground text-center">
              Complete KPIs to see your progress trend
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
