# Roadmap: Goal Achiever Pro - Vision & KPI Cascade Fix

## Overview

This roadmap transforms Goal Achiever Pro from isolated goal pages into a unified cascading system where Visions drive KPIs that flow down to daily actions, with progress rolling back up to the dashboard. The journey starts with database schema changes to enable parent-child KPI relationships, builds the progress calculation engine, exposes efficient APIs, integrates frontend state management, adds AI-powered cascade generation, constructs the tree UI, surfaces daily actions on the Today dashboard, and culminates with comprehensive progress analytics.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Schema Foundation** - Add parent-child KPI linkage and progress cache table
- [x] **Phase 2: Progress Calculation** - Implement roll-up engine with triggers and weighted calculations
- [x] **Phase 3: Tree Fetching API** - Build efficient hierarchical query endpoints
- [ ] **Phase 4: Frontend State** - React Query hooks with optimistic updates and cache management
- [ ] **Phase 5: Cascade Generation** - AI-powered KPI breakdown from Vision to daily items
- [ ] **Phase 6: Tree UI** - Collapsible hierarchy view with progress indicators
- [ ] **Phase 7: Today Dashboard** - Daily KPI check-in with cascade-aware context
- [ ] **Phase 8: Progress Page** - Roll-up visualization and analytics

## Phase Details

### Phase 1: Schema Foundation
**Goal**: Database supports 5-level KPI hierarchy with parent-child relationships and cached progress aggregates
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Research flag**: Standard pattern (skip research-phase)
**Success Criteria** (what must be TRUE):
  1. KPIs can be linked to parent KPIs via parent_kpi_id column with proper foreign key
  2. Hierarchy query returns 5 levels: Vision -> Quarterly -> Monthly -> Weekly -> Daily
  3. Existing KPIs are migrated to appropriate parent relationships without data loss
  4. Progress cache table stores pre-computed aggregates and returns data within 50ms
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md - Add FK constraint and index to parent_kpi_id column
- [x] 01-02-PLAN.md - Create progress cache table and data migration script

### Phase 2: Progress Calculation
**Goal**: Completing any KPI automatically updates all ancestor progress percentages with transparent weighted calculations
**Depends on**: Phase 1
**Requirements**: PROG-01, PROG-02, PROG-03, PROG-04, PROG-05, PROG-06
**Research flag**: Complete (application-layer strategy recommended over triggers)
**Success Criteria** (what must be TRUE):
  1. Completing a daily KPI immediately updates weekly/monthly/quarterly/vision progress
  2. User can assign weight to any KPI and see higher-weight items contribute more to parent
  3. User can manually override calculated progress with explanation that persists
  4. UI shows transparent formula explaining exactly how progress percentage was calculated
  5. Progress cache maintained within 100ms of write operations
**Plans**: 4 plans in 3 waves

Plans:
- [x] 02-01-PLAN.md - Core progress calculation library, types, and weight schema migration (Wave 1)
- [x] 02-02-PLAN.md - Progress API endpoints with rollup integration (Wave 2)
- [x] 02-03-PLAN.md - KPI log integration and barrel exports (Wave 3)
- [x] 02-04-PLAN.md - Manual override endpoint (Wave 3)

### Phase 3: Tree Fetching API
**Goal**: Single API call returns complete nested hierarchy for a vision with pre-computed progress
**Depends on**: Phase 2
**Requirements**: API-01, API-02
**Research flag**: Standard pattern (skip research-phase)
**Success Criteria** (what must be TRUE):
  1. GET /api/goal-tree/{visionId} returns full nested JSON hierarchy in one query
  2. POST /api/kpi-logs/{id}/log updates progress and returns all changed ancestor values
  3. API response includes progress percentage from cache for instant dashboard loads
**Plans**: 2 plans in 1 wave

Plans:
- [x] 03-01-PLAN.md - Goal tree API endpoint with nested hierarchy (Wave 1)
- [x] 03-02-PLAN.md - Enhanced KPI log response with ancestor progress values (Wave 1)

### Phase 4: Frontend State
**Goal**: React Query manages server state with optimistic updates providing instant UI feedback
**Depends on**: Phase 3
**Requirements**: API-03, API-04
**Research flag**: Standard pattern (skip research-phase)
**Success Criteria** (what must be TRUE):
  1. Completing a KPI shows updated progress immediately before server confirms
  2. Failed updates roll back to previous state with clear error message
  3. Hierarchical query keys enable targeted cache invalidation without refetching entire tree
  4. Loading states clearly indicate when progress is being recalculated
**Plans**: TBD

Plans:
- [ ] 04-01: React Query hooks with optimistic update pattern
- [ ] 04-02: Hierarchical query key structure and cache invalidation

