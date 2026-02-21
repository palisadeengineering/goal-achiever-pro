'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Coffee, Briefcase, TrendingUp } from 'lucide-react';

interface WorkSummaryCardProps {
  timeData: Array<{
    date: string;
    startTime: string;
    endTime: string;
    dayMarker?: string | null;
    durationMinutes: number;
  }>;
}

function formatHours(minutes: number): string {
  if (minutes <= 0) return '0h';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function WorkSummaryCard({ timeData }: WorkSummaryCardProps) {
  const summary = useMemo(() => {
    // Group events by date
    const byDate = new Map<string, typeof timeData>();
    for (const item of timeData) {
      const existing = byDate.get(item.date) || [];
      existing.push(item);
      byDate.set(item.date, existing);
    }

    let totalWorkMinutes = 0;
    let totalBreakMinutes = 0;
    let daysWithMarkers = 0;

    for (const [, events] of byDate) {
      let dayStart: number | null = null;
      let dayEnd: number | null = null;
      let dayBreak = 0;

      for (const event of events) {
        if (event.dayMarker === 'start_of_work') {
          const startMin = timeToMinutes(event.startTime);
          if (dayStart === null || startMin < dayStart) {
            dayStart = startMin;
          }
        }
        if (event.dayMarker === 'end_of_work') {
          const endMin = timeToMinutes(event.endTime);
          if (dayEnd === null || endMin > dayEnd) {
            dayEnd = endMin;
          }
        }
        if (event.dayMarker === 'break') {
          dayBreak += event.durationMinutes;
        }
      }

      if (dayStart !== null && dayEnd !== null && dayEnd > dayStart) {
        const span = dayEnd - dayStart;
        totalWorkMinutes += span;
        totalBreakMinutes += dayBreak;
        daysWithMarkers++;
      }
    }

    const netWorkMinutes = totalWorkMinutes - totalBreakMinutes;
    const avgPerDay = daysWithMarkers > 0 ? Math.round(netWorkMinutes / daysWithMarkers) : 0;

    return {
      totalWorkMinutes,
      totalBreakMinutes,
      netWorkMinutes,
      avgPerDay,
      daysWithMarkers,
    };
  }, [timeData]);

  if (summary.daysWithMarkers === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Mark events with day markers (Start of Work, End of Work, Break) to see your work summary.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Work Hours</span>
          </div>
          <p className="text-2xl font-bold mt-1">{formatHours(summary.totalWorkMinutes)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">Break Hours</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-amber-500">{formatHours(summary.totalBreakMinutes)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-600" />
            <span className="text-sm text-muted-foreground">Net Hours</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-cyan-600">{formatHours(summary.netWorkMinutes)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Avg Hours/Day</span>
          </div>
          <p className="text-2xl font-bold mt-1">{formatHours(summary.avgPerDay)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{summary.daysWithMarkers} day{summary.daysWithMarkers !== 1 ? 's' : ''} tracked</p>
        </CardContent>
      </Card>
    </div>
  );
}
