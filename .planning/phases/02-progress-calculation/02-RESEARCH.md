# Phase 2: Progress Calculation - Research

**Researched:** 2026-01-23
**Domain:** PostgreSQL hierarchical progress aggregation, weighted calculations, Supabase triggers
**Confidence:** HIGH

## Summary

This phase implements automatic progress rollup calculations when KPI completions occur. The research examined three key areas: (1) hierarchical progress calculation strategies in PostgreSQL, (2) weighted averaging formulas for goal tracking systems, and (3) manual override patterns that preserve accountability.

The recommended approach is a **hybrid application-layer strategy** where progress calculations happen in Next.js API routes with React Query cache invalidation, using the existing `kpi_progress_cache` table as a read-optimized store. Database triggers are NOT recommended for this use case due to debugging complexity, testing difficulty, and the need for transparent formula explanations that must be computed dynamically.

**Primary recommendation:** Calculate progress in application layer when KPI logs are written, update the cache table synchronously, and expose a formula breakdown endpoint for UI transparency.

## Standard Stack

### Core (Already in Codebase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase PostgreSQL | N/A | Database with recursive CTE support | Already in use, supports WITH RECURSIVE |
| Drizzle ORM | Existing | Type-safe database access | Already in use, no change needed |
| React Query | Existing | Cache invalidation on mutations | Already in use, mutation callbacks available |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| decimal.js | ^10.4 | Precision decimal arithmetic | Weighted percentage calculations to avoid float errors |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Application-layer calc | PostgreSQL triggers | Triggers harder to debug, test, and don't provide formula breakdown for UI |
| Synchronous cache update | Background job | Real-time feedback is requirement, <100ms target |
| Weighted average | Simple average | User requirement PROG-03 specifies weight support |

**Installation:**
```bash
npm install decimal.js
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── progress/
│       ├── calculator.ts        # Core calculation logic
│       ├── types.ts            # ProgressFormula, WeightedKPI types
│       └── rollup.ts           # Hierarchical rollup functions
├── app/api/
│   ├── vision-kpis/
│   │   └── [id]/
│   │       └── progress/
│   │           └── route.ts    # Progress cache update endpoint
│   └── progress/
│       └── formula/
│           └── route.ts        # Formula breakdown endpoint
└── components/features/progress/
    └── progress-formula-display.tsx  # Transparent formula UI
```

### Pattern 1: Hierarchical Progress Rollup via Recursive CTE
**What:** Use PostgreSQL's `WITH RECURSIVE` to traverse the KPI tree from a changed node up to root, then calculate progress at each level.
**When to use:** When fetching all ancestor KPIs to update their progress after a leaf KPI changes.
**Example:**
```sql
-- Source: PostgreSQL Documentation 18: WITH Queries
WITH RECURSIVE kpi_ancestors AS (
  -- Anchor: start with the changed KPI
  SELECT id, parent_kpi_id, level, 1 as depth
  FROM vision_kpis
  WHERE id = $1

  UNION ALL

  -- Recursive: traverse up the tree
  SELECT p.id, p.parent_kpi_id, p.level, ka.depth + 1
  FROM vision_kpis p
  INNER JOIN kpi_ancestors ka ON p.id = ka.parent_kpi_id
)
SELECT * FROM kpi_ancestors ORDER BY depth DESC;
```

### Pattern 2: Weighted Progress Calculation
**What:** Calculate parent progress as weighted sum of child progress values.
**When to use:** When children have different importance weights.
**Example:**
```typescript
// Source: Verified against OKR industry patterns (Lattice, PeopleForce)
interface WeightedKPI {
  id: string;
  progress: number; // 0-100
  weight: number;   // User-assigned weight, default 1
}

function calculateWeightedProgress(children: WeightedKPI[]): number {
  if (children.length === 0) return 0;

  const totalWeight = children.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = children.reduce(
    (sum, c) => sum + (c.progress * c.weight),
    0
  );

  return Math.round((weightedSum / totalWeight) * 100) / 100;
}
```

### Pattern 3: Manual Override with Preserved Auto-Calculation
**What:** Store both calculated and override values, with reason field for accountability.
**When to use:** When user needs to correct automated progress (PROG-04 requirement).
**Example:**
```typescript
// Progress cache update logic
async function updateProgressCache(kpiId: string, options: {
  manualOverride?: number;
  overrideReason?: string;
}) {
  const calculatedProgress = await calculateProgress(kpiId);

  const updateData = {
    progress_percentage: options.manualOverride ?? calculatedProgress,
    calculation_method: options.manualOverride ? 'manual_override' : 'auto',
    manual_override_reason: options.overrideReason || null,
    last_calculated_at: new Date().toISOString(),
  };

  // Always store what auto-calc would produce for transparency
  if (options.manualOverride) {
    updateData.weighted_progress = calculatedProgress; // Store original calc
  }

  await db.update(kpiProgressCache).set(updateData).where(eq(kpiId));
}
```