### Phase 5: Cascade Generation
**Goal**: Creating or editing a Vision triggers AI generation of aligned KPIs that cascade to daily actions
**Depends on**: Phase 4
**Requirements**: CASC-01, CASC-02, CASC-03, CASC-04, CASC-05
**Research flag**: Standard pattern (existing AI integration patterns in codebase)
**Success Criteria** (what must be TRUE):
  1. Creating a new Vision shows option to generate aligned KPIs via AI
  2. Each generated KPI can be further broken down into quarterly/monthly/weekly/daily items
  3. AI suggestions reference Vision SMART components for contextual breakdown
  4. User can manually create and link KPIs to any parent in the hierarchy
  5. Re-generating cascade adds new items without deleting user's existing customizations
**Plans**: TBD

Plans:
- [ ] 05-01: Vision-to-KPI AI generation endpoint
- [ ] 05-02: KPI cascade breakdown with manual creation
- [ ] 05-03: Incremental generation with existing item preservation

### Phase 6: Tree UI
**Goal**: Users can navigate the full goal hierarchy with clear visual indicators and efficient interaction
**Depends on**: Phase 5
**Requirements**: TREE-01, TREE-02, TREE-03, TREE-04, TREE-05, TREE-06
**Research flag**: Needs research-phase (tree component library evaluation, accessibility)
**Success Criteria** (what must be TRUE):
  1. Tree view shows collapsible nodes that expand/collapse on click
  2. Each node displays progress bar showing completion percentage
  3. Status indicators show green (on-track), yellow (at-risk), red (behind) based on progress
  4. Breadcrumb navigation shows path from Vision to currently selected item
  5. Tree limits visible nesting to 2-3 levels with "show more" for deeper items
  6. User can navigate tree using keyboard (Enter/Space to expand, arrows to move)
**Plans**: TBD

Plans:
- [ ] 06-01: Collapsible tree component with progress bars
- [ ] 06-02: Status indicators and breadcrumb navigation
- [ ] 06-03: Progressive disclosure and keyboard navigation

### Phase 7: Today Dashboard
**Goal**: Users see all daily KPIs due today with quick check-in and clear cascade context
**Depends on**: Phase 6
**Requirements**: TODAY-01, TODAY-02, TODAY-03, TODAY-04, TODAY-05, TODAY-06
**Research flag**: Needs research-phase (300% Rule quantification)
**Success Criteria** (what must be TRUE):
  1. Dashboard shows all daily KPIs from the cascade that are active today
  2. User can mark complete, log value, and add confidence score in quick form
  3. Progress summary widget shows completion rates at daily/weekly/monthly/quarterly levels
  4. 300% Rule gauge displays current Clarity, Belief, Consistency scores
  5. Completing items shows instant progress update before server confirms
  6. Each daily item shows which Vision and parent KPI it contributes to
**Plans**: TBD

Plans:
- [ ] 07-01: Today dashboard with daily KPI list
- [ ] 07-02: Quick check-in form with optimistic updates
- [ ] 07-03: Progress summary widget and 300% Rule gauge

### Phase 8: Progress Page
**Goal**: Users can analyze progress trends and identify which activities drive top-level goals
**Depends on**: Phase 7
**Requirements**: PRGS-01, PRGS-02, PRGS-03, PRGS-04, PRGS-05, PRGS-06
**Research flag**: Standard pattern (analytics dashboard, Recharts)
**Success Criteria** (what must be TRUE):
  1. Roll-up visualization shows Vision -> Quarter -> Month -> Week -> Day progress cascade
  2. Activity feed shows recent completions with timestamps across entire hierarchy
  3. Trend charts display progress over time with selectable date ranges
  4. Goal health scoring flags "zombie goals" that have no activity in 14+ days
  5. Filters allow viewing by quarter, month, status, or specific vision
  6. "Impact" indicators show which daily actions contribute most to vision progress
**Plans**: TBD

Plans:
- [ ] 08-01: Roll-up visualization and activity feed
- [ ] 08-02: Trend charts and goal health scoring
- [ ] 08-03: Filters and impact indicators

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Schema Foundation | 2/2 | Complete | 2026-01-24 |
| 2. Progress Calculation | 4/4 | Complete | 2026-01-24 |
| 3. Tree Fetching API | 2/2 | Complete | 2026-01-24 |
| 4. Frontend State | 0/2 | Not started | - |
| 5. Cascade Generation | 0/3 | Not started | - |
| 6. Tree UI | 0/3 | Not started | - |
| 7. Today Dashboard | 0/3 | Not started | - |
| 8. Progress Page | 0/3 | Not started | - |

---
*Roadmap created: 2026-01-23*
*Last updated: 2026-01-24*
