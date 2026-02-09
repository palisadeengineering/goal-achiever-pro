'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, CalendarDays, CalendarRange, Lock, RefreshCw, ChevronDown, Upload, ArrowUpRight, BarChart3, ListChecks, Trash2, ChevronRight, PanelRightClose, PanelRight, Settings2, EyeOff, Eye, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { WeeklyCalendarView, IgnoreableBlock, TagInfo } from '@/components/features/time-audit/weekly-calendar-view';
import { TagManager } from '@/components/features/time-audit/tag-manager';
import { BulkCategorizationView } from '@/components/features/time-audit/bulk-categorization-view';
import { useGoogleCalendar } from '@/lib/hooks/use-google-calendar';
import { useEventPatterns } from '@/lib/hooks/use-event-patterns';
import { useTimeBlocks, TimeBlock as DbTimeBlock } from '@/lib/hooks/use-time-blocks';
import { startOfWeek, endOfWeek, addDays, addWeeks, addMonths } from 'date-fns';
import { BiweeklyCalendarView } from '@/components/features/time-audit/biweekly-calendar-view';
import { MonthlyCalendarView } from '@/components/features/time-audit/monthly-calendar-view';
import { ValuePieChart } from '@/components/features/time-audit/drip-pie-chart';
import { EnergyPieChart } from '@/components/features/time-audit/energy-pie-chart';
import { TimeSummaryStats } from '@/components/features/time-audit/time-summary-stats';
import { TimeBlockForm, TimeBlock } from '@/components/features/time-audit/time-block-form';
import { InsightsView } from '@/components/features/time-audit/insights-view';
import { ChartsView } from '@/components/features/time-audit/charts-view';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { useTags } from '@/lib/hooks/use-tags';
import { useEditPatterns } from '@/lib/hooks/use-edit-patterns';
import { EditSuggestionBanner } from '@/components/features/time-audit/edit-suggestion-banner';
import { EventList, EventListItem } from '@/components/features/time-audit/event-list';
import { BulkDeleteDialog, CleanupSuggestions } from '@/components/features/time-audit/bulk-delete-dialog';
import { ROUTES } from '@/constants/routes';
import { expandRecurringEvents } from '@/lib/utils/recurrence';
import type { ValueQuadrant, EnergyRating } from '@/types/database';
import { ShareButton } from '@/components/features/sharing';

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
  valueQuadrant: ValueQuadrant;
  energyRating: EnergyRating;
  externalEventId?: string;
  source?: string;
  createdAt?: string;
  // Recurring event properties
  isRecurring?: boolean;
  recurrenceRule?: string;
  isRecurrenceInstance?: boolean;
  parentBlockId?: string;
  // Tags
  tagIds?: string[];
  tags?: { id: string; name: string; color: string }[];
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
  // Handle ?reset=1 query param: clear all categorizations and reload
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('reset') === '1') {
      // Clear localStorage keys
      localStorage.removeItem('event-categorizations');
      localStorage.removeItem('ignored-events');
      localStorage.removeItem('google-calendar-patterns');

      // Delete all event categorizations from DB
      fetch('/api/event-categorizations', { method: 'DELETE' }).catch(() => {
        // Ignore errors - we still want to clear local state and reload
      });

      // Remove ?reset=1 from the URL so it doesn't re-trigger
      window.history.replaceState({}, '', window.location.pathname);

      // Reload the page to pick up the cleared state
      window.location.reload();
    }
  }, [searchParams]);

  // In real app, check user subscription tier from database
  const userTier: SubscriptionTier = 'elite'; // Temporarily set to elite for testing
  const hasProAccess = checkProAccess(userTier);
  const hasEliteAccess = checkEliteAccess(userTier);

  // Get current week date range for initial fetch
  // Use weekStartsOn: 0 (Sunday) to match WeeklyCalendarView's default
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

  // Google Calendar integration - needs to be before useTimeBlocks for 2-way sync
  const {
    events: googleEvents,
    isLoading: isLoadingGoogle,
    isConnected: isGoogleConnected,
    isCheckingConnection,
    fetchEvents: fetchGoogleEvents,
    clearCache: clearGoogleCache,
    removeEvent: removeGoogleEvent,
    debugInfo: googleDebugInfo,
  } = useGoogleCalendar();

  // Database time blocks - fetch a wide range to support navigation
  // 3 months back and 6 months forward to cover most navigation scenarios
  const {
    timeBlocks: dbTimeBlocks,
    isLoading: isLoadingDb,
    isSyncingFromGoogle,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    clearAllTimeBlocks,
    clearGoogleSyncedBlocks,
    importTimeBlocks,
    fetchTimeBlocks,
    syncFromGoogle,
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
      valueQuadrant: b.valueQuadrant as ValueQuadrant,
      energyRating: b.energyRating as EnergyRating,
      source: b.source,
      externalEventId: b.externalEventId,
      createdAt: b.createdAt || new Date().toISOString(),
      // Include recurring event fields
      isRecurring: b.isRecurring,
      recurrenceRule: b.recurrenceRule,
      recurrenceEndDate: b.recurrenceEndDate,
      parentBlockId: b.parentBlockId,
      // Include tagIds
      tagIds: b.tagIds,
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

  const { getUncategorizedEventIds, getCategorization, saveCategorization, categorizations, refreshFromStorage, clearCategorizations, ignoreEvent, removeCategorization, isIgnored, unignoreEvent, ignoredEvents } = useEventPatterns();

  // Refresh key to trigger InsightsView refetch when categorizations change
  const [insightsRefreshKey, setInsightsRefreshKey] = useState(0);
  const handleCategorizationChange = useCallback(() => {
    refreshFromStorage();
    setInsightsRefreshKey(prev => prev + 1);
  }, [refreshFromStorage]);

  const { tags, fetchTags, createTag, updateTag, deleteTag } = useTags();

  // Tag manager dialog state
  const [showTagManager, setShowTagManager] = useState(false);

  // Edit pattern detection
  const { trackEdit, getPatternSuggestion, dismissPattern } = useEditPatterns();

  const [showCategorizationDialog, setShowCategorizationDialog] = useState(false);
  const [categorizationDismissed, setCategorizationDismissed] = useState(false); // Track if user manually closed
  const [mainTab, setMainTab] = useState<'calendar' | 'insights' | 'manage' | 'charts'>('calendar');
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  // AI cleanup suggestions state
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<CleanupSuggestions | null>(null);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);

  // Debug panel state
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [syncTimeframe, setSyncTimeframe] = useLocalStorage<'1week' | '2weeks' | '1month'>('google-sync-timeframe', '1week');

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage<boolean>('time-audit-sidebar-collapsed', false);
  const [calendarColorMode, setCalendarColorMode] = useState<'value' | 'energy'>('value');

  // Track currently viewed date range from calendar views
  // Use weekStartsOn: 0 (Sunday) to match WeeklyCalendarView's default
  const [viewedDateRange, setViewedDateRange] = useState<{ start: Date; end: Date }>(() => ({
    start: startOfWeek(new Date(), { weekStartsOn: 0 }),
    end: endOfWeek(new Date(), { weekStartsOn: 0 }),
  }));

  // Use a ref to always have the latest viewedDateRange for async operations
  // This prevents stale closures in the debounced fetch
  const viewedDateRangeRef = useRef(viewedDateRange);
  useEffect(() => {
    viewedDateRangeRef.current = viewedDateRange;
  }, [viewedDateRange]);

  // Track what date range we last fetched to avoid duplicate fetches
  const lastFetchedRangeRef = useRef<{ start: string; end: string } | null>(null);

  // Callback for calendar views to report their current date range
  const handleDateRangeChange = useCallback((start: Date, end: Date) => {
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    console.log(`[handleDateRangeChange] Setting viewedDateRange: ${startStr} to ${endStr}`);
    setViewedDateRange({ start, end });
  }, []);

  // Helper function to calculate sync end date based on timeframe
  // This ensures consistent date calculations across manual sync and auto-sync
  // Use weekStartsOn: 0 (Sunday) to match WeeklyCalendarView's default
  const calculateSyncEndDate = useCallback((startDate: Date, timeframe: '1week' | '2weeks' | '1month'): Date => {
    // Always start from the beginning of the week (Sunday)
    const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });

    switch (timeframe) {
      case '2weeks':
        // Sync current week + next week (14 days total)
        return endOfWeek(addWeeks(weekStart, 1), { weekStartsOn: 0 });
      case '1month':
        // Sync from week start for approximately 1 month (4-5 weeks)
        return endOfWeek(addWeeks(weekStart, 4), { weekStartsOn: 0 });
      case '1week':
      default:
        // Sync just the current week
        return endOfWeek(weekStart, { weekStartsOn: 0 });
    }
  }, []);

  // Auto-sync Google Calendar events when navigating to different weeks
  // Uses ref to always get the LATEST viewedDateRange when the timeout fires
  // This prevents stale closure issues during rapid navigation
  useEffect(() => {
    if (!isGoogleConnected) {
      console.log('[Auto-Sync] Not connected, skipping');
      return;
    }

    // Get string representations for comparison
    const currentStartStr = format(viewedDateRange.start, 'yyyy-MM-dd');
    const currentEndStr = format(viewedDateRange.end, 'yyyy-MM-dd');

    // Skip if we already fetched this exact range
    if (lastFetchedRangeRef.current?.start === currentStartStr &&
        lastFetchedRangeRef.current?.end === currentEndStr) {
      console.log(`[Auto-Sync] Already fetched this range, skipping: ${currentStartStr} to ${currentEndStr}`);
      return;
    }

    console.log(`[Auto-Sync] Scheduling fetch for: ${currentStartStr} to ${currentEndStr}`);

    // Debounce: wait 300ms after last navigation before fetching
    const timeoutId = setTimeout(() => {
      // Use the REF to get the LATEST viewedDateRange at execution time
      // This is crucial - it ensures we fetch for the week the user ACTUALLY landed on
      const latestRange = viewedDateRangeRef.current;
      const latestStartStr = format(latestRange.start, 'yyyy-MM-dd');
      const latestEndStr = format(latestRange.end, 'yyyy-MM-dd');

      // Double-check we haven't already fetched this range (might have happened via manual sync)
      if (lastFetchedRangeRef.current?.start === latestStartStr &&
          lastFetchedRangeRef.current?.end === latestEndStr) {
        console.log(`[Auto-Sync] Already fetched (double-check), skipping: ${latestStartStr} to ${latestEndStr}`);
        return;
      }

      console.log(`[Auto-Sync] FETCHING for week: ${latestStartStr} to ${latestEndStr}`);

      // Mark this range as fetched BEFORE the async call to prevent duplicate requests
      lastFetchedRangeRef.current = { start: latestStartStr, end: latestEndStr };

      fetchGoogleEvents(latestRange.start, latestRange.end);
    }, 300);

    // Cleanup: cancel pending fetch if viewedDateRange changes again
    return () => {
      console.log(`[Auto-Sync] Cancelled pending fetch (navigation changed from ${currentStartStr})`);
      clearTimeout(timeoutId);
    };
  }, [viewedDateRange, isGoogleConnected, fetchGoogleEvents]);

  // Fetch Google events when connected - uses the currently viewed date range
  const handleSyncGoogle = useCallback((timeframe?: '1week' | '2weeks' | '1month') => {
    const selectedTimeframe = timeframe || syncTimeframe;
    if (timeframe) {
      setSyncTimeframe(timeframe);
    }

    // Only clear the sessionStorage cache, NOT the in-memory events.
    // fetchGoogleEvents will atomically replace events when new data arrives,
    // so clearing events here would cause a visual flash where all Google events
    // temporarily disappear from the calendar.
    try {
      sessionStorage.removeItem('google-calendar-events');
    } catch {
      // Ignore sessionStorage errors
    }

    // Calculate sync range based on the currently viewed week and selected timeframe
    // Use weekStartsOn: 0 (Sunday) to match WeeklyCalendarView's default
    const syncStart = startOfWeek(viewedDateRange.start, { weekStartsOn: 0 });
    const syncEnd = calculateSyncEndDate(viewedDateRange.start, selectedTimeframe);

    // Log for debugging
    console.log(`[Google Sync] Manual sync ${selectedTimeframe}: ${format(syncStart, 'yyyy-MM-dd')} to ${format(syncEnd, 'yyyy-MM-dd')}`);

    // Update the lastFetchedRangeRef so auto-sync knows we've fetched this range
    lastFetchedRangeRef.current = {
      start: format(syncStart, 'yyyy-MM-dd'),
      end: format(syncEnd, 'yyyy-MM-dd'),
    };

    fetchGoogleEvents(syncStart, syncEnd);
  }, [syncTimeframe, setSyncTimeframe, viewedDateRange.start, fetchGoogleEvents, calculateSyncEndDate]);

  // Sync changes FROM Google Calendar TO local database (reverse sync / two-way sync)
  const [lastSyncFromGoogleResult, setLastSyncFromGoogleResult] = useState<{
    synced: number;
    deleted: number;
    errors: string[];
  } | null>(null);

  const handleSyncFromGoogle = useCallback(async () => {
    console.log('[Time Audit] Starting reverse sync from Google Calendar...');
    setLastSyncFromGoogleResult(null);

    const result = await syncFromGoogle();

    if (result.success) {
      setLastSyncFromGoogleResult({
        synced: result.synced,
        deleted: result.deleted,
        errors: result.errors,
      });

      // Show result in console for debugging
      console.log('[Time Audit] Reverse sync complete:', result);

      if (result.synced > 0 || result.deleted > 0) {
        console.log(`[Time Audit] Updated ${result.synced} blocks, unlinked ${result.deleted} blocks`);
      }
    } else {
      console.error('[Time Audit] Reverse sync failed:', result.errors);
    }

    // Clear result after 5 seconds
    setTimeout(() => setLastSyncFromGoogleResult(null), 5000);

    return result;
  }, [syncFromGoogle]);

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

    // Create a tag lookup map for fast access
    const tagLookup = new Map(tags.map(t => [t.id, { id: t.id, name: t.name, color: t.color }]));

    // Helper to map tagIds to full tag objects
    const mapTagIds = (tagIds?: string[]) => {
      if (!tagIds || tagIds.length === 0) return undefined;
      return tagIds
        .map(id => tagLookup.get(id))
        .filter((t): t is { id: string; name: string; color: string } => t !== undefined);
    };

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
        valueQuadrant: block.valueQuadrant,
        energyRating: block.energyRating,
        externalEventId: block.externalEventId,
        source: block.source,
        createdAt: block.createdAt,
        // Include recurring event properties
        isRecurring: block.isRecurring,
        recurrenceRule: block.recurrenceRule,
        isRecurrenceInstance: 'isRecurrenceInstance' in block ? (block.isRecurrenceInstance as boolean) : undefined,
        parentBlockId: 'parentBlockId' in block ? (block.parentBlockId as string) : undefined,
        // Include tags
        tagIds: block.tagIds,
        tags: mapTagIds(block.tagIds),
      });
    });

    // Merge Google Calendar events (skip if already imported or ignored)
    // Show ALL events, even uncategorized ones (with default 'na' quadrant and 'yellow' energy)
    googleEvents.forEach((event) => {
      // Skip if this event is already imported as a time block
      if (importedGoogleEventIds.has(event.id)) {
        return;
      }

      // Skip if this event is ignored
      if (isIgnored(event.id)) {
        return;
      }

      const categorization = getCategorization(event.id);

      // Use pre-extracted date/time fields from API to avoid timezone conversion issues
      // The API extracts these directly from ISO strings using .slice() which preserves local time
      const dateKey = event.date || '';
      const startTimeStr = event.startTime || '';
      const endTimeStr = event.endTime || startTimeStr;

      if (dateKey && startTimeStr) {
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }

        // Show event with categorization if available, otherwise use defaults
        grouped[dateKey].push({
          id: event.id,
          startTime: startTimeStr,
          endTime: endTimeStr,
          activityName: event.summary,
          // Use categorization if available, otherwise default to 'na' (neutral/uncategorized)
          valueQuadrant: categorization?.valueQuadrant || 'na',
          energyRating: categorization?.energyRating || 'yellow',
          externalEventId: event.id,
          source: 'google_calendar',
          createdAt: new Date().toISOString(),
        });
      }
    });

    return grouped;
  }, [timeBlocks, googleEvents, getCategorization, categorizations, isIgnored, tags]);

  // Get all data sources for stats: derived from calendarTimeBlocks (same data shown on calendar)
  // FILTERED by currently viewed date range, excluding all-day events
  const allTimeData = useMemo(() => {
    const allBlocks: Array<{
      date: string;
      startTime: string;
      endTime: string;
      valueQuadrant: ValueQuadrant;
      energyRating: EnergyRating;
      source: string;
    }> = [];

    const viewStartStr = format(viewedDateRange.start, 'yyyy-MM-dd');
    const viewEndStr = format(viewedDateRange.end, 'yyyy-MM-dd');

    // Use calendarTimeBlocks as the source - this is exactly what's shown on the calendar
    Object.entries(calendarTimeBlocks).forEach(([dateKey, blocks]) => {
      // Only include dates within the viewed range
      if (dateKey >= viewStartStr && dateKey <= viewEndStr) {
        blocks.forEach((block) => {
          // Skip all-day events from stats (they're reminders, not actual time spent)
          const isAllDay = block.startTime === '00:00' && block.endTime === '23:59';
          if (isAllDay) {
            return;
          }

          allBlocks.push({
            date: dateKey,
            startTime: block.startTime,
            endTime: block.endTime,
            valueQuadrant: block.valueQuadrant,
            energyRating: block.energyRating,
            source: block.source || 'manual',
          });
        });
      }
    });

    return allBlocks;
  }, [calendarTimeBlocks, viewedDateRange]);

  // Combined data for InsightsView - includes ALL time blocks + Google Calendar events (unfiltered by date)
  // The InsightsView handles its own date filtering internally
  const insightsTimeBlocks = useMemo(() => {
    const allBlocks: Array<{
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      activityName: string;
      valueQuadrant: ValueQuadrant;
      energyRating: EnergyRating;
      tagIds?: string[];
      durationMinutes: number;
    }> = [];

    // Add time blocks from database and local storage
    timeBlocks.forEach((block) => {
      allBlocks.push({
        id: block.id,
        date: block.date,
        startTime: block.startTime,
        endTime: block.endTime,
        activityName: block.activityName,
        valueQuadrant: block.valueQuadrant,
        energyRating: block.energyRating,
        tagIds: 'tagIds' in block ? (block.tagIds as string[]) : undefined,
        durationMinutes: calculateDuration(block.startTime, block.endTime),
      });
    });

    // Add Google Calendar events that aren't already imported
    const importedExternalIds = new Set(
      timeBlocks.filter(b => b.externalEventId).map(b => b.externalEventId)
    );

    googleEvents.forEach((event) => {
      // Skip if already imported as a time block
      if (importedExternalIds.has(event.id)) {
        return;
      }

      // Skip if event is ignored
      if (isIgnored(event.id)) {
        return;
      }

      // Skip all-day events from insights (they're reminders, not actual time spent)
      const isAllDay = event.isAllDay || (event.startTime === '00:00' && event.endTime === '23:59');
      if (isAllDay) {
        return;
      }

      const categorization = getCategorization(event.id);

      // Use pre-extracted date/time fields from API to avoid timezone conversion issues
      const eventDateStr = event.date || '';
      const startTimeStr = event.startTime || '';
      const endTimeStr = event.endTime || startTimeStr;

      if (eventDateStr && startTimeStr) {
        // Use calculateDuration for consistency with time blocks
        const durationMinutes = calculateDuration(startTimeStr, endTimeStr);

        allBlocks.push({
          id: event.id,
          date: eventDateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
          activityName: event.summary || 'Untitled Event',
          valueQuadrant: categorization?.valueQuadrant || 'na',
          energyRating: categorization?.energyRating || 'yellow',
          durationMinutes,
        });
      }
    });

    return allBlocks;
  }, [timeBlocks, googleEvents, getCategorization, categorizations, isIgnored]);

  // Combined events list for the Manage Events tab
  const manageEventsList = useMemo((): EventListItem[] => {
    const eventMap = new Map<string, EventListItem>();

    // Add time blocks from database
    timeBlocks.forEach((block) => {
      eventMap.set(block.id, {
        id: block.id,
        date: block.date,
        startTime: block.startTime,
        endTime: block.endTime,
        activityName: block.activityName,
        valueQuadrant: block.valueQuadrant,
        energyRating: block.energyRating,
        source: block.source || 'manual',
        externalEventId: block.externalEventId,
      });
    });

    // Add Google Calendar events that aren't already in the time blocks
    const importedExternalIds = new Set(
      timeBlocks.filter(b => b.externalEventId).map(b => b.externalEventId)
    );

    googleEvents.forEach((event) => {
      // Skip if already imported
      if (importedExternalIds.has(event.id)) {
        return;
      }

      const categorization = getCategorization(event.id);

      // Use pre-extracted date/time fields from API to avoid timezone conversion issues
      const eventDateStr = event.date || '';
      const startTimeStr = event.startTime || '';
      const endTimeStr = event.endTime || startTimeStr;

      if (eventDateStr && startTimeStr) {
        eventMap.set(event.id, {
          id: event.id,
          date: eventDateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
          activityName: event.summary || 'Untitled Event',
          valueQuadrant: categorization?.valueQuadrant || 'na',
          energyRating: categorization?.energyRating || 'yellow',
          source: 'google_calendar',
          externalEventId: event.id,
        });
      }
    });

    return Array.from(eventMap.values()).sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [timeBlocks, googleEvents, getCategorization]);

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

      if (block.valueQuadrant === 'production') {
        productionMinutes += duration;
      }
      if (block.valueQuadrant === 'delegation') {
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

  // Calculate Value distribution from ALL time data
  const valueData = useMemo(() => {
    const data = { delegation: 0, replacement: 0, investment: 0, production: 0, na: 0 };
    allTimeData.forEach((block) => {
      const duration = calculateDuration(block.startTime, block.endTime);
      if (duration > 0) {
        data[block.valueQuadrant] += duration;
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
      valueQuadrant: b.valueQuadrant,
      energyRating: b.energyRating,
    }));
    return getPatternSuggestion(blockInfos);
  }, [timeBlocks, getPatternSuggestion]);

  // Handle saving a new or edited time block (saves to database and optionally syncs to Google Calendar)
  const handleSaveBlock = async (blockData: Omit<TimeBlock, 'id' | 'createdAt'>) => {
    if (editingBlock) {
      // Track the edit for pattern detection
      if (editingBlock.valueQuadrant !== blockData.valueQuadrant ||
          editingBlock.energyRating !== blockData.energyRating) {
        trackEdit(
          editingBlock.id,
          editingBlock.activityName,
          editingBlock.valueQuadrant,
          blockData.valueQuadrant,
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
          valueQuadrant: blockData.valueQuadrant,
          energyRating: blockData.energyRating,
          source: 'calendar_sync',
          externalEventId: editingBlock.externalEventId,
          // Tag assignments
          tagIds: blockData.tagIds,
          // Recurring event fields
          isRecurring: blockData.isRecurring,
          recurrenceRule: blockData.recurrenceRule,
          recurrenceEndDate: blockData.recurrenceEndDate,
        });

        // Also save/update the categorization in localStorage for pattern learning
        saveCategorization(
          editingBlock.externalEventId!,
          blockData.activityName,
          blockData.valueQuadrant,
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
                description: `Value: ${blockData.valueQuadrant} | Energy: ${blockData.energyRating}`,
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

        // No need to refetch - createTimeBlock already added the block to local state
      } else {
        // Update existing block in database
        await updateTimeBlock(editingBlock.id, {
          date: blockData.date,
          startTime: blockData.startTime,
          endTime: blockData.endTime,
          activityName: blockData.activityName,
          valueQuadrant: blockData.valueQuadrant,
          energyRating: blockData.energyRating,
          // Tag assignments
          tagIds: blockData.tagIds,
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
                description: `Value: ${blockData.valueQuadrant} | Energy: ${blockData.energyRating}`,
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
              description: `Value: ${blockData.valueQuadrant} | Energy: ${blockData.energyRating}`,
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
        valueQuadrant: blockData.valueQuadrant,
        energyRating: blockData.energyRating,
        source: externalEventId ? 'calendar_sync' : 'manual',
        externalEventId,
        // Tag assignments
        tagIds: blockData.tagIds,
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
          blockData.valueQuadrant,
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
          if (importedExternalIds.has(event.id)) {
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
            valueQuadrant: categorization.valueQuadrant,
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
          description: `Value: ${block.valueQuadrant} | Energy: ${block.energyRating}`,
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
      if (importedExternalIds.has(event.id)) {
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

      // Use pre-extracted date/time fields from API to avoid timezone conversion issues
      const eventDateStr = googleEvent.date || format(new Date(), 'yyyy-MM-dd');
      const startTimeStr = googleEvent.startTime || '09:00';
      const endTimeStr = googleEvent.endTime || '09:30';

      // Create a pseudo-block for editing Google Calendar events
      const pseudoBlock: TimeBlock = {
        id: googleEvent.id,
        date: eventDateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        activityName: googleEvent.summary || 'Untitled Event',
        valueQuadrant: categorization?.valueQuadrant || 'production',
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

    const updates: { valueQuadrant?: ValueQuadrant; energyRating?: EnergyRating } = {};
    if (patternSuggestion.suggestedValue) {
      updates.valueQuadrant = patternSuggestion.suggestedValue;
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
    // Reset lastFetchedRange so next navigation triggers a fresh fetch
    lastFetchedRangeRef.current = null;
  }, [clearGoogleCache, clearCategorizations, setLocalTimeBlocks, clearAllTimeBlocks]);

  // State for reset & re-sync operation
  const [isResettingSync, setIsResettingSync] = useState(false);

  // Handle Reset & Re-sync: clears only Google-synced blocks (keeps manual entries), then re-fetches
  const handleResetAndResync = useCallback(async () => {
    setIsResettingSync(true);
    try {
      // Step 1: Clear Google-synced blocks from database (keeps manual entries)
      const result = await clearGoogleSyncedBlocks();
      console.log(`[Reset & Re-sync] Cleared ${result.deletedCount} Google-synced blocks`);

      // Step 2: Clear Google events cache from localStorage
      clearGoogleCache();

      // Step 3: Clear categorizations (event patterns)
      clearCategorizations();

      // Step 4: Reset lastFetchedRange so we can re-fetch
      lastFetchedRangeRef.current = null;

      // Step 5: Re-fetch from Google Calendar
      const syncStart = startOfWeek(viewedDateRange.start, { weekStartsOn: 0 });
      const syncEnd = calculateSyncEndDate(viewedDateRange.start, syncTimeframe);
      console.log(`[Reset & Re-sync] Fetching fresh events: ${format(syncStart, 'yyyy-MM-dd')} to ${format(syncEnd, 'yyyy-MM-dd')}`);

      await fetchGoogleEvents(syncStart, syncEnd);

      console.log('[Reset & Re-sync] Complete!');
    } catch (error) {
      console.error('[Reset & Re-sync] Error:', error);
    } finally {
      setIsResettingSync(false);
    }
  }, [clearGoogleSyncedBlocks, clearGoogleCache, clearCategorizations, viewedDateRange.start, calculateSyncEndDate, syncTimeframe, fetchGoogleEvents]);

  // State for calendar sync verification
  const [isVerifyingSyncOpen, setIsVerifyingSyncOpen] = useState(false);
  const [verificationResults, setVerificationResults] = useState<Array<{
    eventId: string;
    eventName: string;
    googleDate: string;
    googleStartTime: string;
    googleEndTime: string;
    timeAuditDate: string;
    timeAuditStartTime: string;
    timeAuditEndTime: string;
    isSynced: boolean;
    issues: string[];
  }>>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  // Handle verifying calendar sync
  const handleVerifySync = useCallback(async () => {
    setIsVerifying(true);
    setIsVerifyingSyncOpen(true);
    const results: typeof verificationResults = [];

    try {
      // For each Google Calendar event, compare with what Time Audit shows
      googleEvents.forEach((event) => {
        // Get the pre-extracted values (what Time Audit should show)
        const googleDate = event.date || '';
        const googleStartTime = event.startTime || '';
        const googleEndTime = event.endTime || '';

        // Find matching block in calendarTimeBlocks
        const matchingBlocks = Object.entries(calendarTimeBlocks).flatMap(([date, blocks]) =>
          blocks.filter(b => b.id === event.id || b.externalEventId === event.id)
            .map(b => ({ ...b, date }))
        );

        const matchingBlock = matchingBlocks[0];

        const timeAuditDate = matchingBlock?.date || 'Not found';
        const timeAuditStartTime = matchingBlock?.startTime || 'N/A';
        const timeAuditEndTime = matchingBlock?.endTime || 'N/A';

        const issues: string[] = [];
        if (googleDate !== timeAuditDate) {
          issues.push(`Date mismatch: Google=${googleDate}, TimeAudit=${timeAuditDate}`);
        }
        if (googleStartTime !== timeAuditStartTime) {
          issues.push(`Start time mismatch: Google=${googleStartTime}, TimeAudit=${timeAuditStartTime}`);
        }
        if (googleEndTime !== timeAuditEndTime) {
          issues.push(`End time mismatch: Google=${googleEndTime}, TimeAudit=${timeAuditEndTime}`);
        }

        results.push({
          eventId: event.id,
          eventName: event.summary || 'Untitled Event',
          googleDate,
          googleStartTime,
          googleEndTime,
          timeAuditDate,
          timeAuditStartTime,
          timeAuditEndTime,
          isSynced: issues.length === 0,
          issues,
        });
      });

      setVerificationResults(results);
    } finally {
      setIsVerifying(false);
    }
  }, [googleEvents, calendarTimeBlocks]);

  // Handle deleting a time block (and optionally from Google Calendar)
  const handleDeleteBlock = useCallback(async (block: TimeBlock) => {
    // Prevent categorization popup from showing after delete
    setCategorizationDismissed(true);

    // Immediately remove from Google events state for instant UI update (no flicker)
    if (block.externalEventId) {
      removeGoogleEvent(block.externalEventId);
    }
    // Also try removing by block.id in case it matches
    removeGoogleEvent(block.id);

    // If it's a Google Calendar event, delete from Google Calendar
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

    // Fetch updated time blocks from database
    await fetchTimeBlocks();
  }, [deleteTimeBlock, setLocalTimeBlocks, isGoogleConnected, fetchTimeBlocks, dbTimeBlocks, removeGoogleEvent]);

  // Handle skipping (uncategorizing) a time block - keeps event in Google Calendar but removes from tracking
  const handleSkipBlock = useCallback(async (block: IgnoreableBlock) => {
    // Add to ignored events list (prevents it from appearing in categorization dialog)
    if (block.externalEventId) {
      ignoreEvent(block.externalEventId, block.activityName);
      // Also remove any existing categorization
      removeCategorization(block.externalEventId);
    }

    // Remove from database if it exists there
    const existsInDb = dbTimeBlocks.some(b => b.id === block.id);
    if (existsInDb) {
      await deleteTimeBlock(block.id);
    }

    // Also remove from local storage
    setLocalTimeBlocks(blocks => blocks.filter(b => b.id !== block.id));

    // Refresh the view
    await fetchTimeBlocks();
  }, [ignoreEvent, removeCategorization, deleteTimeBlock, setLocalTimeBlocks, dbTimeBlocks, fetchTimeBlocks]);

  // Handle deleting an event from the Manage Events tab
  const handleEventListDelete = useCallback(async (event: EventListItem) => {
    setIsDeletingEvent(true);
    // Prevent categorization popup from showing after delete
    setCategorizationDismissed(true);

    // Immediately remove from Google events state for instant UI update (no flicker)
    if (event.externalEventId) {
      removeGoogleEvent(event.externalEventId);
    }
    removeGoogleEvent(event.id);

    try {
      // If it's a Google Calendar event, delete from Google Calendar
      if (event.externalEventId && isGoogleConnected) {
        const eventId = event.externalEventId.replace('gcal_', '');
        const response = await fetch(`/api/calendar/google/events?eventId=${eventId}`, {
          method: 'DELETE',
        });

        if (!response.ok && response.status !== 404) {
          console.error('Failed to delete from Google Calendar');
        }
      }

      // Delete from database if it exists there
      const existsInDb = dbTimeBlocks.some(b => b.id === event.id);
      if (existsInDb) {
        await deleteTimeBlock(event.id);
      }

      // Remove from local storage
      setLocalTimeBlocks(blocks => blocks.filter(b => b.id !== event.id));

      // Fetch updated time blocks from database
      await fetchTimeBlocks();
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setIsDeletingEvent(false);
    }
  }, [dbTimeBlocks, deleteTimeBlock, setLocalTimeBlocks, isGoogleConnected, fetchTimeBlocks, removeGoogleEvent]);

  // Fetch AI cleanup suggestions
  const fetchAiCleanupSuggestions = useCallback(async () => {
    setIsLoadingAiSuggestions(true);
    setShowBulkDeleteDialog(true);
    setAiSuggestions(null);

    try {
      const response = await fetch('/api/ai/suggest-event-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: manageEventsList }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI suggestions');
      }

      const data = await response.json();
      setAiSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  }, [manageEventsList]);

  // Handle bulk delete from AI suggestions
  const handleBulkDelete = useCallback(async (eventIds: string[]) => {
    // Prevent categorization popup from showing after bulk delete
    setCategorizationDismissed(true);

    for (const eventId of eventIds) {
      const event = manageEventsList.find(e => e.id === eventId);
      if (event) {
        // Immediately remove from Google events state for instant UI update
        if (event.externalEventId) {
          removeGoogleEvent(event.externalEventId);
        }
        removeGoogleEvent(event.id);

        // If it's a Google Calendar event, delete from Google Calendar
        if (event.externalEventId && isGoogleConnected) {
          const googleEventId = event.externalEventId.replace('gcal_', '');
          try {
            await fetch(`/api/calendar/google/events?eventId=${googleEventId}`, {
              method: 'DELETE',
            });
          } catch (error) {
            console.error('Error deleting from Google Calendar:', error);
          }
        }

        // Delete from database if it exists there
        const existsInDb = dbTimeBlocks.some(b => b.id === event.id);
        if (existsInDb) {
          await deleteTimeBlock(event.id);
        }

        // Remove from local storage
        setLocalTimeBlocks(blocks => blocks.filter(b => b.id !== event.id));
      }
    }

    // Fetch updated time blocks from database
    await fetchTimeBlocks();
  }, [manageEventsList, dbTimeBlocks, deleteTimeBlock, setLocalTimeBlocks, isGoogleConnected, fetchTimeBlocks, removeGoogleEvent]);

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
            valueQuadrant: categorization?.valueQuadrant || 'production',
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

  // Handle toggling a tag on a time block (from right-click context menu)
  const handleToggleTag = useCallback(async (blockId: string, tagId: string, isAdding: boolean) => {
    try {
      // Find the block to get current tagIds
      const block = dbTimeBlocks.find(b => b.id === blockId);
      if (!block) {
        console.error('Block not found for tag toggle:', blockId);
        return;
      }

      const currentTagIds = block.tagIds || [];
      let newTagIds: string[];

      if (isAdding) {
        // Add tag if not already present
        if (!currentTagIds.includes(tagId)) {
          newTagIds = [...currentTagIds, tagId];
        } else {
          return; // Already has this tag
        }
      } else {
        // Remove tag
        newTagIds = currentTagIds.filter(id => id !== tagId);
      }

      // Update the time block with new tagIds
      await updateTimeBlock(blockId, { tagIds: newTagIds });

      // Refetch to update the UI
      await fetchTimeBlocks();
    } catch (error) {
      console.error('Error toggling tag:', error);
    }
  }, [dbTimeBlocks, updateTimeBlock, fetchTimeBlocks]);

  // Handle opening the tag manager dialog
  const handleManageTags = useCallback(() => {
    setShowTagManager(true);
  }, []);

  // Check if we have data (for showing different states) - includes all data sources
  const hasData = allTimeData.length > 0;
  const totalHours = stats.totalMinutes > 0 ? stats.totalMinutes : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time & Energy Audit"
        description="Track how you spend your time and energy across Value quadrants"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <ShareButton tabName="time_audit" />
            {/* Google Calendar connection status */}
            {!isGoogleConnected && !isCheckingConnection && (
              <Link href="/settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Connect Google Calendar</span>
              </Link>
            )}
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSyncFromGoogle}
                      disabled={isSyncingFromGoogle}
                    >
                      <Download className={`h-4 w-4 mr-2 ${isSyncingFromGoogle ? 'animate-pulse' : ''}`} />
                      {isSyncingFromGoogle ? 'Syncing...' : 'Pull from Google'}
                      {lastSyncFromGoogleResult && lastSyncFromGoogleResult.synced > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {lastSyncFromGoogleResult.synced} updated
                        </Badge>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleResetAndResync}
                      disabled={isResettingSync || isLoadingGoogle}
                      className="text-orange-600 dark:text-orange-400"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isResettingSync ? 'animate-spin' : ''}`} />
                      {isResettingSync ? 'Resetting...' : 'Reset & Re-sync'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleVerifySync}
                      disabled={isVerifying || googleEvents.length === 0}
                    >
                      <ListChecks className={`h-4 w-4 mr-2 ${isVerifying ? 'animate-pulse' : ''}`} />
                      {isVerifying ? 'Verifying...' : 'Verify Calendar Sync'}
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
        onSkip={handleSkipBlock}
        initialDate={initialDate}
        initialTime={initialTime}
        initialEndTime={initialEndTime}
        editBlock={editingBlock}
      />

      {/* Google Calendar Categorization Dialog - Full screen on mobile, draggable on desktop */}
      <Dialog open={showCategorizationDialog} onOpenChange={(open) => {
        setShowCategorizationDialog(open);
        // If user is closing the dialog (not opening it), mark as dismissed
        if (!open) {
          setCategorizationDismissed(true);
        }
      }}>
        <DialogContent draggable className="max-w-2xl max-h-[85vh] overflow-y-auto sm:max-h-[85vh] h-[100dvh] sm:h-auto w-full sm:w-auto p-4 sm:p-6">
          <DialogHeader draggable>
            <DialogTitle className="text-lg">Categorize Events</DialogTitle>
            <DialogDescription className="text-sm">
              Drag header to move • Tap to set Value quadrant and energy level
            </DialogDescription>
          </DialogHeader>
          <BulkCategorizationView
            events={googleEvents}
            onComplete={() => setShowCategorizationDialog(false)}
            onCategorize={handleCategorizationChange}
          />
        </DialogContent>
      </Dialog>

      {/* Tag Manager Dialog */}
      <TagManager
        open={showTagManager}
        onOpenChange={setShowTagManager}
        tags={tags}
        onCreateTag={createTag}
        onUpdateTag={updateTag}
        onDeleteTag={deleteTag}
      />

      {/* Calendar Sync Verification Dialog */}
      <Dialog open={isVerifyingSyncOpen} onOpenChange={setIsVerifyingSyncOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Calendar Sync Verification</DialogTitle>
            <DialogDescription>
              Comparing Google Calendar events with Time Audit display
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{verificationResults.length}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {verificationResults.filter(r => r.isSynced).length}
                </div>
                <div className="text-sm text-muted-foreground">In Sync ✓</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {verificationResults.filter(r => !r.isSynced).length}
                </div>
                <div className="text-sm text-muted-foreground">Issues ⚠️</div>
              </div>
            </div>

            {/* Results Table */}
            {verificationResults.filter(r => !r.isSynced).length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-orange-600">Events with Issues</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Event</th>
                        <th className="p-2 text-left">Google Calendar</th>
                        <th className="p-2 text-left">Time Audit</th>
                        <th className="p-2 text-left">Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verificationResults.filter(r => !r.isSynced).map((result) => (
                        <tr key={result.eventId} className="border-t">
                          <td className="p-2 font-medium">{result.eventName}</td>
                          <td className="p-2">
                            <div>{result.googleDate}</div>
                            <div className="text-muted-foreground">
                              {result.googleStartTime} - {result.googleEndTime}
                            </div>
                          </td>
                          <td className="p-2">
                            <div>{result.timeAuditDate}</div>
                            <div className="text-muted-foreground">
                              {result.timeAuditStartTime} - {result.timeAuditEndTime}
                            </div>
                          </td>
                          <td className="p-2 text-orange-600">
                            {result.issues.map((issue, i) => (
                              <div key={i} className="text-xs">{issue}</div>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {verificationResults.filter(r => r.isSynced).length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-green-600">
                  Events in Sync ({verificationResults.filter(r => r.isSynced).length})
                </h4>
                <div className="text-sm text-muted-foreground">
                  {verificationResults.filter(r => r.isSynced).map(r => r.eventName).slice(0, 10).join(', ')}
                  {verificationResults.filter(r => r.isSynced).length > 10 && '...'}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyingSyncOpen(false)}>
              Close
            </Button>
          </DialogFooter>
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
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'calendar' | 'insights' | 'manage' | 'charts')} className="space-y-4">
        <TabsList className="w-fit">
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="manage" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Manage Events
          </TabsTrigger>
          <TabsTrigger value="charts" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Charts
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
              {/* Unified Calendar with Value/Energy toggle */}
              <div className="relative">
                <WeeklyCalendarView
                  timeBlocks={calendarTimeBlocks}
                  onAddBlock={handleAddBlock}
                  onBlockClick={handleBlockClick}
                  onBlockMove={handleBlockMove}
                  onIgnoreBlock={handleSkipBlock}
                  onColorModeChange={setCalendarColorMode}
                  availableTags={tags.map(t => ({ id: t.id, name: t.name, color: t.color }))}
                  onToggleTag={handleToggleTag}
                  onManageTags={handleManageTags}
                  onWeekChange={handleDateRangeChange}
                  initialWeekStart={viewedDateRange.start}
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

              {/* Quick Debug Strip for Calendar Tab */}
              {showDebugPanel && (
                <div className="mt-2 p-2 bg-muted rounded-md text-xs font-mono flex flex-wrap gap-4 items-center">
                  <span>📊 DB: <strong className="text-blue-600">{timeBlocks.length}</strong></span>
                  <span>🌐 Google: <strong className="text-purple-600">{googleEvents.length}</strong></span>
                  <span>📅 On Calendar: <strong className="text-cyan-600">
                    {Object.entries(calendarTimeBlocks)
                      .filter(([date]) => {
                        const viewStartStr = format(viewedDateRange.start, 'yyyy-MM-dd');
                        const viewEndStr = format(viewedDateRange.end, 'yyyy-MM-dd');
                        return date >= viewStartStr && date <= viewEndStr;
                      })
                      .reduce((sum, [, blocks]) => sum + blocks.length, 0)}
                  </strong></span>
                  <span>⏳ Loading: <strong className={isLoadingGoogle ? 'text-orange-600' : 'text-cyan-600'}>{isLoadingGoogle ? 'Yes' : 'No'}</strong></span>
                  <span>📆 Range: {format(viewedDateRange.start, 'MMM d')} - {format(viewedDateRange.end, 'MMM d')}</span>
                </div>
              )}
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
                      Get a bird&apos;s eye view of your entire month with detailed Value breakdowns for each day.
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
            {calendarColorMode === 'value' ? (
              <>
                {/* Value Distribution - Primary when in Value mode */}
                <Card className="p-0 ring-2 ring-primary/20">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm flex items-center gap-2">
                      Value
                      <Badge variant="secondary" className="text-[10px]">Active</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {hasData ? (
                      <>
                        <ValuePieChart data={valueData} size="sm" showLegend={false} />
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-cyan-500" />
                              Production
                            </span>
                            <span className="font-medium text-cyan-600">
                              {totalHours > 0 ? Math.round((valueData.production / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-purple-500" />
                              Investment
                            </span>
                            <span className="font-medium text-purple-600">
                              {totalHours > 0 ? Math.round((valueData.investment / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-amber-500" />
                              Replacement
                            </span>
                            <span className="font-medium text-amber-600">
                              {totalHours > 0 ? Math.round((valueData.replacement / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-red-500" />
                              Delegation
                            </span>
                            <span className="font-medium text-red-600">
                              {totalHours > 0 ? Math.round((valueData.delegation / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-blue-500" />
                              N/A
                            </span>
                            <span className="font-medium text-blue-600">
                              {totalHours > 0 ? Math.round((valueData.na / totalHours) * 100) : 0}%
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
                              <span className="h-2 w-2 rounded-sm bg-cyan-500" />
                              Energizing
                            </span>
                            <span className="font-medium text-cyan-600">
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
                              <span className="h-2 w-2 rounded-sm bg-cyan-500" />
                              Energizing
                            </span>
                            <span className="font-medium text-cyan-600">
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

                {/* Value Distribution - Secondary */}
                <Card className="p-0 opacity-70">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm">Value</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {hasData ? (
                      <>
                        <ValuePieChart data={valueData} size="sm" showLegend={false} />
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-cyan-500" />
                              Production
                            </span>
                            <span className="font-medium text-cyan-600">
                              {totalHours > 0 ? Math.round((valueData.production / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-purple-500" />
                              Investment
                            </span>
                            <span className="font-medium text-purple-600">
                              {totalHours > 0 ? Math.round((valueData.investment / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-amber-500" />
                              Replacement
                            </span>
                            <span className="font-medium text-amber-600">
                              {totalHours > 0 ? Math.round((valueData.replacement / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-red-500" />
                              Delegation
                            </span>
                            <span className="font-medium text-red-600">
                              {totalHours > 0 ? Math.round((valueData.delegation / totalHours) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-sm bg-blue-500" />
                              N/A
                            </span>
                            <span className="font-medium text-blue-600">
                              {totalHours > 0 ? Math.round((valueData.na / totalHours) * 100) : 0}%
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
                    View Value Matrix
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
              <Card className="bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 p-0">
                <CardContent className="p-2">
                  <p className="text-xs text-cyan-800 dark:text-cyan-200">
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
            timeBlocks={insightsTimeBlocks}
            tags={tags}
            dateRange={viewedDateRange}
            onDateRangeChange={handleDateRangeChange}
            refreshKey={insightsRefreshKey}
          />
        </TabsContent>

        <TabsContent value="manage" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Manage Events
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                View and delete events from the current date range ({format(viewedDateRange.start, 'MMM d')} - {format(viewedDateRange.end, 'MMM d, yyyy')})
              </p>
            </CardHeader>
            <CardContent>
              <EventList
                events={manageEventsList}
                dateRange={viewedDateRange}
                onDelete={handleEventListDelete}
                onAISuggest={fetchAiCleanupSuggestions}
                isLoading={isLoadingDb || isLoadingGoogle}
                isDeleting={isDeletingEvent}
              />
            </CardContent>
          </Card>

          {/* Ignored Events */}
          {ignoredEvents.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <EyeOff className="h-5 w-5" />
                  Ignored Events
                  <Badge variant="secondary" className="ml-2">{ignoredEvents.length}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Events you&apos;ve chosen to hide from the calendar. Click to restore them.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Group ignored events by date */}
                  {Object.entries(
                    ignoredEvents.reduce((acc, event) => {
                      const date = event.ignoredAt.split('T')[0];
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(event);
                      return acc;
                    }, {} as Record<string, typeof ignoredEvents>)
                  )
                    .sort(([a], [b]) => b.localeCompare(a)) // Sort by date descending (most recent first)
                    .map(([date, events]) => (
                      <div key={date} className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Ignored on {format(new Date(date), 'MMM d, yyyy')}
                        </h4>
                        <div className="space-y-2">
                          {events.map((event) => (
                            <div
                              key={event.eventId}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{event.eventName}</p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {event.eventId.slice(0, 20)}...
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => unignoreEvent(event.eventId)}
                                className="ml-2 gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Restore
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debug Panel */}
          <Card className="mt-4">
            <CardHeader className="py-3">
              <Button
                variant="ghost"
                className="w-full justify-between"
                onClick={() => setShowDebugPanel(!showDebugPanel)}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  🐛 Debug Info
                </span>
                <ChevronRight className={`h-4 w-4 transition-transform ${showDebugPanel ? 'rotate-90' : ''}`} />
              </Button>
            </CardHeader>
            {showDebugPanel && (
              <CardContent className="pt-0">
                <div className="space-y-4 text-xs font-mono">
                  {/* Connection Status */}
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Connection Status</h4>
                    <div className="space-y-1 bg-muted p-3 rounded-md">
                      <p>Google Connected: <span className={isGoogleConnected ? 'text-cyan-600' : 'text-red-600'}>{isGoogleConnected ? 'Yes' : 'No'}</span></p>
                      <p>Loading: {isLoadingGoogle ? 'Yes' : 'No'}</p>
                      <p>Events in state: {googleEvents.length}</p>
                    </div>
                  </div>

                  {/* Current View Range */}
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Current View Range</h4>
                    <div className="bg-muted p-3 rounded-md">
                      <p>Start: {format(viewedDateRange.start, 'yyyy-MM-dd HH:mm:ss')}</p>
                      <p>End: {format(viewedDateRange.end, 'yyyy-MM-dd HH:mm:ss')}</p>
                    </div>
                  </div>

                  {/* Calendar Data Stats */}
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Calendar Data</h4>
                    <div className="space-y-1 bg-muted p-3 rounded-md">
                      <p>Time Blocks (DB): <span className="text-blue-600">{timeBlocks.length}</span></p>
                      <p>Google Events (state): <span className="text-purple-600">{googleEvents.length}</span></p>
                      <p>Uncategorized Events: <span className={uncategorizedCount > 0 ? 'text-orange-600' : 'text-cyan-600'}>{uncategorizedCount}</span></p>
                      <p>All Time Data (for stats): <span className="text-cyan-600">{allTimeData.length}</span></p>
                      <p className="mt-2 font-semibold">Events on Calendar by Date:</p>
                      {Object.entries(calendarTimeBlocks).length === 0 ? (
                        <p className="text-red-600">No events in calendarTimeBlocks!</p>
                      ) : (
                        <div className="pl-2 max-h-32 overflow-y-auto">
                          {Object.entries(calendarTimeBlocks)
                            .filter(([date]) => {
                              const viewStartStr = format(viewedDateRange.start, 'yyyy-MM-dd');
                              const viewEndStr = format(viewedDateRange.end, 'yyyy-MM-dd');
                              return date >= viewStartStr && date <= viewEndStr;
                            })
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([date, blocks]) => (
                              <p key={date}>
                                {date}: <span className="text-cyan-600">{blocks.length} events</span>
                              </p>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Google Events Sample */}
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Google Events Sample (first 5)</h4>
                    <div className="bg-muted p-3 rounded-md max-h-40 overflow-y-auto">
                      {googleEvents.length === 0 ? (
                        <p className="text-red-600">No Google events in state</p>
                      ) : (
                        googleEvents.slice(0, 5).map((event, i) => (
                          <div key={event.id} className="mb-2 pb-2 border-b border-muted-foreground/20 last:border-0">
                            <p className="font-semibold">{i + 1}. {event.summary}</p>
                            <p className="text-muted-foreground">
                              {event.date && event.startTime ? `${event.date} ${event.startTime}` : 'No date'}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* API Debug Info */}
                  {googleDebugInfo && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">Last API Response Debug</h4>
                      <div className="bg-muted p-3 rounded-md overflow-x-auto max-h-48 overflow-y-auto">
                        <pre className="whitespace-pre-wrap break-all">{JSON.stringify(googleDebugInfo, null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  {/* Sync Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSyncGoogle()}
                      disabled={isLoadingGoogle}
                    >
                      Force Sync
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => clearGoogleCache()}
                    >
                      Clear Cache
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log('[Debug] googleEvents:', googleEvents);
                        console.log('[Debug] calendarTimeBlocks:', calendarTimeBlocks);
                        console.log('[Debug] timeBlocks:', timeBlocks);
                        console.log('[Debug] allTimeData:', allTimeData);
                        console.log('[Debug] viewedDateRange:', viewedDateRange);
                      }}
                    >
                      Log to Console
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="mt-4">
          <ChartsView
            dateRange={viewedDateRange}
            availableTags={tags.map(t => ({ id: t.id, name: t.name, color: t.color }))}
            onManageTags={handleManageTags}
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
        <DialogContent draggable>
          <DialogHeader draggable>
            <DialogTitle>Push to Google Calendar</DialogTitle>
            <DialogDescription>
              Drag to move • Create this time block as an event in your Google Calendar.
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
                    {blockToPush.valueQuadrant}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      blockToPush.energyRating === 'green'
                        ? 'text-cyan-600 border-cyan-300'
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

      {/* AI Bulk Delete Dialog */}
      <BulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        suggestions={aiSuggestions}
        isLoading={isLoadingAiSuggestions}
        onDelete={handleBulkDelete}
        onRefresh={fetchAiCleanupSuggestions}
      />
    </div>
  );
}
