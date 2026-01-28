# Roadmap: Goal Achiever Pro

## Overview

Goal Achiever Pro is a comprehensive goal-setting and time-optimization web app. The roadmap progresses through milestones: v1.0 established the Vision & KPI Cascade system, and v2.0 adds gamification and analytics to make the app beta-ready.

## Milestones

- ✅ **v1.0 Vision & KPI Cascade** - Phases 1-8 (shipped 2026-01-25)
- 🚧 **v2.0 Beta Ready - Gamification & Analytics** - Phases 9-13 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

<details>
<summary>✅ v1.0 Vision & KPI Cascade (Phases 1-8) - SHIPPED 2026-01-25</summary>

### Phase 1: Schema Foundation
**Goal**: Database supports 5-level KPI hierarchy with parent-child relationships and cached progress aggregates
**Depends on**: Nothing (first phase)
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md - Add FK constraint and index to parent_kpi_id column
- [x] 01-02-PLAN.md - Create progress cache table and data migration script

### Phase 2: Progress Calculation
**Goal**: Completing any KPI automatically updates all ancestor progress percentages with transparent weighted calculations
**Depends on**: Phase 1
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md - Core progress calculation library, types, and weight schema migration
- [x] 02-02-PLAN.md - Progress API endpoints with rollup integration
- [x] 02-03-PLAN.md - KPI log integration and barrel exports
- [x] 02-04-PLAN.md - Manual override endpoint

### Phase 3: Tree Fetching API
**Goal**: Single API call returns complete nested hierarchy for a vision with pre-computed progress
**Depends on**: Phase 2
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md - Goal tree API endpoint with nested hierarchy
- [x] 03-02-PLAN.md - Enhanced KPI log response with ancestor progress values

### Phase 4: Frontend State
**Goal**: React Query manages server state with optimistic updates providing instant UI feedback
**Depends on**: Phase 3
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md - React Query hooks with optimistic updates
- [x] 04-02-PLAN.md - Hierarchical query key factory and targeted cache invalidation
- [x] 04-03-PLAN.md - Fix API field name mismatch in useOverrideProgress
- [x] 04-04-PLAN.md - Create minimal KPI tree widget

### Phase 5: Cascade Generation
**Goal**: Creating or editing a Vision triggers AI generation of aligned KPIs that cascade to daily actions
**Depends on**: Phase 4
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md - Fix generate-cascade to link KPIs hierarchically
- [x] 05-02-PLAN.md - Manual KPI creation endpoint and useCreateKpi hook
- [x] 05-03-PLAN.md - Incremental generation mode preserving existing KPIs

### Phase 6: Tree UI
**Goal**: Users can navigate the full goal hierarchy with clear visual indicators and efficient interaction
**Depends on**: Phase 5
**Plans**: 4 plans

Plans:
- [x] 06-01-PLAN.md - Tree context and recursive node component
- [x] 06-02-PLAN.md - Status indicator and breadcrumb components
- [x] 06-03-PLAN.md - Full tree view integration with keyboard navigation
- [x] 06-04-PLAN.md - Polish and keyboard navigation fixes

### Phase 7: Today Dashboard
**Goal**: Users see all daily KPIs due today with quick check-in and clear cascade context
**Depends on**: Phase 6
**Plans**: 1 plan

Plans:
- [x] 07-01-PLAN.md - Add quarterly progress to stats grid

### Phase 8: Progress Page
**Goal**: Users can analyze progress trends and identify which activities drive top-level goals
**Depends on**: Phase 7
**Plans**: 3 plans

Plans:
- [x] 08-01-PLAN.md - Roll-up visualization and filters
- [x] 08-02-PLAN.md - Activity feed and trend charts
- [x] 08-03-PLAN.md - Zombie goals and impact indicators

</details>

### 🚧 v2.0 Beta Ready - Gamification & Analytics (In Progress)

**Milestone Goal:** Make the app engagement-worthy for beta testers with gamification rewards and visualize the core value prop (leverage time optimization)

**Timeline:** 1-2 weeks (aggressive)

#### Phase 8.1: Critical Bug Fixes (INSERTED) ✅
**Goal**: Fix app-breaking bugs before adding new features
**Depends on**: v1.0 complete
**Research**: None (bug fixes)
**Plans**: 1 plan

