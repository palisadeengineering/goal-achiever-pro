# Project Research Summary

**Project:** Goal Achiever Pro - Vision & KPI Cascade Fix
**Domain:** OKR/KPI Goal-setting and Performance Management
**Researched:** 2026-01-23
**Confidence:** HIGH

## Executive Summary

Goal Achiever Pro is implementing a cascading KPI system where Visions generate hierarchical KPIs (quarterly → monthly → weekly → daily) with automatic progress roll-up. Research across the OKR/goal-tracking domain reveals this is a mature market with well-established patterns. The key insight is that **alignment beats cascading** - modern products emphasize bidirectional goal linking rather than rigid top-down hierarchies, but for Goal Achiever Pro's single-user time optimization methodology, a top-down cascade with progress roll-up is appropriate.

The existing tech stack (Next.js 16.1.1, React Query 5.90.16, Zustand 5.0.9, Drizzle ORM, Supabase) is perfectly suited for this implementation. Only one minor dependency is needed (Immer 11.x for nested state updates). The database schema already has the necessary hierarchy structure in place but lacks proper parent-child KPI linkage and cached progress aggregation. The recommended approach is a **hybrid progress calculation strategy**: database triggers for immediate updates + cached aggregates for fast dashboard reads + React Query for optimistic UI updates.

The primary risks are: (1) strict hierarchical thinking that limits flexibility, (2) progress roll-up calculations that feel inconsistent to users, and (3) deep hierarchy UI that becomes unusable. These are all preventable with careful architecture choices (network model over tree, transparent weighted calculations, progressive disclosure UI).

## Key Findings

### Recommended Stack

The existing stack is ideal for cascading KPI implementation. React Query handles server state with built-in optimistic update support, Zustand manages UI state, Drizzle ORM handles hierarchical queries with PostgreSQL's recursive CTEs, and Supabase provides the database layer with optional real-time capabilities. **No new major libraries are required.**

**Core technologies:**
- **React Query 5.90.16**: Server state management with optimistic updates for instant UX feedback on progress changes
- **Zustand 5.0.9 + Immer**: Client UI state for expanded/collapsed nodes, selected context, and pending update queue
- **Drizzle ORM + PostgreSQL**: Type-safe SQL with recursive CTEs for tree queries and database triggers for roll-up calculations
- **Supabase**: Database, auth, and optional real-time sync for multi-user scenarios (not needed for MVP)

**New addition:**
- **Immer 11.x**: Simplifies deeply nested state updates for 5-level hierarchy (Vision → Quarter → Month → Week → Day). Already bundled with Zustand middleware. Version 11.x includes 50-80% performance improvements over 10.x. Bundle impact: ~5KB gzipped.

### Expected Features

Research across Lattice, 15Five, Weekdone, Perdoo, and Quantive reveals clear feature expectations in the OKR/KPI domain.

