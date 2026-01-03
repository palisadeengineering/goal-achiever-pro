'use client';

import { useState, useMemo, useCallback } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
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
  date?: string;
  syncStatus?: 'synced' | 'pending' | 'error';
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
  onBlockMove?: (blockId: string, newDate: string, newStartTime: string, newEndTime: string) => Promise<boolean>;
  isLoading?: boolean;
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

// Draggable event block component
function DraggableBlock({
  block,
  durationSlots,
  onBlockClick,
  getBlockColor,
}: {
  block: TimeBlock;
  durationSlots: number;
  onBlockClick?: (block: TimeBlock) => void;
  getBlockColor: (quadrant: DripQuadrant) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    data: { block },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 1000 : 1,
      }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onBlockClick?.(block);
        }
      }}
      className={cn(
        'relative text-left p-1 rounded-sm mx-0.5 text-white text-[10px] overflow-hidden transition-all cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 shadow-lg',
        block.syncStatus === 'pending' && 'animate-pulse',
        block.syncStatus === 'error' && 'ring-2 ring-red-500'
      )}
      style={{
        backgroundColor: getBlockColor(block.dripQuadrant),
        gridRow: `span ${durationSlots}`,
        ...style,
      }}
    >
      <span className="line-clamp-2">{block.activityName}</span>
      {block.syncStatus === 'pending' && (
        <Loader2 className="absolute top-0.5 right-0.5 h-2 w-2 animate-spin" />
      )}
    </button>
  );
}

// Droppable time slot component
function DroppableSlot({
  id,
  date,
  time,
  onAddBlock,
  children,
}: {
  id: string;
  date: Date;
  time: string;
  onAddBlock?: (date: Date, time: string) => void;
  children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { date: format(date, 'yyyy-MM-dd'), time },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={() => !children && onAddBlock?.(date, time)}
      className={cn(
        'h-3 transition-colors border-b border-dashed border-muted/30 last:border-b-0 group',
        !children && 'hover:bg-muted/50 cursor-pointer',
        isOver && 'bg-primary/20 ring-1 ring-primary'
      )}
    >
      {children || (
        <Plus className="h-2 w-2 mx-auto opacity-0 group-hover:opacity-50" />
      )}
    </div>
  );
}

export function WeeklyCalendarView({
  timeBlocks = {},
  onAddBlock,
  onBlockClick,
  onBlockMove,
  isLoading = false,
}: WeeklyCalendarViewProps) {
  const [settings] = useLocalStorage<UserSettings>('user-settings', DEFAULT_SETTINGS);
  const [activeBlock, setActiveBlock] = useState<TimeBlock | null>(null);

  const weekStartsOn = settings.weekStartsOn === 'monday' ? 1 : 0;

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn })
  );

  // Configure drag sensor with activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
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

  const getBlockColor = useCallback((quadrant: DripQuadrant) => {
    return DRIP_QUADRANTS[quadrant].color;
  }, []);

  // Calculate block duration in minutes
  const getBlockDuration = (block: TimeBlock): number => {
    const startParts = block.startTime.split(':');
    const endParts = block.endTime.split(':');
    const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
    return endMins - startMins;
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const block = active.data.current?.block as TimeBlock;
    if (block) {
      setActiveBlock(block);
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlock(null);

    if (!over || !onBlockMove) return;

    const block = active.data.current?.block as TimeBlock;
    const dropData = over.data.current as { date: string; time: string } | undefined;

    if (!block || !dropData) return;

    // Calculate new end time based on block duration
    const duration = getBlockDuration(block);
    const [startHour, startMin] = dropData.time.split(':').map(Number);
    const startTotalMins = startHour * 60 + startMin;
    const endTotalMins = startTotalMins + duration;
    const endHour = Math.floor(endTotalMins / 60);
    const endMin = endTotalMins % 60;
    const newEndTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

    // Only move if position changed
    const currentDate = block.date || format(new Date(), 'yyyy-MM-dd');
    if (currentDate === dropData.date && block.startTime === dropData.time) {
      return;
    }

    await onBlockMove(block.id, dropData.date, dropData.time, newEndTime);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              Weekly View
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </CardTitle>
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
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const block = getBlocksForDateAndTime(day, time);
                            const isBlockStart = block?.startTime === time;
                            const slotId = `${dateKey}-${time}`;

                            if (block && isBlockStart) {
                              // Calculate block height based on duration
                              const startParts = block.startTime.split(':');
                              const endParts = block.endTime.split(':');
                              const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                              const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                              const durationSlots = (endMins - startMins) / 15;

                              return (
                                <DraggableBlock
                                  key={time}
                                  block={{ ...block, date: dateKey }}
                                  durationSlots={durationSlots}
                                  onBlockClick={onBlockClick}
                                  getBlockColor={getBlockColor}
                                />
                              );
                            }

                            if (block) {
                              // Part of existing block, don't render droppable
                              return <div key={time} className="h-3" />;
                            }

                            return (
                              <DroppableSlot
                                key={time}
                                id={slotId}
                                date={day}
                                time={time}
                                onAddBlock={onAddBlock}
                              />
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

    {/* Drag overlay - shows a preview of the dragged item */}
    <DragOverlay>
      {activeBlock && (
        <div
          className="p-1 rounded-sm text-white text-[10px] shadow-lg opacity-90"
          style={{
            backgroundColor: getBlockColor(activeBlock.dripQuadrant),
            minWidth: '80px',
          }}
        >
          <span className="line-clamp-1">{activeBlock.activityName}</span>
        </div>
      )}
    </DragOverlay>
    </DndContext>
  );
}
