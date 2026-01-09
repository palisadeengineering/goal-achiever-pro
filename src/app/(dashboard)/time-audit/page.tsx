'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, CalendarDays, CalendarRange, Lock, RefreshCw, ChevronDown, Upload, ArrowUpRight, BarChart3, Trash2 } from 'lucide-react';
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
import type { DripQuadrant, EnergyRating } from '@/types/database';

type SubscriptionTier = 'free' | 'pro' | 'premium';

// Interface matching WeeklyCalendarView's expected TimeBlock
interface CalendarTimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  activityName: string;
  dripQuadrant: DripQuadrant;
  energyRating: EnergyRating;
}

function checkProAccess(tier: SubscriptionTier): boolean {
  return tier === 'pro' || tier === 'premium';
}

function checkPremiumAccess(tier: SubscriptionTier): boolean {
  return tier === 'premium';
}

// Calculate duration in minutes between two time strings
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

export default function TimeAuditPage() {
  // In real app, check user subscription tier from database
  const userTier: SubscriptionTier = 'premium'; // Temporarily set to premium for testing
  const hasProAccess = checkProAccess(userTier);
  const hasPremiumAccess = checkPremiumAccess(userTier);

  // Get current week date range for initial fetch
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  // Database time blocks
  const {
    timeBlocks: dbTimeBlocks,
    isLoading: isLoadingDb,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    importTimeBlocks,
    fetchTimeBlocks,
  } = useTimeBlocks(
    format(weekStart, 'yyyy-MM-dd'),
    format(addMonths(weekEnd, 1), 'yyyy-MM-dd')
  );

  // Local storage for backwards compatibility (will migrate to DB)
  const [localTimeBlocks, setLocalTimeBlocks] = useLocalStorage<TimeBlock[]>('time-blocks', []);

  // Combine database and local time blocks (prefer database)
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

    // Merge and sort by date/time
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
    })), ...uniqueLocalBlocks];

    return merged.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [dbTimeBlocks, localTimeBlocks]);

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

  // Google Calendar integration
  const {
    events: googleEvents,
    isLoading: isLoadingGoogle,
    isConnected: isGoogleConnected,
    fetchEvents: fetchGoogleEvents,
    clearCache: clearGoogleCache,
  } = useGoogleCalendar();

  const { getUncategorizedEventIds, getCategorization, saveCategorization, categorizations, clearCategorizations } = useEventPatterns();

  const { tags } = useTags();

  // Edit pattern detection
  const { trackEdit, getPatternSuggestion, dismissPattern } = useEditPatterns();

  const [showCategorizationDialog, setShowCategorizationDialog] = useState(false);
  const [mainTab, setMainTab] = useState<'calendar' | 'insights'>('calendar');
  const [syncTimeframe, setSyncTimeframe] = useLocalStorage<'1week' | '2weeks' | '1month'>('google-sync-timeframe', '1week');

  // Fetch Google events when connected
  const handleSyncGoogle = (timeframe?: '1week' | '2weeks' | '1month') => {
    const selectedTimeframe = timeframe || syncTimeframe;
    if (timeframe) {
      setSyncTimeframe(timeframe);
    }

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    let endDate: Date;

    switch (selectedTimeframe) {
      case '2weeks':
        endDate = endOfWeek(addWeeks(weekStart, 1), { weekStartsOn: 1 });
        break;
      case '1month':
        endDate = addMonths(weekStart, 1);
        break;
      case '1week':
      default:
        endDate = endOfWeek(addDays(weekStart, 6), { weekStartsOn: 1 });
        break;
    }

    fetchGoogleEvents(weekStart, endDate);
  };

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

  // Transform time blocks for WeeklyCalendarView (grouped by date)
  // Includes both manual time blocks AND categorized Google Calendar events
  const calendarTimeBlocks = useMemo(() => {
    const grouped: Record<string, CalendarTimeBlock[]> = {};

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
      });
    });

    // Merge categorized Google Calendar events
    googleEvents.forEach((event) => {
      const categorization = getCategorization(event.id);
      if (categorization) {
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

            grouped[dateKey].push({
              id: event.id,
              startTime: format(startDate, 'HH:mm'),
              endTime: format(endDate, 'HH:mm'),
              activityName: event.summary,
              dripQuadrant: categorization.dripQuadrant,
              energyRating: categorization.energyRating,
            });
          } catch {
            // Skip events with invalid dates
          }
        }
      }
    });

    return grouped;
  }, [timeBlocks, googleEvents, getCategorization]);

  // Get all data sources for stats: time blocks + categorized Google events
  const allTimeData = useMemo(() => {
    const allBlocks: Array<{
      startTime: string;
      endTime: string;
      dripQuadrant: DripQuadrant;
      energyRating: EnergyRating;
      source: string;
    }> = [];

    // Add time blocks (from database and local)
    timeBlocks.forEach((block) => {
      allBlocks.push({
        startTime: block.startTime,
        endTime: block.endTime,
        dripQuadrant: block.dripQuadrant,
        energyRating: block.energyRating,
        source: block.source || 'manual',
      });
    });

    // Add categorized Google Calendar events that aren't already imported
    const importedExternalIds = new Set(
      timeBlocks.filter(b => b.externalEventId).map(b => b.externalEventId)
    );

    googleEvents.forEach((event) => {
      // Skip if already imported as a time block
      if (importedExternalIds.has(event.id) || importedExternalIds.has(`gcal_${event.id}`)) {
        return;
      }

      const categorization = getCategorization(event.id);
      if (categorization) {
        const startDateTime = event.start?.dateTime || event.startTime;
        const endDateTime = event.end?.dateTime || event.endTime;

        if (startDateTime && endDateTime) {
          try {
            const startDate = new Date(startDateTime);
            const endDate = new Date(endDateTime);

            allBlocks.push({
              startTime: format(startDate, 'HH:mm'),
              endTime: format(endDate, 'HH:mm'),
              dripQuadrant: categorization.dripQuadrant,
              energyRating: categorization.energyRating,
              source: 'google_calendar',
            });
          } catch {
            // Skip invalid dates
          }
        }
      }
    });

    return allBlocks;
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

  // Handle saving a new or edited time block (saves to database)
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
        });

        // Also save/update the categorization in localStorage for pattern learning
        saveCategorization(
          editingBlock.externalEventId!,
          blockData.activityName,
          blockData.dripQuadrant,
          blockData.energyRating
        );

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
        });

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
      // Create new block in database
      await createTimeBlock({
        date: blockData.date,
        startTime: blockData.startTime,
        endTime: blockData.endTime,
        activityName: blockData.activityName,
        dripQuadrant: blockData.dripQuadrant,
        energyRating: blockData.energyRating,
        source: 'manual',
      });

      // Also save to local storage for backwards compatibility
      const newBlock: TimeBlock = {
        ...blockData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setLocalTimeBlocks(blocks => [...blocks, newBlock]);
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
    // First check if it's a database/local time block
    const fullBlock = timeBlocks.find(b => b.id === block.id);
    if (fullBlock) {
      setEditingBlock(fullBlock);
      setIsFormOpen(true);
      return;
    }

    // Check if it's a Google Calendar event
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

  // Handle clearing synced Google Calendar data and categorizations
  const handleClearSyncedData = useCallback(() => {
    clearGoogleCache();
    clearCategorizations();
  }, [clearGoogleCache, clearCategorizations]);

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
            {isGoogleConnected && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={isLoadingGoogle}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingGoogle ? 'animate-spin' : ''}`} />
                      Sync {getTimeframeLabel(syncTimeframe)}
                      <ChevronDown className="h-4 w-4 ml-2" />
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
                <Button
                  variant="secondary"
                  onClick={() => setShowCategorizationDialog(true)}
                >
                  <Badge variant="destructive" className="mr-2">
                    {uncategorizedCount}
                  </Badge>
                  Categorize ({uncategorizedCount})
                </Button>
                {categorizedNotImportedCount > 0 && (
                  <Button
                    variant="default"
                    onClick={handleImportCategorized}
                    disabled={isImporting}
                  >
                    <Upload className={`h-4 w-4 mr-2 ${isImporting ? 'animate-pulse' : ''}`} />
                    Import {categorizedNotImportedCount} to Database
                  </Button>
                )}
                {googleEvents.length > 0 && (
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
            <Button onClick={handleLogTimeBlock}>
              <Plus className="h-4 w-4 mr-2" />
              Log Time Block
            </Button>
          </div>
        }
      />

      {/* Time Block Form Modal */}
      <TimeBlockForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveBlock}
        initialDate={initialDate}
        initialTime={initialTime}
        initialEndTime={initialEndTime}
        editBlock={editingBlock}
      />

      {/* Google Calendar Categorization Dialog */}
      <Dialog open={showCategorizationDialog} onOpenChange={setShowCategorizationDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Categorize Google Calendar Events</DialogTitle>
          </DialogHeader>
          <BulkCategorizationView
            events={googleEvents}
            onComplete={() => setShowCategorizationDialog(false)}
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
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Calendar Views - Takes 2 columns */}
            <div className="lg:col-span-2">
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
              <TabsTrigger value="monthly" className="gap-2" disabled={!hasPremiumAccess}>
                <CalendarRange className="h-4 w-4" />
                Monthly
                {!hasPremiumAccess && <Lock className="h-3 w-3" />}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="space-y-6">
              {/* DRIP Distribution Calendar */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">DRIP Distribution</h3>
                <WeeklyCalendarView
                  timeBlocks={calendarTimeBlocks}
                  onAddBlock={handleAddBlock}
                  onBlockClick={handleBlockClick}
                  colorMode="drip"
                />
              </div>

              {/* Energy Distribution Calendar */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Energy Distribution</h3>
                <WeeklyCalendarView
                  timeBlocks={calendarTimeBlocks}
                  onAddBlock={handleAddBlock}
                  onBlockClick={handleBlockClick}
                  colorMode="energy"
                />
              </div>
            </TabsContent>

            <TabsContent value="biweekly">
              {hasProAccess ? (
                <BiweeklyCalendarView />
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
              {hasPremiumAccess ? (
                <MonthlyCalendarView />
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
                        Upgrade to Premium
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Pie Charts - Takes 1 column */}
        <div className="space-y-6">
          {/* DRIP Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">DRIP Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {hasData ? (
                <>
                  <DripPieChart data={dripData} size="md" />
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Production (Sweet Spot)</span>
                      <span className="font-medium text-green-600">
                        {totalHours > 0 ? Math.round((dripData.production / totalHours) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Investment (Growth)</span>
                      <span className="font-medium text-blue-600">
                        {totalHours > 0 ? Math.round((dripData.investment / totalHours) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Replacement (Automate)</span>
                      <span className="font-medium text-orange-600">
                        {totalHours > 0 ? Math.round((dripData.replacement / totalHours) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delegation (Delegate)</span>
                      <span className="font-medium text-purple-600">
                        {totalHours > 0 ? Math.round((dripData.delegation / totalHours) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No time blocks logged yet.</p>
                  <p className="text-sm">Click &quot;Log Time Block&quot; to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Energy Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Energy Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {hasData ? (
                <>
                  <EnergyPieChart data={energyData} size="md" />
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Energizing
                      </span>
                      <span className="font-medium text-green-600">
                        {totalHours > 0 ? Math.round((energyData.green / totalHours) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                        Neutral
                      </span>
                      <span className="font-medium text-yellow-600">
                        {totalHours > 0 ? Math.round((energyData.yellow / totalHours) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Draining
                      </span>
                      <span className="font-medium text-red-600">
                        {totalHours > 0 ? Math.round((energyData.red / totalHours) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Track your energy levels</p>
                  <p className="text-sm">to see distribution here.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={ROUTES.drip}>
                  View DRIP Matrix
                </Link>
              </Button>
              {isGoogleConnected && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // Select the most recent block to push
                    const recentBlock = timeBlocks[timeBlocks.length - 1];
                    if (recentBlock && !recentBlock.externalEventId) {
                      setBlockToPush(recentBlock);
                      setShowPushDialog(true);
                    }
                  }}
                  disabled={timeBlocks.length === 0}
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Push to Google Calendar
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start">
                Export Report
                {!hasProAccess && (
                  <Badge variant="secondary" className="ml-auto">Pro</Badge>
                )}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Set Time Goals
              </Button>
            </CardContent>
          </Card>

          {/* Import Result Notification */}
          {importResult && (
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="py-3">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Imported {importResult.imported} events
                  {importResult.skipped > 0 && ` (${importResult.skipped} skipped)`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
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
