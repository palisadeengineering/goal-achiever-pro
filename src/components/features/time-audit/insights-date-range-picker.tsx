'use client';

import { useState, useMemo } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  addMonths,
  isSameDay,
  isSameWeek,
  isSameMonth,
} from 'date-fns';

type PeriodType = 'week' | 'biweekly' | 'month';

interface InsightsDateRangePickerProps {
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (start: Date, end: Date) => void;
}

export function InsightsDateRangePicker({
  dateRange,
  onDateRangeChange,
}: InsightsDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>(() => {
    // Detect current period type based on date range
    const daysDiff = Math.round(
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff <= 7) return 'week';
    if (daysDiff <= 14) return 'biweekly';
    return 'month';
  });

  // For navigation within the popover
  const [viewMonth, setViewMonth] = useState(dateRange.start);

  // Handle period type change - update the date range immediately
  const handlePeriodTypeChange = (newType: PeriodType) => {
    setPeriodType(newType);
    // Recalculate range based on the current start date
    const start = startOfWeek(dateRange.start, { weekStartsOn: 0 });
    let end: Date;

    switch (newType) {
      case 'week':
        end = endOfWeek(start, { weekStartsOn: 0 });
        break;
      case 'biweekly':
        end = endOfWeek(addWeeks(start, 1), { weekStartsOn: 0 });
        break;
      case 'month':
        const monthStart = startOfMonth(dateRange.start);
        const monthEnd = endOfMonth(dateRange.start);
        onDateRangeChange(monthStart, monthEnd);
        return;
    }

    onDateRangeChange(start, end);
  };

  // Handle day selection - select the entire week/biweekly/month containing that day
  const handleDaySelect = (date: Date | undefined) => {
    if (!date) return;

    let start: Date;
    let end: Date;

    switch (periodType) {
      case 'week':
        start = startOfWeek(date, { weekStartsOn: 0 });
        end = endOfWeek(date, { weekStartsOn: 0 });
        break;
      case 'biweekly':
        start = startOfWeek(date, { weekStartsOn: 0 });
        end = endOfWeek(addWeeks(start, 1), { weekStartsOn: 0 });
        break;
      case 'month':
        start = startOfMonth(date);
        end = endOfMonth(date);
        break;
    }

    onDateRangeChange(start, end);
    setOpen(false);
  };

  // Navigate to previous period
  const goToPrevious = () => {
    let newStart: Date;
    let newEnd: Date;

    switch (periodType) {
      case 'week':
        newStart = addWeeks(dateRange.start, -1);
        newEnd = endOfWeek(newStart, { weekStartsOn: 0 });
        break;
      case 'biweekly':
        newStart = addWeeks(dateRange.start, -2);
        newEnd = endOfWeek(addWeeks(newStart, 1), { weekStartsOn: 0 });
        break;
      case 'month':
        newStart = startOfMonth(addMonths(dateRange.start, -1));
        newEnd = endOfMonth(newStart);
        break;
    }

    onDateRangeChange(newStart, newEnd);
    setViewMonth(newStart);
  };

  // Navigate to next period
  const goToNext = () => {
    let newStart: Date;
    let newEnd: Date;

    switch (periodType) {
      case 'week':
        newStart = addWeeks(dateRange.start, 1);
        newEnd = endOfWeek(newStart, { weekStartsOn: 0 });
        break;
      case 'biweekly':
        newStart = addWeeks(dateRange.start, 2);
        newEnd = endOfWeek(addWeeks(newStart, 1), { weekStartsOn: 0 });
        break;
      case 'month':
        newStart = startOfMonth(addMonths(dateRange.start, 1));
        newEnd = endOfMonth(newStart);
        break;
    }

    onDateRangeChange(newStart, newEnd);
    setViewMonth(newStart);
  };

  // Go to current period
  const goToCurrent = () => {
    const today = new Date();
    let start: Date;
    let end: Date;

    switch (periodType) {
      case 'week':
        start = startOfWeek(today, { weekStartsOn: 0 });
        end = endOfWeek(today, { weekStartsOn: 0 });
        break;
      case 'biweekly':
        start = startOfWeek(today, { weekStartsOn: 0 });
        end = endOfWeek(addWeeks(start, 1), { weekStartsOn: 0 });
        break;
      case 'month':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
    }

    onDateRangeChange(start, end);
    setViewMonth(start);
  };

  // Format the date range for display
  const formattedRange = useMemo(() => {
    if (periodType === 'month') {
      return format(dateRange.start, 'MMMM yyyy');
    }
    // For week and biweekly, show the date range
    const sameMonth = dateRange.start.getMonth() === dateRange.end.getMonth();
    const sameYear = dateRange.start.getFullYear() === dateRange.end.getFullYear();

    if (sameMonth && sameYear) {
      return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'd, yyyy')}`;
    } else if (sameYear) {
      return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
    } else {
      return `${format(dateRange.start, 'MMM d, yyyy')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
    }
  }, [dateRange, periodType]);

  // Check if a day is within the selected range
  const isDayInRange = (date: Date) => {
    return date >= dateRange.start && date <= dateRange.end;
  };

  // Check if we're viewing the current period
  const isCurrentPeriod = useMemo(() => {
    const today = new Date();
    switch (periodType) {
      case 'week':
        return isSameWeek(dateRange.start, today, { weekStartsOn: 0 });
      case 'biweekly':
        const biweeklyStart = startOfWeek(today, { weekStartsOn: 0 });
        return isSameDay(dateRange.start, biweeklyStart);
      case 'month':
        return isSameMonth(dateRange.start, today);
    }
  }, [dateRange.start, periodType]);

  return (
    <div className="flex items-center gap-2">
      {/* Previous button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={goToPrevious}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Date range popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[180px] justify-start gap-2 font-medium"
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            {formattedRange}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            {/* Period type selector */}
            <Tabs
              value={periodType}
              onValueChange={(v) => handlePeriodTypeChange(v as PeriodType)}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="biweekly">2 Weeks</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Current period button */}
            {!isCurrentPeriod && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={goToCurrent}
              >
                Go to Current {periodType === 'week' ? 'Week' : periodType === 'biweekly' ? '2 Weeks' : 'Month'}
              </Button>
            )}

            {/* Calendar */}
            <Calendar
              mode="single"
              selected={dateRange.start}
              onSelect={handleDaySelect}
              month={viewMonth}
              onMonthChange={setViewMonth}
              modifiers={{
                inRange: isDayInRange,
              }}
              modifiersClassNames={{
                inRange: 'bg-primary/20 text-primary-foreground',
              }}
              className="rounded-md border"
            />

            {/* Helper text */}
            <p className="text-xs text-muted-foreground text-center">
              Click any day to select the{' '}
              {periodType === 'week'
                ? 'week'
                : periodType === 'biweekly'
                ? '2-week period'
                : 'month'}{' '}
              containing it
            </p>
          </div>
        </PopoverContent>
      </Popover>

      {/* Next button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={goToNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Current period indicator */}
      {!isCurrentPeriod && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={goToCurrent}
        >
          Today
        </Button>
      )}
    </div>
  );
}
