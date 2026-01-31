'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, TrendingUp, TrendingDown, Users } from 'lucide-react';

interface MeetingCategoryBreakdown {
  categoryId: string;
  categoryName: string;
  minutes: number;
  eventCount: number;
}

interface MeetingMetrics {
  totalMeetingMinutes: number;
  meetingFreeMinutes: number;
  meetingPercentage: number;
  categoryBreakdown: MeetingCategoryBreakdown[];
  longestMeetingDay: { date: string; minutes: number };
  averageMeetingDuration: number;
  trend: number;
}

interface MeetingLoadWidgetProps {
  metrics: MeetingMetrics;
}

// Colors for meeting categories
const CATEGORY_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
  '#ef4444', // red
  '#06b6d4', // cyan
];

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function MeetingLoadWidget({ metrics }: MeetingLoadWidgetProps) {
  const chartData = useMemo(() => {
    return metrics.categoryBreakdown.map((cat, index) => ({
      name: cat.categoryName,
      value: cat.minutes,
      count: cat.eventCount,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  }, [metrics.categoryBreakdown]);

  const totalMeetingEvents = useMemo(() => {
    return metrics.categoryBreakdown.reduce((sum, cat) => sum + cat.eventCount, 0);
  }, [metrics.categoryBreakdown]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Meeting Load</CardTitle>
          <div className="flex items-center gap-1">
            {metrics.trend !== 0 && (
              metrics.trend > 0 ? (
                <span className="flex items-center gap-0.5 text-amber-600 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  +{metrics.trend}%
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-green-600 text-xs">
                  <TrendingDown className="h-3 w-3" />
                  {metrics.trend}%
                </span>
              )
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-semibold text-amber-600">
              {formatMinutes(metrics.totalMeetingMinutes)}
            </div>
            <div className="text-xs text-muted-foreground">In Meetings</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-semibold text-green-600">
              {formatMinutes(metrics.meetingFreeMinutes)}
            </div>
            <div className="text-xs text-muted-foreground">Meeting-Free</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-semibold">
              {metrics.meetingPercentage}%
            </div>
            <div className="text-xs text-muted-foreground">Of Total Time</div>
          </div>
        </div>

        {/* Pie Chart & Category List */}
        {chartData.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Mini Pie Chart */}
            <div className="h-[120px] w-full lg:w-1/3">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMinutes(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="flex-1 space-y-1.5">
              {chartData.slice(0, 5).map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm">{cat.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatMinutes(cat.value)} ({cat.count})
                  </span>
                </div>
              ))}
              {chartData.length > 5 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{chartData.length - 5} more
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No meetings tracked in this period
          </div>
        )}

        {/* Additional Stats */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{totalMeetingEvents}</div>
              <div className="text-xs text-muted-foreground">Total Meetings</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{formatMinutes(metrics.averageMeetingDuration)}</div>
              <div className="text-xs text-muted-foreground">Avg Duration</div>
            </div>
          </div>
        </div>

        {/* Busiest Meeting Day */}
        {metrics.longestMeetingDay.minutes > 0 && (
          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span className="text-muted-foreground">Busiest day:</span>
              <span className="font-medium">
                {formatDate(metrics.longestMeetingDay.date)}
              </span>
              <span className="text-amber-600">
                ({formatMinutes(metrics.longestMeetingDay.minutes)})
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
