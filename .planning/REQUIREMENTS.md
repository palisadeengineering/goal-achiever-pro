# Requirements: Goal Achiever Pro - Vision & KPI Cascade

**Defined:** 2026-01-23
**Core Value:** When a user creates a Vision, KPIs cascade down to daily actions, and completing items rolls progress back up to the dashboard.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Schema & Data Model

- [x] **DATA-01**: KPIs have parent_kpi_id column linking to parent KPIs forming hierarchy
- [x] **DATA-02**: Hierarchy supports 5 levels: Vision -> Quarterly -> Monthly -> Weekly -> Daily
- [x] **DATA-03**: Migration script links existing KPIs to appropriate parents
- [x] **DATA-04**: Progress cache table stores pre-computed aggregates for fast reads

### Progress Calculation

- [x] **PROG-01**: Completing child KPI automatically updates parent progress percentage
- [x] **PROG-02**: Progress rolls up entire chain: daily -> weekly -> monthly -> quarterly -> vision
- [x] **PROG-03**: User can assign weights to KPIs (higher-weight items contribute more)
- [x] **PROG-04**: User can manually override calculated progress with explanation
- [x] **PROG-05**: UI shows transparent formula explaining how progress was calculated
- [x] **PROG-06**: Application-layer triggers maintain progress cache on write operations

### Cascade Generation

- [ ] **CASC-01**: Creating a vision triggers AI generation of aligned KPIs
- [ ] **CASC-02**: Each KPI can cascade down to quarterly/monthly/weekly/daily breakdown
- [ ] **CASC-03**: AI suggests KPI breakdowns based on vision SMART components
- [ ] **CASC-04**: User can manually create KPIs and link to parents
- [ ] **CASC-05**: Cascade generation respects existing items (incremental, not destructive)

### Tree UI & Hierarchy View

- [ ] **TREE-01**: Collapsible tree view shows goal hierarchy with expand/collapse
- [ ] **TREE-02**: Each node displays progress bar showing completion percentage
- [ ] **TREE-03**: Status indicators show on-track (green), at-risk (yellow), behind (red)
- [ ] **TREE-04**: Breadcrumb navigation shows path from vision to current item
- [ ] **TREE-05**: Tree limits visible nesting to 2-3 levels with progressive disclosure
- [ ] **TREE-06**: Keyboard navigation (Enter/Space to expand/collapse)

### Today Dashboard

- [ ] **TODAY-01**: Dashboard shows all daily KPIs due today from the cascade
- [ ] **TODAY-02**: Quick check-in form: mark complete, log value, add confidence score
- [ ] **TODAY-03**: Progress summary widget shows daily/weekly/monthly/quarterly rates
- [ ] **TODAY-04**: 300% Rule gauge displays Clarity, Belief, Consistency scores
- [ ] **TODAY-05**: Completing items triggers optimistic UI update before server confirms
- [ ] **TODAY-06**: Dashboard shows which vision/KPI each daily item contributes to

### Progress Page

- [ ] **PRGS-01**: Roll-up visualization shows Vision -> Quarter -> Month -> Week -> Day
- [ ] **PRGS-02**: Activity feed shows recent completions across entire hierarchy
- [ ] **PRGS-03**: Trend charts show progress over time (line/bar charts)
- [ ] **PRGS-04**: Goal health scoring flags "zombie goals" with no activity
- [ ] **PRGS-05**: Filter by quarter, month, status, or vision
- [ ] **PRGS-06**: "Impact" indicators show which daily actions drive top-level goals

### API Layer

- [ ] **API-01**: GET /api/goal-tree/{visionId} returns full nested hierarchy in one query
- [ ] **API-02**: POST /api/kpi-logs/{id}/log updates progress and returns ancestor changes
- [ ] **API-03**: React Query hooks with optimistic updates for instant UX
- [ ] **API-04**: Hierarchical query key structure enables targeted cache invalidation

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: Streak tracking with GitHub-style contribution calendar
- **ADV-02**: AI alignment suggestions (flag conflicting goals)
- **ADV-03**: OKR retrospectives (end-of-quarter learnings)
- **ADV-04**: Goal templates for common patterns
- **ADV-05**: Capacity visualization (hours committed vs available)
- **ADV-06**: Export/reporting capabilities (PDF, CSV)

### Team Collaboration

- **TEAM-01**: Many-to-many goal alignment for team features
- **TEAM-02**: Real-time progress sync via Supabase Realtime
- **TEAM-03**: Goal owner assignment with accountability

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobile app | Web-first for this milestone |
| Tying KPIs to compensation | Anti-pattern - causes sandbagging |
| Real-time JIRA/Asana integration | High complexity, defer to v2+ |
| Notification system | Thoughtful nudges need design work, defer |
| Strategy map visualization | Complex UI, defer to advanced features |
| Pulse survey integration | Out of scope for goal tracking |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Phase Name | Status |
|-------------|-------|------------|--------|
| DATA-01 | 1 | Schema Foundation | Complete |
| DATA-02 | 1 | Schema Foundation | Complete |
| DATA-03 | 1 | Schema Foundation | Complete |
| DATA-04 | 1 | Schema Foundation | Complete |
| PROG-01 | 2 | Progress Calculation | Complete |
| PROG-02 | 2 | Progress Calculation | Complete |
| PROG-03 | 2 | Progress Calculation | Complete |
| PROG-04 | 2 | Progress Calculation | Complete |
| PROG-05 | 2 | Progress Calculation | Complete |
| PROG-06 | 2 | Progress Calculation | Complete |
| API-01 | 3 | Tree Fetching API | Pending |
| API-02 | 3 | Tree Fetching API | Pending |
| API-03 | 4 | Frontend State | Pending |
| API-04 | 4 | Frontend State | Pending |
| CASC-01 | 5 | Cascade Generation | Pending |
| CASC-02 | 5 | Cascade Generation | Pending |
| CASC-03 | 5 | Cascade Generation | Pending |
| CASC-04 | 5 | Cascade Generation | Pending |
| CASC-05 | 5 | Cascade Generation | Pending |
| TREE-01 | 6 | Tree UI | Pending |
| TREE-02 | 6 | Tree UI | Pending |
| TREE-03 | 6 | Tree UI | Pending |
| TREE-04 | 6 | Tree UI | Pending |
| TREE-05 | 6 | Tree UI | Pending |
| TREE-06 | 6 | Tree UI | Pending |
| TODAY-01 | 7 | Today Dashboard | Pending |
| TODAY-02 | 7 | Today Dashboard | Pending |
| TODAY-03 | 7 | Today Dashboard | Pending |
| TODAY-04 | 7 | Today Dashboard | Pending |
| TODAY-05 | 7 | Today Dashboard | Pending |
| TODAY-06 | 7 | Today Dashboard | Pending |
| PRGS-01 | 8 | Progress Page | Pending |
| PRGS-02 | 8 | Progress Page | Pending |
| PRGS-03 | 8 | Progress Page | Pending |
| PRGS-04 | 8 | Progress Page | Pending |
| PRGS-05 | 8 | Progress Page | Pending |
| PRGS-06 | 8 | Progress Page | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-01-23*
*Last updated: 2026-01-24 after Phase 2 completion*
