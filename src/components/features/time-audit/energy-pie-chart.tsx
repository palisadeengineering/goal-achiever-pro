'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ENERGY_RATINGS } from '@/constants/drip';

interface EnergyPieChartProps {
  data: {
    green: number;
    yellow: number;
    red: number;
  };
  showLegend?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function EnergyPieChart({ data, showLegend = true, size = 'md' }: EnergyPieChartProps) {
  const chartData = [
    { name: 'Energizing', value: data.green, color: ENERGY_RATINGS.green.color },
    { name: 'Neutral', value: data.yellow, color: ENERGY_RATINGS.yellow.color },
    { name: 'Draining', value: data.red, color: ENERGY_RATINGS.red.color },
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
