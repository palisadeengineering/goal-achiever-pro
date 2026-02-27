'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { VALUE_QUADRANTS } from '@/constants/drip';
import type { DashboardEvent } from './types';

interface StackedTimelineProps {
  events: DashboardEvent[];
}

interface DayData {
  day: string;
  production: number;
  investment: number;
  replacement: number;
  delegation: number;
}

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function StackedTimeline({ events }: StackedTimelineProps) {
  const data = useMemo(() => {
    // Group events by block_date and quadrant
    const dayMap = new Map<string, DayData>();

    for (const event of events) {
      if (!event.blockDate) continue;
      const dateKey = event.blockDate;
      const quadrant = (event.quadrant ?? '').toLowerCase();

      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          day: getDayLabel(dateKey),
          production: 0,
          investment: 0,
          replacement: 0,
          delegation: 0,
        });
      }

      const entry = dayMap.get(dateKey)!;
      if (quadrant === 'production') entry.production += event.hours;
      else if (quadrant === 'investment') entry.investment += event.hours;
      else if (quadrant === 'replacement') entry.replacement += event.hours;
      else if (quadrant === 'delegation') entry.delegation += event.hours;
    }

    // Sort by date
    const sorted = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        ...v,
        production: Math.round(v.production * 10) / 10,
        investment: Math.round(v.investment * 10) / 10,
        replacement: Math.round(v.replacement * 10) / 10,
        delegation: Math.round(v.delegation * 10) / 10,
      }));

    return sorted;
  }, [events]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        No time data available for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350} minWidth={0}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          label={{
            value: 'Hours',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: 11 },
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value, name) => {
            const numValue = value as number;
            return [`${numValue}h`, name];
          }}
        />
        <Legend />
        <Bar
          dataKey="production"
          name="Production"
          fill={VALUE_QUADRANTS.production.color}
          stackId="drip"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="investment"
          name="Investment"
          fill={VALUE_QUADRANTS.investment.color}
          stackId="drip"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="replacement"
          name="Replacement"
          fill={VALUE_QUADRANTS.replacement.color}
          stackId="drip"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="delegation"
          name="Delegation"
          fill={VALUE_QUADRANTS.delegation.color}
          stackId="drip"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
