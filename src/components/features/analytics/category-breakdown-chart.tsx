'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActivityType } from '@/lib/hooks/use-enhanced-analytics';

interface ActivityTypeBreakdown {
  type: ActivityType;
  minutes: number;
  percentage: number;
  trend: number;
}

interface CategoryBreakdownChartProps {
  data: ActivityTypeBreakdown[];
  totalMinutes: number;
}

// Colors for each activity type
const ACTIVITY_COLORS: Record<ActivityType, string> = {
  project: '#6366f1', // indigo
  meeting: '#f59e0b', // amber
  deep_work: '#10b981', // emerald
  commute: '#8b5cf6', // violet
  admin: '#64748b', // slate
  break: '#ec4899', // pink
  other: '#94a3b8', // gray
};

// Display names for activity types
const ACTIVITY_LABELS: Record<ActivityType, string> = {
  project: 'Project Work',
  meeting: 'Meetings',
  deep_work: 'Deep Work',
  commute: 'Commute',
  admin: 'Admin',
  break: 'Breaks',
  other: 'Other',
};

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function CategoryBreakdownChart({ data, totalMinutes }: CategoryBreakdownChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      name: ACTIVITY_LABELS[item.type],
      value: item.minutes,
      percentage: item.percentage,
      color: ACTIVITY_COLORS[item.type],
      trend: item.trend,
    }));
  }, [data]);

  if (data.length === 0 || totalMinutes === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Activity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No time tracked in this period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Activity Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Pie Chart */}
          <div className="h-[200px] w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatMinutes(value as number)}
                  labelFormatter={(name) => String(name)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend with percentages */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.percentage}% · {formatMinutes(item.value)}
                    {item.trend !== 0 && (
                      <span className={item.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                        {' '}({item.trend > 0 ? '+' : ''}{item.trend}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t text-center">
          <span className="text-sm text-muted-foreground">Total: </span>
          <span className="text-sm font-medium">{formatMinutes(totalMinutes)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
