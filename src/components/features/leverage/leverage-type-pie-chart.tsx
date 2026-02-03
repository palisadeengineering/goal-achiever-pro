'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { LeverageTimeData, LeverageType } from '@/lib/hooks/use-leverage-analytics';

const LEVERAGE_COLORS: Record<LeverageType, string> = {
  code: '#3b82f6',      // blue-500
  content: '#a855f7',   // purple-500
  capital: '#22c55e',   // green-500
  collaboration: '#f97316', // orange-500
};

const LEVERAGE_LABELS: Record<LeverageType, string> = {
  code: 'Code',
  content: 'Content',
  capital: 'Capital',
  collaboration: 'Collaboration',
};

interface LeverageTypePieChartProps {
  data: LeverageTimeData[];
  showLegend?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LeverageTypePieChart({ data, showLegend = true, size = 'md' }: LeverageTypePieChartProps) {
  const chartData = data
    .filter(item => item.totalMinutes > 0)
    .map(item => ({
      name: LEVERAGE_LABELS[item.leverageType],
      value: item.totalMinutes,
      color: LEVERAGE_COLORS[item.leverageType],
      percentage: item.percentage,
    }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const heights = {
    sm: 150,
    md: 200,
    lg: 280,
  };

  const innerRadius = size === 'sm' ? 30 : size === 'md' ? 40 : 50;
  const outerRadius = size === 'sm' ? 50 : size === 'md' ? 70 : 90;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No leverage time tracked yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={heights[size]} minWidth={0}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => {
            const numValue = Number(value) || 0;
            const hours = (numValue / 60).toFixed(1);
            const percent = ((numValue / total) * 100).toFixed(1);
            return [`${hours}h (${percent}%)`, ''];
          }}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-xs">{value}</span>
            )}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
