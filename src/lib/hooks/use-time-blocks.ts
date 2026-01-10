'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { DripQuadrant, EnergyRating } from '@/types/database';

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
  dripQuadrant: DripQuadrant;
  source?: string;
  externalEventId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UseTimeBlocksReturn {
  timeBlocks: TimeBlock[];
  isLoading: boolean;
  error: string | null;
  fetchTimeBlocks: (startDate?: string, endDate?: string) => Promise<void>;
  createTimeBlock: (block: Omit<TimeBlock, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TimeBlock | null>;
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => Promise<TimeBlock | null>;
  deleteTimeBlock: (id: string) => Promise<boolean>;
  clearAllTimeBlocks: () => Promise<boolean>;
  importTimeBlocks: (blocks: Array<Omit<TimeBlock, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<{ imported: number; skipped: number }>;
  refetch: () => Promise<void>;
}

export function useTimeBlocks(initialStartDate?: string, initialEndDate?: string): UseTimeBlocksReturn {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      const newBlock = data.timeBlock;

      // Add to local state
      setTimeBlocks(prev => [...prev, newBlock]);

      return newBlock;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create time block';
      setError(message);
      console.error('Create time block error:', err);
      return null;
    }
  }, []);

  const updateTimeBlock = useCallback(async (
    id: string,
    updates: Partial<TimeBlock>
  ): Promise<TimeBlock | null> => {
    try {
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
  }, []);

  const deleteTimeBlock = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/time-blocks?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete time block');
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
  }, []);

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

  return {
    timeBlocks,
    isLoading,
    error,
    fetchTimeBlocks,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    clearAllTimeBlocks,
    importTimeBlocks,
    refetch,
  };
}