### Anti-Patterns to Avoid
- **Trigger Cascade Loops:** PostgreSQL triggers firing recursively on the same table can cause infinite loops. Use `pg_trigger_depth()` guard if triggers are ever added.
- **Float Arithmetic for Percentages:** JavaScript floats cause rounding errors (0.1 + 0.2 !== 0.3). Use decimal.js or integer percentages (0-10000 for 0.00-100.00%).
- **Calculating Progress on Every Read:** Expensive recursive calculations should happen on writes, cached results served on reads.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decimal percentage math | Manual float arithmetic | decimal.js | Float precision errors compound in multi-level hierarchies |
| Recursive tree traversal | Loop-based parent fetching | PostgreSQL WITH RECURSIVE | Database-level recursion is faster and atomic |
| Cache invalidation | Custom pubsub | React Query mutation callbacks | Already integrated, handles refetch automatically |
| Weight normalization | Custom percentage calc | Standard weighted average formula | Industry-tested OKR formula from Lattice/PeopleForce |

**Key insight:** The hard part isn't the calculation itself - it's keeping the cache consistent with source data across all update paths (KPI log, weight change, manual override, KPI deletion).

## Common Pitfalls

### Pitfall 1: Orphaned Cache Entries
**What goes wrong:** Deleting a KPI leaves orphaned cache entries that never get cleaned up.
**Why it happens:** Soft deletes (`is_active = false`) don't cascade to cache table.
**How to avoid:** Add cleanup logic to KPI deletion API route, or use ON DELETE CASCADE in FK constraint (already present in Phase 1 schema).
**Warning signs:** Cache table row count grows while active KPI count stays stable.

### Pitfall 2: Race Condition on Concurrent Updates
**What goes wrong:** Two simultaneous KPI completions for siblings cause incorrect parent progress.
**Why it happens:** Both reads see same child counts, both writes produce wrong aggregate.
**How to avoid:** Use database transaction with SELECT FOR UPDATE when reading children for aggregation, or accept eventual consistency with <100ms staleness.
**Warning signs:** Progress percentages that don't match manual calculation.

### Pitfall 3: Stale Cache After Weight Changes
**What goes wrong:** User changes KPI weight but parent progress doesn't update.
**Why it happens:** Weight changes don't trigger cache recalculation.
**How to avoid:** Weight update API must also trigger parent recalculation cascade.
**Warning signs:** Weighted formula shows correct breakdown but total is wrong.

### Pitfall 4: Manual Override Lost on Recalculation
**What goes wrong:** User overrides progress, then logs a child completion - override is replaced.
**Why it happens:** Recalculation doesn't check if manual override exists.
**How to avoid:** If `calculation_method = 'manual_override'`, skip auto-recalculation unless explicitly requested.
**Warning signs:** User complaints about overrides "disappearing."

## Code Examples

Verified patterns from official sources and codebase analysis:

### Recursive Ancestor Fetch
```typescript
// Based on existing Drizzle patterns in codebase
import { sql } from 'drizzle-orm';

async function getKpiAncestors(kpiId: string) {
  const result = await db.execute(sql`
    WITH RECURSIVE kpi_ancestors AS (
      SELECT id, parent_kpi_id, level, title
      FROM vision_kpis
      WHERE id = ${kpiId}

      UNION ALL

      SELECT p.id, p.parent_kpi_id, p.level, p.title
      FROM vision_kpis p
      INNER JOIN kpi_ancestors ka ON p.id = ka.parent_kpi_id
    )
    SELECT * FROM kpi_ancestors
  `);
  return result.rows;
}
```

### Progress Formula Breakdown for UI (PROG-05)
```typescript
// Formula transparency pattern
interface ProgressFormula {
  resultPercentage: number;
  method: 'auto' | 'manual_override';
  components: Array<{
    kpiId: string;
    kpiTitle: string;
    progress: number;
    weight: number;
    contribution: number; // weight * progress / totalWeight
  }>;
  formula: string; // Human-readable: "((85% * 2) + (60% * 1)) / 3 = 76.67%"
  overrideReason?: string;
}

function buildProgressFormula(children: WeightedKPI[]): ProgressFormula {
  const totalWeight = children.reduce((sum, c) => sum + c.weight, 0);

  const components = children.map(c => ({
    kpiId: c.id,
    kpiTitle: c.title,
    progress: c.progress,
    weight: c.weight,
    contribution: (c.weight * c.progress) / totalWeight,
  }));

  const resultPercentage = components.reduce(
    (sum, c) => sum + c.contribution,
    0
  );

  // Build human-readable formula
  const parts = children.map(c => `(${c.progress}% * ${c.weight})`);
  const formula = `(${parts.join(' + ')}) / ${totalWeight} = ${resultPercentage.toFixed(2)}%`;

  return {
    resultPercentage,
    method: 'auto',
    components,
    formula,
  };
}
```

