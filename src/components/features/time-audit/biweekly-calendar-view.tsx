'use client';

import { useState } from 'react';
import { format, startOfWeek, addDays, addWeeks, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DRIP_QUADRANTS } from '@/constants/drip';
import type { DripQuadrant } from '@/types/database';

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

interface BiweeklyCalendarViewProps {
  week1Data?: DayData[];
  week2Data?: DayData[];
  onDayClick?: (date: Date) => void;
}

export function BiweeklyCalendarView({
  week1Data = [],
  week2Data = [],
  onDayClick,
}: BiweeklyCalendarViewProps) {
  const [startDate, setStartDate] = useState(() =>
    startOfWeek(addWeeks(new Date(), -1), { weekStartsOn: 1 })
  );

  const week1Start = startDate;
  const week2Start = addWeeks(startDate, 1);

  const week1Days = Array.from({ length: 7 }, (_, i) => addDays(week1Start, i));
  const week2Days = Array.from({ length: 7 }, (_, i) => addDays(week2Start, i));

  const goToPreviousBiweek = () => {
    setStartDate(prev => addWeeks(prev, -2));
  };

  const goToNextBiweek = () => {
    setStartDate(prev => addWeeks(prev, 2));
  };

  const goToCurrentBiweek = () => {
    setStartDate(startOfWeek(addWeeks(new Date(), -1), { weekStartsOn: 1 }));
  };

  // Calculate week totals
  const calculateWeekTotals = (data: DayData[]) => {
    return data.reduce(
      (acc, day) => ({
        totalMinutes: acc.totalMinutes + day.totalMinutes,
        delegation: acc.delegation + day.dripBreakdown.delegation,
        replacement: acc.replacement + day.dripBreakdown.replacement,
        investment: acc.investment + day.dripBreakdown.investment,
        production: acc.production + day.dripBreakdown.production,
      }),
      { totalMinutes: 0, delegation: 0, replacement: 0, investment: 0, production: 0 }
    );
  };

  const week1Totals = calculateWeekTotals(week1Data);
  const week2Totals = calculateWeekTotals(week2Data);

  // Calculate trend (week2 vs week1)
  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return { direction: 'neutral' as const, percent: 0 };
    const percent = Math.round(((current - previous) / previous) * 100);
    if (percent > 5) return { direction: 'up' as const, percent };
    if (percent < -5) return { direction: 'down' as const, percent };
    return { direction: 'neutral' as const, percent };
  };

  const productionTrend = getTrend(week2Totals.production, week1Totals.production);

  const getDayData = (date: Date, weekData: DayData[]): DayData | undefined => {
    return weekData.find(d => isSameDay(d.date, date));
  };

  const DayCell = ({ date, data }: { date: Date; data?: DayData }) => {
    const total = data?.totalMinutes || 0;
    const breakdown = data?.dripBreakdown || { delegation: 0, replacement: 0, investment: 0, production: 0 };
    const isToday = isSameDay(date, new Date());

    return (
      <button
        onClick={() => onDayClick?.(date)}
        className={cn(
          'p-2 border rounded-lg hover:bg-muted/50 transition-colors text-left min-h-[80px]',
          isToday && 'ring-2 ring-primary'
        )}
      >
        <div className="flex justify-between items-start mb-2">
          <span className={cn(
            'text-sm font-medium',
            isToday && 'text-primary'
          )}>
            {format(date, 'd')}
          </span>
          <span className="text-xs text-muted-foreground">
            {total > 0 ? `${Math.round(total / 60)}h` : '-'}
          </span>
        </div>

        {/* DRIP Distribution Bar */}
        {total > 0 && (
          <div className="h-3 rounded-full overflow-hidden flex">
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
        )}
      </button>
    );
  };

  const WeekRow = ({ label, days, weekData }: { label: string; days: Date[]; weekData: DayData[] }) => (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => (
          <DayCell key={index} date={day} data={getDayData(day, weekData)} />
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Bi-Weekly Comparison</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToCurrentBiweek}>
              Current
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousBiweek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {format(week1Start, 'MMM d')} - {format(addDays(week2Start, 6), 'MMM d, yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextBiweek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 text-center">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-xs text-muted-foreground font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Week 1 */}
        <WeekRow
          label={`Week 1: ${format(week1Start, 'MMM d')} - ${format(addDays(week1Start, 6), 'MMM d')}`}
          days={week1Days}
          weekData={week1Data}
        />

        {/* Week 2 */}
        <WeekRow
          label={`Week 2: ${format(week2Start, 'MMM d')} - ${format(addDays(week2Start, 6), 'MMM d')}`}
          days={week2Days}
          weekData={week2Data}
        />

        {/* Trend Indicator */}
        <div className="flex items-center justify-center gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Production Time Trend</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              {productionTrend.direction === 'up' && (
                <>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-bold text-green-600">
                    +{productionTrend.percent}%
                  </span>
                </>
              )}
              {productionTrend.direction === 'down' && (
                <>
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <span className="text-lg font-bold text-red-600">
                    {productionTrend.percent}%
                  </span>
                </>
              )}
              {productionTrend.direction === 'neutral' && (
                <>
                  <Minus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-bold text-muted-foreground">
                    No change
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center">
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
