# Architecture Patterns: Cascading Goal/KPI System

**Domain:** Hierarchical Goal Tracking with KPI Roll-up
**Researched:** 2026-01-23
**Confidence:** HIGH (verified with existing schema and industry patterns)

## Executive Summary

Goal Achiever Pro already has the **hierarchy structure** in place (Vision -> KPIs -> quarterly/monthly/weekly/daily) but lacks **proper cascading linkage** and **progress roll-up calculations**. The architecture should add parent-child KPI relationships, implement hybrid progress calculation (cached + computed), and provide efficient tree-fetching APIs.

## Current State Analysis

### Existing Schema Structure

```
Vision (visions)
  |
  +-- Vision KPIs (vision_kpis) -- level: quarterly/monthly/weekly/daily
  |     BUT: parentKpiId exists but not consistently used
  |
  +-- Quarterly Targets (quarterly_targets)
  |     |
  |     +-- Power Goals (power_goals)
  |           |
  |           +-- Monthly Targets (monthly_targets)
  |                 |
  |                 +-- Weekly Targets (weekly_targets)
  |                       |
  |                       +-- Daily Actions (daily_actions)
```

### Identified Gaps

1. **KPI hierarchy is flat** - `parentKpiId` exists but cascade generation doesn't link KPIs hierarchically
2. **No automatic progress roll-up** - Progress calculated on-demand with N+1 queries
3. **Dual tracking systems** - Both KPIs (`vision_kpis`) and Targets (monthly/weekly/daily) track progress independently
4. **No cached aggregates** - Each API call re-computes progress from scratch

## Recommended Architecture

### Component Boundaries

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/Next.js)                      │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Goal Tree View   │  │ KPI Dashboard    │  │ Progress Widgets │  │
│  │ (CascadingPlan)  │  │ (KpiTracking)    │  │ (Today/Summary)  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                     │            │
│  ┌────────▼─────────────────────▼─────────────────────▼──────────┐ │
│  │              React Query Cache (TanStack Query)                │ │
│  │   - goal-tree/{visionId}    - kpi-progress/{visionId}         │ │
│  │   - daily-kpis/{date}       - progress-summary                │ │
│  └────────┬─────────────────────┬─────────────────────┬──────────┘ │
└───────────┼─────────────────────┼─────────────────────┼────────────┘
            │                     │                     │
┌───────────▼─────────────────────▼─────────────────────▼────────────┐
│                          API LAYER (Next.js)                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ /api/goal-tree   │  │ /api/kpi-logs    │  │ /api/progress    │  │
│  │ GET: fetch tree  │  │ POST: log value  │  │ GET: aggregates  │  │
│  │ with aggregates  │  │ triggers rollup  │  │ from cache       │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
└───────────┼─────────────────────┼─────────────────────┼────────────┘
            │                     │                     │
┌───────────▼─────────────────────▼─────────────────────▼────────────┐
│                      DATABASE (Supabase/PostgreSQL)                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    PROGRESS ROLLUP LAYER                      │  │
│  │  - kpi_progress_cache table (cached aggregates)               │  │
│  │  - Trigger: on kpi_logs INSERT/UPDATE -> recalc ancestors     │  │
│  │  - Trigger: on daily_actions status change -> recalc weekly   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │ vision_kpis │  │ kpi_logs    │  │ kpi_streaks │  │ targets   │  │
│  │ (hierarchy) │  │ (raw data)  │  │ (cached)    │  │ (actions) │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. Progress Logging Flow (Write Path)

```
User checks KPI -> POST /api/kpi-logs/{id}/log
                          │
                          ▼
                   Insert into kpi_logs
                          │
                          ▼
            ┌─────────────────────────────┐
            │ TRIGGER: after_kpi_log_change │
            │ 1. Update kpi_streaks        │
            │ 2. Recalculate parent KPI    │
            │ 3. Bubble up to quarterly    │
            └─────────────────────────────┘
```

#### 2. Progress Reading Flow (Read Path)

```
Dashboard loads -> GET /api/progress/summary
                          │
                          ▼
              Read from kpi_progress_cache
              (pre-computed aggregates)
                          │
                          ▼
              Return {dailyComplete, weeklyProgress,
                      monthlyProgress, quarterlyProgress}
```

#### 3. Tree Fetching Flow

```
CascadingPlanView loads -> GET /api/goal-tree/{visionId}?depth=4
                                    │
                                    ▼
                           Single recursive CTE query
                           Returns nested JSON structure
                                    │
                                    ▼
                           Frontend renders tree
                           (no additional fetches)
```

