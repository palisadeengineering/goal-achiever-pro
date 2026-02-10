'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Code, FileText, DollarSign, Users } from 'lucide-react';
import type { LeverageBreakdown } from '@/lib/hooks/use-enhanced-analytics';

interface LeverageBreakdownChartProps {
  data: LeverageBreakdown[];
}

const LEVERAGE_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  code: { label: 'Code', color: '#6366f1', icon: Code },
  content: { label: 'Content', color: '#10b981', icon: FileText },
  capital: { label: 'Capital', color: '#f59e0b', icon: DollarSign },
  collaboration: { label: 'Collaboration', color: '#8b5cf6', icon: Users },
};

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function LeverageBreakdownChart({ data }: LeverageBreakdownChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => {
      const config = LEVERAGE_CONFIG[item.type];
      return {
        name: config?.label || item.type,
        value: item.minutes,
        percentage: item.percentage,
        color: config?.color || '#94a3b8',
      };
    });
  }, [data]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Leverage Distribution (4 C&apos;s)</CardTitle>
          <CardDescription>Track how you&apos;re building leverage through Code, Content, Capital, and Collaboration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[150px] items-center justify-center text-muted-foreground text-sm">
            No leverage data tracked yet. Assign leverage types to your time blocks.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Leverage Distribution (4 C&apos;s)</CardTitle>
        <CardDescription>How your time builds leverage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Pie Chart */}
          <div className="h-[160px] w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
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

          {/* Legend */}
          <div className="flex-1 space-y-3">
            {(Object.entries(LEVERAGE_CONFIG) as [string, typeof LEVERAGE_CONFIG[string]][]).map(([key, config]) => {
              const item = data.find((d) => d.type === key);
              const Icon = config.icon;
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item ? `${item.percentage}% \u00b7 ${formatMinutes(item.minutes)}` : '0%'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
