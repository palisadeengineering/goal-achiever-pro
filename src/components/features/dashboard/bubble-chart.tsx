'use client';

import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
  ReferenceArea,
} from 'recharts';
import { VALUE_QUADRANTS } from '@/constants/drip';
import type { DashboardEvent } from './types';

interface BubbleChartProps {
  events: DashboardEvent[];
}

interface BubblePoint {
  x: number; // Lights You Up (1-5)
  y: number; // Makes You Money (derived from quadrant)
  z: number; // hours (bubble size)
  name: string;
  quadrant: string;
  color: string;
}

function energyToNumber(rating: string | null): number {
  switch (rating) {
    case 'green':
      return 4;
    case 'yellow':
      return 3;
    case 'red':
      return 1;
    default:
      return 2.5;
  }
}

function quadrantToMoney(quadrant: string | null): number {
  switch ((quadrant ?? '').toLowerCase()) {
    case 'production':
      return 4;
    case 'replacement':
      return 3;
    case 'investment':
      return 2;
    case 'delegation':
      return 1;
    default:
      return 2.5;
  }
}

function getQuadrantColor(quadrant: string | null): string {
  const q = (quadrant ?? '').toLowerCase();
  if (q in VALUE_QUADRANTS) {
    return VALUE_QUADRANTS[q as keyof typeof VALUE_QUADRANTS].color;
  }
  return '#6b7280';
}

// Custom tooltip for scatter chart
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: BubblePoint }> }) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  return (
    <div
      className="rounded-lg border bg-card p-3 shadow-md"
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      <p className="font-medium text-sm">{data.name}</p>
      <p className="text-xs text-muted-foreground capitalize">{data.quadrant}</p>
      <p className="text-xs text-muted-foreground">{data.z.toFixed(1)}h</p>
    </div>
  );
}

export function BubbleChart({ events }: BubbleChartProps) {
  const data = useMemo(() => {
    // Aggregate events by title+quadrant to reduce clutter
    const aggregated = new Map<string, BubblePoint>();

    for (const event of events) {
      const q = (event.quadrant ?? '').toLowerCase();
      if (!q || q === 'na') continue;

      const key = `${event.title}-${q}`;
      if (aggregated.has(key)) {
        aggregated.get(key)!.z += event.hours;
      } else {
        // Add small jitter to spread out points within the same quadrant
        const jitterX = (Math.random() - 0.5) * 0.6;
        const jitterY = (Math.random() - 0.5) * 0.6;
        aggregated.set(key, {
          x: energyToNumber(event.energyRating) + jitterX,
          y: quadrantToMoney(event.quadrant) + jitterY,
          z: event.hours,
          name: event.title,
          quadrant: q,
          color: getQuadrantColor(event.quadrant),
        });
      }
    }

    return Array.from(aggregated.values());
  }, [events]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        No categorized events to display
      </div>
    );
  }

  // Scale bubble sizes: min 40, max 400
  const maxHours = Math.max(...data.map((d) => d.z), 1);
  const minSize = 40;
  const maxSize = 400;

  return (
    <ResponsiveContainer width="100%" height={350} minWidth={0}>
      <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          type="number"
          dataKey="x"
          domain={[0, 5]}
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          label={{
            value: 'Lights You Up',
            position: 'insideBottom',
            offset: -10,
            style: { textAnchor: 'middle', fontSize: 11 },
          }}
        />
        <YAxis
          type="number"
          dataKey="y"
          domain={[0, 5]}
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          label={{
            value: 'Makes You Money',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: 11 },
          }}
        />
        <ZAxis
          type="number"
          dataKey="z"
          domain={[0, maxHours]}
          range={[minSize, maxSize]}
        />

        {/* Quadrant background zones */}
        <ReferenceArea x1={0} x2={2.5} y1={2.5} y2={5} fill="#f59e0b" fillOpacity={0.04} />
        <ReferenceArea x1={2.5} x2={5} y1={2.5} y2={5} fill="#22c55e" fillOpacity={0.04} />
        <ReferenceArea x1={0} x2={2.5} y1={0} y2={2.5} fill="#ef4444" fillOpacity={0.04} />
        <ReferenceArea x1={2.5} x2={5} y1={0} y2={2.5} fill="#a855f7" fillOpacity={0.04} />

        <Tooltip content={<CustomTooltip />} />
        <Scatter data={data} fillOpacity={0.7}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={1} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
