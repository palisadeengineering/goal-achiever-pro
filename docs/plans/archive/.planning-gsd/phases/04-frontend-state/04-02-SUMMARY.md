---
phase: 04-frontend-state
plan: 02
subsystem: query-cache
tags: [react-query, cache-invalidation, query-keys, loading-states]
completed: 2026-01-24
duration: ~3 minutes

dependency-graph:
  requires: [04-01]
  provides: [query-key-factory, targeted-invalidation, loading-states]
  affects: [05-dashboard-components]

tech-stack:
  patterns:
    - Query key factory pattern (TanStack Query best practice)
    - Hierarchical cache invalidation
    - Server response reconciliation

key-files:
  created:
    - src/lib/hooks/query-keys.ts
  modified:
    - src/lib/hooks/use-goal-tree.ts
    - src/lib/hooks/use-kpi-mutations.ts
    - src/lib/hooks/index.ts

decisions:
  - key: query-key-hierarchy
    choice: Hierarchical keys with factory pattern
    rationale: Enables partial invalidation (single vision vs all trees)

metrics:
  tasks: 3/3
  commits: 3
---

# Phase 04 Plan 02: Query Key Factory and Cache Invalidation Summary

**One-liner:** Hierarchical query key factory with targeted cache invalidation and loading state indicators for efficient tree updates.

## What Was Built

### 1. Query Key Factory (`src/lib/hooks/query-keys.ts`)

Centralized query key management following TanStack Query best practices:

```typescript
export const goalTreeKeys = {
  all: ['goalTree'] as const,
  trees: () => [...goalTreeKeys.all, 'tree'] as const,
  tree: (visionId: string) => [...goalTreeKeys.trees(), visionId] as const,
  kpis: (visionId: string) => [...goalTreeKeys.tree(visionId), 'kpi'] as const,
  kpi: (visionId: string, kpiId: string) => [...goalTreeKeys.kpis(visionId), kpiId] as const,
  logs: (visionId: string, kpiId: string) => [...goalTreeKeys.kpi(visionId, kpiId), 'logs'] as const,
};
```

**Key capability:** Invalidating `goalTreeKeys.tree(visionId)` invalidates only that vision's tree, not unrelated visions.

### 2. Enhanced useGoalTree Hook

Added loading state indicators for UI feedback:

```typescript
interface UseGoalTreeReturn {
  data: GoalTreeResponse | undefined;
  isLoading: boolean;       // Initial load (no data yet)
  isRefetching: boolean;    // Background refetch
  isUpdating: boolean;      // Alias for isRefetching (semantic clarity)
  error: Error | null;
  refetch: () => void;
}
```

**Usage:** `{isUpdating && <UpdateIndicator />}` shows when progress is being recalculated.

### 3. Enhanced Mutation Hooks

**Server Response Reconciliation:** Instead of just invalidating cache, mutations now apply server response data directly:

```typescript
onSettled: (data, error) => {
  if (data && !error) {
    queryClient.setQueryData(queryKey, (old) =>
      updateTreeWithRollup(old, data.rollup.updatedKpis)
    );
  }
}
```

**Algorithm for `updateTreeWithRollup`:**
1. Build O(1) lookup map from updates array
2. Deep clone tree with structuredClone()
3. Recursively apply server progress values
4. Return updated tree without network refetch

**State helpers:** `isLoggingKpi`, `isOverriding` for semantic clarity.

## Commits

| Hash | Description |
|------|-------------|
| `a41e880` | Add query key factory for goal tree |
| `ef775ca` | Enhance hooks with query key factory and loading states |
| `1c9ec62` | Export query keys from hooks barrel |

## Deviations from Plan

None - plan executed exactly as written.

## Files Modified

| File | Change |
|------|--------|
| `src/lib/hooks/query-keys.ts` | Created - Query key factory |
| `src/lib/hooks/use-goal-tree.ts` | Enhanced with factory keys and loading states |
| `src/lib/hooks/use-kpi-mutations.ts` | Enhanced with factory keys and server reconciliation |
| `src/lib/hooks/index.ts` | Added query key exports |

## Success Criteria Verification

| Criteria | Status |
|----------|--------|
| Query keys follow hierarchical pattern | PASS |
| Invalidating tree(visionId) invalidates related queries | PASS |
| Loading states (isLoading, isRefetching) available | PASS |
| Cache updates with server response data | PASS |
| All files compile with TypeScript | PASS |

## Next Phase Readiness

**Delivers to Phase 5:**
- `goalTreeKeys` - Query key factory for cache manipulation
- `useGoalTree` - Enhanced with loading state indicators
- `useLogKpi` / `useOverrideProgress` - Mutations with server reconciliation

**Ready for:** Dashboard components can now show:
- Loading spinners during initial load
- Update indicators during progress recalculation
- Fast progress updates without full page reload
