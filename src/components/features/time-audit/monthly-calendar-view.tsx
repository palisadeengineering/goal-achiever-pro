'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DRIP_QUADRANTS } from '@/constants/drip';
import type { DripQuadrant } from '@/types/database';

interface TimeBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  activityName: string;
  dripQuadrant: DripQuadrant;
}

interface DayData {
  date: Date;
  totalMinutes: number;
  dripBreakdown: {
    delegation: number;
    replacement: number;
    investment: number;
    production: number;
  };
}

interface MonthlyCalendarViewProps {
  timeBlocks?: TimeBlock[];
  onDayClick?: (date: Date) => void;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
}

// Calculate duration in minutes between two time strings
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

export function MonthlyCalendarView({
  timeBlocks = [],
  onDayClick,
  onDateRangeChange,
}: MonthlyCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Memoize date calculations to prevent infinite re-renders
  // Use weekStartsOn: 0 (Sunday) to match WeeklyCalendarView
  const { monthStart, monthEnd, calendarStart, calendarEnd } = useMemo(() => {
    const mStart = startOfMonth(currentMonth);
    const mEnd = endOfMonth(currentMonth);
    return {
      monthStart: mStart,
      monthEnd: mEnd,
      calendarStart: startOfWeek(mStart, { weekStartsOn: 0 }),
      calendarEnd: endOfWeek(mEnd, { weekStartsOn: 0 }),
    };
  }, [currentMonth]);

  // Notify parent when date range changes - use a ref to track previous values
  const prevDateRangeRef = useRef<{ start: number; end: number } | null>(null);
  useEffect(() => {
    const startTime = monthStart.getTime();
    const endTime = monthEnd.getTime();

    // Only call callback if the dates actually changed
    if (!prevDateRangeRef.current ||
        prevDateRangeRef.current.start !== startTime ||
        prevDateRangeRef.current.end !== endTime) {
      prevDateRangeRef.current = { start: startTime, end: endTime };
      onDateRangeChange?.(monthStart, monthEnd);
    }
  }, [monthStart, monthEnd, onDateRangeChange]);

  // Generate all days to display
  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Compute month data from time blocks
  const monthData = useMemo(() => {
    const dayDataMap = new Map<string, DayData>();

    // Filter blocks for the current month's calendar range
    const calendarStartStr = format(calendarStart, 'yyyy-MM-dd');
    const calendarEndStr = format(calendarEnd, 'yyyy-MM-dd');

    timeBlocks.forEach((block) => {
      if (block.date >= calendarStartStr && block.date <= calendarEndStr) {
        const dateKey = block.date;
        const duration = calculateDuration(block.startTime, block.endTime);

        if (!dayDataMap.has(dateKey)) {
          dayDataMap.set(dateKey, {
            date: parseISO(dateKey),
            totalMinutes: 0,
            dripBreakdown: { delegation: 0, replacement: 0, investment: 0, production: 0 },
          });
        }

        const dayData = dayDataMap.get(dateKey)!;
        dayData.totalMinutes += duration;

        // Add duration to the appropriate DRIP quadrant
        const quadrant = block.dripQuadrant;
        if (quadrant === 'delegation' || quadrant === 'replacement' ||
            quadrant === 'investment' || quadrant === 'production') {
          dayData.dripBreakdown[quadrant] += duration;
        }
      }
    });

    return Array.from(dayDataMap.values());
  }, [timeBlocks, calendarStart, calendarEnd]);

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => addMonths(prev, -1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  const getDayData = (date: Date): DayData | undefined => {
    return monthData.find(d => isSameDay(d.date, date));
  };

  // Calculate month totals
  const monthTotals = monthData.reduce(
    (acc, day) => ({
      totalMinutes: acc.totalMinutes + day.totalMinutes,
      delegation: acc.delegation + day.dripBreakdown.delegation,
      replacement: acc.replacement + day.dripBreakdown.replacement,
      investment: acc.investment + day.dripBreakdown.investment,
      production: acc.production + day.dripBreakdown.production,
    }),
    { totalMinutes: 0, delegation: 0, replacement: 0, investment: 0, production: 0 }
  );

  const DayCell = ({ date }: { date: Date }) => {
    const data = getDayData(date);
    const total = data?.totalMinutes || 0;
    const breakdown = data?.dripBreakdown || { delegation: 0, replacement: 0, investment: 0, production: 0 };
    const isToday = isSameDay(date, new Date());
    const isCurrentMonth = isSameMonth(date, currentMonth);

    return (
      <button
        onClick={() => onDayClick?.(date)}
        className={cn(
          'aspect-square p-1 border rounded-lg hover:bg-muted/50 transition-colors text-left flex flex-col',
          isToday && 'ring-2 ring-primary',
          !isCurrentMonth && 'opacity-40'
        )}
      >
        <span className={cn(
          'text-xs font-medium mb-1',
          isToday && 'text-primary'
        )}>
          {format(date, 'd')}
        </span>

        {/* Mini DRIP Distribution Bar */}
        {total > 0 && (
          <div className="flex-1 flex flex-col justify-end">
            <div className="h-2 rounded-full overflow-hidden flex">
              {breakdown.production > 0 && (
                <div
                  style={{
                    width: `${(breakdown.production / total) * 100}%`,
                    backgroundColor: DRIP_QUADRANTS.production.color,
                  }}
                />
              )}
              {breakdown.investment > 0 && (
                <div
                  style={{
                    width: `${(breakdown.investment / total) * 100}%`,
                    backgroundColor: DRIP_QUADRANTS.investment.color,
                  }}
                />
              )}
              {breakdown.replacement > 0 && (
                <div
                  style={{
                    width: `${(breakdown.replacement / total) * 100}%`,
                    backgroundColor: DRIP_QUADRANTS.replacement.color,
                  }}
                />
              )}
              {breakdown.delegation > 0 && (
                <div
                  style={{
                    width: `${(breakdown.delegation / total) * 100}%`,
                    backgroundColor: DRIP_QUADRANTS.delegation.color,
                  }}
                />
              )}
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Monthly Overview</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month Summary */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Time</p>
            <p className="text-lg font-bold">
              {Math.round(monthTotals.totalMinutes / 60)}h
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Production</p>
            <p className="text-lg font-bold text-cyan-600">
              {monthTotals.totalMinutes > 0
                ? Math.round((monthTotals.production / monthTotals.totalMinutes) * 100)
                : 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Investment</p>
            <p className="text-lg font-bold text-blue-600">
              {monthTotals.totalMinutes > 0
                ? Math.round((monthTotals.investment / monthTotals.totalMinutes) * 100)
                : 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">To Optimize</p>
            <p className="text-lg font-bold text-purple-600">
              {monthTotals.totalMinutes > 0
                ? Math.round(((monthTotals.delegation + monthTotals.replacement) / monthTotals.totalMinutes) * 100)
                : 0}%
            </p>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-xs text-muted-foreground font-medium py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => (
            <DayCell key={index} date={date} />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          {Object.entries(DRIP_QUADRANTS).map(([key, quadrant]) => (
            <Badge
              key={key}
              variant="outline"
              className="gap-1"
              style={{ borderColor: quadrant.color }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: quadrant.color }}
              />
              {quadrant.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