### 300% Rule Integration
```typescript
// Integrate 300% Rule scores into vision-level progress
interface VisionProgress {
  // KPI-based progress (from hierarchy rollup)
  kpiProgress: number;

  // 300% Rule scores (from visions table)
  clarityScore: number;   // 0-100
  beliefScore: number;    // 0-100
  consistencyScore: number; // 0-100
  threeHundredTotal: number; // Sum of above (0-300)

  // Combined "health score" (optional enhancement)
  overallHealth: number; // Weighted combination
}

function calculateVisionOverallHealth(
  kpiProgress: number,
  clarity: number,
  belief: number,
  consistency: number
): number {
  // KPI progress is 50%, 300% Rule is 50%
  const threeHundredNormalized = (clarity + belief + consistency) / 3;
  return Math.round((kpiProgress * 0.5) + (threeHundredNormalized * 0.5));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Database triggers for all aggregates | Application-layer with cache | 2024+ | Better debugging, testing, transparent formulas |
| Fixed equal weights | Configurable weights per KPI | Standard OKR practice | Prioritization support |
| Progress on read (computed) | Progress on write (cached) | Performance pattern | Sub-50ms reads |

**Deprecated/outdated:**
- PostgreSQL LISTEN/NOTIFY for realtime cache invalidation: Supabase Realtime provides better integration
- Materialized views for progress: Don't support RLS in PostgreSQL 15, problematic with Supabase

## Open Questions

Things that couldn't be fully resolved:

1. **100ms Trigger Target (PROG-06)**
   - What we know: Application-layer updates should complete in <100ms for single KPI chains
   - What's unclear: Does requirement mean database-level triggers or just "fast updates"?
   - Recommendation: Interpret as "progress cache update within 100ms of write operation" - achievable with application-layer approach

2. **Weight Storage Location**
   - What we know: `kpi_progress_cache.total_weight` exists in Phase 1 schema
   - What's unclear: Should weight be on `vision_kpis` table (per-KPI) or `kpi_progress_cache` (per-relationship)?
   - Recommendation: Add `weight` column to `vision_kpis` table, `total_weight` in cache is aggregate of children

3. **300% Rule Integration Depth**
   - What we know: 300% scores are already in `visions` table (clarity, belief, consistency)
   - What's unclear: Should 300% scores affect progress calculation or just display alongside?
   - Recommendation: Keep separate - 300% Rule is qualitative self-assessment, KPI progress is quantitative. Display together but don't combine mathematically.

## Sources

### Primary (HIGH confidence)
- PostgreSQL Documentation 18: WITH Queries (Recursive CTEs) - https://www.postgresql.org/docs/current/queries-with.html
- Supabase Docs: Database Functions - https://supabase.com/docs/guides/database/functions
- Supabase Docs: Triggers - https://supabase.com/docs/guides/database/postgres/triggers
- Existing codebase: `src/lib/db/schema.ts`, `src/app/api/vision-kpis/[id]/log/route.ts`

### Secondary (MEDIUM confidence)
- Lattice Help Center: Progress Calculation - https://help.lattice.com/hc/en-us/articles/360059451414-Understand-Progress-Calculation-in-Lattice
- PeopleForce: OKR Progress Calculation - https://help.peopleforce.io/en/articles/8498885-okr-progress-calculation
- Medium: Database Triggers vs Application-Level Handling - https://medium.com/@kavindaheshan96/should-you-use-database-triggers-or-handle-logic-in-your-app-heres-when-and-why-acdc35cf483d
- PostgreSQL Triggers 2026 article - https://thelinuxcode.com/postgresql-triggers-in-2026-design-performance-and-production-reality/

### Tertiary (LOW confidence)
- WebSearch: Weighted average SQL patterns - general search results, formula verified against primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing codebase patterns, no new libraries except decimal.js
- Architecture: HIGH - Application-layer calculation is proven pattern, matches codebase style
- Pitfalls: MEDIUM - Based on general patterns and common issues, not project-specific history

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable domain, no rapid changes expected)
