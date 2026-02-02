import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Types
interface DailyAction {
  id: string;
  title: string;
  description?: string;
  estimated_minutes: number;
  status: string;
  key_metric?: string;
  target_value?: number;
  assignee_id?: string;
  assignee_name?: string;
  calendar_event_id?: string;
  calendar_sync_status?: 'not_synced' | 'synced' | 'pending' | 'error';
  calendar_synced_at?: string;
  scheduled_start_time?: string;
  weekly_targets?: {
    id: string;
    title: string;
    monthly_targets?: {
      id: string;
      title: string;
      power_goals?: {
        id: string;
        title: string;
        category: string;
        visions?: {
          id: string;
          title: string;
          color: string;
        };
      };
    };
  };
}

interface VisionGroup {
  visionId: string;
  visionTitle: string;
  visionColor: string;
  actions: DailyAction[];
  completedCount: number;
  totalCount: number;
}

interface Deadline {
  type: 'weekly' | 'monthly';
  id: string;
  title: string;
  dueDate: string;
  daysRemaining: number;
  visionTitle: string;
  visionColor: string;
}

export interface TodayData {
  date: string;
  totalActions: number;
  completedActions: number;
  totalEstimatedMinutes: number;
  completionPercentage: number;
  actionsByVision: VisionGroup[];
  upcomingDeadlines: Deadline[];
  calendarSyncStats?: {
    synced: number;
    notSynced: number;
    error: number;
  };
}

export interface UseTodayDataOptions {
  assigneeFilter?: string;
}

export interface UseTodayDataReturn {
  data: TodayData | null;
  isLoading: boolean;
  error: string | null;
  refetch: (filter?: string) => Promise<void>;
  toggleComplete: (actionId: string, currentStatus: string) => Promise<void>;
  bulkComplete: () => Promise<void>;
  completingIds: Set<string>;
  isBulkCompleting: boolean;
  updateAssignee: (actionId: string, memberId: string | null, memberName: string | null) => Promise<void>;
  updateLocalData: (updater: (prev: TodayData | null) => TodayData | null) => void;
}

// Query keys for cache management
export const todayDataKeys = {
  all: ['today'] as const,
  list: (filter?: string) => [...todayDataKeys.all, 'list', filter] as const,
};

/**
 * Custom hook for managing Today page data and actions.
 *
 * Handles:
 * - Fetching today's actions data
 * - Toggle complete functionality with optimistic updates
 * - Bulk complete functionality
 * - Assignee management
 * - Loading and error states
 */
export function useTodayData(options: UseTodayDataOptions = {}): UseTodayDataReturn {
  const { assigneeFilter = 'all' } = options;

  const [data, setData] = useState<TodayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [isBulkCompleting, setIsBulkCompleting] = useState(false);

  /**
   * Fetch today's data from the API
   */
  const refetch = useCallback(async (filter?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const filterParam = filter ?? assigneeFilter;
      const url = filterParam && filterParam !== 'all'
        ? `/api/today?assignee=${filterParam}`
        : '/api/today';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch today\'s data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching today data:', err);
      setError('Failed to load today\'s actions');
    } finally {
      setIsLoading(false);
    }
  }, [assigneeFilter]);

  /**
   * Toggle an action's completion status with optimistic update
   */
  const toggleComplete = useCallback(async (actionId: string, currentStatus: string) => {
    setCompletingIds((prev) => new Set(prev).add(actionId));
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    try {
      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        const wasCompleted = currentStatus === 'completed';
        return {
          ...prev,
          completedActions: wasCompleted
            ? prev.completedActions - 1
            : prev.completedActions + 1,
          completionPercentage: Math.round(
            ((wasCompleted
              ? prev.completedActions - 1
              : prev.completedActions + 1) / prev.totalActions) * 100
          ),
          actionsByVision: prev.actionsByVision.map((group) => ({
            ...group,
            actions: group.actions.map((action) =>
              action.id === actionId ? { ...action, status: newStatus } : action
            ),
            completedCount:
              group.actions.find((a) => a.id === actionId)
                ? wasCompleted
                  ? group.completedCount - 1
                  : group.completedCount + 1
                : group.completedCount,
          })),
        };
      });

      // Update action status via API
      const response = await fetch(`/api/targets/daily/${actionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update action');
      }

      if (newStatus === 'completed') {
        toast.success('Action completed!');
      } else {
        toast.success('Action marked as pending');
      }
    } catch (err) {
      console.error('Error updating action:', err);
      toast.error('Failed to update action');
      refetch(); // Revert on error by refetching
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
    }
  }, [refetch]);

  /**
   * Mark all pending actions as complete
   */
  const bulkComplete = useCallback(async () => {
    setIsBulkCompleting(true);
    try {
      const response = await fetch('/api/today', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete actions');
      }

      if (result.updated > 0) {
        toast.success(result.message);
        // Optimistic update
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            completedActions: prev.totalActions,
            completionPercentage: 100,
            actionsByVision: prev.actionsByVision.map((group) => ({
              ...group,
              actions: group.actions.map((action) => ({
                ...action,
                status: 'completed',
              })),
              completedCount: group.totalCount,
            })),
          };
        });
      } else {
        toast.info('All actions already completed!');
      }
    } catch (err) {
      console.error('Bulk complete error:', err);
      toast.error('Failed to complete all actions');
    } finally {
      setIsBulkCompleting(false);
    }
  }, []);

  /**
   * Update action assignee with optimistic update
   */
  const updateAssignee = useCallback(async (
    actionId: string,
    memberId: string | null,
    memberName: string | null
  ) => {
    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        actionsByVision: prev.actionsByVision.map((group) => ({
          ...group,
          actions: group.actions.map((action) =>
            action.id === actionId
              ? { ...action, assignee_id: memberId || undefined, assignee_name: memberName || undefined }
              : action
          ),
        })),
      };
    });

    try {
      const response = await fetch(`/api/targets/daily/${actionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigneeId: memberId,
          assigneeName: memberName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update assignee');
      }

      toast.success(memberName ? `Assigned to ${memberName}` : 'Assignee removed');
    } catch (err) {
      console.error('Error updating assignee:', err);
      toast.error('Failed to update assignee');
      refetch(); // Revert on error
    }
  }, [refetch]);

  /**
   * Allow external components to update local data (e.g., for calendar sync updates)
   */
  const updateLocalData = useCallback((updater: (prev: TodayData | null) => TodayData | null) => {
    setData(updater);
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch,
    toggleComplete,
    bulkComplete,
    completingIds,
    isBulkCompleting,
    updateAssignee,
    updateLocalData,
  };
}

// Re-export types for convenience
export type { DailyAction, VisionGroup, Deadline };