Plans:
- [x] 08.1-01-PLAN.md - Time Audit crash fix, subscription pricing, "Impact Projects" terminology cleanup

#### Phase 9: Gamification Foundation
**Goal**: Database schema and core services for achievements, badges, XP/points system
**Depends on**: v1.0 complete
**Research**: Unlikely (database schema, internal patterns)
**Plans**: 2 plans

Plans:
- [ ] 09-01-PLAN.md - Gamification database schema (achievements, user_achievements, user_gamification tables)
- [ ] 09-02-PLAN.md - Gamification service, API endpoints, and KPI integration

#### Phase 10: Streaks & Daily Goals
**Goal**: Track consecutive completion days, daily targets, visual streak indicators, MINS integration
**Depends on**: Phase 9
**Research**: Unlikely (CRUD, streak calculation logic)
**Plans**: TBD

**Additional scope (from user feedback):**
- Daily actions from vision plan auto-populate in Daily & Weekly MINS
- When MINS are completed, mark corresponding plan actions complete
- Calendar heat map for habit/action tracking (like GitHub contribution graph)
- Success rate metric (% of days goal was met)

Plans:
- [ ] 10-01: TBD

#### Phase 11: Visual Celebrations
**Goal**: Confetti, animations, level-up celebrations, satisfying micro-interactions
**Depends on**: Phase 10
**Research**: Likely (confetti/animation libraries, UX patterns)
**Research topics**: canvas-confetti, Framer Motion, Lottie, gamification UX patterns
**Plans**: TBD

Plans:
- [ ] 11-01: TBD

#### Phase 12: Value Matrix Charts
**Goal**: Time distribution visualization showing % in each quadrant (D/R/I/P), production trends
**Depends on**: Phase 11
**Research**: Unlikely (Recharts already in codebase)
**Plans**: TBD

**Additional scope (from user feedback):**
- Production Time Analytics Dashboard:
  - Weekly trend of Production % vs goal (50%+)
  - Month-over-month comparison charts
  - Alert when Production time drops below threshold
- Time distribution pie/bar charts by quadrant

Plans:
- [ ] 12-01: TBD

#### Phase 13: Leverage Analytics
**Goal**: Trend charts, ROI indicators, activity categorization by leverage type (4 C's), project-time linking
**Depends on**: Phase 12
**Research**: Unlikely (extending existing chart patterns)
**Plans**: TBD

**Additional scope (from user feedback):**
- Project-to-Time Linking:
  - Link time blocks to specific Impact Projects
  - Track actual time spent vs planned time per project
  - Show burndown/burnup charts per project
- Leverage Tracking Graph:
  - Track time invested in "high leverage" activities over time
  - Show expected vs actual payoff
  - ROI calculation for time investments

Plans:
- [ ] 13-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> ... -> 8 -> **8.1** -> 9 -> 10 -> 11 -> 12 -> 13

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Schema Foundation | v1.0 | 2/2 | Complete | 2026-01-24 |
| 2. Progress Calculation | v1.0 | 4/4 | Complete | 2026-01-24 |
| 3. Tree Fetching API | v1.0 | 2/2 | Complete | 2026-01-24 |
| 4. Frontend State | v1.0 | 4/4 | Complete | 2026-01-24 |
| 5. Cascade Generation | v1.0 | 3/3 | Complete | 2026-01-24 |
| 6. Tree UI | v1.0 | 4/4 | Complete | 2026-01-25 |
| 7. Today Dashboard | v1.0 | 1/1 | Complete | 2026-01-25 |
| 8. Progress Page | v1.0 | 3/3 | Complete | 2026-01-25 |
| **8.1. Critical Bug Fixes** | v2.0 | 1/1 | **Complete** | 2026-01-28 |
| 9. Gamification Foundation | v2.0 | 0/2 | Planned | - |
| 10. Streaks & Daily Goals | v2.0 | 0/? | Not started | - |
| 11. Visual Celebrations | v2.0 | 0/? | Not started | - |
| 12. Value Matrix Charts | v2.0 | 0/? | Not started | - |
| 13. Leverage Analytics | v2.0 | 0/? | Not started | - |

---
*Roadmap created: 2026-01-23*
*Last updated: 2026-01-28*