**Must have (table stakes):**
- Parent-child goal linking with visual hierarchy (tree view)
- Automatic progress roll-up from children to parents
- Goal status indicators (on-track/at-risk/behind with color coding)
- Progress tracking dashboard with percentage completion bars
- Weekly check-in mechanism for progress updates
- Time period scoping (filter by quarter/month/week)
- Manual progress override capability (users know context algorithms don't)
- Goal owner assignment for accountability

**Should have (competitive differentiators):**
- **300% Rule tracking (Clarity/Belief/Consistency)** - UNIQUE to Goal Achiever Pro, no competitor has this
- Confidence scoring (0-10 scale: "how confident are you?")
- Weighted progress calculation (higher-weight items contribute more)
- AI-generated goals and KPI suggestions (already in GAP)
- Streak tracking for daily habits (gamification)
- Buyback Rate calculation (time optimization-specific)
- Bi-directional calendar sync (already in GAP)

**Defer (v2+):**
- AI alignment suggestions (needs usage patterns first)
- Strategy map visualization (complex UI)
- Pulse survey integration (out of scope)
- Real-time JIRA/Asana integrations

**Anti-features (deliberately avoid):**
- Mandatory top-down cascading without bottom-up creation
- Tying OKRs directly to compensation (causes sandbagging)
- Allowing too many OKRs (overwhelms users, defeats focus)
- Output-based key results ("Build feature X" vs "Increase Y by Z%")
- Real-time progress pressure (weekly cadence is sufficient)
- Notification overload (thoughtful nudges, not daily spam)

### Architecture Approach

The codebase has the hierarchy structure (Vision → KPIs → quarterly/monthly/weekly/daily) but lacks proper cascading linkage and progress roll-up calculations. The recommended architecture adds parent-child KPI relationships, implements hybrid progress calculation (cached + computed), and provides efficient tree-fetching APIs.

**Major components:**

1. **Hierarchical Query Key Structure** - React Query keys designed to enable targeted invalidation at any level of the cascade (e.g., `['goals', 'visions', visionId, 'monthly', year, month]`)

2. **Progress Cache Table** - New `kpi_progress_cache` table stores pre-computed aggregates (current value, progress percentage, child counts) with database triggers maintaining consistency on writes

3. **Database Triggers for Roll-up** - PostgreSQL function that recalculates KPI progress up the ancestor chain whenever a log is inserted, bubbling updates from daily → weekly → monthly → quarterly → vision

4. **Tree Fetching API** - Single endpoint (`/api/goal-tree/{visionId}`) using recursive CTE to return full nested hierarchy in one query, eliminating N+1 problems

5. **Optimistic Update Pattern** - React Query mutations that immediately update UI, snapshot state for rollback on error, and invalidate affected queries on success

6. **Normalized Tree State** - Frontend flattens nested tree into `{ byId, childrenByParent, rootIds }` structure for efficient updates without deep object mutation

**Data flow:**
- **Write path**: User checks KPI → POST to API → Insert to kpi_logs → Trigger recalculates parent → React Query invalidates affected keys
- **Read path**: Dashboard loads → GET /api/progress/summary → Read from kpi_progress_cache (pre-computed) → Return aggregates
- **Tree path**: View loads → GET /api/goal-tree with recursive CTE → Single query returns nested JSON → Frontend renders tree

**Hybrid progress calculation strategy:**
- Daily KPIs: Eager (trigger) - high write frequency, low latency reads needed
- Weekly aggregates: Lazy (on-read) - weekly refresh acceptable
- Monthly/Quarterly: Scheduled + on-demand - lower frequency, larger calculations

### Critical Pitfalls

Top 5 pitfalls identified from research across OKR tools, PostgreSQL patterns, and UI/UX best practices:

1. **Cascading OKRs as Strict Hierarchy** - Treating goals as pure tree inheritance robs the framework of flexibility. Cross-functional alignment becomes impossible. Prevention: Model OKRs as network/graph with "contributes to" relationships, not "child of" relationships. Allow bottom-up goal creation. *For Goal Achiever Pro:* Single-user context allows top-down cascade, but ensure "many-to-many" alignment is possible for future team features.

2. **Progress Rollup Calculation Inconsistencies** - Parent shows 33% when user completed "the important thing." Users lose trust. Prevention: Explicit weighting (let users assign importance), transparent formula display, manual override protection, separate status from numeric progress. *Phase 2 priority.*

3. **Deep Hierarchy UI Becomes Unusable** - 5-level nesting (Vision → Quarter → Month → Week → Day) pushes content off-screen, creates "click fatigue." 77% of users abandon apps within 3 days if they can't find features. Prevention: Limit visible nesting to 2-3 levels with progressive disclosure, breadcrumb navigation, context sidebar showing ancestors, multiple view options (tree/list/kanban). *Phase 3 UI critical path.*

4. **Database Performance with Recursive Queries** - Recursive CTEs on large datasets slow down, N+1 queries during tree loading. Prevention: Index all parent_id/vision_id columns (already done), materialized views for hierarchies, denormalize progress with cached table, limit recursion depth (5 levels max in this schema). *Phase 2 data layer.*

5. **Stale Progress Data from Eventual Consistency** - User completes action but dashboard shows old progress for seconds/minutes. Users think it didn't save, click multiple times. Prevention: Optimistic updates in UI, explicit loading states ("Recalculating..."), cache invalidation strategy, consider sync calculation (may be fast enough at <100ms for single user). *Phase 2 & 3 overlap.*

## Implications for Roadmap

Based on research, suggested phase structure emphasizes foundation-first with progressive feature layering:

### Phase 1: Schema Foundation & Parent-Child Linkage
**Rationale:** All cascade features depend on proper hierarchical relationships. Must be built first before any UI or calculation logic can work. This is the "point of no return" decision - getting the data model right is critical.

**Delivers:**
- Migration adding `parent_kpi_id` to `vision_kpis` table with proper indexes
- New `kpi_progress_cache` table for storing pre-computed aggregates
- Updated AI cascade generation to link KPI parent-child relationships
- Data migration script to link existing KPIs hierarchically

**Addresses (from FEATURES.md):**
- Parent-child goal linking (table stakes)
- Multi-level hierarchy structure

**Avoids (from PITFALLS.md):**
- Pitfall #5: Adding foreign keys to inconsistent data (use multi-step migration with NOT VALID)
- Pitfall #1: Strict hierarchy trap (design for network model even if implementing tree)

**Research flag:** Standard pattern, skip research-phase (well-documented in PostgreSQL docs and Drizzle ORM guides)

### Phase 2: Progress Calculation Engine
**Rationale:** With hierarchy in place, implement the "brain" of the cascade - how progress bubbles up. This must be solid before building UI, as inconsistent calculations erode user trust immediately.

**Delivers:**
- Database trigger function for automatic progress roll-up
- Weighted progress calculation with transparent formula
- Manual progress override with protection flag
- `/api/progress/summary` endpoint reading from cache
- Background job for periodic full recalculation (safety net)

**Uses (from STACK.md):**
- PostgreSQL triggers and functions
- Drizzle ORM for raw SQL execution (WITH RECURSIVE not natively supported)
- Decimal/numeric types for precision (already in schema)

**Implements (from ARCHITECTURE.md):**
- Hybrid progress strategy (triggers + cache + lazy)
- Progress cache table with last_calculated_at timestamps
- Roll-up trigger that bubbles updates to ancestors

**Avoids (from PITFALLS.md):**
- Pitfall #2: Progress rollup inconsistencies (explicit weights, transparent formulas)
- Pitfall #4: Database performance issues (indexes, cached aggregates, limited recursion)
- Pitfall #10: Rounding errors (round only at display time, consistent precision)

**Research flag:** Needs research-phase - Progress rollup strategies vary significantly, and time optimization's 300% Rule integration requires custom logic not found in standard OKR tools.

### Phase 3: Tree Fetching & API Layer
**Rationale:** With calculations working, expose data efficiently to frontend. Single-query tree fetching prevents N+1 problems that plague hierarchical systems.

**Delivers:**
- `/api/goal-tree/{visionId}` endpoint with recursive CTE query
- Query depth parameter for performance control
- Nested JSON response structure optimized for React
- `/api/kpi-logs/{id}/log` endpoint returning updated ancestor progress
- Hierarchical query key factory for React Query

**Uses (from STACK.md):**
- Drizzle ORM with raw SQL for recursive CTEs
- React Query key structure from TanStack Query best practices

**Implements (from ARCHITECTURE.md):**
- Tree fetching with single query (no N+1)
- API returning pre-computed progress from cache
- Query key structure enabling surgical invalidation

**Avoids (from PITFALLS.md):**
- Pitfall #4: N+1 queries when loading hierarchy

**Research flag:** Standard pattern, skip research-phase (well-documented REST API design for nested resources)

### Phase 4: Frontend Integration - React Query & State
**Rationale:** APIs exist, now build the state management layer that enables fast, responsive UI with optimistic updates.

**Delivers:**
- React Query hooks for tree/progress with optimistic updates
- Zustand store with Immer for UI state (expanded nodes, selected context)
- Normalized tree state (`{ byId, childrenByParent, rootIds }`)
- Cache invalidation strategy on mutations
- Loading states and error handling

**Uses (from STACK.md):**
- React Query 5.90.16 with optimistic update pattern
- Zustand 5.0.9 with Immer middleware
- Immer 11.x installation (only new dependency)

**Implements (from ARCHITECTURE.md):**
- Optimistic update pattern with rollback on error
- Normalized tree state for efficient updates
- Hierarchical query keys

**Avoids (from PITFALLS.md):**
- Pitfall #6: Stale progress data (optimistic updates, explicit loading states)

**Research flag:** Standard pattern, skip research-phase (TanStack Query docs cover this extensively)

### Phase 5: Cascading Plan View (Tree UI)
**Rationale:** Data and state layers ready, now build the visual hierarchy that users interact with daily.

**Delivers:**
- Collapsible tree view component with virtualization
- Progress bars and status indicators on each node
- Breadcrumb navigation showing current path
- Context sidebar with parent information pinned
- Multiple view options (tree/list toggle)
- Keyboard navigation (expand/collapse with Enter/Space)
- Max 2-3 visible nesting levels (progressive disclosure)

**Addresses (from FEATURES.md):**
- Visual goal hierarchy tree view (table stakes)
- Goal status indicators (table stakes)
- Progress tracking dashboard (table stakes)

**Implements (from ARCHITECTURE.md):**
- Tree view component using normalized state
- Progressive disclosure UI pattern

**Avoids (from PITFALLS.md):**
- Pitfall #3: Deep hierarchy UI unusable (limit visible levels, breadcrumbs, context sidebar)

**Research flag:** Needs research-phase - Complex UI patterns for 5-level hierarchy require evaluation of React tree libraries (e.g., react-arborist, react-complex-tree) vs custom implementation.

### Phase 6: Today Dashboard & KPI Check-in
**Rationale:** Core cascade working, now surface daily actions prominently with quick check-in flow.

**Delivers:**
- Today dashboard showing all active daily KPIs
- Quick check-in form (mark complete, log value, add confidence)
- Progress summary widget (daily/weekly/monthly/quarterly rates)
- Streak calendar visualization (GitHub-style contribution graph)
- 300% Rule gauge showing Clarity/Belief/Consistency scores

**Addresses (from FEATURES.md):**
- Basic check-ins (table stakes)
- Confidence scoring (differentiator)
- **300% Rule tracking (unique differentiator)**
- Streak tracking (differentiator)

**Avoids (from PITFALLS.md):**
- Pitfall #7: 300% Rule becomes vanity metric (link scores to actions, show trends)
- Pitfall #8: Too many objectives (focus on daily items only, show capacity)

**Research flag:** Needs research-phase - 300% Rule implementation requires understanding how Clarity/Belief/Consistency map to quantifiable system behaviors (not documented in time optimization's public materials).

### Phase 7: Progress Page & Analytics
**Rationale:** Users need to understand trends over time and see full roll-up cascade visualization.

**Delivers:**
- Roll-up view showing Vision → Quarter → Month → Week → Day progress
- Activity feed of recent completions across hierarchy
- Trend charts (progress over time, confidence trends)
- "Impact" indicators showing which activities drive top-level goals
- Goal health scoring (flag "zombie goals" with no activity)

**Addresses (from FEATURES.md):**
- Progress tracking dashboard (enhanced beyond table stakes)
- Time period scoping with filtering

**Avoids (from PITFALLS.md):**
- Pitfall #8: Too many goals (goal health scoring, zombie detection)

**Research flag:** Standard pattern, skip research-phase (analytics dashboards well-documented in Recharts/Chart.js docs)

### Phase 8: Advanced Features & Polish
**Rationale:** Core cascade complete, add competitive differentiators and refinements.

**Delivers:**
- Weighted progress calculation UI (assign importance to KPIs)
- AI alignment suggestions (flag potential conflicts)
- OKR retrospectives (end-of-quarter learnings)
- Goal templates for common patterns
- Capacity visualization (hours/week committed vs available)
- Export/reporting capabilities

**Addresses (from FEATURES.md):**
- Weighted progress calculation (differentiator)
- AI alignment suggestions (differentiator)

**Research flag:** Needs research-phase (Phase-specific) - AI alignment pattern detection requires ML/heuristic research.

### Phase Ordering Rationale

**Dependency-driven sequencing:** Schema must exist before calculations, calculations before APIs, APIs before frontend, frontend before advanced UI. Each phase depends on the previous being stable.

**Risk mitigation:** Critical pitfalls (data model, progress calculation, performance) addressed early when changes are cheaper. UI/UX pitfalls tackled after backend is solid.

**Value delivery:** By Phase 6, users have a working cascade with daily check-ins - core value proposition delivered. Phases 7-8 are enhancements.

**Research minimization:** Standard patterns (Phases 1, 3, 4, 7) skip research. Complex/novel features (Phases 2, 5, 6, 8) get research-phase validation.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 2 (Progress Calculation):** Multiple strategies exist (eager triggers vs lazy computation vs hybrid vs background jobs). time optimization's 300% Rule integration with standard progress math needs custom logic design. Weighting algorithms vary (arithmetic mean vs geometric mean vs say/do ratio).
- **Phase 5 (Tree UI):** React tree component library evaluation (react-arborist vs react-complex-tree vs custom). Virtualization for large hierarchies. Accessibility patterns for deeply nested trees.
- **Phase 6 (300% Rule):** Mapping Clarity/Belief/Consistency to quantifiable behaviors. How do scores integrate with progress roll-up? What actions trigger score changes?
- **Phase 8 (AI Alignment):** Pattern detection algorithms for goal conflicts. Heuristics for "good" vs "bad" KPI relationships.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Schema):** PostgreSQL foreign keys, indexes, migrations - well-documented.
- **Phase 3 (APIs):** REST API design for nested resources, recursive CTEs - established patterns.
- **Phase 4 (State Management):** React Query + Zustand patterns extensively documented by TanStack team and community.
- **Phase 7 (Analytics):** Chart libraries (Recharts, Chart.js) and dashboard layouts have standard implementations.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | React Query, Zustand, Drizzle ORM, Supabase all verified with official docs. Optimistic update patterns well-documented. Only addition (Immer) is mature library with known bundle size. |
| Features | **MEDIUM** | Table stakes and anti-features verified across 5+ OKR products (Lattice, 15Five, Perdoo, Weekdone, Quantive). Differentiators validated except 300% Rule (unique to GAP, no competitor examples). WebSearch sources, not hands-on testing. |
| Architecture | **HIGH** | Hybrid progress calculation pattern verified in multiple sources (Citus Data, Hashrocket on materialized views). React Query hierarchical patterns from official TanStack docs and TkDodo blog (authoritative community source). Tree UI challenges well-documented in Carbon Design System, Retool, PatternFly. |
| Pitfalls | **HIGH** | Critical pitfalls (#1-5) verified from authoritative OKR sources (What Matters, Quantive, Workpath) and PostgreSQL performance guides (Cybertec, MinervaDB). Moderate/minor pitfalls from official help centers (Lattice, PeopleForce) and established anti-pattern articles (Jeff Gothelf, Tability). |

**Overall confidence:** **HIGH**

Research drew from official documentation (PostgreSQL, TanStack Query, Zustand, Drizzle ORM), established OKR best practices (What Matters, multiple enterprise tools), and verified database patterns (Citus Data, Cybertec on PostgreSQL). The only MEDIUM confidence area is Features, primarily because 300% Rule is unique to GAP with no competitor implementation to study.

### Gaps to Address

**300% Rule Implementation Details** - time optimization's public materials describe the concept (Clarity + Belief + Consistency = 300%) but not the software mechanics. During Phase 6 planning, need to decide:
- How Clarity score is quantified (SMART goal completeness? User self-assessment?)
- How Belief score is measured (confidence scoring? Streak consistency?)
- How Consistency score is calculated (daily check-in completion rate? Progress velocity?)
- How these scores integrate with standard progress percentages
- Mitigation: Phase 6 requires research-phase to design scoring algorithms before implementation.

**Weighted Progress Formula** - Multiple calculation strategies exist (arithmetic mean, weighted average, say/do ratio, geometric mean). Research identified the options but not which is best for time optimization methodology.
- Mitigation: Phase 2 research-phase evaluates strategies against user scenarios ("finished the important thing" should show high progress).

**Tree Component Library Selection** - Evaluation needed between react-arborist (11.8KB, popular), react-complex-tree (45KB, feature-rich), or custom implementation.
- Mitigation: Phase 5 research-phase benchmarks libraries against 5-level hierarchy performance and accessibility requirements.

**Cross-Functional Goal Alignment** - Research emphasizes OKRs as networks, not trees. Current single-user scope allows tree, but future team features will need many-to-many alignment.
- Mitigation: Design schema in Phase 1 to support future `kpi_alignments` junction table (many-to-many) even if only using parent_kpi_id (one-to-many) initially.

**Real-time vs Polling for Progress Updates** - For single-user, React Query's refetch-on-focus is sufficient. But if team features added, need Supabase Realtime subscriptions.
- Mitigation: Architecture allows adding real-time layer without refactoring (subscribe to kpi_logs changes, invalidate React Query cache).

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [TanStack Query v5 Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) - React Query mutation patterns
- [Zustand Updating State](https://zustand.docs.pmnd.rs/guides/updating-state) - Immer middleware integration
- [Drizzle ORM Relations](https://orm.drizzle.team/docs/relations-v2) - Self-referencing relationships
- [PostgreSQL WITH RECURSIVE](https://www.postgresql.org/docs/current/queries-with.html) - Recursive CTE documentation
- [Supabase Realtime](https://supabase.com/docs/guides/realtime) - Real-time subscriptions with Next.js
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/trigger-definition.html) - Trigger functions
- [GitLab Database Guide](https://docs.gitlab.com/ee/development/database/add_foreign_key_to_existing_column.html) - Multi-step FK migration pattern

**OKR Product Help Centers:**
- [Lattice - Cascading Goals](https://help.lattice.com/hc/en-us/articles/1500001356821-Cascading-Goals) - Parent-child alignment patterns
- [Lattice - Progress Calculation](https://help.lattice.com/hc/en-us/articles/360059451414-Understand-Progress-Calculation-in-Lattice) - Weighted rollup mechanics
- [15Five - Objectives Feature Overview](https://success.15five.com/hc/en-us/articles/17103846921243-Objectives-Feature-Overview) - Weight assignment UI
- [Perdoo Support - Aligning OKRs](https://support.perdoo.com/en/articles/5391069-aligning-okrs) - Multi-level hierarchy, network vs tree
- [PeopleForce - OKR Progress Calculation](https://help.peopleforce.io/en/articles/8498885-okr-progress-calculation) - Rollup formula examples

### Secondary (MEDIUM confidence)

**Community Best Practices:**
- [Effective React Query Keys - TkDodo](https://tkdodo.eu/blog/effective-react-query-keys) - Hierarchical key structure patterns
- [Concurrent Optimistic Updates - TkDodo](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query) - Mutation queue management
- [Drizzle Recursive Relationships](https://wanago.io/2024/10/21/api-nestjs-drizzle-postgresql-recursive-relationships/) - WITH RECURSIVE workarounds
- [Zustand Architecture at Scale](https://brainhub.eu/library/zustand-architecture-patterns-at-scale) - Store composition patterns
- [Immer npm package](https://www.npmjs.com/package/immer) - Performance characteristics v11 vs v10

**OKR Anti-patterns:**
- [What Matters - Common OKR Mistakes](https://www.whatmatters.com/faqs/common-okr-mistakes) - John Doerr's authoritative source
- [Quantive - 20 Most Common OKR Mistakes](https://quantive.com/resources/articles/okr-mistakes) - Enterprise tool vendor insights
- [Workpath - 8 OKR Pitfalls](https://www.workpath.com/en/magazine/okr-pitfalls) - European OKR tool perspective
- [Jeff Gothelf - OKR Anti-patterns](https://jeffgothelf.com/blog/sandbagging-okr-antipattern/) - Industry thought leader
- [Tability - OKR Scoring](https://www.tability.io/okrs/how-to-score-your-okrs) - Google's 70% rule analysis

**Database Performance:**
- [Citus Data - Materialized Views vs Rollup Tables](https://www.citusdata.com/blog/2018/10/31/materialized-views-vs-rollup-tables/) - Trade-offs in aggregation strategies
- [Hashrocket - Materialized View Strategies](https://hashrocket.com/blog/posts/materialized-view-strategies-using-postgresql) - Refresh patterns
- [Cybertec - Speeding Up Recursive Queries](https://www.cybertec-postgresql.com/en/postgresql-speeding-up-recursive-queries-and-hierarchic-data/) - PostgreSQL optimization
- [MinervaDB - Recursive Queries in PostgreSQL](https://minervadb.xyz/how-to-implement-optimally-recursive-queries-and-hierarchical-data-in-postgresql/) - Closure table pattern
- [The Linux Code - PostgreSQL Triggers in 2026](https://thelinuxcode.com/postgresql-triggers-in-2026-design-performance-and-production-reality/) - Production trigger patterns

**UI/UX Patterns:**
- [Carbon Design System - Tree View Usage](https://carbondesignsystem.com/components/tree-view/usage/) - Accessibility guidelines
- [Retool - Designing UI for Tree Data](https://retool.com/blog/designing-a-ui-for-tree-data) - Progressive disclosure patterns
- [PatternFly - Tree View Guidelines](https://www.patternfly.org/components/tree-view/design-guidelines/) - Keyboard navigation
- [Medium - Designing Nested Tables](https://medium.com/design-bootcamp/designing-nested-tables-the-ux-of-showing-complex-data-without-creating-chaos-0b25f8bdd7d9) - Nesting depth limits
- [REST API Design - Sub and Nested Resources](https://www.moesif.com/blog/technical/api-design/REST-API-Design-Best-Practices-for-Sub-and-Nested-Resources/) - API patterns for hierarchies

### Tertiary (Context/Background)

**Market Research:**
- [Datalligence - 15 Must-Have OKR Features 2025](https://datalligence.ai/blogs/okr-software-features/) - Feature landscape
- [Workpath - Enterprise OKR Software 2025](https://www.workpath.com/en/magazine/best-ai-okr-kpi-business-review-software) - AI trends
- [Trophy - Gamification Case Studies](https://trophy.so/blog/streaks-gamification-case-study) - Streak tracking effectiveness

**time optimization Methodology:**
- Time optimization methodology principles - Core methodology
- [time optimization Twitter - 300% Rule](https://x.com/danmartell/status/1902440329309254021) - Concept explanation

**User Behavior Research:**
- [Forasoft - App Abandonment](https://www.forasoft.com/blog/article/avoid-app-abandonment-strategies) - 77% abandon in 3 days stat
- [Orbix Studio - UX Patterns for Retention](https://www.orbix.studio/blogs/mobile-app-ux-patterns-increase-retention) - Retention drivers

---
*Research completed: 2026-01-23*
*Ready for roadmap: yes*