## Schema Enhancements

### 1. Strengthen KPI Parent-Child Links

```sql
-- Add explicit parent reference and computed rollup fields
ALTER TABLE vision_kpis ADD COLUMN IF NOT EXISTS
  parent_kpi_id UUID REFERENCES vision_kpis(id) ON DELETE SET NULL;

ALTER TABLE vision_kpis ADD COLUMN IF NOT EXISTS
  rollup_strategy TEXT DEFAULT 'average'; -- 'sum', 'average', 'min', 'max', 'count'

-- Add index for tree traversal
CREATE INDEX idx_vision_kpis_parent ON vision_kpis(parent_kpi_id);
CREATE INDEX idx_vision_kpis_vision_level ON vision_kpis(vision_id, level);
```

### 2. Progress Cache Table

```sql
CREATE TABLE kpi_progress_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES vision_kpis(id) ON DELETE CASCADE UNIQUE,

  -- Current period values
  current_value DECIMAL(15, 2) DEFAULT 0,
  target_value DECIMAL(15, 2),
  progress_percentage INTEGER DEFAULT 0,

  -- Child rollup data
  child_count INTEGER DEFAULT 0,
  children_completed INTEGER DEFAULT 0,

  -- Time-based aggregates
  daily_completion_rate DECIMAL(5, 2), -- % of days completed this period
  period_start_date DATE,
  period_end_date DATE,

  -- Metadata
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  calculation_version INTEGER DEFAULT 1
);

CREATE INDEX idx_kpi_progress_cache_kpi ON kpi_progress_cache(kpi_id);
```

### 3. Database Triggers for Roll-up

```sql
-- Function to recalculate KPI progress up the chain
CREATE OR REPLACE FUNCTION recalculate_kpi_progress()
RETURNS TRIGGER AS $$
DECLARE
  parent_id UUID;
  kpi_record RECORD;
BEGIN
  -- Get the KPI that was just logged
  SELECT * INTO kpi_record FROM vision_kpis WHERE id = NEW.kpi_id;

  -- Update this KPI's progress cache
  INSERT INTO kpi_progress_cache (kpi_id, current_value, progress_percentage, last_calculated_at)
  SELECT
    NEW.kpi_id,
    COALESCE(SUM(value), 0),
    CASE
      WHEN kpi_record.numeric_target > 0
      THEN LEAST(100, (COALESCE(SUM(value), 0) / kpi_record.numeric_target * 100)::INTEGER)
      ELSE 0
    END,
    now()
  FROM kpi_logs
  WHERE kpi_id = NEW.kpi_id
    AND log_date >= date_trunc('period', CURRENT_DATE) -- period depends on level
  ON CONFLICT (kpi_id) DO UPDATE SET
    current_value = EXCLUDED.current_value,
    progress_percentage = EXCLUDED.progress_percentage,
    last_calculated_at = EXCLUDED.last_calculated_at;

  -- Bubble up to parent
  parent_id := kpi_record.parent_kpi_id;
  WHILE parent_id IS NOT NULL LOOP
    -- Recalculate parent based on children
    UPDATE kpi_progress_cache
    SET
      progress_percentage = (
        SELECT AVG(progress_percentage)::INTEGER
        FROM kpi_progress_cache c
        JOIN vision_kpis k ON c.kpi_id = k.id
        WHERE k.parent_kpi_id = parent_id
      ),
      children_completed = (
        SELECT COUNT(*)
        FROM kpi_progress_cache c
        JOIN vision_kpis k ON c.kpi_id = k.id
        WHERE k.parent_kpi_id = parent_id AND c.progress_percentage >= 100
      ),
      last_calculated_at = now()
    WHERE kpi_id = parent_id;

    -- Move to next parent
    SELECT parent_kpi_id INTO parent_id FROM vision_kpis WHERE id = parent_id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_kpi_log_rollup
AFTER INSERT OR UPDATE ON kpi_logs
FOR EACH ROW
EXECUTE FUNCTION recalculate_kpi_progress();
```

## API Design

### Tree Fetching Endpoint

