'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';

interface ChartDataPoint {
  label: string;
  value: number;
  color: string;
  percentage?: number;
}

interface TimeSeriesDataPoint {
  period: string;
  [key: string]: number | string;
}

interface HorizontalBarChartProps {
  data: ChartDataPoint[];
  measure: 'hours' | 'events';
}

export function HorizontalBarChart({ data, measure }: HorizontalBarChartProps) {
  const chartData = data.map(d => ({
    name: d.label,
    value: d.value,
    fill: d.color,
  }));

  return (
    <ResponsiveContainer width="100%" height={data.length * 50 + 40}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" tickFormatter={(v) => measure === 'hours' ? `${v}h` : v} />
        <YAxis type="category" dataKey="name" width={70} />
        <Tooltip
          formatter={(value) => [
            measure === 'hours' ? `${Number(value).toFixed(1)} hours` : `${value} events`,
            'Time'
          ]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface DonutChartProps {
  data: ChartDataPoint[];
  measure: 'hours' | 'events';
}

export function DonutChart({ data, measure }: DonutChartProps) {
  const chartData = data.filter(d => d.value > 0).map(d => ({
    name: d.label,
    value: d.value,
    color: d.color,
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground">
        No data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [
            measure === 'hours' ? `${Number(value).toFixed(1)} hours` : `${value} events`,
          ]}
        />
        <Legend />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-lg font-semibold"
        >
          {measure === 'hours' ? `${total.toFixed(1)}h` : total}
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}

interface StackedBarChartProps {
  data: TimeSeriesDataPoint[];
  keys: string[];
  colors: Record<string, string>;
  measure: 'hours' | 'events';
}

export function StackedBarChart({ data, keys, colors, measure }: StackedBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis tickFormatter={(v) => measure === 'hours' ? `${v}h` : v} />
        <Tooltip
          formatter={(value) => [
            measure === 'hours' ? `${Number(value).toFixed(1)} hours` : `${value} events`,
          ]}
        />
        <Legend />
        {keys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={colors[key] || '#94a3b8'}
            name={key.charAt(0).toUpperCase() + key.slice(1)}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

interface LineChartProps {
  data: TimeSeriesDataPoint[];
  keys: string[];
  colors: Record<string, string>;
  measure: 'hours' | 'events';
}

export function TrendLineChart({ data, keys, colors, measure }: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis tickFormatter={(v) => measure === 'hours' ? `${v}h` : v} />
        <Tooltip
          formatter={(value) => [
            measure === 'hours' ? `${Number(value).toFixed(1)} hours` : `${value} events`,
          ]}
        />
        <Legend />
        {keys.map((key) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[key] || '#94a3b8'}
            name={key.charAt(0).toUpperCase() + key.slice(1)}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Energy Flow Chart - shows energy levels throughout the day by hour
export interface EnergyFlowDataPoint {
  hour: number;
  hourLabel: string;
  avgEnergy: number;
  energizingMinutes: number;
  neutralMinutes: number;
  drainingMinutes: number;
  totalMinutes: number;
  dominantEnergy: 'green' | 'yellow' | 'red' | null;
}

interface EnergyFlowChartProps {
  data: EnergyFlowDataPoint[];
}

const ENERGY_GRADIENT_COLORS = {
  high: '#22c55e',    // Green - energizing
  medium: '#eab308',  // Yellow - neutral
  low: '#ef4444',     // Red - draining
};

function getEnergyColor(avgEnergy: number): string {
  if (avgEnergy >= 2.5) return ENERGY_GRADIENT_COLORS.high;
  if (avgEnergy >= 1.5) return ENERGY_GRADIENT_COLORS.medium;
  return ENERGY_GRADIENT_COLORS.low;
}

function getEnergyLabel(avgEnergy: number): string {
  if (avgEnergy >= 2.5) return 'High Energy';
  if (avgEnergy >= 1.5) return 'Medium Energy';
  if (avgEnergy > 0) return 'Low Energy';
  return 'No Data';
}

export function EnergyFlowChart({ data }: EnergyFlowChartProps) {
  const hasData = data.some(d => d.totalMinutes > 0);

  if (!hasData) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No energy data available for the selected period
      </div>
    );
  }

  // Create gradient stops based on data
  const gradientId = 'energyGradient';

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
            <stop offset="50%" stopColor="#eab308" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="hourLabel"
          tick={{ fontSize: 12 }}
          interval={1}
        />
        <YAxis
          domain={[0, 3]}
          ticks={[1, 2, 3]}
          tickFormatter={(v) => {
            if (v === 3) return 'High';
            if (v === 2) return 'Med';
            if (v === 1) return 'Low';
            return '';
          }}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;
            const dataPoint = payload[0]?.payload as EnergyFlowDataPoint;
            if (!dataPoint || dataPoint.totalMinutes === 0) {
              return (
                <div className="rounded-lg border bg-background p-3 shadow-md">
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">No activities tracked</p>
                </div>
              );
            }
            return (
              <div className="rounded-lg border bg-background p-3 shadow-md">
                <p className="font-medium">{label}</p>
                <p className="text-sm" style={{ color: getEnergyColor(dataPoint.avgEnergy) }}>
                  {getEnergyLabel(dataPoint.avgEnergy)}
                </p>
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-cyan-600">
                    Energizing: {Math.round(dataPoint.energizingMinutes)} min
                  </p>
                  <p className="text-yellow-600">
                    Neutral: {Math.round(dataPoint.neutralMinutes)} min
                  </p>
                  <p className="text-red-600">
                    Draining: {Math.round(dataPoint.drainingMinutes)} min
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Total: {Math.round(dataPoint.totalMinutes)} min tracked
                </p>
              </div>
            );
          }}
        />
        <ReferenceLine y={2} stroke="#94a3b8" strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="avgEnergy"
          stroke="#3b82f6"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={(props) => {
            const { cx, cy, payload } = props;
            if (!payload || payload.totalMinutes === 0) return <circle key={`dot-${payload?.hour}`} cx={cx} cy={cy} r={0} />;
            return (
              <circle
                key={`dot-${payload.hour}`}
                cx={cx}
                cy={cy}
                r={5}
                fill={getEnergyColor(payload.avgEnergy)}
                stroke="#fff"
                strokeWidth={2}
              />
            );
          }}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
