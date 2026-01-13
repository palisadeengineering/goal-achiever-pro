'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, CalendarDays, CalendarRange, Lock, RefreshCw, ChevronDown, Upload, ArrowUpRight, BarChart3, ListChecks, Trash2, ChevronRight, PanelRightClose, PanelRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { WeeklyCalendarView } from '@/components/features/time-audit/weekly-calendar-view';
import { BulkCategorizationView } from '@/components/features/time-audit/bulk-categorization-view';
import { useGoogleCalendar } from '@/lib/hooks/use-google-calendar';
import { useEventPatterns } from '@/lib/hooks/use-event-patterns';
import { useTimeBlocks, TimeBlock as DbTimeBlock } from '@/lib/hooks/use-time-blocks';
import { startOfWeek, endOfWeek, addDays, addWeeks, addMonths } from 'date-fns';
import { BiweeklyCalendarView } from '@/components/features/time-audit/biweekly-calendar-view';
import { MonthlyCalendarView } from '@/components/features/time-audit/monthly-calendar-view';
import { DripPieChart } from '@/components/features/time-audit/drip-pie-chart';
import { EnergyPieChart } from '@/components/features/time-audit/energy-pie-chart';
import { TimeSummaryStats } from '@/components/features/time-audit/time-summary-stats';
import { TimeBlockForm, TimeBlock } from '@/components/features/time-audit/time-block-form';
import { InsightsView } from '@/components/features/time-audit/insights-view';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { useTags } from '@/lib/hooks/use-tags';
import { useEditPatterns } from '@/lib/hooks/use-edit-patterns';
import { EditSuggestionBanner } from '@/components/features/time-audit/edit-suggestion-banner';
import { ROUTES } from '@/constants/routes';
import { expandRecurringEvents } from '@/lib/utils/recurrence';
import type { DripQuadrant, EnergyRating } from '@/types/database';

type SubscriptionTier = 'free' | 'pro' | 'elite';

// Helper to normalize time format to HH:mm (handles both HH:mm and HH:mm:ss formats)
function normalizeTimeFormat(time: string): string {
  // If time already has seconds (HH:mm:ss), strip them
  const parts = time.split(':');
  return `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}`;
}

// Interface matching WeeklyCalendarView's expected TimeBlock
interface CalendarTimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  activityName: string;
  dripQuadrant: DripQuadrant;
  energyRating: EnergyRating;
  // Recurring event properties
  isRecurring?: boolean;
  recurrenceRule?: string;
  isRecurrenceInstance?: boolean;
  parentBlockId?: string;
}

function checkProAccess(tier: SubscriptionTier): boolean {
  return tier === 'pro' || tier === 'elite';
}

function checkEliteAccess(tier: SubscriptionTier): boolean {
  return tier === 'elite';
}

// Calculate duration in minutes between two time strings
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