```typescript
// GET /api/goal-tree/{visionId}
// Query params: ?depth=4&includeProgress=true

interface GoalTreeResponse {
  vision: {
    id: string;
    title: string;
    progress: number; // aggregated from children
    kpis: KpiNode[];
    quarterlyTargets: QuarterlyNode[];
  };
}

interface KpiNode {
  id: string;
  level: 'quarterly' | 'monthly' | 'weekly' | 'daily';
  title: string;
  targetValue: string;
  currentValue: number;
  progressPercentage: number;
  children: KpiNode[]; // nested KPIs
}
```

### Progress Update Endpoint

```typescript
// POST /api/kpi-logs/{kpiId}/log
// Body: { date: string, value?: number, isCompleted?: boolean }

// Response includes updated progress for ancestors
interface LogResponse {
  log: KpiLog;
  updatedProgress: {
    kpiId: string;
    progress: number;
  }[]; // includes this KPI and all ancestors
}
```

### Bulk Progress Fetch

```typescript
// GET /api/progress/summary?visionId={id}&period=current
// Returns pre-computed aggregates from cache

interface ProgressSummary {
  daily: { completed: number; total: number; rate: number };
  weekly: { progress: number; kpisOnTrack: number };
  monthly: { progress: number; milestonesHit: number };
  quarterly: { progress: number; powerGoalsOnTrack: number };
  streaks: { best: number; average: number; total: number };
}
```

## Progress Calculation Strategy

### Recommended: Hybrid Approach (Cached + Computed)

| Layer | Strategy | Rationale |
|-------|----------|-----------|
| Daily KPIs | Eager (trigger) | High write frequency, low latency reads needed |
| Weekly aggregates | Lazy (on-read) | Weekly refresh acceptable |
| Monthly/Quarterly | Scheduled + on-demand | Lower frequency, larger calculations |

### Why Not Pure Eager?

1. **Write amplification** - Each daily check-off would trigger multiple UPDATEs up the chain
2. **Race conditions** - Concurrent check-offs could cause lost updates
3. **Complexity** - Trigger chains are hard to debug

### Why Not Pure Lazy?

1. **N+1 queries** - Current implementation already shows this problem
2. **Slow dashboards** - Users expect instant progress visualization
3. **Inconsistent views** - Stale reads between operations

### Recommended Implementation

```typescript
// On KPI log write
async function logKpiValue(kpiId: string, value: number, date: string) {
  // 1. Write log (trigger handles immediate parent update)
  await db.insert(kpiLogs).values({ kpiId, value, logDate: date });

  // 2. Invalidate React Query cache for this KPI's ancestors
  queryClient.invalidateQueries(['kpi-progress', kpiId]);

  // 3. Return updated progress (fetched from cache table)
  return await db.select().from(kpiProgressCache).where(eq(kpiId));
}

// On dashboard load
async function getProgressSummary(visionId: string) {
  // Read from cache table - no computation
  return await db
    .select()
    .from(kpiProgressCache)
    .innerJoin(visionKpis, eq(kpiProgressCache.kpiId, visionKpis.id))
    .where(eq(visionKpis.visionId, visionId));
}
```

## Frontend State Management

### React Query Configuration

```typescript
// queries/kpi-progress.ts
export const kpiProgressKeys = {
  all: ['kpi-progress'] as const,
  byVision: (visionId: string) => [...kpiProgressKeys.all, visionId] as const,
  tree: (visionId: string) => [...kpiProgressKeys.byVision(visionId), 'tree'] as const,
  summary: (visionId: string) => [...kpiProgressKeys.byVision(visionId), 'summary'] as const,
};

export function useKpiTree(visionId: string) {
  return useQuery({
    queryKey: kpiProgressKeys.tree(visionId),
    queryFn: () => fetchGoalTree(visionId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => normalizeTreeData(data), // Flatten for easier updates
  });
}

export function useLogKpi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logKpiValue,
    onSuccess: (data, variables) => {
      // Optimistic update for immediate feedback
      queryClient.setQueryData(
        kpiProgressKeys.tree(variables.visionId),
        (old) => updateTreeWithNewProgress(old, data.updatedProgress)
      );

      // Also invalidate summary to ensure consistency
      queryClient.invalidateQueries(kpiProgressKeys.summary(variables.visionId));
    },
  });
}
```

### Normalized Tree State

