'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  CollisionDetection,
} from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Loader2, Palette, Repeat } from 'lucide-react';
import { cn, formatHour } from '@/lib/utils';
import { DRIP_QUADRANTS } from '@/constants/drip';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { useEventSize, getAdaptiveEventStyles } from '@/lib/hooks/use-event-size';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { DripQuadrant, EnergyRating } from '@/types/database';
import { describeRecurrence } from '@/lib/utils/recurrence';

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  activityName: string;
  dripQuadrant: DripQuadrant;
  energyRating: EnergyRating;
  date?: string;
  syncStatus?: 'synced' | 'pending' | 'error';
  // Recurring event properties
  isRecurring?: boolean;
  recurrenceRule?: string;
  isRecurrenceInstance?: boolean;
  parentBlockId?: string;
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
  timeBlocks?: Record<string, TimeBlock[]>;
  onAddBlock?: (date: Date, startTime: string, endTime?: string) => void;
  onBlockClick?: (block: TimeBlock) => void;
  onBlockMove?: (blockId: string, newDate: string, newStartTime: string, newEndTime: string) => Promise<boolean>;
  isLoading?: boolean;
  colorMode?: 'drip' | 'energy';
  onColorModeChange?: (mode: 'drip' | 'energy') => void;
  onWeekChange?: (weekStart: Date, weekEnd: Date) => void;
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

// Format time for display
function formatTimeShort(time: string, format: '12h' | '24h' = '12h'): string {
  const [hour, min] = time.split(':').map(Number);
  if (format === '24h') {
    return `${hour}:${min.toString().padStart(2, '0')}`;
  }
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'am' : 'pm';
  return min === 0 ? `${h}${ampm}` : `${h}:${min.toString().padStart(2, '0')}${ampm}`;
}

// Energy color mapping
const ENERGY_COLORS: Record<EnergyRating, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

