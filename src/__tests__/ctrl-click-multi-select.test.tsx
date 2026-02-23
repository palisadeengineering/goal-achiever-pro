import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import React from 'react';

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useDraggable: () => ({
    attributes: { role: 'button', tabIndex: 0 },
    listeners: {
      onPointerDown: vi.fn(),
      onKeyDown: vi.fn(),
    },
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }),
  PointerSensor: class {},
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

// Mock Radix UI components that wrap the event cards
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: React.forwardRef(({ children, ...props }: { children: React.ReactNode; asChild?: boolean }, ref) => (
    <div ref={ref as React.Ref<HTMLDivElement>} {...props}>{children}</div>
  )),
}));

vi.mock('@/components/ui/context-menu', () => ({
  ContextMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ContextMenuTrigger: React.forwardRef(({ children }: { children: React.ReactNode; asChild?: boolean }, ref) => (
    <div ref={ref as React.Ref<HTMLDivElement>}>{children}</div>
  )),
  ContextMenuContent: () => null,
  ContextMenuSub: () => null,
  ContextMenuSubTrigger: () => null,
  ContextMenuSubContent: () => null,
  ContextMenuCheckboxItem: () => null,
  ContextMenuItem: () => null,
  ContextMenuSeparator: () => null,
  ContextMenuLabel: () => null,
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverContent: () => null,
  PopoverTrigger: React.forwardRef(({ children }: { children: React.ReactNode }, ref) => (
    <div ref={ref as React.Ref<HTMLDivElement>}>{children}</div>
  )),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: React.forwardRef(({ children, ...props }: { children: React.ReactNode; onClick?: () => void }, ref) => (
    <button ref={ref as React.Ref<HTMLButtonElement>} {...props}>{children}</button>
  )),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: { children: React.ReactNode }) => <span {...props}>{children}</span>,
}));

vi.mock('@/lib/hooks/use-local-storage', () => ({
  useLocalStorage: () => [{
    timeFormat: '12h',
    calendarStartHour: 5,
    calendarEndHour: 23,
    weekStartsOn: 'sunday',
  }, vi.fn()],
}));

vi.mock('@/lib/hooks/use-event-size', () => ({
  useEventSize: () => ({ ref: vi.fn(), sizeBucket: 'md', bucketClass: 'timeAuditEvent--md' }),
  getAdaptiveEventStyles: () => ({
    containerClass: '',
    titleClass: 'text-xs font-semibold',
    metaClass: 'text-[10px]',
    lineClamp: 2,
    showTime: true,
    showDuration: true,
    showRecurringIcon: true,
    truncateToFirstWord: false,
  }),
  SIZE_BUCKET_CLASSES: {},
}));

vi.mock('@/constants/drip', () => ({
  VALUE_QUADRANTS: {
    production: { name: 'Production', color: '#0891b2' },
    investment: { name: 'Investment', color: '#9333ea' },
    replacement: { name: 'Replacement', color: '#f59e0b' },
    delegation: { name: 'Delegation', color: '#ef4444' },
    na: { name: 'N/A', color: '#3b82f6' },
  },
  getValueQuadrantConfig: (q: string) => ({
    name: q, color: q === 'production' ? '#0891b2' : '#888',
  }),
  getEnergyRatingConfig: (r: string) => ({
    name: r, color: '#888',
  }),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
  formatHour: (h: number) => `${h}:00`,
}));

vi.mock('@/lib/utils/recurrence', () => ({
  describeRecurrence: () => 'Weekly',
}));

import { WeeklyCalendarView } from '@/components/features/time-audit/weekly-calendar-view';
import { format, startOfWeek } from 'date-fns';

// Helper to create a time block
function makeBlock(id: string, name: string, startTime: string, endTime: string, date: string) {
  return {
    id,
    startTime,
    endTime,
    activityName: name,
    valueQuadrant: 'production' as const,
    energyRating: 'green' as const,
    date,
    source: 'manual',
  };
}