```typescript
// Flatten tree for efficient updates
interface NormalizedKpiState {
  byId: Record<string, KpiNode>;
  childrenByParent: Record<string, string[]>;
  rootIds: string[];
}

function normalizeTreeData(tree: GoalTreeResponse): NormalizedKpiState {
  const byId: Record<string, KpiNode> = {};
  const childrenByParent: Record<string, string[]> = {};

  function traverse(node: KpiNode, parentId?: string) {
    byId[node.id] = { ...node, children: [] }; // Remove nested children

    if (parentId) {
      childrenByParent[parentId] = childrenByParent[parentId] || [];
      childrenByParent[parentId].push(node.id);
    }

    node.children?.forEach(child => traverse(child, node.id));
  }

  tree.vision.kpis.forEach(kpi => traverse(kpi));

  return { byId, childrenByParent, rootIds: tree.vision.kpis.map(k => k.id) };
}
```

## Build Order Recommendations

Based on dependency analysis, build in this order:

### Phase 1: Schema Foundation (Must be first)

1. Add `parent_kpi_id` column to `vision_kpis` (migration)
2. Create `kpi_progress_cache` table (migration)
3. Update cascade generation to link KPI parent-child relationships

**Why first:** All other features depend on proper hierarchy linkage.

### Phase 2: Backend Progress Calculation

4. Create progress rollup trigger function
5. Create `/api/goal-tree` endpoint with recursive CTE
6. Create `/api/progress/summary` endpoint reading from cache

**Why second:** API must exist before frontend can use it.

### Phase 3: Frontend Integration

7. Add React Query hooks for tree/progress
8. Update `CascadingPlanView` to use tree API
9. Update `KpiTrackingPanel` to show hierarchical progress

**Why third:** Frontend consumes backend APIs.

### Phase 4: Polish & Optimization

10. Add optimistic updates for instant feedback
11. Implement background refresh for stale data
12. Add visual progress indicators in tree view

## Anti-Patterns to Avoid

### Anti-Pattern 1: Fetching Each Level Separately

**Bad:**
```typescript
const quarterly = await fetch('/api/kpis?level=quarterly');
const monthly = await fetch('/api/kpis?level=monthly'); // N+1!
const weekly = await fetch('/api/kpis?level=weekly');
```

**Good:**
```typescript
const tree = await fetch('/api/goal-tree?visionId=xxx&depth=4');
// Single request, nested response
```

### Anti-Pattern 2: Recomputing Progress on Every Read

**Bad:**
```typescript
// In API handler
const dailyKpis = await db.query('SELECT * FROM kpi_logs WHERE level = daily');
const progress = dailyKpis.reduce((sum, k) => sum + computeProgress(k), 0);
```

**Good:**
```typescript
// Read pre-computed cache
const progress = await db.query('SELECT * FROM kpi_progress_cache WHERE kpi_id = $1');
```

### Anti-Pattern 3: Storing Progress at Every Level Independently

**Bad:** Each level stores its own `progress_percentage` that must be manually synced.

**Good:** Single source of truth (cache table) computed from raw logs, with triggers maintaining consistency.

## Scalability Considerations

| Scale | Progress Strategy | Tree Fetching | Cache Invalidation |
|-------|-------------------|---------------|-------------------|
| 1-10 users | Compute on read | Single query | Immediate |
| 10-1K users | Hybrid (triggers + lazy) | With pagination | Debounced |
| 1K+ users | Background jobs | Materialized views | Event-driven |

For Goal Achiever Pro's current scale (likely < 1K users), the hybrid trigger approach is optimal.

## Sources

- [What Matters - Cascading OKRs](https://www.whatmatters.com/faqs/cascading-top-down-okr-examples)
- [Weekdone - Stop Cascading, Start Aligning](https://weekdone.com/resources/articles/goal-alignment)
- [Citus Data - Materialized Views vs Rollup Tables](https://www.citusdata.com/blog/2018/10/31/materialized-views-vs-rollup-tables/)
- [Hashrocket - Materialized View Strategies](https://hashrocket.com/blog/posts/materialized-view-strategies-using-postgresql)
- [PostgreSQL Triggers Documentation](https://www.postgresql.org/docs/current/trigger-definition.html)
- [Supabase - Postgres Triggers](https://supabase.com/docs/guides/database/postgres/triggers)
- [TanStack Query - Nested Data Discussion](https://github.com/TanStack/query/discussions/6150)
- [REST API Design - Sub and Nested Resources](https://www.moesif.com/blog/technical/api-design/REST-API-Design-Best-Practices-for-Sub-and-Nested-Resources/)
- [The Linux Code - PostgreSQL Triggers in 2026](https://thelinuxcode.com/postgresql-triggers-in-2026-design-performance-and-production-reality/)
