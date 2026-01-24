'use client';

/**
 * KPI Mutation Hooks
 *
 * React Query mutations for KPI logging and progress overrides with optimistic updates.
 * Provides instant UI feedback by optimistically updating the logged KPI's progress,
 * with rollback on error and server reconciliation for accurate ancestor progress.
 *
 * Enhanced with:
 * - Centralized query keys for targeted invalidation
 * - Server response reconciliation (not just invalidation)
 * - Mutation state helpers (isLoggingKpi)
 *
 * Usage:
 *   const { mutate: logKpi, isPending, error } = useLogKpi(visionId);
 *   const { mutate: overrideProgress } = useOverrideProgress(visionId);
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { KpiTreeNode, AncestorProgressUpdate } from '@/lib/progress';
import type { GoalTreeResponse } from './use-goal-tree';
import { goalTreeKeys } from './query-keys';

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
 * Updates a goal tree with progress rollup data from the server.
 *
 * Algorithm:
 * 1. Create a lookup map from updates array: Map<kpiId, AncestorProgressUpdate>
 * 2. Deep clone the tree structure using structuredClone()
 * 3. Call recursive updateNode() on each root node
 * 4. Return the cloned tree with updated values
 *
 * @param response - The current goal tree response from cache
 * @param updates - Array of ancestor progress updates from server rollup
 * @returns Updated goal tree response with server-accurate progress values
 */
