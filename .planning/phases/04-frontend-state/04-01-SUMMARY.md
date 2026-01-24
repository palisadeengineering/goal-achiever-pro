---
phase: 04-frontend-state
plan: 01
subsystem: frontend-hooks
tags: [react-query, optimistic-updates, mutations, hooks]

dependency-graph:
  requires:
    - "03-01: Goal tree API endpoint"
    - "03-02: KPI log endpoint with ancestor rollup"
  provides:
    - "useGoalTree hook for fetching KPI hierarchy"
    - "useLogKpi mutation with optimistic updates"
    - "useOverrideProgress mutation for manual overrides"
  affects:
    - "04-02: Dashboard components (will consume these hooks)"
    - "Future KPI UI components"

tech-stack:
  added:
    - "None (uses existing @tanstack/react-query)"
  patterns:
    - "Optimistic updates with rollback"
    - "Query key pattern ['goalTree', visionId]"
    - "Barrel export for hooks"

file-tracking:
  created:
    - "src/lib/hooks/use-goal-tree.ts"
    - "src/lib/hooks/use-kpi-mutations.ts"
    - "src/lib/hooks/index.ts"
  modified: []

decisions:
  - key: "optimistic-single-kpi"
    choice: "Only update logged KPI optimistically, not ancestors"
    rationale: "Accurate ancestor progress requires server calculation; invalidation fetches correct values"
  - key: "stale-time-30s"
    choice: "30 second stale time for goal tree query"
    rationale: "Balances freshness with reduced server load"

metrics:
  duration: "2 minutes"
  completed: "2026-01-24"
---

# Phase 04 Plan 01: React Query Hooks for Goal Tree Summary

React Query hooks for KPI hierarchy fetching and mutations with optimistic updates and rollback.

## One-liner

useGoalTree fetches nested KPI hierarchy; useLogKpi/useOverrideProgress mutate with optimistic single-node updates and server reconciliation.

## What Was Built

### 1. useGoalTree Hook (src/lib/hooks/use-goal-tree.ts)
- Fetches goal tree from `/api/goal-tree/{visionId}`
- Returns `GoalTreeResponse` with tree, metadata
- Query key: `['goalTree', visionId]`
- Enabled only when visionId provided
- 30s stale time, 5min cache time

### 2. useLogKpi Mutation (src/lib/hooks/use-kpi-mutations.ts)
- Posts to `/api/vision-kpis/{id}/log`
- Optimistic update: sets logged KPI to 100% (or value)
- Rollback: restores previous tree on error
- Invalidation: refetches for accurate ancestor progress

### 3. useOverrideProgress Mutation (src/lib/hooks/use-kpi-mutations.ts)
- Posts to `/api/kpi-progress/{id}/override`
- Same optimistic pattern as useLogKpi
- Accepts arbitrary progress value (0-100)

### 4. Barrel Export (src/lib/hooks/index.ts)
- Exports all hooks and types from single location
- Enables: `import { useGoalTree, useLogKpi } from '@/lib/hooks'`

## Commits

| Hash | Message |
|------|---------|
| 050e47e | feat(04-01): add useGoalTree React Query hook |
| 121dd8a | feat(04-01): add useLogKpi and useOverrideProgress mutations |
| 1faaa17 | feat(04-01): add hooks barrel export |

## Technical Decisions

### Optimistic Update Strategy
**Decision:** Update only the logged KPI node, not ancestors.

**Rationale:**
- Ancestor progress requires weighted calculation
- Server already calculates this in rollup response
- Immediate feedback on the action taken
- Query invalidation ensures accurate tree state

**Pattern:**
```typescript
onMutate: async (variables) => {
  const previousTree = queryClient.getQueryData(['goalTree', visionId]);
  queryClient.setQueryData(['goalTree', visionId],
    updateSingleKpiProgress(previousTree, variables.kpiId, 100)
  );
  return { previousTree };
}
onError: (err, vars, context) => {
  queryClient.setQueryData(['goalTree', visionId], context.previousTree);
}
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['goalTree', visionId] });
}
```

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- TypeScript compiles without errors
- All files created at specified paths
- Exports verified: useGoalTree, useLogKpi, useOverrideProgress
- API endpoint links verified:
  - use-goal-tree.ts -> /api/goal-tree/{visionId}
  - use-kpi-mutations.ts -> /api/vision-kpis/{id}/log

## Next Phase Readiness

Phase 04 Plan 02 can begin. Hooks are ready to be consumed by:
- Dashboard components displaying KPI tree
- KPI checkbox/toggle components for logging
- Progress slider components for overrides

### Example Integration

```tsx
function KpiNode({ kpi, visionId }) {
  const { mutate: logKpi, isPending } = useLogKpi(visionId);

  return (
    <Checkbox
      checked={kpi.progress >= 100}
      disabled={isPending}
      onChange={() => logKpi({ kpiId: kpi.id, isCompleted: true })}
    />
  );
}
```
