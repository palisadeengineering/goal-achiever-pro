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