// Format duration for display
function formatDuration(startTime: string, endTime: string): string {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const totalMins = (eh * 60 + em) - (sh * 60 + sm);

  if (totalMins < 60) {
    return `${totalMins} min`;
  }

  const hours = totalMins / 60;
  if (hours === Math.floor(hours)) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${hours.toFixed(1)} hrs`;
}

// Shared event details content for Tooltip and Popover
function EventDetailsContent({
  block,
  timeRange,
  durationDisplay,
}: {
  block: TimeBlock;
  timeRange: string;
  durationDisplay: string;
}) {
  const isRecurring = block.isRecurring || block.isRecurrenceInstance;

  return (
    <div className="space-y-2">
      <p className="font-semibold text-sm">{block.activityName}</p>
      <p className="text-xs text-muted-foreground">{timeRange} · {durationDisplay}</p>
      {isRecurring && block.recurrenceRule && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Repeat className="h-3 w-3" />
          {describeRecurrence(block.recurrenceRule)}
        </p>
      )}
      <div className="flex gap-2 mt-2">
        <Badge
          className="text-[10px] capitalize text-white font-medium px-2 py-0.5"
          style={{
            backgroundColor: DRIP_QUADRANTS[block.dripQuadrant].color,
            borderColor: DRIP_QUADRANTS[block.dripQuadrant].color,
          }}
        >
          {block.dripQuadrant === 'na' ? 'N/A' : block.dripQuadrant}
        </Badge>
        <Badge
          className="text-[10px] text-white font-medium px-2 py-0.5"
          style={{
            backgroundColor: ENERGY_COLORS[block.energyRating],
            borderColor: ENERGY_COLORS[block.energyRating],
          }}
        >
          {block.energyRating === 'green' ? 'Energizing' : block.energyRating === 'yellow' ? 'Neutral' : 'Draining'}
        </Badge>
      </div>
    </div>
  );
}

// Event card component with adaptive sizing based on measured height
function EventCard({
  block,
  durationSlots,
  onBlockClick,
  getBlockColor: _getBlockColor,
  onResizeStart,
  isResizing,
  colorMode,
}: {
  block: TimeBlock;
  durationSlots: number;
  onBlockClick?: (block: TimeBlock) => void;
  getBlockColor: (quadrant: DripQuadrant) => string;
  onResizeStart?: (block: TimeBlock, e: React.MouseEvent) => void;
  isResizing?: boolean;
  colorMode: 'drip' | 'energy';
}) {
  // _getBlockColor is kept for API compatibility but we use inline styles
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: block.id,
    data: { block },
  });

  // Use measured height for adaptive sizing
  const fallbackHeight = durationSlots * 14;
  const { ref: sizeRef, sizeBucket } = useEventSize(fallbackHeight);

  // Combine refs for both drag and size measurement
  const setNodeRef = useCallback((node: HTMLDivElement | null) => {
    setDragRef(node);
    sizeRef(node);
  }, [setDragRef, sizeRef]);

  // Mobile/touch detection - check synchronously on mount via lazy initial state
  const [isTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });
  const [popoverOpen, setPopoverOpen] = useState(false);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 1000 : 1,
      }
    : undefined;

  const timeRange = `${formatTimeShort(block.startTime)} - ${formatTimeShort(block.endTime)}`;
  const startTimeDisplay = formatTimeShort(block.startTime);
  const durationDisplay = formatDuration(block.startTime, block.endTime);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onResizeStart?.(block, e);
  };

  // Get adaptive styles based on size bucket
  const adaptiveStyles = getAdaptiveEventStyles(sizeBucket);

  // Check if this is a recurring event
  const isRecurring = block.isRecurring || block.isRecurrenceInstance;

  // Solid background colors like Google Calendar for better readability
  const getBgColor = () => {
    if (colorMode === 'energy') {
      switch (block.energyRating) {
        case 'green': return 'bg-green-600 hover:bg-green-700';
        case 'yellow': return 'bg-yellow-500 hover:bg-yellow-600';
        case 'red': return 'bg-red-500 hover:bg-red-600';
      }
    }
    switch (block.dripQuadrant) {
      case 'production': return 'bg-green-600 hover:bg-green-700';
      case 'investment': return 'bg-purple-600 hover:bg-purple-700';
      case 'replacement': return 'bg-amber-500 hover:bg-amber-600';
      case 'delegation': return 'bg-red-500 hover:bg-red-600';
      case 'na': return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  // Truncate title for very small events
  const getDisplayTitle = () => {
    if (adaptiveStyles.truncateToFirstWord && block.activityName.length > 15) {
      const firstWord = block.activityName.split(' ')[0];
      return firstWord.length > 12 ? firstWord.slice(0, 12) + '...' : firstWord;
    }
    return block.activityName;
  };

  // Render event content based on size bucket
  const renderContent = () => {
    // Use CSS classes for line clamping
    const lineClampClass = adaptiveStyles.lineClamp === 1
      ? 'truncate'
      : adaptiveStyles.lineClamp === 2
        ? 'line-clamp-2'
        : 'line-clamp-3';

    return (
      <div className={cn('w-full h-full flex flex-col justify-center overflow-hidden', adaptiveStyles.containerClass)}>
        <div className="flex items-center gap-0.5 min-w-0 flex-1">
          {isRecurring && adaptiveStyles.showRecurringIcon && (
            <Repeat
              className="flex-shrink-0 opacity-90"
              style={{ width: '10px', height: '10px' }}
            />
          )}
          <div className={cn('flex-1 min-w-0 text-white', adaptiveStyles.titleClass, lineClampClass)}>
            {getDisplayTitle()}
          </div>
        </div>
        {adaptiveStyles.showTime && (
          <div className={cn('opacity-90 truncate text-white/90 flex-shrink-0', adaptiveStyles.metaClass)}>
            {startTimeDisplay}
            {adaptiveStyles.showDuration && ` · ${durationDisplay}`}
          </div>
        )}
      </div>
    );
  };

  // The main event card element
  const cardElement = (
    <div
      ref={setNodeRef}
      className={cn(
        'relative rounded-lg h-full w-full overflow-hidden',
        'transition-all duration-200 ease-out',
        'shadow-md hover:shadow-lg',
        'ring-1 ring-white/15',
        getBgColor(),
        isDragging && 'opacity-80 shadow-2xl scale-[1.02] ring-2 ring-white/40',
        isResizing && 'ring-2 ring-white/50',
        block.syncStatus === 'pending' && 'animate-pulse',
        block.syncStatus === 'error' && 'ring-2 ring-red-300'
      )}
      style={style}
    >
      <button
        {...listeners}
        {...attributes}
        onClick={(e) => {
          const isKeyboardClick = e.detail === 0;
          if (isKeyboardClick) return;
          if (!isDragging && !isResizing) {
            e.stopPropagation();
            // On touch devices for small events, open popover instead of edit
            if (isTouchDevice && (sizeBucket === 'xs' || sizeBucket === 'sm')) {
              setPopoverOpen(true);
            } else {
              onBlockClick?.(block);
            }
          }
        }}
        className="w-full h-full text-left cursor-grab active:cursor-grabbing overflow-hidden text-white p-0"
      >
        {renderContent()}
      </button>

      {block.syncStatus === 'pending' && (
        <Loader2 className="absolute top-1 right-1 h-3 w-3 animate-spin opacity-60" />
      )}

      {sizeBucket !== 'xs' && (
        <div
          onMouseDown={handleResizeMouseDown}
          className={cn(
            "absolute bottom-0 left-0 right-0 cursor-ns-resize opacity-0 hover:opacity-100 transition-opacity",
            sizeBucket === 'sm' ? "h-2" : "h-3",
            "bg-gradient-to-t from-black/30 to-transparent"
          )}
        >
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white/70 rounded" />
        </div>
      )}
    </div>
  );

  // For mobile touch devices with small events, use Popover for tap-to-expand
  if (isTouchDevice && (sizeBucket === 'xs' || sizeBucket === 'sm')) {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          {cardElement}
        </PopoverTrigger>
        <PopoverContent side="right" className="w-64 p-3" sideOffset={8}>
          <EventDetailsContent
            block={block}
            timeRange={timeRange}
            durationDisplay={durationDisplay}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={() => {
              setPopoverOpen(false);
              onBlockClick?.(block);
            }}
          >
            Edit Event
          </Button>
        </PopoverContent>
      </Popover>
    );
  }

  // For desktop, use Tooltip for hover details
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {cardElement}
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs p-3">
          <EventDetailsContent
            block={block}
            timeRange={timeRange}
            durationDisplay={durationDisplay}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Droppable slot
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
    if (children) return;
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
        'h-[15px] transition-all duration-75 select-none',
        !children && 'hover:bg-primary/10 cursor-pointer',
        isOver && 'bg-primary/25 ring-2 ring-primary/50 ring-inset',
        isInDragRange && 'bg-primary/20'
      )}
    >
      {children}
    </div>
  );
}

export function WeeklyCalendarView({
  timeBlocks = {},
  onAddBlock,
  onBlockClick,
  onBlockMove,
  isLoading = false,
  colorMode: externalColorMode,
  onColorModeChange,
  onWeekChange,
}: WeeklyCalendarViewProps) {
  const [settings] = useLocalStorage<UserSettings>('user-settings', DEFAULT_SETTINGS);
  const [internalColorMode, setInternalColorMode] = useState<'drip' | 'energy'>('drip');
  const colorMode = externalColorMode ?? internalColorMode;

  // Notify parent of color mode changes
  const handleColorModeChange = (newMode: 'drip' | 'energy') => {
    setInternalColorMode(newMode);
    onColorModeChange?.(newMode);
  };
  const [activeBlock, setActiveBlock] = useState<TimeBlock | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const calendarGridRef = useRef<HTMLDivElement>(null);
  const lastCalculatedDropRef = useRef<{ date: string; time: string } | null>(null);

  // Mobile view
  const [isMobileView, setIsMobileView] = useState(false);
  const [selectedMobileDay, setSelectedMobileDay] = useState(new Date());

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Drag selection
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragStart, setDragStart] = useState<{ date: Date; time: string } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ date: Date; time: string } | null>(null);

  // Resize
  const [resizingBlock, setResizingBlock] = useState<TimeBlock | null>(null);
  const [resizeStartY, setResizeStartY] = useState<number>(0);
  const [resizePreviewEndTime, setResizePreviewEndTime] = useState<string | null>(null);
  const HOUR_HEIGHT = 56;

  // Update current time
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

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
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = Math.floor(now.getMinutes() / 15) * 15;
            const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            onAddBlock?.(now, timeStr);
            break;
          case 'c':
          case 'C':
            e.preventDefault();
            handleColorModeChange(colorMode === 'drip' ? 'energy' : 'drip');
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10, delay: 100, tolerance: 5 },
    })
  );

  // Custom collision detection with improved accuracy
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    const { pointerCoordinates } = args;
    if (!pointerCoordinates || !calendarGridRef.current) return [];

    const gridRect = calendarGridRef.current.getBoundingClientRect();
    const scrollContainer = calendarGridRef.current.closest('.overflow-y-auto') as HTMLElement | null;
    const scrollTop = scrollContainer?.scrollTop || 0;

    const TIME_COLUMN_WIDTH = 48;

    // Get bounds for collision checking
    const effectiveLeft = gridRect.left + TIME_COLUMN_WIDTH;
    const effectiveRight = gridRect.right;

    // Allow some tolerance at edges (10px)
    const EDGE_TOLERANCE = 10;

    if (
      pointerCoordinates.x < effectiveLeft - EDGE_TOLERANCE ||
      pointerCoordinates.x > effectiveRight + EDGE_TOLERANCE
    ) {
      return [];
    }

    // Clamp X position to valid range
    const clampedX = Math.max(effectiveLeft, Math.min(effectiveRight, pointerCoordinates.x));
    const relativeX = clampedX - effectiveLeft;
    const dayColumnWidth = (gridRect.width - TIME_COLUMN_WIDTH) / 7;
    const dayIndex = Math.min(6, Math.max(0, Math.floor(relativeX / dayColumnWidth)));

    // Calculate Y position relative to grid content
    // The grid content starts at the top of calendarGridRef
    const relativeY = (pointerCoordinates.y - gridRect.top) + scrollTop;

    // Convert pixel position to minutes
    const totalMinutesFromTop = (relativeY / HOUR_HEIGHT) * 60;

    // Snap to 15-minute intervals
    const slotMinutes = Math.floor(totalMinutesFromTop / 15) * 15;

    // Calculate actual hour/minute based on calendar start
    const absoluteMinutes = settings.calendarStartHour * 60 + slotMinutes;
    const hour = Math.floor(absoluteMinutes / 60);
    const minute = absoluteMinutes % 60;

    // Clamp to valid hours with some tolerance
    const clampedHour = Math.max(settings.calendarStartHour, Math.min(settings.calendarEndHour, hour));
    const finalMinute = hour === clampedHour ? minute : (hour < settings.calendarStartHour ? 0 : 45);

    const targetDate = addDays(currentWeekStart, dayIndex);
    const dateKey = format(targetDate, 'yyyy-MM-dd');
    const timeKey = `${clampedHour.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}`;
    const droppableId = `${dateKey}-${timeKey}`;

    lastCalculatedDropRef.current = { date: dateKey, time: timeKey };

    const droppable = args.droppableContainers.find(container => container.id === droppableId);
    if (droppable) {
      return [{ id: droppableId, data: { droppableContainer: droppable, value: 1 } }];
    }

    return [{
      id: droppableId,
      data: { droppableContainer: { id: droppableId, data: { current: { date: dateKey, time: timeKey } } }, value: 1 }
    }];
  }, [settings.calendarStartHour, settings.calendarEndHour, currentWeekStart]);

  const timeSlots = useMemo(
    () => generateTimeSlots(settings.calendarStartHour, settings.calendarEndHour),
    [settings.calendarStartHour, settings.calendarEndHour]
  );

  const hourLabels = useMemo(
    () => timeSlots.filter(slot => slot.endsWith(':00')),
    [timeSlots]
  );

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // Memoize weekEnd to prevent infinite re-renders
  const weekEnd = useMemo(() => addDays(currentWeekStart, 6), [currentWeekStart]);

  // Notify parent when week changes - use a ref to track previous values
  const prevWeekRef = useRef<{ start: number; end: number } | null>(null);
  useEffect(() => {
    const startTime = currentWeekStart.getTime();
    const endTime = weekEnd.getTime();

    // Only call callback if the dates actually changed
    if (!prevWeekRef.current ||
        prevWeekRef.current.start !== startTime ||
        prevWeekRef.current.end !== endTime) {
      prevWeekRef.current = { start: startTime, end: endTime };
      onWeekChange?.(currentWeekStart, weekEnd);
    }
  }, [currentWeekStart, weekEnd, onWeekChange]);

  const goToPreviousWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const goToNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));
  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn }));
    setSelectedMobileDay(new Date());
  };

  const goToPreviousDay = () => setSelectedMobileDay(prev => subDays(prev, 1));
  const goToNextDay = () => setSelectedMobileDay(prev => addDays(prev, 1));

  const getBlocksForDateAndTime = (date: Date, time: string, excludeBlockId?: string): TimeBlock | undefined => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const blocks = timeBlocks[dateKey] || [];
    return blocks.find(block => {
      if (excludeBlockId && block.id === excludeBlockId) return false;
      return time >= block.startTime && time < block.endTime;
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
    if (isDragSelecting && dragStart && format(date, 'yyyy-MM-dd') === format(dragStart.date, 'yyyy-MM-dd')) {
      setDragEnd({ date, time });
    }
  }, [isDragSelecting, dragStart]);

  const handleDragSelectEnd = useCallback(() => {
    if (dragStart && dragEnd) {
      let startTime = dragStart.time;
      let endTime = dragEnd.time;
      if (startTime > endTime) [startTime, endTime] = [endTime, startTime];

      const [endHour, endMin] = endTime.split(':').map(Number);
      const totalMins = endHour * 60 + endMin + 15;
      endTime = `${Math.floor(totalMins / 60).toString().padStart(2, '0')}:${(totalMins % 60).toString().padStart(2, '0')}`;

      onAddBlock?.(dragStart.date, startTime, endTime);
    }
    setIsDragSelecting(false);
    setDragStart(null);
    setDragEnd(null);
  }, [dragStart, dragEnd, onAddBlock]);

  const isSlotInDragRange = useCallback((date: Date, time: string): boolean => {
    if (!isDragSelecting || !dragStart || !dragEnd) return false;
    if (format(date, 'yyyy-MM-dd') !== format(dragStart.date, 'yyyy-MM-dd')) return false;

    let rangeStart = dragStart.time;
    let rangeEnd = dragEnd.time;
    if (rangeStart > rangeEnd) [rangeStart, rangeEnd] = [rangeEnd, rangeStart];

    return time >= rangeStart && time <= rangeEnd;
  }, [isDragSelecting, dragStart, dragEnd]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragSelecting) handleDragSelectEnd();
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragSelecting, handleDragSelectEnd]);

  // Resize handlers
  const handleResizeStart = useCallback((block: TimeBlock, e: React.MouseEvent) => {
    setResizingBlock(block);
    setResizeStartY(e.clientY);
    setResizePreviewEndTime(block.endTime);
  }, []);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingBlock) return;

    const deltaY = e.clientY - resizeStartY;
    const deltaMinutes = Math.round((deltaY / HOUR_HEIGHT) * 60 / 15) * 15;

    const [endHour, endMin] = resizingBlock.endTime.split(':').map(Number);
    let newEndMins = endHour * 60 + endMin + deltaMinutes;

    const [startHour, startMin] = resizingBlock.startTime.split(':').map(Number);
    const startMins = startHour * 60 + startMin;
    if (newEndMins <= startMins) newEndMins = startMins + 15;

    const maxMins = (settings.calendarEndHour + 1) * 60;
    if (newEndMins > maxMins) newEndMins = maxMins;

    setResizePreviewEndTime(`${Math.floor(newEndMins / 60).toString().padStart(2, '0')}:${(newEndMins % 60).toString().padStart(2, '0')}`);
  }, [resizingBlock, resizeStartY, settings.calendarEndHour]);

  const handleResizeEnd = useCallback(async () => {
    if (!resizingBlock || !resizePreviewEndTime || !onBlockMove) {
      setResizingBlock(null);
      setResizePreviewEndTime(null);
      return;
    }

    if (resizePreviewEndTime !== resizingBlock.endTime) {
      const blockDate = resizingBlock.date || format(new Date(), 'yyyy-MM-dd');
      await onBlockMove(resizingBlock.id, blockDate, resizingBlock.startTime, resizePreviewEndTime);
    }

    setResizingBlock(null);
    setResizePreviewEndTime(null);
  }, [resizingBlock, resizePreviewEndTime, onBlockMove]);

  useEffect(() => {
    if (!resizingBlock) return;

    const handleMouseMove = (e: MouseEvent) => handleResizeMove(e);
    const handleMouseUp = () => handleResizeEnd();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingBlock, handleResizeMove, handleResizeEnd]);

  const isCurrentWeekVisible = useMemo(() => {
    const weekEnd = addDays(currentWeekStart, 6);
    return isWithinInterval(new Date(), { start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart]);

  const getCurrentTimePosition = useCallback(() => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    if (hours < settings.calendarStartHour || hours > settings.calendarEndHour) return null;

    const totalMinutes = (hours - settings.calendarStartHour) * 60 + minutes;
    const totalGridMinutes = (settings.calendarEndHour - settings.calendarStartHour + 1) * 60;
    return (totalMinutes / totalGridMinutes) * 100;
  }, [currentTime, settings.calendarStartHour, settings.calendarEndHour]);

  const getBlockDuration = (block: TimeBlock): number => {
    const [sh, sm] = block.startTime.split(':').map(Number);
    const [eh, em] = block.endTime.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const block = event.active.data.current?.block as TimeBlock;
    if (block) setActiveBlock(block);
  };

  const SNAP_THRESHOLD_MINS = 30;
  const timeToMins = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const minsToTime = (mins: number): string => {
    return `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`;
  };

  const findSnapTarget = (dropDate: string, dropStartMins: number, duration: number, excludeBlockId: string) => {
    const dayBlocks = timeBlocks[dropDate] || [];
    const dropEndMins = dropStartMins + duration;

    let bestSnap = { startMins: dropStartMins, snapType: null as 'before' | 'after' | null, distance: Infinity };

    for (const otherBlock of dayBlocks) {
      if (otherBlock.id === excludeBlockId) continue;

      const otherStartMins = timeToMins(otherBlock.startTime);
      const otherEndMins = timeToMins(otherBlock.endTime);

      const distanceToEnd = Math.abs(dropStartMins - otherEndMins);
      if (distanceToEnd <= SNAP_THRESHOLD_MINS && distanceToEnd < bestSnap.distance) {
        bestSnap = { startMins: otherEndMins, snapType: 'after', distance: distanceToEnd };
      }

      const distanceToStart = Math.abs(dropEndMins - otherStartMins);
      if (distanceToStart <= SNAP_THRESHOLD_MINS && distanceToStart < bestSnap.distance) {
        bestSnap = { startMins: otherStartMins - duration, snapType: 'before', distance: distanceToStart };
      }
    }

    return { startMins: bestSnap.startMins, snapType: bestSnap.snapType };
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlock(null);

    if (!onBlockMove) {
      lastCalculatedDropRef.current = null;
      return;
    }

    const block = active.data.current?.block as TimeBlock;
    let dropData: { date: string; time: string } | null = null;

    // Try to get drop data from the droppable container
    if (over?.data.current) {
      const data = over.data.current as { date?: string; time?: string; droppableContainer?: { data?: { current?: { date?: string; time?: string } } } };
      if (data.date && data.time) {
        dropData = { date: data.date, time: data.time };
      } else if (data.droppableContainer?.data?.current?.date && data.droppableContainer?.data?.current?.time) {
        dropData = {
          date: data.droppableContainer.data.current.date,
          time: data.droppableContainer.data.current.time
        };
      }
    }

    // Try parsing the droppable ID (format: yyyy-MM-dd-HH:mm)
    if (!dropData && over && typeof over.id === 'string') {
      const idStr = over.id as string;
      // Match pattern: YYYY-MM-DD-HH:mm
      const match = idStr.match(/^(\d{4}-\d{2}-\d{2})-(\d{2}:\d{2})$/);
      if (match) {
        dropData = { date: match[1], time: match[2] };
      }
    }

    // Last resort: use the calculated drop position from collision detection
    if (!dropData && lastCalculatedDropRef.current) {
      dropData = lastCalculatedDropRef.current;
    }

    lastCalculatedDropRef.current = null;

    if (!block || !dropData) {
      console.log('[DragEnd] No valid drop data found');
      return;
    }

    const duration = getBlockDuration(block);
    const snapResult = findSnapTarget(dropData.date, timeToMins(dropData.time), duration, block.id);

    const minMins = settings.calendarStartHour * 60;
    const maxMins = (settings.calendarEndHour + 1) * 60;

    let adjustedStartMins = snapResult.startMins;
    if (adjustedStartMins < minMins) adjustedStartMins = minMins;
    if (adjustedStartMins + duration > maxMins) adjustedStartMins = maxMins - duration;

    const newStartTime = minsToTime(adjustedStartMins);
    const newEndTime = minsToTime(adjustedStartMins + duration);

    const normalizeTime = (t: string) => t.split(':').slice(0, 2).join(':');
    const currentDate = block.date || format(new Date(), 'yyyy-MM-dd');

    // Skip if position hasn't actually changed
    if (currentDate === dropData.date && normalizeTime(block.startTime) === newStartTime) {
      return;
    }

    try {
      await onBlockMove(block.id, dropData.date, newStartTime, newEndTime);
    } catch (error) {
      console.error('[DragEnd] Failed to move block:', error);
    }
  };

  // Mobile view
  if (isMobileView) {
    const dayBlocks = timeBlocks[format(selectedMobileDay, 'yyyy-MM-dd')] || [];
    const sortedBlocks = [...dayBlocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

    return (
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-0">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs">
                Today
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[110px] text-center">
                {format(selectedMobileDay, 'EEE, MMM d')}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          {/* Quick day selector */}
          <div className="flex gap-1 overflow-x-auto pb-3 mb-4 scrollbar-hide">
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
                    'flex flex-col items-center p-2 rounded-xl min-w-[48px] transition-all',
                    isSelected ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted',
                    isToday && !isSelected && 'ring-2 ring-primary/50'
                  )}
                >
                  <span className="text-[10px] uppercase opacity-70">{format(day, 'EEE')}</span>
                  <span className={cn('text-lg font-bold', isToday && !isSelected && 'text-primary')}>
                    {format(day, 'd')}
                  </span>
                  {hasBlocks && <span className="h-1 w-1 rounded-full bg-current mt-0.5 opacity-70" />}
                </button>
              );
            })}
          </div>

          {/* Events list */}
          <div className="space-y-2">
            {sortedBlocks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No events for this day</p>
                <p className="text-xs mt-1 opacity-70">Tap + to add one</p>
              </div>
            ) : (
              sortedBlocks.map((block) => {
                const isBlockRecurring = block.isRecurring || block.isRecurrenceInstance;
                return (
                <button
                  key={block.id}
                  onClick={() => onBlockClick?.(block)}
                  className="w-full text-left p-3 rounded-xl bg-card border shadow-sm transition-all hover:shadow-lg active:scale-[0.98]"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: colorMode === 'energy' ? ENERGY_COLORS[block.energyRating] : DRIP_QUADRANTS[block.dripQuadrant].color,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate flex items-center gap-1.5">
                        {isBlockRecurring && <Repeat className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />}
                        {block.activityName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTimeShort(block.startTime)} - {formatTimeShort(block.endTime)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {block.dripQuadrant}
                      </Badge>
                    </div>
                  </div>
                </button>
              );})
            )}
          </div>

          <button
            onClick={() => onAddBlock?.(selectedMobileDay, format(new Date(), 'HH:mm'))}
            className="w-full mt-4 p-4 border-2 border-dashed rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-5 w-5 mx-auto mb-1" />
            <span className="text-sm">Add event</span>
          </button>
        </CardContent>
      </Card>
    );
  }

  // Desktop view
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Card className="overflow-hidden border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="font-medium"
            >
              Today
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold">
              {format(currentWeekStart, 'MMMM yyyy')}
            </h2>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />}
          </div>

          {/* Color mode toggle */}
          {!externalColorMode && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleColorModeChange(colorMode === 'drip' ? 'energy' : 'drip')}
                className="gap-2 text-xs"
              >
                <Palette className="h-3.5 w-3.5" />
                {colorMode === 'drip' ? 'DRIP' : 'Energy'}
              </Button>
            </div>
          )}
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Days header */}
              <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b sticky top-0 bg-background z-10">
                <div className="p-2" />
                {weekDays.map((day, index) => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={index}
                      className={cn(
                        'py-2 px-1 text-center border-l border-border/30',
                        isToday && 'bg-primary/5'
                      )}
                    >
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        {format(day, 'EEE')}
                      </div>
                      <div className={cn(
                        'text-xl font-semibold mt-0.5 transition-colors',
                        isToday ? 'text-primary bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''
                      )}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time grid */}
              <div className="max-h-[600px] overflow-y-auto relative">
                {/* Current time indicator */}
                {isCurrentWeekVisible && getCurrentTimePosition() !== null && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${getCurrentTimePosition()}%` }}
                  >
                    <div className="grid grid-cols-[48px_repeat(7,1fr)]">
                      <div className="relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-red-500 font-medium pr-1">
                          {format(currentTime, 'h:mm')}
                        </div>
                      </div>
                      {weekDays.map((day, index) => (
                        <div key={index} className="relative">
                          {isSameDay(day, new Date()) && (
                            <>
                              <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full shadow-md" />
                              <div className="absolute left-0 right-0 border-t-2 border-red-500" />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={calendarGridRef} className="grid grid-cols-[48px_repeat(7,1fr)]">
                  {/* Time column */}
                  <div className="border-r border-border/30">
                    {hourLabels.map((hourSlot: string, index: number) => {
                      const hourNum = parseInt(hourSlot.split(':')[0]);
                      return (
                        <div
                          key={hourSlot}
                          className={cn(
                            "h-[56px] pr-2 text-[11px] text-muted-foreground flex items-start justify-end whitespace-nowrap",
                            index === 0 ? "pt-2" : "pt-0 -mt-2"
                          )}
                        >
                          {formatHour(hourNum, settings.timeFormat, true)}
                        </div>
                      );
                    })}
                  </div>

                  {/* Day columns */}
                  {weekDays.map((day, dayIndex) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayBlocks = timeBlocks[dateKey] || [];
                    const totalHours = settings.calendarEndHour - settings.calendarStartHour + 1;
                    const isToday = isSameDay(day, new Date());

                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          'border-l border-border/30 relative',
                          isToday && 'bg-primary/[0.02]'
                        )}
                        style={{ height: `${totalHours * HOUR_HEIGHT}px` }}
                      >
                        {/* Hour grid lines */}
                        {hourLabels.map((hourSlot: string) => {
                          const hourNum = parseInt(hourSlot.split(':')[0]);
                          const quarterSlots = [
                            hourSlot,
                            `${hourNum.toString().padStart(2, '0')}:15`,
                            `${hourNum.toString().padStart(2, '0')}:30`,
                            `${hourNum.toString().padStart(2, '0')}:45`,
                          ];

                          return (
                            <div key={hourSlot} className="h-[56px] border-b border-border/20">
                              <div className="grid grid-rows-4 h-full">
                                {quarterSlots.map((time, idx) => {
                                  const block = getBlocksForDateAndTime(day, time, activeBlock?.id);
                                  const slotId = `${dateKey}-${time}`;

                                  if (block) return <div key={time} className="h-[14px]" />;

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

                        {/* Event blocks */}
                        {dayBlocks.map((block) => {
                          const [startHour, startMin] = block.startTime.split(':').map(Number);
                          const [endHour, endMin] = block.endTime.split(':').map(Number);
                          const startMins = startHour * 60 + startMin;
                          const endMins = endHour * 60 + endMin;
                          const durationMins = endMins - startMins;

                          const calendarStartMins = settings.calendarStartHour * 60;
                          const topPosition = ((startMins - calendarStartMins) / 60) * HOUR_HEIGHT;
                          const height = (durationMins / 60) * HOUR_HEIGHT;
                          const durationSlots = durationMins / 15;

                          const isBeingResized = resizingBlock?.id === block.id;
                          let displayHeight = height;
                          let displayDurationSlots = durationSlots;

                          if (isBeingResized && resizePreviewEndTime) {
                            const [pH, pM] = resizePreviewEndTime.split(':').map(Number);
                            const previewDurationMins = (pH * 60 + pM) - startMins;
                            displayHeight = (previewDurationMins / 60) * HOUR_HEIGHT;
                            displayDurationSlots = previewDurationMins / 15;
                          }

                          const isDraggingOther = activeBlock && activeBlock.id !== block.id;

                          return (
                            <div
                              key={block.id}
                              className={cn(
                                "absolute left-0.5 right-0.5 z-10",
                                isDraggingOther && "pointer-events-none"
                              )}
                              style={{
                                top: `${topPosition}px`,
                                height: `${Math.max(displayHeight - 1, 13)}px`,
                              }}
                            >
                              <EventCard
                                block={isBeingResized && resizePreviewEndTime
                                  ? { ...block, date: dateKey, endTime: resizePreviewEndTime }
                                  : { ...block, date: dateKey }
                                }
                                durationSlots={displayDurationSlots}
                                onBlockClick={onBlockClick}
                                getBlockColor={(q) => getBlockColor(q, block.energyRating)}
                                onResizeStart={handleResizeStart}
                                isResizing={isBeingResized}
                                colorMode={colorMode}
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="px-4 py-3 border-t bg-muted/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {colorMode === 'drip' ? (
                Object.entries(DRIP_QUADRANTS).map(([key, quadrant]) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: quadrant.color }} />
                    {quadrant.name}
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-sm bg-green-500" />
                    Energizing
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-sm bg-yellow-500" />
                    Neutral
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                    Draining
                  </div>
                </>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground/70 flex gap-3">
              <span><kbd className="px-1 py-0.5 bg-muted rounded">Alt</kbd>+<kbd className="px-1 py-0.5 bg-muted rounded">C</kbd> Toggle colors</span>
              <span><kbd className="px-1 py-0.5 bg-muted rounded">Alt</kbd>+<kbd className="px-1 py-0.5 bg-muted rounded">N</kbd> New event</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drag overlay - Google Calendar style */}
      <DragOverlay dropAnimation={null}>
        {activeBlock && (
          <div
            className="px-2 py-1.5 rounded shadow-2xl text-white font-bold text-xs"
            style={{
              backgroundColor: getBlockColor(activeBlock.dripQuadrant, activeBlock.energyRating),
              minWidth: '100px',
              maxWidth: '180px',
              opacity: 0.9,
            }}
          >
            <span className="truncate block">{activeBlock.activityName}</span>
            <span className="text-[10px] opacity-90 block">
              {formatTimeShort(activeBlock.startTime)} - {formatTimeShort(activeBlock.endTime)}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
