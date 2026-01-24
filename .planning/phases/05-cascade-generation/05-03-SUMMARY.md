---
phase: 05-cascade-generation
plan: 03
subsystem: api
tags: [cascade-generation, incremental-update, mutation-hook, tanstack-query]

# Dependency graph
requires:
  - phase: 05-01
    provides: Parent linking pattern in generate-cascade (quarterlyKpiMap, monthlyKpiMap)
  - phase: 05-02
    provides: Manual KPI creation context for preservation requirements
provides:
  - Incremental mode support in generate-cascade endpoint
  - useGenerateCascade mutation hook with mode parameter
  - KPI deduplication by title+level matching
  - Skipped counts in response for incremental updates
affects: [06-full-tree-ui, 07-sync-and-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Title-based KPI deduplication with case-insensitive matching
    - Lookup existing IDs for parent linking when skipping KPIs

key-files:
  created:
    - src/lib/hooks/use-cascade-generation.ts
  modified:
    - src/app/api/visions/[id]/generate-cascade/route.ts
    - src/lib/hooks/index.ts

key-decisions:
  - "Default mode is incremental for safety (preserves user data)"
  - "Title matching uses case-insensitive ilike for deduplication"
  - "Skipped KPI IDs are still looked up for child linking"
  - "Known limitation: title changes cause duplicates (documented for future hash-based improvement)"

patterns-established:
  - "Incremental mode pattern: check existing before insert, lookup ID if exists"
  - "Response includes mode and skipped counts for UI feedback"

# Metrics
duration: 8min
completed: 2026-01-24
---

# Phase 5 Plan 3: Cascade Trigger Summary

**Incremental mode support in generate-cascade preserving existing KPIs by title match, with useGenerateCascade hook defaulting to incremental**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-24T21:00:00Z
- **Completed:** 2026-01-24T21:08:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Generate-cascade endpoint now accepts mode parameter (full/incremental)
- Incremental mode skips existing KPIs by title+level match
- Skipped KPI IDs are still looked up for parent-child linking
- Response includes separate saved and skipped counts
- useGenerateCascade hook defaults to incremental mode for safety
- Goal tree query invalidated on successful generation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add incremental mode to generate-cascade endpoint** - `ac1a89f` (feat)
2. **Task 2: Create useGenerateCascade hook** - `f59627f` (feat)

## Files Created/Modified
- `src/app/api/visions/[id]/generate-cascade/route.ts` - Added mode parsing, existing KPI checks, skipped tracking
- `src/lib/hooks/use-cascade-generation.ts` - New mutation hook with typed input/output
- `src/lib/hooks/index.ts` - Barrel export for useGenerateCascade

## Decisions Made
- **Default to incremental mode:** Hook defaults to `mode: 'incremental'` to prevent accidental data duplication when users trigger regeneration
- **Title-based matching:** Uses `level:title.toLowerCase()` key for deduplication. This is fragile if users edit titles, but acceptable because:
  1. Most users won't edit AI-generated titles
  2. Duplicates are visible and can be manually deleted
  3. Better to have duplicates than lose user-customized KPIs
- **Lookup existing IDs:** When skipping a KPI in incremental mode, its ID is still looked up so child KPIs can link to it properly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed variable name conflict with Anthropic message**
- **Found during:** Task 1 (incremental mode implementation)
- **Issue:** New `message` variable for response conflicted with existing `message` from Anthropic API call
- **Fix:** Renamed response message to `responseMessage`
- **Files modified:** src/app/api/visions/[id]/generate-cascade/route.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** ac1a89f (Task 1 commit)

**2. [Rule 1 - Bug] Added null check to getExistingKpiId helper**
- **Found during:** Task 1 (incremental mode implementation)
- **Issue:** TypeScript error TS18047: 'supabase' is possibly 'null'
- **Fix:** Added `if (!supabase) return null;` guard
- **Files modified:** src/app/api/visions/[id]/generate-cascade/route.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** ac1a89f (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bug fixes)
**Impact on plan:** Both fixes required for TypeScript compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 5 complete: Cascade generation with hierarchical KPIs and incremental updates
- All hooks exported: useGoalTree, useLogKpi, useOverrideProgress, useCreateKpi, useGenerateCascade
- Ready for Phase 6: Full Tree UI implementation
- Known limitation documented: Title matching may cause duplicates if user edits AI-generated titles (future improvement: hash-based matching)

---
*Phase: 05-cascade-generation*
*Completed: 2026-01-24*
