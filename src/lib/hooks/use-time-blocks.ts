'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ValueQuadrant, EnergyRating } from '@/types/database';

export interface GoogleCalendarSyncConfig {
  isConnected: boolean;
  autoSync: boolean;
}

export interface TimeBlock {
  id: string;
  userId?: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  activityName: string;
  activityCategory?: string;
  notes?: string;
  energyRating: EnergyRating;
  valueQuadrant: ValueQuadrant;
  source?: string;
  externalEventId?: string;
  // Recurring event fields
  isRecurring?: boolean;
  recurrenceRule?: string; // RFC 5545 RRULE format
  recurrenceEndDate?: string;
  parentBlockId?: string;
  isRecurrenceException?: boolean;
  originalDate?: string;
  tagIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncFromGoogleResult {
  success: boolean;
  synced: number;
  deleted: number;
  conflicts: number;
  errors: string[];
  details: {
    blockId: string;
    action: 'updated' | 'deleted' | 'skipped' | 'error';
    reason?: string;
    oldDate?: string;
    newDate?: string;
  }[];
}

interface UseTimeBlocksReturn {
  timeBlocks: TimeBlock[];
  isLoading: boolean;
  error: string | null;
  isSyncingFromGoogle: boolean;
  fetchTimeBlocks: (startDate?: string, endDate?: string) => Promise<void>;
  createTimeBlock: (block: Omit<TimeBlock, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TimeBlock | null>;
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => Promise<TimeBlock | null>;
  deleteTimeBlock: (id: string) => Promise<boolean>;
  clearAllTimeBlocks: () => Promise<boolean>;
  clearGoogleSyncedBlocks: () => Promise<{ success: boolean; deletedCount: number }>;
  importTimeBlocks: (blocks: Array<Omit<TimeBlock, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<{ imported: number; skipped: number }>;
  refetch: () => Promise<void>;
  syncFromGoogle: () => Promise<SyncFromGoogleResult>;
}

export function useTimeBlocks(
  initialStartDate?: string,
  initialEndDate?: string,
  googleCalendarConfig?: GoogleCalendarSyncConfig
): UseTimeBlocksReturn {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingFromGoogle, setIsSyncingFromGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: initialStartDate,
    endDate: initialEndDate,
  });
  const initializedRef = useRef(false);

