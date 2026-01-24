/**
 * Query Key Factory for Goal Tree
 *
 * Centralized query key management following TanStack Query best practices.
 * Hierarchical structure enables targeted cache invalidation:
 *
 * - goalTreeKeys.all -> invalidates everything
 * - goalTreeKeys.trees() -> invalidates all trees
 * - goalTreeKeys.tree(visionId) -> invalidates specific vision's tree
 * - goalTreeKeys.kpis(visionId) -> invalidates all KPIs under a vision
 * - goalTreeKeys.kpi(visionId, kpiId) -> invalidates specific KPI
 * - goalTreeKeys.logs(visionId, kpiId) -> invalidates specific KPI's logs
 *
 * Usage:
 *   import { goalTreeKeys } from '@/lib/hooks';
 *   queryClient.invalidateQueries({ queryKey: goalTreeKeys.tree(visionId) });
 */

export const goalTreeKeys = {
  all: ['goalTree'] as const,

  trees: () => [...goalTreeKeys.all, 'tree'] as const,
  tree: (visionId: string) => [...goalTreeKeys.trees(), visionId] as const,

  kpis: (visionId: string) => [...goalTreeKeys.tree(visionId), 'kpi'] as const,
  kpi: (visionId: string, kpiId: string) => [...goalTreeKeys.kpis(visionId), kpiId] as const,

  logs: (visionId: string, kpiId: string) => [...goalTreeKeys.kpi(visionId, kpiId), 'logs'] as const,

  // Convenience methods for invalidation patterns
  invalidateTree: (visionId: string) => goalTreeKeys.tree(visionId),
  invalidateAllTrees: () => goalTreeKeys.trees(),
};

// Type helper for query key inference
export type GoalTreeKeys = typeof goalTreeKeys;