function updateTreeWithRollup(
  response: GoalTreeResponse,
  updates: AncestorProgressUpdate[]
): GoalTreeResponse {
  if (!updates || updates.length === 0) {
    return response;
  }

  // Build lookup map: O(n) where n = updates.length
  const updateMap = new Map(updates.map(u => [u.kpiId, u]));

  // Deep clone to avoid mutating cache directly
  const clonedTree = structuredClone(response.tree);

  // Recursively update nodes
  function updateNode(node: KpiTreeNode): KpiTreeNode {
    const update = updateMap.get(node.id);
    if (update) {
      // Apply progress update from server (uses correct field names from AncestorProgressUpdate)
      node.progress = update.progressPercentage;
      node.status = update.status;
      node.childCount = update.childCount;
      node.completedChildCount = update.completedChildCount;
    }

    // Recurse into children
    if (node.children && node.children.length > 0) {
      node.children = node.children.map(updateNode);
    }

    return node;
  }

  return {
    ...response,
    tree: clonedTree.map(updateNode),
  };
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
  const response = await fetch(`/api/vision-kpis/${request.kpiId}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      progressPercentage: request.progress,
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
 * Return type for useLogKpi hook with enhanced state helpers
 */
export interface UseLogKpiReturn {
  mutate: (request: LogKpiRequest) => void;
  mutateAsync: (request: LogKpiRequest) => Promise<LogKpiResponse>;
  isPending: boolean;
  isLoggingKpi: boolean; // Semantic alias for isPending
  error: Error | null;
  reset: () => void;
}

/**
 * Hook to log a KPI value or completion with optimistic updates.
 *
 * The optimistic update immediately shows the KPI as complete (100%) or updated,
 * providing instant feedback. The server then returns accurate ancestor progress
 * which is applied directly to the cache (avoiding extra refetch).
 *
 * @param visionId - The vision ID for cache key targeting
 * @param options - Optional callbacks for onSuccess and onError
 * @returns React Query mutation result with optimistic updates and state helpers
 *
 * @example
 * ```tsx
 * function KpiCheckbox({ kpiId, visionId }: Props) {
 *   const { mutate: logKpi, isLoggingKpi } = useLogKpi(visionId);
 *
 *   const handleToggle = () => {
 *     logKpi({ kpiId, isCompleted: true });
 *   };
 *
 *   return <Checkbox onChange={handleToggle} disabled={isLoggingKpi} />;
 * }
 * ```
 */
export function useLogKpi(
  visionId: string | undefined,
  options?: {
    onSuccess?: (data: LogKpiResponse) => void;
    onError?: (error: Error) => void;
  }
): UseLogKpiReturn {
  const queryClient = useQueryClient();
  const queryKey = visionId ? goalTreeKeys.tree(visionId) : goalTreeKeys.trees();

  const mutation = useMutation<LogKpiResponse, Error, LogKpiRequest, MutationContext>({
    mutationFn: postKpiLog,

    onMutate: async (variables) => {
      // 1. Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey });

      // 2. Snapshot previous state for rollback
      const previousTree = queryClient.getQueryData<GoalTreeResponse>(queryKey);

      // 3. Optimistically update ONLY the logged KPI (not ancestors)
      // Ancestors will be updated after server returns accurate rollup
      if (previousTree) {
        const newProgress = variables.isCompleted ? 100 : (variables.value ?? 0);
        queryClient.setQueryData<GoalTreeResponse>(
          queryKey,
          updateSingleKpiProgress(previousTree, variables.kpiId, newProgress)
        );
      }

      // 4. Return context for rollback
      return { previousTree };
    },

    onError: (err, _variables, context) => {
      // Rollback to snapshot on failure
      if (context?.previousTree) {
        queryClient.setQueryData(queryKey, context.previousTree);
      }
      options?.onError?.(err);
    },

    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },

    onSettled: (data, error, _variables, context) => {
      if (data && !error) {
        // Update cache with server response (more accurate than optimistic)
        // This avoids an extra refetch by applying server-calculated values directly
        queryClient.setQueryData<GoalTreeResponse>(
          queryKey,
          (old: GoalTreeResponse | undefined) => {
            if (!old) return old;
            // Apply actual server progress values from rollup.updatedKpis
            return updateTreeWithRollup(old, data.rollup.updatedKpis);
          }
        );
      } else if (error) {
        // Ensure cache is invalidated if rollback failed or update was problematic
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isLoggingKpi: mutation.isPending, // Semantic alias
    error: mutation.error,
    reset: mutation.reset,
  };
}

/**
 * Return type for useOverrideProgress hook with enhanced state helpers
 */
export interface UseOverrideProgressReturn {
  mutate: (request: OverrideProgressRequest) => void;
  mutateAsync: (request: OverrideProgressRequest) => Promise<unknown>;
  isPending: boolean;
  isOverriding: boolean; // Semantic alias for isPending
  error: Error | null;
  reset: () => void;
}

/**
 * Hook to manually override a KPI's progress with optimistic updates.
 *
 * Used for setting arbitrary progress values (0-100) on any KPI.
 * The override is marked in the cache so automatic rollup won't overwrite it.
 *
 * @param visionId - The vision ID for cache key targeting
 * @param options - Optional callbacks for onSuccess and onError
 * @returns React Query mutation result with optimistic updates and state helpers
 *
 * @example
 * ```tsx
 * function ProgressSlider({ kpiId, visionId }: Props) {
 *   const { mutate: override, isOverriding } = useOverrideProgress(visionId);
 *
 *   const handleChange = (value: number) => {
 *     override({ kpiId, progress: value, reason: 'Manual adjustment' });
 *   };
 *
 *   return <Slider onChange={handleChange} disabled={isOverriding} />;
 * }
 * ```
 */
export function useOverrideProgress(
  visionId: string | undefined,
  options?: {
    onSuccess?: (data: unknown) => void;
    onError?: (error: Error) => void;
  }
): UseOverrideProgressReturn {
  const queryClient = useQueryClient();
  const queryKey = visionId ? goalTreeKeys.tree(visionId) : goalTreeKeys.trees();

  const mutation = useMutation<unknown, Error, OverrideProgressRequest, MutationContext>({
    mutationFn: postProgressOverride,

    onMutate: async (variables) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // 2. Snapshot previous state for rollback
      const previousTree = queryClient.getQueryData<GoalTreeResponse>(queryKey);

      // 3. Optimistically update the KPI with the new progress value
      if (previousTree) {
        queryClient.setQueryData<GoalTreeResponse>(
          queryKey,
          updateSingleKpiProgress(previousTree, variables.kpiId, variables.progress)
        );
      }

      // 4. Return context for rollback
      return { previousTree };
    },

    onError: (err, _variables, context) => {
      // Rollback to snapshot on failure
      if (context?.previousTree) {
        queryClient.setQueryData(queryKey, context.previousTree);
      }
      options?.onError?.(err);
    },

    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },

    onSettled: (data, error) => {
      // For overrides, always invalidate to get accurate tree state
      // (Override response may not include full rollup data)
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isOverriding: mutation.isPending, // Semantic alias
    error: mutation.error,
    reset: mutation.reset,
  };
}

/**
 * Input type for creating a new KPI manually
 */
export interface CreateKpiInput {
  visionId: string;
  title: string;
  description?: string;
  level: 'quarterly' | 'monthly' | 'weekly' | 'daily';
  parentKpiId?: string | null;
  targetValue?: string;
  unit?: string;
  numericTarget?: number;
  weight?: number;
  quarter?: number;
  month?: number;
}

/**
 * Response type from POST /api/vision-kpis for single KPI creation
 */
export interface CreateKpiResponse {
  kpis: Array<{
    id: string;
    vision_id: string;
    title: string;
    level: string;
    parent_kpi_id: string | null;
    weight: number;
    [key: string]: unknown;
  }>;
  count: number;
}

/**
 * Mutation hook for creating a new KPI manually.
 * Invalidates goal tree query on success to show new KPI.
 *
 * @param visionId - The vision ID to create the KPI under
 * @returns React Query mutation for creating KPIs
 *
 * @example
 * ```tsx
 * function AddKpiForm({ visionId }: Props) {
 *   const { mutate: createKpi, isPending } = useCreateKpi(visionId);
 *
 *   const handleSubmit = (data: CreateKpiInput) => {
 *     createKpi(data);
 *   };
 *
 *   return <Form onSubmit={handleSubmit} disabled={isPending} />;
 * }
 * ```
 */
export function useCreateKpi(visionId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<CreateKpiResponse, Error, CreateKpiInput>({
    mutationFn: async (input: CreateKpiInput) => {
      const response = await fetch('/api/vision-kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create KPI');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate goal tree to show new KPI immediately
      if (visionId) {
        queryClient.invalidateQueries({ queryKey: goalTreeKeys.tree(visionId) });
      }
    },
  });
}
