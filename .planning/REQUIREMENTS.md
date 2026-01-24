# Requirements: Goal Achiever Pro - Vision & KPI Cascade

**Defined:** 2026-01-23
**Core Value:** When a user creates a Vision, KPIs cascade down to daily actions, and completing items rolls progress back up to the dashboard.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Schema & Data Model

- [ ] **DATA-01**: KPIs have parent_kpi_id column linking to parent KPIs forming hierarchy
- [ ] **DATA-02**: Hierarchy supports 5 levels: Vision → Quarterly → Monthly → Weekly → Daily
- [ ] **DATA-03**: Migration script links existing KPIs to appropriate parents
- [ ] **DATA-04**: Progress cache table stores pre-computed aggregates for fast reads

### Progress Calculation

- [ ] **PROG-01**: Completing child KPI automatically updates parent progress percentage
- [ ] **PROG-02**: Progress rolls up entire chain: daily → weekly → monthly → quarterly → vision
- [ ] **PROG-03**: User can assign weights to KPIs (higher-weight items contribute more)
- [ ] **PROG-04**: User can manually override calculated progress with explanation
- [ ] **PROG-05**: UI shows transparent formula explaining how progress was calculated
- [ ] **PROG-06**: Database triggers maintain progress cache on write operations

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

- [ ] **PRGS-01**: Roll-up visualization shows Vision → Quarter → Month → Week → Day
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

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| PROG-01 | Phase 2 | Pending |
| PROG-02 | Phase 2 | Pending |
| PROG-03 | Phase 2 | Pending |
| PROG-04 | Phase 2 | Pending |
| PROG-05 | Phase 2 | Pending |
| PROG-06 | Phase 2 | Pending |
| API-01 | Phase 3 | Pending |
| API-02 | Phase 3 | Pending |
| API-03 | Phase 4 | Pending |
| API-04 | Phase 4 | Pending |
| CASC-01 | Phase 5 | Pending |
| CASC-02 | Phase 5 | Pending |
| CASC-03 | Phase 5 | Pending |
| CASC-04 | Phase 5 | Pending |
| CASC-05 | Phase 5 | Pending |
| TREE-01 | Phase 6 | Pending |
| TREE-02 | Phase 6 | Pending |
| TREE-03 | Phase 6 | Pending |
| TREE-04 | Phase 6 | Pending |
| TREE-05 | Phase 6 | Pending |
| TREE-06 | Phase 6 | Pending |
| TODAY-01 | Phase 7 | Pending |
| TODAY-02 | Phase 7 | Pending |
| TODAY-03 | Phase 7 | Pending |
| TODAY-04 | Phase 7 | Pending |
| TODAY-05 | Phase 7 | Pending |
| TODAY-06 | Phase 7 | Pending |
| PRGS-01 | Phase 8 | Pending |
| PRGS-02 | Phase 8 | Pending |
| PRGS-03 | Phase 8 | Pending |
| PRGS-04 | Phase 8 | Pending |
| PRGS-05 | Phase 8 | Pending |
| PRGS-06 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-23*
*Last updated: 2026-01-23 after initial definition*
