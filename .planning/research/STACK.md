# Technology Stack: KPI/Goal Cascading System

**Project:** Goal Achiever Pro - KPI Cascade Milestone
**Researched:** 2026-01-23
**Overall Confidence:** HIGH

## Executive Summary

The existing stack (Next.js 16.1.1, React Query, Zustand, Drizzle ORM, Supabase) is well-suited for implementing a cascading KPI/goal system. **No new major libraries are required.** The key is leveraging the existing tools with the right patterns:

1. **React Query** (already v5.90.16) handles server state with built-in optimistic update support
2. **Zustand** (already v5.0.9) handles UI state with Immer middleware for nested updates
3. **Drizzle ORM + PostgreSQL** handles hierarchical queries with recursive CTEs where needed
4. **Supabase Realtime** (optional) for multi-user real-time sync

The architecture should use **React Query as the single source of truth for hierarchical goal data** with a carefully designed query key structure that enables efficient cascading invalidation.

---

## Recommended Stack

### Keep Existing (No Changes Required)

| Technology | Current Version | Purpose | Confidence |
|------------|-----------------|---------|------------|
| @tanstack/react-query | 5.90.16 | Server state, optimistic updates, cache | HIGH |
| zustand | 5.0.9 | Client UI state | HIGH |
| drizzle-orm | 0.45.1 | Type-safe SQL, relations | HIGH |
| @supabase/supabase-js | 2.89.0 | Database, auth, optional realtime | HIGH |

### Add (Minor Dependencies)

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| immer | ^11.1.3 | Nested state updates in Zustand | HIGH |
| zustand/middleware/immer | (bundled) | Zustand Immer integration | HIGH |

**Why Immer:** The existing codebase uses spread operators for simple state. KPI cascading requires updating deeply nested structures (Vision -> Quarter -> Month -> Week -> Day). Immer simplifies this significantly and is already bundled with Zustand middleware. Version 11.x includes 50-80% performance improvements over 10.x.

```bash
# Only addition needed
npm install immer
```

---

## Architecture Recommendations

### 1. Hierarchical Query Key Structure (HIGH Confidence)

Design query keys to enable targeted invalidation at any level of the cascade:

```typescript
// Query key factory pattern
const goalKeys = {
  all: ['goals'] as const,
  visions: () => [...goalKeys.all, 'visions'] as const,
  vision: (id: string) => [...goalKeys.visions(), id] as const,
  visionKpis: (visionId: string) => [...goalKeys.vision(visionId), 'kpis'] as const,

  // Hierarchical time-based keys
  quarterly: (visionId: string, year: number, quarter: number) =>
    [...goalKeys.vision(visionId), 'quarterly', year, quarter] as const,
  monthly: (visionId: string, year: number, month: number) =>
    [...goalKeys.vision(visionId), 'monthly', year, month] as const,
  weekly: (visionId: string, weekStart: string) =>
    [...goalKeys.vision(visionId), 'weekly', weekStart] as const,
  daily: (visionId: string, date: string) =>
    [...goalKeys.vision(visionId), 'daily', date] as const,

  // Progress aggregation
  progress: (visionId: string) => [...goalKeys.vision(visionId), 'progress'] as const,
};
```

**Rationale:** This structure allows:
- Invalidating all goals: `queryClient.invalidateQueries({ queryKey: goalKeys.all })`
- Invalidating one vision and all its children: `queryClient.invalidateQueries({ queryKey: goalKeys.vision(id) })`
- Surgical updates to specific time periods

**Source:** [Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)

### 2. Optimistic Updates Pattern (HIGH Confidence)

For marking items complete (the core UX interaction):

```typescript
const useCompleteAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (actionId: string) => {
      return fetch(`/api/actions/${actionId}/complete`, { method: 'POST' });
    },

    // Optimistic update for immediate UX
    onMutate: async (actionId) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: goalKeys.all });

      // Snapshot current state for rollback
      const previousState = queryClient.getQueriesData({ queryKey: goalKeys.all });

      // Optimistically update the action
      queryClient.setQueryData(
        goalKeys.daily(visionId, date),
        (old: DailyAction[]) => old.map(a =>
          a.id === actionId ? { ...a, status: 'completed', completedAt: new Date() } : a
        )
      );

      // Optimistically update roll-up progress (parent levels)
      // This is where the cascading magic happens
      queryClient.setQueryData(
        goalKeys.progress(visionId),
        (old: ProgressData) => calculateOptimisticProgress(old, actionId)
      );

      return { previousState };
    },

    onError: (err, actionId, context) => {
      // Rollback on error
      context?.previousState?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },

    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: goalKeys.progress(visionId) });
    },
  });
};
```

