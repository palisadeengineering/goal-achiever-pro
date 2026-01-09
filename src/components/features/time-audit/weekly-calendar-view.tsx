'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, isWithinInterval, subDays } from 'date-fns';
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
  onAddBlock?: (date: Date, startTime: string, endTime?: string) => void;
  onBlockClick?: (block: TimeBlock) => void;
  onBlockMove?: (blockId: string, newDate: string, newStartTime: string, newEndTime: string) => Promise<boolean>;
  isLoading?: boolean;
  colorMode?: 'drip' | 'energy'; // Which color scheme to use
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
        'relative text-left p-1 rounded-sm mx-0.5 text-white text-[10px] overflow-hidden',
        'transition-all duration-200 cursor-grab active:cursor-grabbing',
        'shadow-sm hover:shadow-md hover:brightness-110 hover:scale-[1.02]',
        isDragging && 'opacity-50 shadow-lg scale-105',
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

// Energy color mapping
const ENERGY_COLORS: Record<EnergyRating, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

// Droppable time slot component with drag-to-select support
function DroppableSlot({
  id,
  date,
  time,
  onAddBlock,
  children,
  isDragSelecting,
  isInDragRange,
  onDragSelectStart,
  onDragSelectMove,
  onDragSelectEnd,
}: {
  id: string;
  date: Date;
  time: string;
  onAddBlock?: (date: Date, startTime: string, endTime?: string) => void;
  children?: React.ReactNode;
  isDragSelecting?: boolean;
  isInDragRange?: boolean;
  onDragSelectStart?: (date: Date, time: string) => void;
  onDragSelectMove?: (date: Date, time: string) => void;
  onDragSelectEnd?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { date: format(date, 'yyyy-MM-dd'), time },
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (children) return; // Don't start drag on existing blocks
    e.preventDefault();
    onDragSelectStart?.(date, time);
  };

  const handleMouseEnter = () => {
    if (isDragSelecting && !children) {
      onDragSelectMove?.(date, time);
    }
  };

  const handleMouseUp = () => {
    if (isDragSelecting) {
      onDragSelectEnd?.();
    }
  };

  return (
    <div
      ref={setNodeRef}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
      className={cn(
        'h-3 transition-all duration-150 border-b border-dashed border-muted/30 last:border-b-0 group select-none',
        !children && 'hover:bg-primary/10 cursor-pointer',
        isOver && 'bg-primary/20 ring-1 ring-primary',
        isInDragRange && 'bg-primary/30'
      )}
    >
      {children || (
        <Plus className="h-2 w-2 mx-auto opacity-0 group-hover:opacity-40 transition-opacity" />
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
  colorMode = 'drip',
}: WeeklyCalendarViewProps) {
  const [settings] = useLocalStorage<UserSettings>('user-settings', DEFAULT_SETTINGS);
  const [activeBlock, setActiveBlock] = useState<TimeBlock | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mobile single-day view state
  const [isMobileView, setIsMobileView] = useState(false);
  const [selectedMobileDay, setSelectedMobileDay] = useState(new Date());

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Drag-to-select state
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragStart, setDragStart] = useState<{ date: Date; time: string } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ date: Date; time: string } | null>(null);

  // Update current time every minute for the time indicator
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.altKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            setCurrentWeekStart(prev => addDays(prev, -7));
            break;
          case 'ArrowRight':
            e.preventDefault();
            setCurrentWeekStart(prev => addDays(prev, 7));
            break;
          case 't':
          case 'T':
            e.preventDefault();
            setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: settings.weekStartsOn === 'monday' ? 1 : 0 }));
            break;
          case 'n':
          case 'N':
            e.preventDefault();
            // Open new block form for current time
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = Math.floor(now.getMinutes() / 15) * 15;
            const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            onAddBlock?.(now, timeStr);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.weekStartsOn, onAddBlock]);

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
    setSelectedMobileDay(new Date());
  };

  // Mobile day navigation
  const goToPreviousDay = () => setSelectedMobileDay(prev => subDays(prev, 1));
  const goToNextDay = () => setSelectedMobileDay(prev => addDays(prev, 1));

  const getBlocksForDateAndTime = (date: Date, time: string): TimeBlock | undefined => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const blocks = timeBlocks[dateKey] || [];
    return blocks.find(block => {
      const blockStart = block.startTime;
      const blockEnd = block.endTime;
      return time >= blockStart && time < blockEnd;
    });
  };

  const getBlockColor = useCallback((quadrant: DripQuadrant, energyRating?: EnergyRating) => {
    if (colorMode === 'energy' && energyRating) {
      return ENERGY_COLORS[energyRating];
    }
    return DRIP_QUADRANTS[quadrant].color;
  }, [colorMode]);

  // Drag selection handlers
  const handleDragSelectStart = useCallback((date: Date, time: string) => {
    setIsDragSelecting(true);
    setDragStart({ date, time });
    setDragEnd({ date, time });
  }, []);

  const handleDragSelectMove = useCallback((date: Date, time: string) => {
    if (isDragSelecting && dragStart) {
      // Only allow dragging within the same day
      if (format(date, 'yyyy-MM-dd') === format(dragStart.date, 'yyyy-MM-dd')) {
        setDragEnd({ date, time });
      }
    }
  }, [isDragSelecting, dragStart]);

  const handleDragSelectEnd = useCallback(() => {
    if (dragStart && dragEnd) {
      // Calculate the time range
      let startTime = dragStart.time;
      let endTime = dragEnd.time;

      // Ensure startTime <= endTime (swap if dragged upward)
      if (startTime > endTime) {
        [startTime, endTime] = [endTime, startTime];
      }

      // Add 15 minutes to end time (since we're selecting the slot, not the end point)
      const [endHour, endMin] = endTime.split(':').map(Number);
      const totalMins = endHour * 60 + endMin + 15;
      const newEndHour = Math.floor(totalMins / 60);
      const newEndMin = totalMins % 60;
      endTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`;

      onAddBlock?.(dragStart.date, startTime, endTime);
    }

    setIsDragSelecting(false);
    setDragStart(null);
    setDragEnd(null);
  }, [dragStart, dragEnd, onAddBlock]);

  // Check if a time slot is in the current drag selection range
  const isSlotInDragRange = useCallback((date: Date, time: string): boolean => {
    if (!isDragSelecting || !dragStart || !dragEnd) return false;

    const dateKey = format(date, 'yyyy-MM-dd');
    const startDateKey = format(dragStart.date, 'yyyy-MM-dd');

    if (dateKey !== startDateKey) return false;

    let rangeStart = dragStart.time;
    let rangeEnd = dragEnd.time;

    if (rangeStart > rangeEnd) {
      [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
    }

    return time >= rangeStart && time <= rangeEnd;
  }, [isDragSelecting, dragStart, dragEnd]);

  // Handle mouseup on window to end drag if user releases outside calendar
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragSelecting) {
        handleDragSelectEnd();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragSelecting, handleDragSelectEnd]);

  // Check if current week contains today
  const isCurrentWeekVisible = useMemo(() => {
    const weekEnd = addDays(currentWeekStart, 6);
    return isWithinInterval(new Date(), { start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart]);

  // Calculate current time indicator position (percentage within the time grid)
  const getCurrentTimePosition = useCallback(() => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    // Check if current time is within calendar display hours
    if (hours < settings.calendarStartHour || hours > settings.calendarEndHour) {
      return null;
    }

    // Calculate position as percentage of total grid height
    const totalMinutes = (hours - settings.calendarStartHour) * 60 + minutes;
    const totalGridMinutes = (settings.calendarEndHour - settings.calendarStartHour + 1) * 60;
    return (totalMinutes / totalGridMinutes) * 100;
  }, [currentTime, settings.calendarStartHour, settings.calendarEndHour]);

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

  // Mobile single-day render
  if (isMobileView) {
    const dayBlocks = timeBlocks[format(selectedMobileDay, 'yyyy-MM-dd')] || [];
    const sortedBlocks = [...dayBlocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPreviousDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {format(selectedMobileDay, 'EEE, MMM d')}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {/* Quick day selector - horizontal scroll */}
          <div className="flex gap-1 overflow-x-auto pb-3 mb-3 border-b scrollbar-hide">
            {Array.from({ length: 7 }, (_, i) => {
              const day = addDays(startOfWeek(selectedMobileDay, { weekStartsOn }), i);
              const isSelected = isSameDay(day, selectedMobileDay);
              const isToday = isSameDay(day, new Date());
              const hasBlocks = (timeBlocks[format(day, 'yyyy-MM-dd')] || []).length > 0;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedMobileDay(day)}
                  className={cn(
                    'flex flex-col items-center p-2 rounded-lg min-w-[48px] transition-colors',
                    isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                    isToday && !isSelected && 'ring-1 ring-primary'
                  )}
                >
                  <span className="text-[10px] uppercase">{format(day, 'EEE')}</span>
                  <span className={cn('text-lg font-semibold', isToday && !isSelected && 'text-primary')}>
                    {format(day, 'd')}
                  </span>
                  {hasBlocks && <span className="h-1 w-1 rounded-full bg-current mt-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Time blocks list - mobile friendly */}
          <div className="space-y-2">
            {sortedBlocks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No time blocks for this day</p>
                <p className="text-xs mt-1">Tap + to add one</p>
              </div>
            ) : (
              sortedBlocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => onBlockClick?.(block)}
                  className="w-full text-left p-3 rounded-lg border transition-all hover:shadow-md active:scale-[0.98]"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: colorMode === 'energy' ? ENERGY_COLORS[block.energyRating] : DRIP_QUADRANTS[block.dripQuadrant].color,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{block.activityName}</p>
                      <p className="text-sm text-muted-foreground">
                        {block.startTime} - {block.endTime}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize"
                        style={{
                          borderColor: DRIP_QUADRANTS[block.dripQuadrant].color,
                          color: DRIP_QUADRANTS[block.dripQuadrant].color,
                        }}
                      >
                        {block.dripQuadrant}
                      </Badge>
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: ENERGY_COLORS[block.energyRating] }}
                      />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Tap to add hint */}
          <button
            onClick={() => onAddBlock?.(selectedMobileDay, format(new Date(), 'HH:mm'))}
            className="w-full mt-4 p-3 border-2 border-dashed rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4 mx-auto mb-1" />
            <span className="text-sm">Tap to add time block</span>
          </button>
        </CardContent>
      </Card>
    );
  }

  // Desktop weekly view
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
            <div className="max-h-[650px] overflow-y-auto relative">
              {/* Current Time Indicator */}
              {isCurrentWeekVisible && getCurrentTimePosition() !== null && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none"
                  style={{ top: `${getCurrentTimePosition()}%` }}
                >
                  <div className="grid grid-cols-8">
                    <div className="col-span-1" /> {/* Time column spacer */}
                    {weekDays.map((day, index) => (
                      <div key={index} className="relative">
                        {isSameDay(day, new Date()) && (
                          <>
                            <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                            <div className="absolute left-0 right-0 border-t-2 border-red-500" />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {hourLabels.map((hourSlot: string, hourIndex: number) => {
                const hourNum = parseInt(hourSlot.split(':')[0]);
                const isEvenHour = hourNum % 2 === 0;

                return (
                <div key={hourSlot} className={cn('grid grid-cols-8 border-b', isEvenHour && 'bg-muted/20')}>
                  {/* Time Label */}
                  <div className="p-1 text-xs text-muted-foreground border-r flex items-start justify-end pr-2">
                    {formatHour(hourNum, settings.timeFormat)}
                  </div>

                  {/* Day Columns */}
                  {weekDays.map((day, dayIndex) => {
                    // Get the 4 quarter-hour slots for this hour
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
                                  getBlockColor={(q) => getBlockColor(q, block.energyRating)}
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
                                isDragSelecting={isDragSelecting}
                                isInDragRange={isSlotInDragRange(day, time)}
                                onDragSelectStart={handleDragSelectStart}
                                onDragSelectMove={handleDragSelectMove}
                                onDragSelectEnd={handleDragSelectEnd}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 border-t flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            {colorMode === 'drip' ? (
              Object.entries(DRIP_QUADRANTS).map(([key, quadrant]) => (
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
              ))
            ) : (
              <>
                <Badge variant="outline" className="gap-1" style={{ borderColor: ENERGY_COLORS.green }}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ENERGY_COLORS.green }} />
                  Energizing
                </Badge>
                <Badge variant="outline" className="gap-1" style={{ borderColor: ENERGY_COLORS.yellow }}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ENERGY_COLORS.yellow }} />
                  Neutral
                </Badge>
                <Badge variant="outline" className="gap-1" style={{ borderColor: ENERGY_COLORS.red }}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ENERGY_COLORS.red }} />
                  Draining
                </Badge>
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex gap-3">
            <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Alt</kbd>+<kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">←/→</kbd> Navigate</span>
            <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Alt</kbd>+<kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">T</kbd> Today</span>
            <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Alt</kbd>+<kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">N</kbd> New</span>
            <span className="text-muted-foreground/70">Drag to select</span>
          </div>
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