  const fetchTimeBlocks = useCallback(async (startDate?: string, endDate?: string) => {
    setIsLoading(true);
    setError(null);

    // Update date range if provided
    if (startDate || endDate) {
      setDateRange({ startDate, endDate });
    }

    const actualStartDate = startDate || dateRange.startDate;
    const actualEndDate = endDate || dateRange.endDate;

    try {
      const params = new URLSearchParams();
      if (actualStartDate) params.set('startDate', actualStartDate);
      if (actualEndDate) params.set('endDate', actualEndDate);

      const response = await fetch(`/api/time-blocks?${params}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch time blocks');
      }

      const data = await response.json();
      setTimeBlocks(data.timeBlocks || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch time blocks';
      setError(message);
      console.error('Time blocks fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  // Initial fetch - runs once on mount with initial values
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    fetchTimeBlocks(initialStartDate, initialEndDate);
  }, [fetchTimeBlocks, initialStartDate, initialEndDate]);

  const refetch = useCallback(async () => {
    await fetchTimeBlocks(dateRange.startDate, dateRange.endDate);
  }, [fetchTimeBlocks, dateRange.startDate, dateRange.endDate]);

  const createTimeBlock = useCallback(async (
    block: Omit<TimeBlock, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TimeBlock | null> => {
    try {
      const response = await fetch('/api/time-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(block),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create time block');
      }

      const data = await response.json();
      let newBlock = data.timeBlock;

      // Auto-sync to Google Calendar if enabled
      if (
        googleCalendarConfig?.autoSync &&
        googleCalendarConfig?.isConnected &&
        !block.externalEventId && // Don't sync if it already has a Google event ID
        block.source !== 'calendar_sync' // Don't sync if it came from Google Calendar
      ) {
        try {
          console.log('[Time Blocks] Auto-syncing new block to Google Calendar:', newBlock.activityName);

          const googleResponse = await fetch('/api/calendar/google/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              summary: block.activityName,
              description: block.notes || '',
              start: `${block.date}T${block.startTime}:00`,
              end: `${block.date}T${block.endTime}:00`,
            }),
          });

          if (googleResponse.ok) {
            const googleData = await googleResponse.json();
            console.log('[Time Blocks] Successfully synced to Google Calendar:', googleData.event.googleEventId);

            // Update the block with the Google event ID
            const updateResponse = await fetch('/api/time-blocks', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: newBlock.id,
                externalEventId: googleData.event.googleEventId,
                source: 'calendar_sync',
              }),
            });

            if (updateResponse.ok) {
              const updateData = await updateResponse.json();
              newBlock = updateData.timeBlock;
            }
          } else {
            const errorData = await googleResponse.json();
            console.error('[Time Blocks] Failed to sync to Google Calendar:', errorData);
          }
        } catch (syncError) {
          console.error('[Time Blocks] Google Calendar sync error:', syncError);
          // Don't fail the whole operation if sync fails
        }
      }

      // Add to local state
      setTimeBlocks(prev => [...prev, newBlock]);

      return newBlock;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create time block';
      setError(message);
      console.error('Create time block error:', err);
      return null;
    }
  }, [googleCalendarConfig]);

  const updateTimeBlock = useCallback(async (
    id: string,
    updates: Partial<TimeBlock>
  ): Promise<TimeBlock | null> => {
    try {
      // Get the current block to check for Google event ID
      const currentBlock = timeBlocks.find(b => b.id === id);

      const response = await fetch('/api/time-blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update time block');
      }

      const data = await response.json();
      const updatedBlock = data.timeBlock;

      // Auto-sync to Google Calendar if enabled and block has a Google event ID
      if (
        googleCalendarConfig?.autoSync &&
        googleCalendarConfig?.isConnected &&
        updatedBlock.externalEventId &&
        (currentBlock?.source === 'calendar_sync' || updatedBlock.source === 'calendar_sync')
      ) {
        try {
          console.log('[Time Blocks] Auto-syncing update to Google Calendar:', updatedBlock.externalEventId);

          // Build the update payload - only include fields that matter for Google Calendar
          const googleUpdatePayload: Record<string, unknown> = {};
          if (updates.activityName !== undefined) {
            googleUpdatePayload.summary = updates.activityName;
          }
          if (updates.notes !== undefined) {
            googleUpdatePayload.description = updates.notes;
          }
          if (updates.date !== undefined || updates.startTime !== undefined) {
            const date = updates.date || updatedBlock.date;
            const startTime = updates.startTime || updatedBlock.startTime;
            googleUpdatePayload.start = `${date}T${startTime}:00`;
          }
          if (updates.date !== undefined || updates.endTime !== undefined) {
            const date = updates.date || updatedBlock.date;
            const endTime = updates.endTime || updatedBlock.endTime;
            googleUpdatePayload.end = `${date}T${endTime}:00`;
          }

          // Only sync if there are actual changes to sync
          if (Object.keys(googleUpdatePayload).length > 0) {
            const googleResponse = await fetch('/api/calendar/google/events', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventId: updatedBlock.externalEventId,
                ...googleUpdatePayload,
              }),
            });

            if (googleResponse.ok) {
              console.log('[Time Blocks] Successfully synced update to Google Calendar');
            } else {
              const errorData = await googleResponse.json();
              console.error('[Time Blocks] Failed to sync update to Google Calendar:', errorData);
            }
          }
        } catch (syncError) {
          console.error('[Time Blocks] Google Calendar sync error:', syncError);
          // Don't fail the whole operation if sync fails
        }
      }

      // Update local state
      setTimeBlocks(prev =>
        prev.map(b => b.id === id ? updatedBlock : b)
      );

      return updatedBlock;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update time block';
      setError(message);
      console.error('Update time block error:', err);
      return null;
    }
  }, [googleCalendarConfig, timeBlocks]);

  const deleteTimeBlock = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Get the block before deleting to check for Google event ID
      const blockToDelete = timeBlocks.find(b => b.id === id);

      const response = await fetch(`/api/time-blocks?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete time block');
      }

      // Auto-sync deletion to Google Calendar if enabled and block has a Google event ID
      if (
        googleCalendarConfig?.autoSync &&
        googleCalendarConfig?.isConnected &&
        blockToDelete?.externalEventId &&
        blockToDelete?.source === 'calendar_sync'
      ) {
        try {
          console.log('[Time Blocks] Auto-syncing deletion to Google Calendar:', blockToDelete.externalEventId);

          const googleResponse = await fetch(
            `/api/calendar/google/events?eventId=${encodeURIComponent(blockToDelete.externalEventId)}`,
            { method: 'DELETE' }
          );

          if (googleResponse.ok) {
            console.log('[Time Blocks] Successfully deleted from Google Calendar');
          } else {
            const errorData = await googleResponse.json();
            console.error('[Time Blocks] Failed to delete from Google Calendar:', errorData);
          }
        } catch (syncError) {
          console.error('[Time Blocks] Google Calendar delete error:', syncError);
          // Don't fail the whole operation if sync fails
        }
      }

      // Remove from local state
      setTimeBlocks(prev => prev.filter(b => b.id !== id));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete time block';
      setError(message);
      console.error('Delete time block error:', err);
      return false;
    }
  }, [googleCalendarConfig, timeBlocks]);

