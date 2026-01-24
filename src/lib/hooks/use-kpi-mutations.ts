'use client';

/**
 * KPI Mutation Hooks
 *
 * React Query mutations for KPI logging and progress overrides with optimistic updates.
 * Provides instant UI feedback by optimistically updating the logged KPI's progress,
 * with rollback on error and server reconciliation for accurate ancestor progress.
 *
 * Usage:
 *   const { mutate: logKpi, isPending, error } = useLogKpi(visionId);
 *   const { mutate: overrideProgress } = useOverrideProgress(visionId);
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { KpiTreeNode, AncestorProgressUpdate } from '@/lib/progress';
import type { GoalTreeResponse } from './use-goal-tree';

/**
 * Request type for logging a KPI value or completion
 */
export interface LogKpiRequest {
  kpiId: string;
  date?: string;
  value?: number;
  isCompleted?: boolean;
  notes?: string;
}

/**
 * Response type from POST /api/vision-kpis/{id}/log
 */
export interface LogKpiResponse {
  log: {
    id: string;
    kpi_id: string;
    log_date: string;
    value: number | null;
    is_completed: boolean;
    notes: string | null;
  };
  rollup: {
    updatedKpis: AncestorProgressUpdate[];
    duration: number;
  };
}

/**
 * Request type for overriding KPI progress manually
 */
export interface OverrideProgressRequest {
  kpiId: string;
  progress: number; // 0-100
  reason?: string;
}

/**
 * Context type for optimistic update rollback
 */
interface MutationContext {
  previousTree: GoalTreeResponse | undefined;
}

/**
 * Helper function to update a single KPI's progress in the tree
 * Used for optimistic updates before server confirmation
 */
function updateSingleKpiProgress(
  response: GoalTreeResponse,
  kpiId: string,
  newProgress: number
): GoalTreeResponse {
  const cloned = structuredClone(response.tree);

  function findAndUpdate(nodes: KpiTreeNode[]): boolean {
    for (const node of nodes) {
      if (node.id === kpiId) {
        node.progress = newProgress;
        node.status = newProgress >= 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started';
        return true;
      }
      if (node.children && findAndUpdate(node.children)) return true;
    }
    return false;
  }

  findAndUpdate(cloned);
  return { ...response, tree: cloned };
}

/**
 * Posts a KPI log to the server
 */
async function postKpiLog(request: LogKpiRequest): Promise<LogKpiResponse> {
  const response = await fetch(`/api/vision-kpis/${request.kpiId}/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: request.date,
      value: request.value,
      isCompleted: request.isCompleted,
      notes: request.notes,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Failed to log KPI: ${response.status}`);
  }

  return response.json();
}

/**
 * Posts a progress override to the server
 */
async function postProgressOverride(request: OverrideProgressRequest): Promise<unknown> {
  const response = await fetch(`/api/kpi-progress/${request.kpiId}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      progress: request.progress,
      reason: request.reason,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Failed to override progress: ${response.status}`);
  }

  return response.json();
}

/**
 * Hook to log a KPI value or completion with optimistic updates.
 *
 * The optimistic update immediately shows the KPI as complete (100%) or updated,
 * providing instant feedback. The server then returns accurate ancestor progress
 * which is applied via query invalidation.
 *
 * @param visionId - The vision ID for cache key targeting
 * @param options - Optional callbacks for onSuccess and onError
 * @returns React Query mutation result with optimistic updates
 *
 * @example
 * ```tsx
 * function KpiCheckbox({ kpiId, visionId }: Props) {
 *   const { mutate: logKpi, isPending } = useLogKpi(visionId);
 *
 *   const handleToggle = () => {
 *     logKpi({ kpiId, isCompleted: true });
 *   };
 *
 *   return <Checkbox onChange={handleToggle} disabled={isPending} />;
 * }
 * ```
 */
export function useLogKpi(
  visionId: string | undefined,
  options?: {
    onSuccess?: (data: LogKpiResponse) => void;
    onError?: (error: Error) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation<LogKpiResponse, Error, LogKpiRequest, MutationContext>({
    mutationFn: postKpiLog,

    onMutate: async (variables) => {
      // 1. Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['goalTree', visionId] });

      // 2. Snapshot previous state for rollback
      const previousTree = queryClient.getQueryData<GoalTreeResponse>(['goalTree', visionId]);

      // 3. Optimistically update ONLY the logged KPI (not ancestors)
      // Ancestors will be updated after server returns accurate rollup
      if (previousTree) {
        const newProgress = variables.isCompleted ? 100 : (variables.value ?? 0);
        queryClient.setQueryData<GoalTreeResponse>(
          ['goalTree', visionId],
          updateSingleKpiProgress(previousTree, variables.kpiId, newProgress)
        );
      }

      // 4. Return context for rollback
      return { previousTree };
    },

    onError: (err, _variables, context) => {
      // Rollback to snapshot on failure
      if (context?.previousTree) {
        queryClient.setQueryData(['goalTree', visionId], context.previousTree);
      }
      options?.onError?.(err);
    },

    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },

    onSettled: () => {
      // Refetch to get accurate ancestor rollup from server
      // This ensures the tree reflects the server-calculated progress
      queryClient.invalidateQueries({ queryKey: ['goalTree', visionId] });
    },
  });
}

/**
 * Hook to manually override a KPI's progress with optimistic updates.
 *
 * Used for setting arbitrary progress values (0-100) on any KPI.
 * The override is marked in the cache so automatic rollup won't overwrite it.
 *
 * @param visionId - The vision ID for cache key targeting
 * @param options - Optional callbacks for onSuccess and onError
 * @returns React Query mutation result with optimistic updates
 *
 * @example
 * ```tsx
 * function ProgressSlider({ kpiId, visionId }: Props) {
 *   const { mutate: override, isPending } = useOverrideProgress(visionId);
 *
 *   const handleChange = (value: number) => {
 *     override({ kpiId, progress: value, reason: 'Manual adjustment' });
 *   };
 *
 *   return <Slider onChange={handleChange} disabled={isPending} />;
 * }
 * ```
 */
export function useOverrideProgress(
  visionId: string | undefined,
  options?: {
    onSuccess?: (data: unknown) => void;
    onError?: (error: Error) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, OverrideProgressRequest, MutationContext>({
    mutationFn: postProgressOverride,

    onMutate: async (variables) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['goalTree', visionId] });

      // 2. Snapshot previous state for rollback
      const previousTree = queryClient.getQueryData<GoalTreeResponse>(['goalTree', visionId]);

      // 3. Optimistically update the KPI with the new progress value
      if (previousTree) {
        queryClient.setQueryData<GoalTreeResponse>(
          ['goalTree', visionId],
          updateSingleKpiProgress(previousTree, variables.kpiId, variables.progress)
        );
      }

      // 4. Return context for rollback
      return { previousTree };
    },

    onError: (err, _variables, context) => {
      // Rollback to snapshot on failure
      if (context?.previousTree) {
        queryClient.setQueryData(['goalTree', visionId], context.previousTree);
      }
      options?.onError?.(err);
    },

    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },

    onSettled: () => {
      // Refetch to get accurate ancestor rollup from server
      queryClient.invalidateQueries({ queryKey: ['goalTree', visionId] });
    },
  });
}
