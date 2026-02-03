'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { WeeklyTrend, LeverageType } from '@/lib/hooks/use-leverage-analytics';

const LEVERAGE_COLORS: Record<LeverageType, string> = {
  code: '#3b82f6',      // blue-500
  content: '#a855f7',   // purple-500
  capital: '#22c55e',   // green-500
  collaboration: '#f97316', // orange-500
};

interface LeverageTrendsChartProps {
  data: WeeklyTrend[];
  chartType?: 'line' | 'area';
}

export function LeverageTrendsChart({ data, chartType = 'area' }: LeverageTrendsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No trends data available for the selected period
      </div>
    );
  }

  // Transform data to hours and format week labels
  const chartData = data.map(week => ({
    week: format(parseISO(week.weekStart), 'MMM d'),
    code: week.code / 60,
    content: week.content / 60,
    capital: week.capital / 60,
    collaboration: week.collaboration / 60,
    total: week.total / 60,
  }));

  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height={300} minWidth={0}>
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            label={{
              value: 'Hours',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: 12 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value) => [`${(value as number).toFixed(1)}h`, '']}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="code"
            stackId="1"
            stroke={LEVERAGE_COLORS.code}
            fill={LEVERAGE_COLORS.code}
            fillOpacity={0.6}
            name="Code"
          />
          <Area
            type="monotone"
            dataKey="content"
            stackId="1"
            stroke={LEVERAGE_COLORS.content}
            fill={LEVERAGE_COLORS.content}
            fillOpacity={0.6}
            name="Content"
          />
          <Area
            type="monotone"
            dataKey="capital"
            stackId="1"
            stroke={LEVERAGE_COLORS.capital}
            fill={LEVERAGE_COLORS.capital}
            fillOpacity={0.6}
            name="Capital"
          />
          <Area
            type="monotone"
            dataKey="collaboration"
            stackId="1"
            stroke={LEVERAGE_COLORS.collaboration}
            fill={LEVERAGE_COLORS.collaboration}
            fillOpacity={0.6}
            name="Collaboration"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300} minWidth={0}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          label={{
            value: 'Hours',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: 12 },
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value) => [`${(value as number).toFixed(1)}h`, '']}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="code"
          stroke={LEVERAGE_COLORS.code}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name="Code"
        />
        <Line
          type="monotone"
          dataKey="content"
          stroke={LEVERAGE_COLORS.content}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name="Content"
        />
        <Line
          type="monotone"
          dataKey="capital"
          stroke={LEVERAGE_COLORS.capital}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name="Capital"
        />
        <Line
          type="monotone"
          dataKey="collaboration"
          stroke={LEVERAGE_COLORS.collaboration}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name="Collaboration"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