export default function TimeAuditPage() {
  // In real app, check user subscription tier from database
  const userTier: SubscriptionTier = 'elite'; // Temporarily set to elite for testing
  const hasProAccess = checkProAccess(userTier);
  const hasEliteAccess = checkEliteAccess(userTier);

  // Get current week date range for initial fetch
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  // Google Calendar integration - needs to be before useTimeBlocks for 2-way sync
  const {
    events: googleEvents,
    isLoading: isLoadingGoogle,
    isConnected: isGoogleConnected,
    fetchEvents: fetchGoogleEvents,
    clearCache: clearGoogleCache,
  } = useGoogleCalendar();

  // Database time blocks - fetch a wide range to support navigation
  // 3 months back and 6 months forward to cover most navigation scenarios
  const {
    timeBlocks: dbTimeBlocks,
    isLoading: isLoadingDb,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    clearAllTimeBlocks,
    importTimeBlocks,
    fetchTimeBlocks,
  } = useTimeBlocks(
    format(addMonths(weekStart, -3), 'yyyy-MM-dd'),
    format(addMonths(weekEnd, 6), 'yyyy-MM-dd'),
    {
      isConnected: isGoogleConnected,
      autoSync: true,
    }
  );

  // Local storage for backwards compatibility (will migrate to DB)
  const [localTimeBlocks, setLocalTimeBlocks] = useLocalStorage<TimeBlock[]>('time-blocks', []);

  // Combine database and local time blocks (prefer database), then expand recurring events
  const timeBlocks = useMemo(() => {
    // Create a set of external event IDs from database
    const dbExternalIds = new Set(
      dbTimeBlocks.filter(b => b.externalEventId).map(b => b.externalEventId)
    );
    const dbLocalIds = new Set(dbTimeBlocks.map(b => b.id));

    // Filter local blocks that aren't already in database
    const uniqueLocalBlocks = localTimeBlocks.filter(
      b => !dbLocalIds.has(b.id) && (!b.externalEventId || !dbExternalIds.has(b.externalEventId))
    );

    // Merge blocks with recurring event fields
    const merged = [...dbTimeBlocks.map(b => ({
      id: b.id,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      activityName: b.activityName,
      dripQuadrant: b.dripQuadrant as DripQuadrant,
      energyRating: b.energyRating as EnergyRating,
      source: b.source,
      externalEventId: b.externalEventId,
      createdAt: b.createdAt || new Date().toISOString(),
      // Include recurring event fields
      isRecurring: b.isRecurring,
      recurrenceRule: b.recurrenceRule,
      recurrenceEndDate: b.recurrenceEndDate,
      parentBlockId: b.parentBlockId,
    })), ...uniqueLocalBlocks];

    // Expand recurring events for a wide range to support navigation
    // 3 months back and 6 months forward to match the fetch range
    const rangeStart = addMonths(weekStart, -3);
    const rangeEnd = addMonths(weekEnd, 6);

    const expanded = expandRecurringEvents(merged, rangeStart, rangeEnd);

    return expanded.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [dbTimeBlocks, localTimeBlocks, weekStart, weekEnd]);

  // State for the form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | undefined>();
  const [initialDate, setInitialDate] = useState<string>();
  const [initialTime, setInitialTime] = useState<string>();
  const [initialEndTime, setInitialEndTime] = useState<string>();

  // Push to Google Calendar dialog
  const [showPushDialog, setShowPushDialog] = useState(false);
  const [pushingToCalendar, setPushingToCalendar] = useState(false);
  const [blockToPush, setBlockToPush] = useState<TimeBlock | null>(null);

  // Import progress
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  const { getUncategorizedEventIds, getCategorization, saveCategorization, categorizations, refreshFromStorage, clearCategorizations } = useEventPatterns();

  const { tags } = useTags();

  // Edit pattern detection
  const { trackEdit, getPatternSuggestion, dismissPattern } = useEditPatterns();

  const [showCategorizationDialog, setShowCategorizationDialog] = useState(false);
  const [categorizationDismissed, setCategorizationDismissed] = useState(false); // Track if user manually closed
  const [mainTab, setMainTab] = useState<'calendar' | 'insights'>('calendar');
  const [syncTimeframe, setSyncTimeframe] = useLocalStorage<'1week' | '2weeks' | '1month'>('google-sync-timeframe', '1week');

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage<boolean>('time-audit-sidebar-collapsed', false);
  const [calendarColorMode, setCalendarColorMode] = useState<'drip' | 'energy'>('drip');

  // Track currently viewed date range from calendar views
  const [viewedDateRange, setViewedDateRange] = useState<{ start: Date; end: Date }>(() => ({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  }));

  // Callback for calendar views to report their current date range
  const handleDateRangeChange = useCallback((start: Date, end: Date) => {
    setViewedDateRange({ start, end });
  }, []);

  // Helper function to calculate sync end date based on timeframe
  // This ensures consistent date calculations across manual sync and auto-sync
  const calculateSyncEndDate = useCallback((startDate: Date, timeframe: '1week' | '2weeks' | '1month'): Date => {
    // Always start from the beginning of the week
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });

    switch (timeframe) {
      case '2weeks':
        // Sync current week + next week (14 days total)
        return endOfWeek(addWeeks(weekStart, 1), { weekStartsOn: 1 });
      case '1month':
        // Sync from week start for approximately 1 month (4-5 weeks)
        return endOfWeek(addWeeks(weekStart, 4), { weekStartsOn: 1 });
      case '1week':
      default:
        // Sync just the current week
        return endOfWeek(weekStart, { weekStartsOn: 1 });
    }
  }, []);

  // Auto-sync Google Calendar events when navigating to different weeks
  const prevViewedRangeRef = useRef<{ start: number; end: number } | null>(null);
  useEffect(() => {
    if (!isGoogleConnected || isLoadingGoogle) return;

    const startTime = viewedDateRange.start.getTime();
    const endTime = viewedDateRange.end.getTime();

    // Only fetch if the date range actually changed (and not on initial mount)
    if (prevViewedRangeRef.current &&
        (prevViewedRangeRef.current.start !== startTime ||
         prevViewedRangeRef.current.end !== endTime)) {
      const syncStart = startOfWeek(viewedDateRange.start, { weekStartsOn: 1 });
      const syncEnd = calculateSyncEndDate(viewedDateRange.start, syncTimeframe);
      fetchGoogleEvents(syncStart, syncEnd);
    }

    prevViewedRangeRef.current = { start: startTime, end: endTime };
  }, [viewedDateRange, isGoogleConnected, isLoadingGoogle, syncTimeframe, fetchGoogleEvents, calculateSyncEndDate]);

  // Fetch Google events when connected - uses the currently viewed date range
  const handleSyncGoogle = useCallback((timeframe?: '1week' | '2weeks' | '1month') => {
    const selectedTimeframe = timeframe || syncTimeframe;
    if (timeframe) {
      setSyncTimeframe(timeframe);
    }

    // Clear cache before fetching to ensure fresh data
    clearGoogleCache();

    // Calculate sync range based on the currently viewed week and selected timeframe
    const syncStart = startOfWeek(viewedDateRange.start, { weekStartsOn: 1 });
    const syncEnd = calculateSyncEndDate(viewedDateRange.start, selectedTimeframe);

    // Log for debugging
    console.log(`[Google Sync] Syncing ${selectedTimeframe}: ${format(syncStart, 'yyyy-MM-dd')} to ${format(syncEnd, 'yyyy-MM-dd')}`);

    fetchGoogleEvents(syncStart, syncEnd);
  }, [syncTimeframe, setSyncTimeframe, viewedDateRange.start, fetchGoogleEvents, calculateSyncEndDate, clearGoogleCache]);

  const getTimeframeLabel = (tf: string) => {
    switch (tf) {
      case '2weeks': return '2 Weeks';
      case '1month': return '1 Month';
      default: return '1 Week';
    }
  };

  // Count uncategorized events
  const uncategorizedCount = useMemo(() => {
    if (!googleEvents || googleEvents.length === 0) return 0;
    try {
      const eventIds = googleEvents.map((e) => e.id).filter(Boolean);
      return getUncategorizedEventIds(eventIds).length;
    } catch {
      return 0;
    }
  }, [googleEvents, getUncategorizedEventIds]);

  // Auto-open categorization dialog when new uncategorized events are detected after sync
  useEffect(() => {
    // Only auto-open if:
    // 1. Google is connected
    // 2. Not currently loading
    // 3. There are uncategorized events
    // 4. Dialog is not already open
    // 5. User hasn't manually dismissed the dialog
    if (isGoogleConnected && !isLoadingGoogle && uncategorizedCount > 0 && !showCategorizationDialog && !categorizationDismissed) {
      setShowCategorizationDialog(true);
    }
  }, [isGoogleConnected, isLoadingGoogle, uncategorizedCount, showCategorizationDialog, categorizationDismissed]);

  // Reset dismissal when sync completes with new uncategorized events (only on fresh sync)
  const prevUncategorizedCount = useRef(uncategorizedCount);
  useEffect(() => {
    // If uncategorized count increased, reset dismissal to allow auto-open for new events
    if (uncategorizedCount > prevUncategorizedCount.current) {
      setCategorizationDismissed(false);
    }
    prevUncategorizedCount.current = uncategorizedCount;
  }, [uncategorizedCount]);

  // Transform time blocks for WeeklyCalendarView (grouped by date)
  // Includes both manual time blocks AND categorized Google Calendar events
  const calendarTimeBlocks = useMemo(() => {
    const grouped: Record<string, CalendarTimeBlock[]> = {};

    // Track which Google event IDs are already imported as time blocks
    const importedGoogleEventIds = new Set(
      timeBlocks
        .filter(b => b.externalEventId)
        .map(b => b.externalEventId)
    );

    // Add manual time blocks
    timeBlocks.forEach((block) => {
      if (!grouped[block.date]) {
        grouped[block.date] = [];
      }
      grouped[block.date].push({
        id: block.id,
        startTime: block.startTime,
        endTime: block.endTime,
        activityName: block.activityName,
        dripQuadrant: block.dripQuadrant,
        energyRating: block.energyRating,
        // Include recurring event properties
        isRecurring: block.isRecurring,
        recurrenceRule: block.recurrenceRule,
        isRecurrenceInstance: 'isRecurrenceInstance' in block ? (block.isRecurrenceInstance as boolean) : undefined,
        parentBlockId: 'parentBlockId' in block ? (block.parentBlockId as string) : undefined,
      });
    });

    // Merge Google Calendar events (skip if already imported)
    // Show ALL events, even uncategorized ones (with default 'na' quadrant and 'yellow' energy)
    googleEvents.forEach((event) => {
      // Skip if this event is already imported as a time block
      if (importedGoogleEventIds.has(event.id)) {
        return;
      }

      const categorization = getCategorization(event.id);

      // Extract date and times from Google event
      const startDateTime = event.start?.dateTime || event.startTime;
      const endDateTime = event.end?.dateTime || event.endTime;

      if (startDateTime) {
        try {
          const startDate = new Date(startDateTime);
          const endDate = endDateTime ? new Date(endDateTime) : startDate;
          const dateKey = format(startDate, 'yyyy-MM-dd');

          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }

          // Show event with categorization if available, otherwise use defaults
          grouped[dateKey].push({
            id: event.id,
            startTime: format(startDate, 'HH:mm'),
            endTime: format(endDate, 'HH:mm'),
            activityName: event.summary,
            // Use categorization if available, otherwise default to 'na' (neutral/uncategorized)
            dripQuadrant: categorization?.dripQuadrant || 'na',
            energyRating: categorization?.energyRating || 'yellow',
          });
        } catch {
          // Skip events with invalid dates
        }
      }
    });

    return grouped;
  }, [timeBlocks, googleEvents, getCategorization, categorizations]);

  // Get all data sources for stats: time blocks + categorized Google events
  // FILTERED by currently viewed date range
  const allTimeData = useMemo(() => {
    const allBlocks: Array<{
      date: string;
      startTime: string;
      endTime: string;
      dripQuadrant: DripQuadrant;
      energyRating: EnergyRating;
      source: string;
    }> = [];

    const viewStartStr = format(viewedDateRange.start, 'yyyy-MM-dd');
    const viewEndStr = format(viewedDateRange.end, 'yyyy-MM-dd');

    // Add time blocks (from database and local) - filtered by viewed date range
    timeBlocks.forEach((block) => {
      // Only include blocks within the viewed date range
      if (block.date >= viewStartStr && block.date <= viewEndStr) {
        allBlocks.push({
          date: block.date,
          startTime: block.startTime,
          endTime: block.endTime,
          dripQuadrant: block.dripQuadrant,
          energyRating: block.energyRating,
          source: block.source || 'manual',
        });
      }
    });

    // Add Google Calendar events that aren't already imported (including uncategorized)
    const importedExternalIds = new Set(
      timeBlocks.filter(b => b.externalEventId).map(b => b.externalEventId)
    );

    googleEvents.forEach((event) => {
      // Skip if already imported as a time block
      if (importedExternalIds.has(event.id) || importedExternalIds.has(`gcal_${event.id}`)) {
        return;
      }

      const categorization = getCategorization(event.id);
      const startDateTime = event.start?.dateTime || event.startTime;
      const endDateTime = event.end?.dateTime || event.endTime;

      if (startDateTime && endDateTime) {
        try {
          const startDate = new Date(startDateTime);
          const endDate = new Date(endDateTime);
          const eventDateStr = format(startDate, 'yyyy-MM-dd');

          // Only include events within the viewed date range
          if (eventDateStr >= viewStartStr && eventDateStr <= viewEndStr) {
            allBlocks.push({
              date: eventDateStr,
              startTime: format(startDate, 'HH:mm'),
              endTime: format(endDate, 'HH:mm'),
              // Use categorization if available, otherwise use defaults
              dripQuadrant: categorization?.dripQuadrant || 'na',
              energyRating: categorization?.energyRating || 'yellow',
              source: 'google_calendar',
            });
          }
        } catch {
          // Skip invalid dates
        }
      }
    });

    return allBlocks;
  }, [timeBlocks, googleEvents, getCategorization, categorizations, viewedDateRange]);

  // Calculate stats from ALL time data (time blocks + categorized Google events)
  const stats = useMemo(() => {
    let totalMinutes = 0;
    let productionMinutes = 0;
    let delegationCount = 0;
    let energizingMinutes = 0;
    let drainingMinutes = 0;

    allTimeData.forEach((block) => {
      const duration = calculateDuration(block.startTime, block.endTime);
      if (duration <= 0) return; // Skip invalid durations

      totalMinutes += duration;

      if (block.dripQuadrant === 'production') {
        productionMinutes += duration;
      }
      if (block.dripQuadrant === 'delegation') {
        delegationCount++;
      }
      if (block.energyRating === 'green') {
        energizingMinutes += duration;
      }
      if (block.energyRating === 'red') {
        drainingMinutes += duration;
      }
    });

    const productionPercent = totalMinutes > 0 ? Math.round((productionMinutes / totalMinutes) * 100) : 0;
    const energyBalance = totalMinutes > 0
      ? Math.round(((energizingMinutes - drainingMinutes) / totalMinutes) * 100)
      : 0;

    return {
      totalMinutes,
      productionPercent,
      delegationCandidates: delegationCount,
      energyBalance,
    };
  }, [allTimeData]);

  // Calculate DRIP distribution from ALL time data
  const dripData = useMemo(() => {
    const data = { delegation: 0, replacement: 0, investment: 0, production: 0, na: 0 };
    allTimeData.forEach((block) => {
      const duration = calculateDuration(block.startTime, block.endTime);
      if (duration > 0) {
        data[block.dripQuadrant] += duration;
      }
    });
    return data;
  }, [allTimeData]);

  // Calculate energy distribution from ALL time data
  const energyData = useMemo(() => {
    const data = { green: 0, yellow: 0, red: 0 };
    allTimeData.forEach((block) => {
      const duration = calculateDuration(block.startTime, block.endTime);
      if (duration > 0) {
        data[block.energyRating] += duration;
      }
    });
    return data;
  }, [allTimeData]);

  // Get edit pattern suggestion
  const patternSuggestion = useMemo(() => {
    const blockInfos = timeBlocks.map(b => ({
      id: b.id,
      activityName: b.activityName,
      dripQuadrant: b.dripQuadrant,
      energyRating: b.energyRating,
    }));
    return getPatternSuggestion(blockInfos);
  }, [timeBlocks, getPatternSuggestion]);

  // Handle saving a new or edited time block (saves to database and optionally syncs to Google Calendar)
  const handleSaveBlock = async (blockData: Omit<TimeBlock, 'id' | 'createdAt'>) => {
    if (editingBlock) {
      // Track the edit for pattern detection
      if (editingBlock.dripQuadrant !== blockData.dripQuadrant ||
          editingBlock.energyRating !== blockData.energyRating) {
        trackEdit(
          editingBlock.id,
          editingBlock.activityName,
          editingBlock.dripQuadrant,
          blockData.dripQuadrant,
          editingBlock.energyRating,
          blockData.energyRating
        );
      }

      // Check if this is a Google Calendar event being saved for the first time
      const isGoogleEvent = editingBlock.source === 'google_calendar' && editingBlock.externalEventId;
      const existsInDb = dbTimeBlocks.some(b => b.id === editingBlock.id);

      if (isGoogleEvent && !existsInDb) {
        // Save Google Calendar event to database for the first time
        await createTimeBlock({
          date: blockData.date,
          startTime: blockData.startTime,
          endTime: blockData.endTime,
          activityName: blockData.activityName,
          dripQuadrant: blockData.dripQuadrant,
          energyRating: blockData.energyRating,
          source: 'calendar_sync',
          externalEventId: editingBlock.externalEventId,
          // Recurring event fields
          isRecurring: blockData.isRecurring,
          recurrenceRule: blockData.recurrenceRule,
          recurrenceEndDate: blockData.recurrenceEndDate,
        });

        // Also save/update the categorization in localStorage for pattern learning
        saveCategorization(
          editingBlock.externalEventId!,
          blockData.activityName,
          blockData.dripQuadrant,
          blockData.energyRating
        );

        // Also update Google Calendar if name/time changed
        if (isGoogleConnected && editingBlock.externalEventId) {
          try {
            const eventId = editingBlock.externalEventId.replace('gcal_', '');
            const startDateTime = new Date(`${blockData.date}T${blockData.startTime}:00`);
            const endDateTime = new Date(`${blockData.date}T${blockData.endTime}:00`);

            await fetch('/api/calendar/google/events', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventId,
                summary: blockData.activityName,
                description: `DRIP: ${blockData.dripQuadrant} | Energy: ${blockData.energyRating}`,
                start: startDateTime.toISOString(),
                end: endDateTime.toISOString(),
              }),
            });
            // Refresh Google events to reflect changes
            handleSyncGoogle();
          } catch (error) {
            console.error('Error updating Google Calendar event:', error);
          }
        }

        // Refresh time blocks from database
        await fetchTimeBlocks();
      } else {
        // Update existing block in database
        await updateTimeBlock(editingBlock.id, {
          date: blockData.date,
          startTime: blockData.startTime,
          endTime: blockData.endTime,
          activityName: blockData.activityName,
          dripQuadrant: blockData.dripQuadrant,
          energyRating: blockData.energyRating,
          // Recurring event fields
          isRecurring: blockData.isRecurring,
          recurrenceRule: blockData.recurrenceRule,
          recurrenceEndDate: blockData.recurrenceEndDate,
        });

        // If this is a Google Calendar event, also update it in Google Calendar
        if (editingBlock.externalEventId && isGoogleConnected) {
          try {
            const eventId = editingBlock.externalEventId.replace('gcal_', '');
            const startDateTime = new Date(`${blockData.date}T${blockData.startTime}:00`);
            const endDateTime = new Date(`${blockData.date}T${blockData.endTime}:00`);

            await fetch('/api/calendar/google/events', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventId,
                summary: blockData.activityName,
                description: `DRIP: ${blockData.dripQuadrant} | Energy: ${blockData.energyRating}`,
                start: startDateTime.toISOString(),
                end: endDateTime.toISOString(),
              }),
            });
            // Refresh Google events to reflect changes
            handleSyncGoogle();
          } catch (error) {
            console.error('Error updating Google Calendar event:', error);
          }
        }

        // Also update local storage for backwards compatibility
        setLocalTimeBlocks(blocks =>
          blocks.map(b =>
            b.id === editingBlock.id
              ? { ...b, ...blockData }
              : b
          )
        );
      }
    } else {
      // Create new block - first create in Google Calendar if connected
      let externalEventId: string | undefined;

      if (isGoogleConnected) {
        try {
          const startDateTime = new Date(`${blockData.date}T${blockData.startTime}:00`);
          const endDateTime = new Date(`${blockData.date}T${blockData.endTime}:00`);

          const response = await fetch('/api/calendar/google/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              summary: blockData.activityName,
              description: `DRIP: ${blockData.dripQuadrant} | Energy: ${blockData.energyRating}`,
              start: startDateTime.toISOString(),
              end: endDateTime.toISOString(),
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // Store the actual Google event ID (without gcal_ prefix) for database storage
            // The API returns googleEventId which is the raw Google ID
            externalEventId = data.event?.googleEventId || data.event?.id?.replace('gcal_', '') || undefined;
          }
        } catch (error) {
          console.error('Error creating Google Calendar event:', error);
        }
      }

      // Create new block in database with external event ID if created
      await createTimeBlock({
        date: blockData.date,
        startTime: blockData.startTime,
        endTime: blockData.endTime,
        activityName: blockData.activityName,
        dripQuadrant: blockData.dripQuadrant,
        energyRating: blockData.energyRating,
        source: externalEventId ? 'calendar_sync' : 'manual',
        externalEventId,
        // Recurring event fields
        isRecurring: blockData.isRecurring,
        recurrenceRule: blockData.recurrenceRule,
        recurrenceEndDate: blockData.recurrenceEndDate,
      });

      // If a Google Calendar event was created, save its categorization to patterns
      // This prevents the event from appearing as "uncategorized" in the categorize dialog
      // Use gcal_ prefixed ID for categorization storage to match how events appear from Google API
      if (externalEventId) {
        saveCategorization(
          `gcal_${externalEventId}`,
          blockData.activityName,
          blockData.dripQuadrant,
          blockData.energyRating
        );
      }

      // Refresh Google events to show the new event
      if (externalEventId && isGoogleConnected) {
        handleSyncGoogle();
      }
    }
    setEditingBlock(undefined);
    setInitialDate(undefined);
    setInitialTime(undefined);
  };

  // Import categorized Google Calendar events to database
  const handleImportCategorized = useCallback(async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      // Get all categorized Google events that aren't already imported
      const importedExternalIds = new Set(
        timeBlocks.filter(b => b.externalEventId).map(b => b.externalEventId)
      );

      const eventsToImport = googleEvents
        .filter(event => {
          // Skip if already imported
          if (importedExternalIds.has(event.id) || importedExternalIds.has(`gcal_${event.id}`)) {
            return false;
          }
          // Only import categorized events
          return getCategorization(event.id) !== null;
        })
        .map(event => {
          const categorization = getCategorization(event.id)!;
          const startDateTime = event.start?.dateTime || event.startTime;
          const endDateTime = event.end?.dateTime || event.endTime;

          const startDate = new Date(startDateTime!);
          const endDate = new Date(endDateTime!);

          return {
            date: format(startDate, 'yyyy-MM-dd'),
            startTime: format(startDate, 'HH:mm'),
            endTime: format(endDate, 'HH:mm'),
            activityName: event.summary || 'Untitled Event',
            dripQuadrant: categorization.dripQuadrant,
            energyRating: categorization.energyRating,
            source: 'calendar_sync',
            externalEventId: event.id,
          };
        });

      if (eventsToImport.length === 0) {
        setImportResult({ imported: 0, skipped: 0 });
        return;
      }

      const result = await importTimeBlocks(eventsToImport);
      setImportResult(result);

      // Refresh data after import
      await fetchTimeBlocks();
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({ imported: 0, skipped: 0 });
    } finally {
      setIsImporting(false);
    }
  }, [googleEvents, timeBlocks, getCategorization, importTimeBlocks, fetchTimeBlocks]);

  // Push a time block to Google Calendar
  const handlePushToCalendar = useCallback(async (block: TimeBlock) => {
    if (!isGoogleConnected) return;

    setPushingToCalendar(true);

    try {
      const startDateTime = new Date(`${block.date}T${block.startTime}:00`);
      const endDateTime = new Date(`${block.date}T${block.endTime}:00`);

      const response = await fetch('/api/calendar/google/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: block.activityName,
          description: `DRIP: ${block.dripQuadrant} | Energy: ${block.energyRating}`,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create calendar event');
      }

      setShowPushDialog(false);
      setBlockToPush(null);

      // Refresh Google events
      handleSyncGoogle();
    } catch (error) {
      console.error('Push to calendar error:', error);
    } finally {
      setPushingToCalendar(false);
    }
  }, [isGoogleConnected, handleSyncGoogle]);

  // Count categorized events ready for import
  const categorizedNotImportedCount = useMemo(() => {
    const importedExternalIds = new Set(
      timeBlocks.filter(b => b.externalEventId).map(b => b.externalEventId)
    );

    return googleEvents.filter(event => {
      if (importedExternalIds.has(event.id) || importedExternalIds.has(`gcal_${event.id}`)) {
        return false;
      }
      return getCategorization(event.id) !== null;
    }).length;
  }, [googleEvents, timeBlocks, getCategorization]);

  // Handle clicking on the calendar to add a block (receives Date object from WeeklyCalendarView)
  // Supports optional endTime from drag-to-select
  const handleAddBlock = (date: Date, startTime: string, endTime?: string) => {
    setInitialDate(format(date, 'yyyy-MM-dd'));
    setInitialTime(startTime);
    setInitialEndTime(endTime);
    setEditingBlock(undefined);
    setIsFormOpen(true);
  };

  // Handle clicking on an existing block (receives block object from WeeklyCalendarView)
  const handleBlockClick = (block: CalendarTimeBlock) => {
    // First check if it's a database/local time block by ID
    let fullBlock = timeBlocks.find(b => b.id === block.id);

    // If not found by ID, check if it's a Google Calendar event that's already imported (by externalEventId)
    if (!fullBlock) {
      fullBlock = timeBlocks.find(b => b.externalEventId === block.id);
    }

    if (fullBlock) {
      setEditingBlock(fullBlock);
      setIsFormOpen(true);
      return;
    }

    // Check if it's a Google Calendar event that hasn't been imported yet
    const googleEvent = googleEvents.find(e => e.id === block.id);
    if (googleEvent) {
      const categorization = getCategorization(googleEvent.id);
      const startDateTime = googleEvent.start?.dateTime || googleEvent.startTime;
      const endDateTime = googleEvent.end?.dateTime || googleEvent.endTime;

      // Create a pseudo-block for editing Google Calendar events
      const pseudoBlock: TimeBlock = {
        id: googleEvent.id,
        date: startDateTime ? format(new Date(startDateTime), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        startTime: startDateTime ? format(new Date(startDateTime), 'HH:mm') : '09:00',
        endTime: endDateTime ? format(new Date(endDateTime), 'HH:mm') : '09:30',
        activityName: googleEvent.summary || 'Untitled Event',
        dripQuadrant: categorization?.dripQuadrant || 'production',
        energyRating: categorization?.energyRating || 'yellow',
        source: 'google_calendar',
        externalEventId: googleEvent.id,
        createdAt: new Date().toISOString(),
      };
      setEditingBlock(pseudoBlock);
      setIsFormOpen(true);
    }
  };

  // Open form for new block
  const handleLogTimeBlock = () => {
    setEditingBlock(undefined);
    setInitialDate(undefined);
    setInitialTime(undefined);
    setInitialEndTime(undefined);
    setIsFormOpen(true);
  };

  // Handle applying pattern suggestion to all matching blocks
  const handleApplyPattern = async () => {
    if (!patternSuggestion) return;

    const updates: { dripQuadrant?: DripQuadrant; energyRating?: EnergyRating } = {};
    if (patternSuggestion.suggestedDrip) {
      updates.dripQuadrant = patternSuggestion.suggestedDrip;
    }
    if (patternSuggestion.suggestedEnergy) {
      updates.energyRating = patternSuggestion.suggestedEnergy;
    }

    try {
      const response = await fetch('/api/time-blocks/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockIds: patternSuggestion.matchingBlockIds,
          updates,
        }),
      });

      if (response.ok) {
        // Dismiss the pattern after successful apply
        dismissPattern(patternSuggestion.normalizedName);
        // Refresh time blocks to show updated data
        await fetchTimeBlocks();
      }
    } catch (error) {
      console.error('Failed to apply pattern:', error);
    }
  };

  // Handle dismissing pattern suggestion
  const handleDismissPattern = () => {
    if (patternSuggestion) {
      dismissPattern(patternSuggestion.normalizedName);
    }
  };

  // Handle clearing synced Google Calendar data, categorizations, and all time blocks
  const handleClearSyncedData = useCallback(async () => {
    clearGoogleCache();
    clearCategorizations();
    setLocalTimeBlocks([]); // Clear localStorage blocks
    await clearAllTimeBlocks(); // Clear database blocks
  }, [clearGoogleCache, clearCategorizations, setLocalTimeBlocks, clearAllTimeBlocks]);

  // Handle deleting a time block (and optionally from Google Calendar)
  const handleDeleteBlock = useCallback(async (block: TimeBlock) => {
    // If it's a Google Calendar event, delete from Google Calendar first
    if (block.externalEventId && isGoogleConnected) {
      try {
        const eventId = block.externalEventId.replace('gcal_', '');
        const response = await fetch(`/api/calendar/google/events?eventId=${eventId}`, {
          method: 'DELETE',
        });

        if (!response.ok && response.status !== 404) {
          console.error('Failed to delete from Google Calendar');
        }
      } catch (error) {
        console.error('Error deleting from Google Calendar:', error);
      }
    }

    // Only delete from database if the block exists there (check by UUID format or actual existence)
    const existsInDb = dbTimeBlocks.some(b => b.id === block.id);
    if (existsInDb) {
      await deleteTimeBlock(block.id);
    }

    // Also remove from local storage
    setLocalTimeBlocks(blocks => blocks.filter(b => b.id !== block.id));

    // Refresh Google events to update the view
    if (block.externalEventId && isGoogleConnected) {
      handleSyncGoogle();
    }
  }, [deleteTimeBlock, setLocalTimeBlocks, isGoogleConnected, handleSyncGoogle, dbTimeBlocks]);

  // Handle moving/resizing a time block (drag-drop or resize)
  const handleBlockMove = useCallback(async (
    blockId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<boolean> => {
    try {
      // Find the block - first check database blocks
      let block = timeBlocks.find(b => b.id === blockId);

      // If not found by ID, check if it's a Google Calendar event by externalEventId
      if (!block) {
        block = timeBlocks.find(b => b.externalEventId === blockId);
      }

      // Also check Google events directly for non-imported events
      if (!block) {
        const googleEvent = googleEvents.find(e => e.id === blockId);
        if (googleEvent) {
          // This is a Google event that hasn't been imported yet - create it in DB first
          const categorization = getCategorization(googleEvent.id);

          await createTimeBlock({
            date: newDate,
            startTime: newStartTime,
            endTime: newEndTime,
            activityName: googleEvent.summary || 'Untitled Event',
            dripQuadrant: categorization?.dripQuadrant || 'production',
            energyRating: categorization?.energyRating || 'yellow',
            source: 'calendar_sync',
            externalEventId: googleEvent.id,
          });

          // Update Google Calendar
          if (isGoogleConnected) {
            const eventId = googleEvent.id.replace('gcal_', '');
            const normalizedStart = normalizeTimeFormat(newStartTime);
            const normalizedEnd = normalizeTimeFormat(newEndTime);
            const startDateTime = new Date(`${newDate}T${normalizedStart}:00`);
            const endDateTime = new Date(`${newDate}T${normalizedEnd}:00`);

            await fetch('/api/calendar/google/events', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventId,
                start: startDateTime.toISOString(),
                end: endDateTime.toISOString(),
              }),
            });
            handleSyncGoogle();
          }

          await fetchTimeBlocks();
          return true;
        }
        return false;
      }

      // Check if block exists in database
      const existsInDb = dbTimeBlocks.some(b => b.id === block!.id || b.externalEventId === blockId);

      if (existsInDb) {
        // Update in database
        const dbBlock = dbTimeBlocks.find(b => b.id === block!.id || b.externalEventId === blockId);
        if (dbBlock) {
          await updateTimeBlock(dbBlock.id, {
            date: newDate,
            startTime: newStartTime,
            endTime: newEndTime,
          });
        }
      } else {
        // Update in local storage for backwards compatibility
        setLocalTimeBlocks(blocks =>
          blocks.map(b =>
            b.id === blockId
              ? { ...b, date: newDate, startTime: newStartTime, endTime: newEndTime }
              : b
          )
        );
      }

      // If this is a Google Calendar event, sync the change
      // Check if the block has an external event ID or if blockId starts with gcal_
      const externalEventId = block.externalEventId;
      const isGoogleEvent = externalEventId || blockId.startsWith('gcal_');
      if (isGoogleEvent && isGoogleConnected) {
        // Extract the Google event ID - remove gcal_ prefix if present
        const eventId = (externalEventId || blockId).replace('gcal_', '');
        const normalizedStart = normalizeTimeFormat(newStartTime);
        const normalizedEnd = normalizeTimeFormat(newEndTime);
        const startDateTime = new Date(`${newDate}T${normalizedStart}:00`);
        const endDateTime = new Date(`${newDate}T${normalizedEnd}:00`);

        const response = await fetch('/api/calendar/google/events', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
          }),
        });

        if (!response.ok) {
          console.error('Failed to update Google Calendar event');
          return false;
        }

        // Refresh Google events to reflect changes
        handleSyncGoogle();
      }

      return true;
    } catch (error) {
      console.error('Error moving block:', error);
      return false;
    }
  }, [timeBlocks, googleEvents, dbTimeBlocks, isGoogleConnected, getCategorization, createTimeBlock, updateTimeBlock, setLocalTimeBlocks, fetchTimeBlocks, handleSyncGoogle]);

  // Check if we have data (for showing different states) - includes all data sources
  const hasData = allTimeData.length > 0;
  const totalHours = stats.totalMinutes > 0 ? stats.totalMinutes : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time & Energy Audit"
        description="Track how you spend your time and energy across DRIP quadrants"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Desktop actions - hidden on mobile where we use floating buttons */}
            {isGoogleConnected && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={isLoadingGoogle}
                      size="sm"
                      className="hidden sm:flex"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingGoogle ? 'animate-spin' : ''}`} />
                      <span className="hidden md:inline">Sync</span> {getTimeframeLabel(syncTimeframe)}
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSyncGoogle('1week')}>
                      Sync 1 Week
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSyncGoogle('2weeks')}>
                      Sync 2 Weeks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSyncGoogle('1month')}>
                      Sync 1 Month
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Mobile: Compact sync button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="sm:hidden"
                  disabled={isLoadingGoogle}
                  onClick={() => handleSyncGoogle()}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingGoogle ? 'animate-spin' : ''}`} />
                </Button>
                {/* Always show Categorize button */}
                <Button
                  variant="secondary"
                  onClick={() => setShowCategorizationDialog(true)}
                  size="sm"
                  className="hidden sm:flex"
                >
                  <Badge variant="destructive" className="mr-2">
                    {uncategorizedCount}
                  </Badge>
                  <span className="hidden md:inline">Categorize</span> Events
                </Button>
                {categorizedNotImportedCount > 0 && (
                  <Button
                    variant="default"
                    onClick={handleImportCategorized}
                    disabled={isImporting}
                    size="sm"
                    className="hidden md:flex"
                  >
                    <Upload className={`h-4 w-4 mr-2 ${isImporting ? 'animate-pulse' : ''}`} />
                    Import {categorizedNotImportedCount}
                  </Button>
                )}
                {(googleEvents.length > 0 || timeBlocks.length > 0) && (
                  <Button
                    variant="outline"
                    onClick={handleClearSyncedData}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </>
            )}
            <Button onClick={handleLogTimeBlock} size="sm" className="hidden sm:flex">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Log Time Block</span>
              <span className="md:hidden">Add</span>
            </Button>
          </div>
        }
      />

      {/* Time Block Form Modal */}
      <TimeBlockForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveBlock}
        onDelete={handleDeleteBlock}
        initialDate={initialDate}
        initialTime={initialTime}
        initialEndTime={initialEndTime}
        editBlock={editingBlock}
      />

      {/* Google Calendar Categorization Dialog - Full screen on mobile */}
      <Dialog open={showCategorizationDialog} onOpenChange={(open) => {
        setShowCategorizationDialog(open);
        // If user is closing the dialog (not opening it), mark as dismissed
        if (!open) {
          setCategorizationDismissed(true);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto sm:max-h-[85vh] h-[100dvh] sm:h-auto w-full sm:w-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg">Categorize Events</DialogTitle>
            <DialogDescription className="text-sm">
              Tap to set DRIP quadrant and energy level for each event
            </DialogDescription>
          </DialogHeader>
          <BulkCategorizationView
            events={googleEvents}
            onComplete={() => setShowCategorizationDialog(false)}
            onCategorize={refreshFromStorage}
          />
        </DialogContent>
      </Dialog>

      {/* Summary Stats */}
      <TimeSummaryStats
        totalMinutes={stats.totalMinutes}
        productionPercent={stats.productionPercent}
        delegationCandidates={stats.delegationCandidates}
        energyBalance={stats.energyBalance}
      />

      {/* Edit Pattern Suggestion Banner */}
      {patternSuggestion && (
        <EditSuggestionBanner
          pattern={patternSuggestion}
          onApply={handleApplyPattern}
          onDismiss={handleDismissPattern}
        />
      )}

      {/* Main Content - Top Level Tabs */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'calendar' | 'insights')} className="space-y-4">
        <TabsList className="w-fit">
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <div className={`grid gap-3 ${sidebarCollapsed ? '' : 'lg:grid-cols-5 xl:grid-cols-6'}`}>
            {/* Calendar Views - Takes more columns when sidebar visible */}
            <div className={sidebarCollapsed ? '' : 'lg:col-span-4 xl:col-span-5'}>
              <Tabs defaultValue="weekly" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weekly" className="gap-2">
                <Calendar className="h-4 w-4" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="biweekly" className="gap-2" disabled={!hasProAccess}>
                <CalendarDays className="h-4 w-4" />
                Bi-weekly
                {!hasProAccess && <Lock className="h-3 w-3" />}
              </TabsTrigger>
              <TabsTrigger value="monthly" className="gap-2" disabled={!hasEliteAccess}>
                <CalendarRange className="h-4 w-4" />
                Monthly
                {!hasEliteAccess && <Lock className="h-3 w-3" />}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="weekly">
              {/* Unified Calendar with DRIP/Energy toggle */}
              <div className="relative">
                <WeeklyCalendarView
                  timeBlocks={calendarTimeBlocks}
                  onAddBlock={handleAddBlock}
                  onBlockClick={handleBlockClick}
                  onBlockMove={handleBlockMove}
                  onColorModeChange={setCalendarColorMode}
                  onWeekChange={handleDateRangeChange}
                />
                {/* Sidebar toggle button - fixed position */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-3 right-24 z-20 hidden lg:flex"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
                >
                  {sidebarCollapsed ? <PanelRight className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="biweekly">
              {hasProAccess ? (
                <BiweeklyCalendarView timeBlocks={timeBlocks} onDateRangeChange={handleDateRangeChange} />
              ) : (
                <Card className="py-12">
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Bi-weekly View</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Compare two weeks side-by-side to identify patterns and trends in your time usage.
                    </p>
                    <Button asChild>
                      <Link href={ROUTES.settingsSubscription}>
                        Upgrade to Pro
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="monthly">
              {hasEliteAccess ? (
                <MonthlyCalendarView timeBlocks={timeBlocks} onDateRangeChange={handleDateRangeChange} />
              ) : (
                <Card className="py-12">
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Monthly View</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Get a bird&apos;s eye view of your entire month with detailed DRIP breakdowns for each day.
                    </p>
                    <Button asChild>
                      <Link href={ROUTES.settingsSubscription}>
                        Upgrade to Elite
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Pie Charts - Collapsible sidebar */}
        {!sidebarCollapsed && (
          <div className="space-y-3 hidden lg:block pt-[52px]">
            {/* Show active chart first based on calendar color mode */}
            {calendarColorMode === 'drip' ? (
              <>
                {/* DRIP Distribution - Primary when in DRIP mode */}
                <Card className="p-0 ring-2 ring-primary/20">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm flex items-center gap-2">
                      DRIP
                      <Badge variant="secondary" className="text-[10px]">Active</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {hasData ? (
                      <>
                        <DripPieChart data={dripData} size="sm" showLegend={false} />
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-green-500" />
                              Production
                            </span>
                            <span className="font-medium text-green-600">
                              {totalHours > 0 ? Math.round((dripData.production / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-purple-500" />
                              Investment
                            </span>
                            <span className="font-medium text-purple-600">
                              {totalHours > 0 ? Math.round((dripData.investment / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-amber-500" />
                              Replacement
                            </span>
                            <span className="font-medium text-amber-600">
                              {totalHours > 0 ? Math.round((dripData.replacement / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-red-500" />
                              Delegation
                            </span>
                            <span className="font-medium text-red-600">
                              {totalHours > 0 ? Math.round((dripData.delegation / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-blue-500" />
                              N/A
                            </span>
                            <span className="font-medium text-blue-600">
                              {totalHours > 0 ? Math.round((dripData.na / totalHours) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-xs">
                        <p>No data yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Energy Distribution - Secondary */}
                <Card className="p-0 opacity-70">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm">Energy</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {hasData ? (
                      <>
                        <EnergyPieChart data={energyData} size="sm" showLegend={false} />
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-green-500" />
                              Energizing
                            </span>
                            <span className="font-medium text-green-600">
                              {totalHours > 0 ? Math.round((energyData.green / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-yellow-500" />
                              Neutral
                            </span>
                            <span className="font-medium text-yellow-600">
                              {totalHours > 0 ? Math.round((energyData.yellow / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-red-500" />
                              Draining
                            </span>
                            <span className="font-medium text-red-600">
                              {totalHours > 0 ? Math.round((energyData.red / totalHours) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-xs">
                        <p>No data yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Energy Distribution - Primary when in Energy mode */}
                <Card className="p-0 ring-2 ring-primary/20">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm flex items-center gap-2">
                      Energy
                      <Badge variant="secondary" className="text-[10px]">Active</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {hasData ? (
                      <>
                        <EnergyPieChart data={energyData} size="sm" showLegend={false} />
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-green-500" />
                              Energizing
                            </span>
                            <span className="font-medium text-green-600">
                              {totalHours > 0 ? Math.round((energyData.green / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-yellow-500" />
                              Neutral
                            </span>
                            <span className="font-medium text-yellow-600">
                              {totalHours > 0 ? Math.round((energyData.yellow / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-red-500" />
                              Draining
                            </span>
                            <span className="font-medium text-red-600">
                              {totalHours > 0 ? Math.round((energyData.red / totalHours) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-xs">
                        <p>No data yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* DRIP Distribution - Secondary */}
                <Card className="p-0 opacity-70">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm">DRIP</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {hasData ? (
                      <>
                        <DripPieChart data={dripData} size="sm" showLegend={false} />
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-green-500" />
                              Production
                            </span>
                            <span className="font-medium text-green-600">
                              {totalHours > 0 ? Math.round((dripData.production / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-purple-500" />
                              Investment
                            </span>
                            <span className="font-medium text-purple-600">
                              {totalHours > 0 ? Math.round((dripData.investment / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-amber-500" />
                              Replacement
                            </span>
                            <span className="font-medium text-amber-600">
                              {totalHours > 0 ? Math.round((dripData.replacement / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-red-500" />
                              Delegation
                            </span>
                            <span className="font-medium text-red-600">
                              {totalHours > 0 ? Math.round((dripData.delegation / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-blue-500" />
                              N/A
                            </span>
                            <span className="font-medium text-blue-600">
                              {totalHours > 0 ? Math.round((dripData.na / totalHours) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-xs">
                        <p>No data yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Quick Actions - Compact */}
            <Card className="p-0">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-1.5">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8" asChild>
                  <Link href={ROUTES.drip}>
                    View DRIP Matrix
                  </Link>
                </Button>
                {isGoogleConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs h-8"
                    onClick={() => {
                      const recentBlock = timeBlocks[timeBlocks.length - 1];
                      if (recentBlock && !recentBlock.externalEventId) {
                        setBlockToPush(recentBlock);
                        setShowPushDialog(true);
                      }
                    }}
                    disabled={timeBlocks.length === 0}
                  >
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    Push to Calendar
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Import Result Notification */}
            {importResult && (
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 p-0">
                <CardContent className="p-2">
                  <p className="text-xs text-green-800 dark:text-green-200">
                    Imported {importResult.imported}
                    {importResult.skipped > 0 && ` (${importResult.skipped} skipped)`}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <InsightsView
            timeBlocks={timeBlocks.map(block => ({
              id: block.id,
              date: block.date,
              startTime: block.startTime,
              endTime: block.endTime,
              activityName: block.activityName,
              dripQuadrant: block.dripQuadrant,
              energyRating: block.energyRating,
              tagIds: 'tagIds' in block ? (block.tagIds as string[]) : undefined,
              durationMinutes: calculateDuration(block.startTime, block.endTime),
            }))}
            tags={tags}
          />
        </TabsContent>
      </Tabs>

      {/* Mobile Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 md:hidden z-50">
        {/* Categorize Events Button - Always show if Google connected */}
        {isGoogleConnected && (
          <Button
            size="lg"
            variant={uncategorizedCount > 0 ? "default" : "secondary"}
            className="rounded-full h-14 w-14 shadow-lg"
            onClick={() => setShowCategorizationDialog(true)}
          >
            <div className="relative">
              <ListChecks className="h-6 w-6" />
              {uncategorizedCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {uncategorizedCount > 9 ? '9+' : uncategorizedCount}
                </span>
              )}
            </div>
          </Button>
        )}
        {/* Add Time Block Button */}
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
          onClick={handleLogTimeBlock}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Push to Google Calendar Dialog */}
      <Dialog open={showPushDialog} onOpenChange={setShowPushDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Push to Google Calendar</DialogTitle>
            <DialogDescription>
              Create this time block as an event in your Google Calendar.
            </DialogDescription>
          </DialogHeader>
          {blockToPush && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-medium">{blockToPush.activityName}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {blockToPush.date} &bull; {blockToPush.startTime} - {blockToPush.endTime}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="capitalize">
                    {blockToPush.dripQuadrant}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      blockToPush.energyRating === 'green'
                        ? 'text-green-600 border-green-300'
                        : blockToPush.energyRating === 'red'
                        ? 'text-red-600 border-red-300'
                        : 'text-yellow-600 border-yellow-300'
                    }
                  >
                    {blockToPush.energyRating}
                  </Badge>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPushDialog(false);
                    setBlockToPush(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handlePushToCalendar(blockToPush)}
                  disabled={pushingToCalendar}
                >
                  {pushingToCalendar ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Create Event
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