  const clearAllTimeBlocks = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/time-blocks?clearAll=true', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clear all time blocks');
      }

      // Clear local state
      setTimeBlocks([]);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear all time blocks';
      setError(message);
      console.error('Clear all time blocks error:', err);
      return false;
    }
  }, []);

  // Clear only Google Calendar synced blocks (keeps manually created blocks)
  const clearGoogleSyncedBlocks = useCallback(async (): Promise<{ success: boolean; deletedCount: number }> => {
    try {
      const response = await fetch('/api/time-blocks?clearSource=google_calendar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clear Google synced time blocks');
      }

      const data = await response.json();

      // Remove synced blocks from local state
      setTimeBlocks(prev => prev.filter(b =>
        b.source !== 'calendar_sync' &&
        b.source !== 'google_calendar' &&
        !b.externalEventId
      ));

      console.log(`[Time Blocks] Cleared ${data.deletedCount} Google synced blocks`);

      return { success: true, deletedCount: data.deletedCount || 0 };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear Google synced time blocks';
      setError(message);
      console.error('Clear Google synced time blocks error:', err);
      return { success: false, deletedCount: 0 };
    }
  }, []);

  const importTimeBlocks = useCallback(async (
    blocks: Array<Omit<TimeBlock, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<{ imported: number; skipped: number }> => {
    try {
      const response = await fetch('/api/time-blocks/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeBlocks: blocks, skipDuplicates: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import time blocks');
      }

      const data = await response.json();

      // Add imported blocks to local state
      if (data.timeBlocks && data.timeBlocks.length > 0) {
        setTimeBlocks(prev => [...prev, ...data.timeBlocks]);
      }

      return { imported: data.imported || 0, skipped: data.skipped || 0 };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import time blocks';
      setError(message);
      console.error('Import time blocks error:', err);
      return { imported: 0, skipped: blocks.length };
    }
  }, []);

  // Sync changes FROM Google Calendar TO local database (reverse sync / two-way sync)
  const syncFromGoogle = useCallback(async (): Promise<SyncFromGoogleResult> => {
    const defaultResult: SyncFromGoogleResult = {
      success: false,
      synced: 0,
      deleted: 0,
      conflicts: 0,
      errors: [],
      details: [],
    };

    if (!googleCalendarConfig?.isConnected) {
      console.log('[Time Blocks] Skipping sync from Google - not connected');
      return { ...defaultResult, errors: ['Not connected to Google Calendar'] };
    }

    setIsSyncingFromGoogle(true);
    setError(null);

    try {
      console.log('[Time Blocks] Starting sync from Google Calendar...');

      const response = await fetch('/api/calendar/google/sync-from-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.error || 'Failed to sync from Google Calendar';
        console.error('[Time Blocks] Sync from Google failed:', errorMessage);
        setError(errorMessage);
        return { ...defaultResult, errors: [errorMessage] };
      }

      const data = await response.json();
      console.log('[Time Blocks] Sync from Google complete:', data);

      // Refetch time blocks to get the updated data
      if (data.synced > 0 || data.deleted > 0) {
        console.log('[Time Blocks] Refetching time blocks after sync...');
        await fetchTimeBlocks(dateRange.startDate, dateRange.endDate);
      }

      return {
        success: true,
        synced: data.synced || 0,
        deleted: data.deleted || 0,
        conflicts: data.conflicts || 0,
        errors: data.errors || [],
        details: data.details || [],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sync from Google Calendar';
      setError(message);
      console.error('[Time Blocks] Sync from Google error:', err);
      return { ...defaultResult, errors: [message] };
    } finally {
      setIsSyncingFromGoogle(false);
    }
  }, [googleCalendarConfig, fetchTimeBlocks, dateRange.startDate, dateRange.endDate]);

  return {
    timeBlocks,
    isLoading,
    error,
    isSyncingFromGoogle,
    fetchTimeBlocks,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    clearAllTimeBlocks,
    clearGoogleSyncedBlocks,
    importTimeBlocks,
    refetch,
    syncFromGoogle,
  };
}