**Source:** [TanStack Query Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

### 3. Progress Roll-Up Strategy (MEDIUM Confidence)

**Option A: Client-Side Aggregation (Recommended for MVP)**

Calculate progress on the client from existing data:

```typescript
// Calculate progress from cached data
function useVisionProgress(visionId: string) {
  const { data: dailyActions } = useQuery(goalKeys.daily(visionId, date));
  const { data: weeklyTargets } = useQuery(goalKeys.weekly(visionId, weekStart));
  // ... other queries

  return useMemo(() => {
    const dailyCompletion = dailyActions?.filter(a => a.status === 'completed').length / dailyActions?.length;
    const weeklyCompletion = weeklyTargets?.filter(t => t.status === 'completed').length / weeklyTargets?.length;
    // Roll up calculation
    return {
      daily: dailyCompletion,
      weekly: weeklyCompletion,
      overall: (dailyCompletion * 0.4 + weeklyCompletion * 0.3 + ...) // weighted
    };
  }, [dailyActions, weeklyTargets]);
}
```

**Option B: Server-Side Aggregation with Cached Results**

For scale, use PostgreSQL window functions or materialized views:

```sql
-- Example: Recursive progress aggregation
WITH RECURSIVE progress_tree AS (
  -- Base case: daily actions with completion status
  SELECT
    da.weekly_target_id as parent_id,
    da.id,
    CASE WHEN da.status = 'completed' THEN 1.0 ELSE 0.0 END as progress,
    'daily' as level
  FROM daily_actions da
  WHERE da.user_id = $1

  UNION ALL

  -- Recursive case: aggregate up
  SELECT
    wt.monthly_target_id,
    wt.id,
    AVG(pt.progress),
    'weekly'
  FROM weekly_targets wt
  JOIN progress_tree pt ON pt.parent_id = wt.id
  GROUP BY wt.id, wt.monthly_target_id
)
SELECT * FROM progress_tree;
```

**Why MEDIUM confidence:** Drizzle ORM doesn't natively support `WITH RECURSIVE` - you'll need raw SQL via `db.execute()`. This is a known limitation.

**Source:** [Drizzle ORM recursive relationships](https://wanago.io/2024/10/21/api-nestjs-drizzle-postgresql-recursive-relationships/)

### 4. Zustand for UI State with Immer (HIGH Confidence)

Use Zustand + Immer for:
- Selected vision/goal context
- Expanded/collapsed state in hierarchy views
- Filter/sort preferences
- Pending optimistic updates queue

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

interface GoalUIState {
  selectedVisionId: string | null;
  expandedNodes: Record<string, boolean>;
  pendingUpdates: Map<string, 'pending' | 'success' | 'error'>;

  // Actions
  setSelectedVision: (id: string | null) => void;
  toggleNode: (nodeId: string) => void;
  expandToNode: (path: string[]) => void;
  setPendingUpdate: (id: string, status: 'pending' | 'success' | 'error') => void;
}

export const useGoalUIStore = create<GoalUIState>()(
  persist(
    immer((set) => ({
      selectedVisionId: null,
      expandedNodes: {},
      pendingUpdates: new Map(),

      setSelectedVision: (id) => set((state) => {
        state.selectedVisionId = id;
      }),

      toggleNode: (nodeId) => set((state) => {
        state.expandedNodes[nodeId] = !state.expandedNodes[nodeId];
      }),

      expandToNode: (path) => set((state) => {
        path.forEach(nodeId => {
          state.expandedNodes[nodeId] = true;
        });
      }),

      setPendingUpdate: (id, status) => set((state) => {
        state.pendingUpdates.set(id, status);
      }),
    })),
    { name: 'gap-goal-ui' }
  )
);
```

**Source:** [Zustand Immer Middleware](https://zustand.docs.pmnd.rs/guides/updating-state)

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| State Management | React Query + Zustand | Redux Toolkit | Already using RQ+Zustand; no benefit to switching |
| Nested Updates | Immer | Spread operators | Immer is cleaner for deep nesting, negligible bundle cost |
| Real-time | Supabase Realtime (optional) | Pusher/Socket.io | Already have Supabase; don't add another service |
| Recursive Queries | Raw SQL via Drizzle | Prisma | Already using Drizzle; Prisma also lacks recursive CTE support |
| Client Caching | React Query | SWR | RQ has better mutation/optimistic update support |

---

## What NOT to Use

| Technology | Reason |
|------------|--------|
| **jotai** | Would add competing state model alongside Zustand |
| **valtio** | Proxy-based; different paradigm from existing code |
| **Apollo Client** | You're not using GraphQL |
| **Recoil** | Facebook has deprioritized it; RQ is better for server state |
| **Custom WebSocket** | Supabase Realtime handles this if needed |
| **Materialized Views (initially)** | Premature optimization; client-side aggregation works for <10k items |

---

## Implementation Notes

### Database Schema Status

The existing schema already has:
- **Hierarchical structure:** `visions` -> `quarterly_targets` -> `power_goals` -> `monthly_targets` -> `weekly_targets` -> `daily_actions`
- **KPI hierarchy:** `vision_kpis` with `parent_kpi_id` for self-referencing
- **Progress tracking:** `progress_percentage` columns on `quarterly_targets`, `power_goals`, and `key_results`

**Recommended index additions for cascade query performance:**

```sql
CREATE INDEX idx_daily_actions_weekly ON daily_actions(weekly_target_id, status);
CREATE INDEX idx_weekly_targets_monthly ON weekly_targets(monthly_target_id, status);
CREATE INDEX idx_monthly_targets_goal ON monthly_targets(power_goal_id, status);
```

### API Route Structure

```
/api/visions/[id]/progress          # GET aggregated progress
/api/goals/[id]/cascade             # GET full hierarchy for one goal
/api/actions/[id]/complete          # POST mark complete (triggers roll-up)
/api/kpis/[id]/log                  # POST log KPI value
```

### Real-time Considerations

For single-user: **Not needed.** React Query's refetch-on-focus handles freshness.

For multi-user/team dashboards: Use Supabase Realtime:

```typescript
// Optional: Real-time subscription for team views
useEffect(() => {
  const channel = supabase
    .channel('goal-updates')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'daily_actions' },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: goalKeys.daily(visionId, payload.new.action_date) });
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [visionId]);
```

**Source:** [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs)

---

## Performance Expectations

| Scenario | Approach | Expected Latency |
|----------|----------|------------------|
| Mark action complete | Optimistic update | <50ms perceived |
| View vision progress | Client aggregation | <100ms (cached) |
| Load full hierarchy | Parallel queries | <500ms initial, <50ms cached |
| Roll-up recalculation | Background invalidation | 200-500ms |

---

## Confidence Summary

| Area | Confidence | Rationale |
|------|------------|-----------|
| React Query patterns | HIGH | Well-documented, verified via official docs |
| Zustand + Immer | HIGH | Standard pattern, bundled middleware |
| Drizzle for hierarchy | MEDIUM | Self-ref relations work; recursive CTEs need raw SQL |
| Client-side aggregation | HIGH | Standard React pattern, no external deps |
| Supabase Realtime | MEDIUM | Works but may not be needed for MVP |
| Progress roll-up perf | MEDIUM | Depends on data volume; needs testing at scale |

---

## Sources

**Official Documentation:**
- [TanStack Query v5 Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Zustand Updating State](https://zustand.docs.pmnd.rs/guides/updating-state)
- [Drizzle ORM Relations](https://orm.drizzle.team/docs/relations-v2)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [PostgreSQL WITH RECURSIVE](https://www.postgresql.org/docs/current/queries-with.html)

**Community Patterns:**
- [Effective React Query Keys - TkDodo](https://tkdodo.eu/blog/effective-react-query-keys)
- [Concurrent Optimistic Updates - TkDodo](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)
- [Drizzle Recursive Relationships](https://wanago.io/2024/10/21/api-nestjs-drizzle-postgresql-recursive-relationships/)
- [Zustand Architecture at Scale](https://brainhub.eu/library/zustand-architecture-patterns-at-scale)
- [Immer npm package](https://www.npmjs.com/package/immer)

---

## Installation Summary

```bash
# Only new dependency
npm install immer

# No other changes to package.json required
```

**Total bundle impact:** ~5KB gzipped (Immer)
