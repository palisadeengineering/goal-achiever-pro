# Goal Achiever Pro - Vision & KPI Cascade Fix

## What This Is

A comprehensive fix to Goal Achiever Pro's Vision & Planning features, transforming isolated pages into a unified cascading system where Vision drives KPIs that flow down to quarterly/monthly/weekly/daily goals, with progress rolling back up to the dashboard. Based on a proven time optimization methodology.

## Core Value

When a user creates a Vision, the entire goal hierarchy cascades automatically - from SMART-based KPIs down to daily actions - and completing any item visibly moves progress up the chain to the dashboard.

## Requirements

### Validated

<!-- Existing working features in the codebase -->

- ✓ Vision creation with SMART goal components — existing
- ✓ 300% Rule tracking (Clarity, Belief, Consistency) — existing
- ✓ AI-powered SMART goal generation via Claude — existing
- ✓ Time block tracking with Value Matrix categorization — existing
- ✓ Daily reviews system — existing
- ✓ Subscription tier gating (Free/Pro/Premium) — existing
- ✓ Supabase auth with demo mode — existing
- ✓ Dashboard with basic stats — existing

### Active

<!-- What we're building in this milestone -->

- [ ] Vision → KPI cascade: Creating a vision auto-generates aligned KPIs
- [ ] KPI time horizons: Each KPI has quarterly/monthly/weekly/daily breakdown
- [ ] Progress roll-up: Completing daily KPIs updates weekly → monthly → quarterly → vision
- [ ] Today dashboard: Shows all active items across the cascade for today
- [ ] Progress page: Roll-up view + activity feed + analytics charts
- [ ] Daily check-in: Input 300% scores with cascade-aware context
- [ ] Unified KPI terminology: Consistent naming across the system
- [ ] Visual hierarchy: UI clearly shows how items connect to parent goals

### Out of Scope

- Mobile app — web-first for this milestone
- Team collaboration features — focus on single-user cascade first
- Google Calendar sync improvements — separate milestone
- Stripe/payment changes — not related to cascade fix

## Context

**Current State:**
The codebase has Vision, Key Results, Milestones, and MINs pages but they operate in isolation. The database schema has relationships (vision_id foreign keys) but the UI doesn't leverage them for cascading or roll-up.

**Architecture Debt:**
- Impact Projects, Monthly/Weekly/Daily Targets exist but terminology is inconsistent
- No unified "cascade" data flow pattern
- Dashboard doesn't reflect real-time progress from child items

**Time Optimization Methodology:**
Based on proven productivity frameworks - Visions with SMART components, 300% Rule (Clarity + Belief + Consistency = 300%), Impact Projects as quarterly projects.

## Constraints

- **Tech stack**: Next.js 16, Supabase, Drizzle ORM — no changes
- **Data migration**: Must preserve existing user data, migrate to new structure
- **Terminology**: Standardize on "KPIs" for all goal/metric items below Vision

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use KPIs as unified term | User preference, clearer than mixing metrics/goals/targets | — Pending |
| Top-down cascade only | User specified cascade flows Vision → down, progress rolls up | — Pending |
| Research OKR/KPI systems first | Learn from proven patterns before implementing | — Pending |

---
*Last updated: 2025-01-23 after initialization*