describe('Ctrl+Click multi-select on calendar events', () => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const dateKey = format(weekStart, 'yyyy-MM-dd');

  const blocks = {
    [dateKey]: [
      makeBlock('block-1', 'Meeting A', '09:00', '10:00', dateKey),
      makeBlock('block-2', 'Meeting B', '10:00', '11:00', dateKey),
      makeBlock('block-3', 'Lunch', '12:00', '13:00', dateKey),
    ],
  };

  let onBulkCategorize: (...args: unknown[]) => void;
  let onBlockClick: (...args: unknown[]) => void;

  beforeEach(() => {
    onBulkCategorize = vi.fn();
    onBlockClick = vi.fn();
    // Simulate desktop (non-touch) viewport
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
  });

  it('selects an event on Ctrl+pointerdown', async () => {
    render(
      <WeeklyCalendarView
        timeBlocks={blocks}
        onBlockClick={onBlockClick}

        onBulkCategorize={onBulkCategorize}
      />
    );

    // Find event buttons by their text content
    const eventA = screen.getAllByText('Meeting A').find(el => el.closest('button'))!.closest('button')!;
    expect(eventA).toBeTruthy();

    // Ctrl+pointerdown should trigger multi-select
    await act(async () => {
      fireEvent.pointerDown(eventA, { button: 0, ctrlKey: true });
    });

    // onBlockClick should NOT have been called (Ctrl+Click = select, not edit)
    expect(onBlockClick).not.toHaveBeenCalled();

    // The floating bar should appear showing the event is selected
    expect(screen.getByText(/1 event selected/)).toBeInTheDocument();
  });

  it('shows the floating selection bar when events are selected', async () => {
    render(
      <WeeklyCalendarView
        timeBlocks={blocks}
        onBlockClick={onBlockClick}

        onBulkCategorize={onBulkCategorize}
      />
    );

    const eventA = screen.getAllByText('Meeting A').find(el => el.closest('button'))!.closest('button')!;

    await act(async () => {
      fireEvent.pointerDown(eventA, { button: 0, ctrlKey: true });
    });

    // The floating bar should appear with "1 event selected"
    expect(screen.getByText(/1 event selected/)).toBeInTheDocument();
    expect(screen.getByText('Categorize')).toBeInTheDocument();
  });

  it('selects multiple events with successive Ctrl+clicks', async () => {
    render(
      <WeeklyCalendarView
        timeBlocks={blocks}
        onBlockClick={onBlockClick}

        onBulkCategorize={onBulkCategorize}
      />
    );

    const eventA = screen.getAllByText('Meeting A').find(el => el.closest('button'))!.closest('button')!;
    const eventB = screen.getAllByText('Meeting B').find(el => el.closest('button'))!.closest('button')!;

    // Select first event
    await act(async () => {
      fireEvent.pointerDown(eventA, { button: 0, ctrlKey: true });
    });

    // Select second event
    await act(async () => {
      fireEvent.pointerDown(eventB, { button: 0, ctrlKey: true });
    });

    // Should show 2 events selected
    expect(screen.getByText(/2 events selected/)).toBeInTheDocument();
  });

  it('deselects an event when Ctrl+clicking it again', async () => {
    render(
      <WeeklyCalendarView
        timeBlocks={blocks}
        onBlockClick={onBlockClick}

        onBulkCategorize={onBulkCategorize}
      />
    );

    const eventA = screen.getAllByText('Meeting A').find(el => el.closest('button'))!.closest('button')!;

    // Select
    await act(async () => {
      fireEvent.pointerDown(eventA, { button: 0, ctrlKey: true });
    });
    expect(screen.getByText(/1 event selected/)).toBeInTheDocument();

    // Deselect
    await act(async () => {
      fireEvent.pointerDown(eventA, { button: 0, ctrlKey: true });
    });

    // Should show no selection bar (0 events)
    expect(screen.queryByText(/event.*selected/)).not.toBeInTheDocument();
  });

  it('clears selection on Escape key', async () => {
    render(
      <WeeklyCalendarView
        timeBlocks={blocks}
        onBlockClick={onBlockClick}

        onBulkCategorize={onBulkCategorize}
      />
    );

    const eventA = screen.getAllByText('Meeting A').find(el => el.closest('button'))!.closest('button')!;

    await act(async () => {
      fireEvent.pointerDown(eventA, { button: 0, ctrlKey: true });
    });
    expect(screen.getByText(/1 event selected/)).toBeInTheDocument();

    // Press Escape
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    expect(screen.queryByText(/event.*selected/)).not.toBeInTheDocument();
  });

  it('works with metaKey (Cmd on Mac) as well', async () => {
    render(
      <WeeklyCalendarView
        timeBlocks={blocks}
        onBlockClick={onBlockClick}

        onBulkCategorize={onBulkCategorize}
      />
    );

    const eventA = screen.getAllByText('Meeting A').find(el => el.closest('button'))!.closest('button')!;

    // Cmd+Click (metaKey)
    await act(async () => {
      fireEvent.pointerDown(eventA, { button: 0, metaKey: true });
    });

    expect(onBlockClick).not.toHaveBeenCalled();
    expect(screen.getByText(/1 event selected/)).toBeInTheDocument();
  });

  it('regular click still opens edit (not multi-select)', async () => {
    render(
      <WeeklyCalendarView
        timeBlocks={blocks}
        onBlockClick={onBlockClick}

        onBulkCategorize={onBulkCategorize}
      />
    );

    const eventA = screen.getAllByText('Meeting A').find(el => el.closest('button'))!.closest('button')!;

    // Regular click (no modifier)
    await act(async () => {
      fireEvent.pointerDown(eventA, { button: 0 });
      fireEvent.click(eventA, { detail: 1 });
    });

    // Should have called onBlockClick for editing
    expect(onBlockClick).toHaveBeenCalled();
    // Should NOT show selection bar
    expect(screen.queryByText(/event.*selected/)).not.toBeInTheDocument();
  });

  it('calls onBulkCategorize when Categorize button is clicked', async () => {
    render(
      <WeeklyCalendarView
        timeBlocks={blocks}
        onBlockClick={onBlockClick}

        onBulkCategorize={onBulkCategorize}
      />
    );

    const eventA = screen.getAllByText('Meeting A').find(el => el.closest('button'))!.closest('button')!;
    const eventB = screen.getAllByText('Meeting B').find(el => el.closest('button'))!.closest('button')!;

    // Select two events
    await act(async () => {
      fireEvent.pointerDown(eventA, { button: 0, ctrlKey: true });
    });
    await act(async () => {
      fireEvent.pointerDown(eventB, { button: 0, ctrlKey: true });
    });

    // Click Categorize
    const categorizeBtn = screen.getByText('Categorize');
    await act(async () => {
      fireEvent.click(categorizeBtn);
    });

    expect(onBulkCategorize).toHaveBeenCalledTimes(1);
    expect((onBulkCategorize as ReturnType<typeof vi.fn>).mock.calls[0][0]).toHaveLength(2);
  });
});
