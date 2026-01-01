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
  ComposedChart,
} from 'recharts';
import { DRIP_QUADRANTS } from '@/constants/drip';

interface WeeklyTrendData {
  week: string;
  delegationHours: number;
  replacementHours: number;
  investmentHours: number;
  productionHours: number;
  totalHours: number;
  productionPercentage: number;
  energyBalance: number;
}

interface WeeklyTrendsChartProps {
  data: WeeklyTrendData[];
  showPercentage?: boolean;
}

export function WeeklyTrendsChart({ data, showPercentage = true }: WeeklyTrendsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available for the selected period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          label={{
            value: 'Hours',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: 12 },
          }}
        />
        {showPercentage && (
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            label={{
              value: '%',
              angle: 90,
              position: 'insideRight',
              style: { textAnchor: 'middle', fontSize: 12 },
            }}
          />
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value, name) => {
            const numValue = value as number;
            if (name === 'Production %' || name === 'Energy Balance') {
              return [`${numValue}%`, name];
            }
            return [`${numValue.toFixed(1)}h`, name];
          }}
        />
        <Legend />

        {/* DRIP Category Lines */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="delegationHours"
          stroke={DRIP_QUADRANTS.delegation.color}
          name="Delegation"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="replacementHours"
          stroke={DRIP_QUADRANTS.replacement.color}
          name="Replacement"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="investmentHours"
          stroke={DRIP_QUADRANTS.investment.color}
          name="Investment"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="productionHours"
          stroke={DRIP_QUADRANTS.production.color}
          name="Production"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />

        {/* Production Percentage Line */}
        {showPercentage && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="productionPercentage"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Production %"
            dot={{ r: 3 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Simpler version showing just production percentage trend
export function ProductionTrendChart({ data }: { data: WeeklyTrendData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value) => [`${value as number}%`, 'Production']}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Line
          type="monotone"
          dataKey="productionPercentage"
          stroke={DRIP_QUADRANTS.production.color}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Energy balance trend
export function EnergyBalanceTrendChart({ data }: { data: WeeklyTrendData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis domain={[-100, 100]} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value) => [`${value as number}%`, 'Energy Balance']}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        {/* Reference line at 0 */}
        <Line
          type="monotone"
          dataKey="energyBalance"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
