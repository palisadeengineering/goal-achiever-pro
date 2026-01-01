'use client';

import { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn, formatHour } from '@/lib/utils';
import { DRIP_QUADRANTS } from '@/constants/drip';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import type { DripQuadrant, EnergyRating } from '@/types/database';

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  activityName: string;
  dripQuadrant: DripQuadrant;
  energyRating: EnergyRating;
}

interface UserSettings {
  timeFormat: '12h' | '24h';
  calendarStartHour: number;
  calendarEndHour: number;
  weekStartsOn: 'sunday' | 'monday';
}

const DEFAULT_SETTINGS: UserSettings = {
  timeFormat: '12h',
  calendarStartHour: 5,
  calendarEndHour: 23,
  weekStartsOn: 'sunday',
};

interface WeeklyCalendarViewProps {
  timeBlocks?: Record<string, TimeBlock[]>; // keyed by date string
  onAddBlock?: (date: Date, time: string) => void;
  onBlockClick?: (block: TimeBlock) => void;
}

// Generate time slots for given hour range in 15-min increments
const generateTimeSlots = (startHour: number, endHour: number): string[] => {
  const slots: string[] = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let min = 0; min < 60; min += 15) {
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

export function WeeklyCalendarView({
  timeBlocks = {},
  onAddBlock,
  onBlockClick,
}: WeeklyCalendarViewProps) {
  const [settings] = useLocalStorage<UserSettings>('user-settings', DEFAULT_SETTINGS);

  const weekStartsOn = settings.weekStartsOn === 'monday' ? 1 : 0;

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn })
  );

  // Generate time slots based on user settings
  const timeSlots = useMemo(
    () => generateTimeSlots(settings.calendarStartHour, settings.calendarEndHour),
    [settings.calendarStartHour, settings.calendarEndHour]
  );

  // Get hourly labels for the time column
  const hourLabels = useMemo(
    () => timeSlots.filter(slot => slot.endsWith(':00')),
    [timeSlots]
  );

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn }));
  };

  const getBlocksForDateAndTime = (date: Date, time: string): TimeBlock | undefined => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const blocks = timeBlocks[dateKey] || [];
    return blocks.find(block => {
      const blockStart = block.startTime;
      const blockEnd = block.endTime;
      return time >= blockStart && time < blockEnd;
    });
  };

  const getBlockColor = (quadrant: DripQuadrant) => {
    return DRIP_QUADRANTS[quadrant].color;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Weekly View</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[180px] text-center">
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row - Days */}
            <div className="grid grid-cols-8 border-b sticky top-0 bg-background z-10">
              <div className="p-2 text-xs text-muted-foreground border-r">Time</div>
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-2 text-center border-r last:border-r-0',
                    isSameDay(day, new Date()) && 'bg-primary/5'
                  )}
                >
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'EEE')}
                  </div>
                  <div className={cn(
                    'text-sm font-medium',
                    isSameDay(day, new Date()) && 'text-primary'
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="max-h-[500px] overflow-y-auto">
              {hourLabels.map((hourSlot: string) => (
                <div key={hourSlot} className="grid grid-cols-8 border-b">
                  {/* Time Label */}
                  <div className="p-1 text-xs text-muted-foreground border-r flex items-start justify-end pr-2">
                    {formatHour(parseInt(hourSlot.split(':')[0]), settings.timeFormat)}
                  </div>

                  {/* Day Columns */}
                  {weekDays.map((day, dayIndex) => {
                    // Get the 4 quarter-hour slots for this hour
                    const hourNum = parseInt(hourSlot.split(':')[0]);
                    const quarterSlots = [
                      `${hourSlot}`,
                      `${hourNum.toString().padStart(2, '0')}:15`,
                      `${hourNum.toString().padStart(2, '0')}:30`,
                      `${hourNum.toString().padStart(2, '0')}:45`,
                    ];

                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          'border-r last:border-r-0 min-h-[48px]',
                          isSameDay(day, new Date()) && 'bg-primary/5'
                        )}
                      >
                        <div className="grid grid-rows-4 h-full">
                          {quarterSlots.map((time) => {
                            const block = getBlocksForDateAndTime(day, time);
                            const isBlockStart = block?.startTime === time;

                            if (block && isBlockStart) {
                              // Calculate block height based on duration
                              const startParts = block.startTime.split(':');
                              const endParts = block.endTime.split(':');
                              const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                              const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                              const durationSlots = (endMins - startMins) / 15;

                              return (
                                <button
                                  key={time}
                                  onClick={() => onBlockClick?.(block)}
                                  className="relative text-left p-1 rounded-sm mx-0.5 text-white text-[10px] overflow-hidden hover:opacity-90 transition-opacity"
                                  style={{
                                    backgroundColor: getBlockColor(block.dripQuadrant),
                                    gridRow: `span ${durationSlots}`,
                                  }}
                                >
                                  <span className="line-clamp-2">{block.activityName}</span>
                                </button>
                              );
                            }

                            if (block) {
                              // Part of existing block, don't render
                              return null;
                            }

                            return (
                              <button
                                key={time}
                                onClick={() => onAddBlock?.(day, time)}
                                className="h-3 hover:bg-muted/50 transition-colors border-b border-dashed border-muted/30 last:border-b-0 group"
                              >
                                <Plus className="h-2 w-2 mx-auto opacity-0 group-hover:opacity-50" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 border-t flex flex-wrap gap-3">
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
