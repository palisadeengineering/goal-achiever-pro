'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectBreakdown {
  projectId: string;
  projectName: string;
  linkedGoalId?: string;
  linkedGoalName?: string;
  totalMinutes: number;
  eventCount: number;
  trend: number;
}

interface TimeByProjectChartProps {
  data: ProjectBreakdown[];
  maxProjects?: number;
  onProjectClick?: (projectId: string) => void;
}

// Generate a color based on the project name (consistent hashing)
function getProjectColor(name: string): string {
  const colors = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function TrendIndicator({ trend }: { trend: number }) {
  if (trend === 0) {
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
  if (trend > 0) {
    return (
      <span className="flex items-center gap-0.5 text-green-600 text-xs">
        <TrendingUp className="h-3 w-3" />
        +{trend}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-red-600 text-xs">
      <TrendingDown className="h-3 w-3" />
      {trend}%
    </span>
  );
}

export function TimeByProjectChart({ data, maxProjects = 8, onProjectClick }: TimeByProjectChartProps) {
  const chartData = useMemo(() => {
    return data.slice(0, maxProjects).map((item) => ({
      name: item.projectName.length > 20
        ? item.projectName.substring(0, 20) + '...'
        : item.projectName,
      fullName: item.projectName,
      projectId: item.projectId,
      hours: Math.round((item.totalMinutes / 60) * 10) / 10,
      minutes: item.totalMinutes,
      events: item.eventCount,
      trend: item.trend,
      color: getProjectColor(item.projectName),
      linkedGoalName: item.linkedGoalName,
    }));
  }, [data, maxProjects]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Time by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No project time tracked
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalProjectMinutes = data.reduce((sum, p) => sum + p.totalMinutes, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Time by Project</CardTitle>
        <span className="text-sm text-muted-foreground">
          {formatMinutes(totalProjectMinutes)} total
        </span>
      </CardHeader>
      <CardContent>
        {/* Bar Chart */}
        <div className="h-[200px] mb-4">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value, _name, props) => [
                  `${value}h`,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (props as any).payload?.fullName || 'Hours',
                ]}
                labelFormatter={() => ''}
              />
              <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project List with details */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {chartData.map((item) => (
            <div
              key={item.fullName}
              className={`flex items-center justify-between py-1.5 border-b last:border-0 ${
                onProjectClick ? 'group cursor-pointer hover:bg-accent/50 rounded-md px-1 -mx-1 transition-colors' : ''
              }`}
              onClick={onProjectClick ? () => onProjectClick(item.projectId) : undefined}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate" title={item.fullName}>
                    {item.fullName}
                  </div>
                  {item.linkedGoalName && (
                    <div className="text-xs text-muted-foreground truncate">
                      → {item.linkedGoalName}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm text-muted-foreground">
                  {item.events} {item.events === 1 ? 'block' : 'blocks'}
                </span>
                <span className="text-sm font-medium w-16 text-right">
                  {formatMinutes(item.minutes)}
                </span>
                <div className="w-12">
                  <TrendIndicator trend={item.trend} />
                </div>
                {onProjectClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProjectClick(item.projectId);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {data.length > maxProjects && (
          <div className="mt-2 text-center text-xs text-muted-foreground">
            +{data.length - maxProjects} more projects
          </div>
        )}
      </CardContent>
    </Card>
  );
}
