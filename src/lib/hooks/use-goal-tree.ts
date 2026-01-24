'use client';

/**
 * Goal Tree Hook
 *
 * React Query hook for fetching the KPI goal tree hierarchy for a vision.
 * Provides loading, error, and refetch states with automatic caching.
 *
 * Enhanced with:
 * - Centralized query keys for targeted invalidation
 * - Loading state indicators (isLoading, isRefetching, isUpdating)
 *
 * Usage:
 *   const { data, isLoading, isUpdating, error, refetch } = useGoalTree(visionId);
 */

import { useQuery } from '@tanstack/react-query';
import type { KpiTreeNode } from '@/lib/progress';
import { goalTreeKeys } from './query-keys';

/**
 * Response shape from GET /api/goal-tree/[visionId]
 */
export interface GoalTreeResponse {
  visionId: string;
  tree: KpiTreeNode[];
  metadata: {
    totalKpis: number;
    lastCalculated: string | null;
    duration: number;
  };
}

/**
 * Fetches the goal tree for a given vision ID
 */
async function fetchGoalTree(visionId: string): Promise<GoalTreeResponse> {
  const response = await fetch(`/api/goal-tree/${visionId}`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Failed to fetch goal tree: ${response.status}`);
  }

  return response.json();
}

/**
 * Return type for useGoalTree hook with enhanced loading states
 */
export interface UseGoalTreeReturn {
  data: GoalTreeResponse | undefined;
  isLoading: boolean;       // Initial load (no data yet)
  isRefetching: boolean;    // Background refetch (has data, updating)
  isUpdating: boolean;      // Alias for isRefetching (semantic clarity for progress updates)
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch and cache the KPI goal tree hierarchy for a vision.
 *
 * @param visionId - The vision ID to fetch the tree for (skips fetch if undefined/empty)
 * @returns Enhanced result with loading states for initial load vs background updates
 *
 * @example
 * ```tsx
 * function GoalTreeView({ visionId }: { visionId: string }) {
 *   const { data, isLoading, isUpdating, error, refetch } = useGoalTree(visionId);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return (
 *     <>
 *       {isUpdating && <UpdateIndicator />}
 *       <TreeDisplay tree={data.tree} />
 *     </>
 *   );
 * }
 * ```
 */
export function useGoalTree(visionId: string | undefined): UseGoalTreeReturn {
  const query = useQuery<GoalTreeResponse, Error>({
    queryKey: goalTreeKeys.tree(visionId ?? ''),
    queryFn: () => fetchGoalTree(visionId!),
    enabled: Boolean(visionId && visionId.trim().length > 0),
    staleTime: 30_000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isUpdating: query.isRefetching, // Semantic alias for progress recalculation
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Get the query key for a specific vision's goal tree.
 * Useful for external cache manipulation.
 *
 * @param visionId - The vision ID
 * @returns Query key array for use with queryClient methods
 */
export function getGoalTreeQueryKey(visionId: string) {
  return goalTreeKeys.tree(visionId);
}
