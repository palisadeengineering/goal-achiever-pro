'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { VALUE_QUADRANTS } from '@/constants/drip';

interface ValuePieChartProps {
  data: {
    delegation: number;
    replacement: number;
    investment: number;
    production: number;
    na?: number;
  };
  showLegend?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ValuePieChart({ data, showLegend = true, size = 'md' }: ValuePieChartProps) {
  const chartData = [
    { name: 'Production', value: data.production, color: VALUE_QUADRANTS.production.color },
    { name: 'Investment', value: data.investment, color: VALUE_QUADRANTS.investment.color },
    { name: 'Replacement', value: data.replacement, color: VALUE_QUADRANTS.replacement.color },
    { name: 'Delegation', value: data.delegation, color: VALUE_QUADRANTS.delegation.color },
    ...(data.na ? [{ name: 'N/A', value: data.na, color: VALUE_QUADRANTS.na.color }] : []),
  ].filter(item => item.value > 0);

  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

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
        No data available
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
            const percent = ((numValue / total) * 100).toFixed(1);
            return [`${numValue} min (${percent}%)`, ''];
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
