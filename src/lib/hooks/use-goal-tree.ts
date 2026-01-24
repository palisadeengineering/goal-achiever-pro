'use client';

/**
 * Goal Tree Hook
 *
 * React Query hook for fetching the KPI goal tree hierarchy for a vision.
 * Provides loading, error, and refetch states with automatic caching.
 *
 * Usage:
 *   const { data, isLoading, error, refetch } = useGoalTree(visionId);
 */

import { useQuery } from '@tanstack/react-query';
import type { KpiTreeNode } from '@/lib/progress';

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
 * Hook to fetch and cache the KPI goal tree hierarchy for a vision.
 *
 * @param visionId - The vision ID to fetch the tree for (skips fetch if undefined/empty)
 * @returns React Query result with tree data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * function GoalTreeView({ visionId }: { visionId: string }) {
 *   const { data, isLoading, error, refetch } = useGoalTree(visionId);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return <TreeDisplay tree={data.tree} />;
 * }
 * ```
 */
export function useGoalTree(visionId: string | undefined) {
  return useQuery<GoalTreeResponse, Error>({
    queryKey: ['goalTree', visionId],
    queryFn: () => fetchGoalTree(visionId!),
    enabled: Boolean(visionId && visionId.trim().length > 0),
    staleTime: 30_000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}
