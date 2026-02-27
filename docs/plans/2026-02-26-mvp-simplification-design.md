# MVP Simplification Design

**Date:** 2026-02-26
**Status:** Approved
**Approach:** Surgical Removal (Approach A)

---

## Problem

The current app has 24 dashboard pages, 58+ database tables, and ~40 API routes covering visions, OKRs, milestones, routines, pomodoro, gamification, team sharing, rewards, reviews, and more. The MVP is too complex. The core value proposition is simpler:

**Categorize your time from Google Calendar, see where you're making money and building leverage, and shift more time into those boxes.**

---

## MVP Scope

### Features Kept (6 areas + settings)

| Feature | Purpose |
|---------|---------|
| **Dashboard** | Read-only reporting: DRIP breakdown, AI coaching nudges, scorecard |
| **Time Audit** | Core interaction: calendar view, AI categorization, bulk edit, insights, charts |
| **Analytics** | Deep dive: production %, trends, projects, meetings, heatmap |
| **Leverage** | 4 C's tracking: Code, Content, Capital, Collaboration |
| **Network** | Friend Inventory with energy scores and contact tracking |
| **Team** | Team sharing and collaboration |
| **Settings** | Account, Google Calendar connection, profile |

### Subscription Model

**Everything free** during product-market fit validation. Stripe integration stays wired but dormant. No tier gating on any feature.

### AI Surface Area

Three levels, all in MVP:

1. **Auto-categorize** — AI classifies Google Calendar events into DRIP quadrants and assigns detected projects
2. **Insights** — AI analyzes patterns and generates actionable recommendations (existing Insights tab)
3. **Coaching nudges** — Proactive nudges on Dashboard: "Your Production time dropped 15% this week..." (new endpoint)

---

## Sidebar Navigation

```
  Dashboard          <- landing page
  Time Audit
  Analytics
  ---------
  Leverage
  Network
  ---------
  Team
  ---------
  Settings
```

Admin section stays for admin users. All tier badges and upgrade prompts removed.

---

## Dashboard Design (Rebuilt)

The Dashboard is a **read-only reporting and summarization tool**. No inline editing — categorization happens in Time Audit.

### Layout

1. **Uncategorized events banner** (top) — "You have X uncategorized events" with [Review Now] link to Time Audit bulk categorization
2. **DRIP quadrant cards** — Hours per quadrant this week + % change from last week + total hours
3. **Visualization switcher** with 3 modes and a time period selector:
   - **Value Matrix (Quadrant Grid)** — 2x2 grid with axes "Makes You Money" (Y) x "Lights You Up" (X). Events appear as read-only cards in their quadrant showing title, description, and hours. Quadrants: Replacement (top-left, orange), Production (top-right, green), Delegation (bottom-left, red), Investment (bottom-right, cyan). Count badges per quadrant.
   - **Stacked Timeline** — Daily or weekly horizontal bars color-coded by DRIP quadrant showing how time breaks down over the period
   - **Bubble Chart** — Events as bubbles sized by hours, plotted on Money x Energy axes
4. **Time period selector** — This Week / 2 Weeks / This Month / 3 Months (filters all views)
5. **Bottom row:**
   - **Scorecard** — Leverage items active, Network contacts engaged, Production trend sparkline
   - **AI Coaching Nudge** — 1-2 actionable recommendations from recent patterns

### New API Endpoint

`POST /api/ai/generate-coaching-nudge` — Takes recent DRIP data (this week vs last 4 weeks) and generates 1-2 specific, actionable nudges.

---

## Time Audit (Minimal Changes)

The most built-out feature. Stays as the core interaction.

### Stays as-is
- Calendar tab: weekly calendar view, Google Calendar sync, DRIP color coding, bulk categorization, multi-select, tag management
- Insights tab: AI-generated pattern insights
- Manage tab: event list, bulk edit/delete
- Charts tab: historical trends
- Projects sub-page (`/time-audit/projects`): manage auto-detected projects

### Removed
- References to Impact Projects, Visions, or Power Goals in categorization flows
- Tier gating on biweekly/monthly views (everything free)
- Subscription upgrade prompts

### Enhanced
- AI coaching nudges can appear as a banner in the Insights tab (reuses dashboard endpoint)

---

## Analytics (Minimal Changes)

Already time-centric. Mostly survives.

### Stays
- Date range selector (1 week / 2 weeks / 1 month / 3 months)
- KPI cards: Production Time %, Total Hours, Meeting Load %, Project Time
- Overview tab: category breakdown, period comparison, weekly trends, value pie, energy pie, productivity heatmap
- Projects tab: time by project chart, project editing
- Meetings tab: meeting load widget, external vs internal, period comparison

### Removed
- Leverage Breakdown Chart (moves to Leverage page)
- "Link to Impact Project" in project edit dialogs
- Tier gating on date ranges

### Added
- AI Insights card surfacing coaching analysis

---

## Leverage, Network, Team (Light Cleanup)

### Leverage
- Remove linking to Visions/Impact Projects
- Remove Pro tier gating

### Network
- Remove Pro tier gating
- Remove references to goal hierarchy

### Team Sharing
- Remove shared tab types for cut features
- Shareable tabs limited to: Time Audit, Analytics, Leverage, Network

---

## What Gets Cut

### Pages Removed (18 pages)

| Page | Route |
|------|-------|
| Today | `/today` |
| Progress | `/progress` |
| Vision Planner V2 | `/vision-planner` |
| Projects V2 | `/projects`, `/projects/[id]` |
| Vision (Legacy) | `/vision`, `/vision/[id]` |
| Key Results (OKRs) | `/okrs` |
| Milestones | `/goals`, `/goals/[id]` |
| Daily & Weekly MINS | `/mins` |
| Planner | `/planner` |
| Backtrack | `/backtrack`, `/backtrack/[id]` |
| Value Matrix (standalone) | `/drip` |
| Routines | `/routines` |
| Pomodoro | `/pomodoro` |
| Reviews | `/reviews` |
| Rewards | `/rewards` |
| Guide | `/guide` |
| Dev test page | `/dev/event-card-test` |

### API Routes Removed (~25 endpoints)

All routes for: visions, power-goals, targets, mins, routines, reviews, pomodoro, daily-checkins, backtrack, milestones-v2, projects-v2, project-key-results, tasks-v2, rewards-v2, streaks-v2, non-negotiables, vision-kpis, kpi-dashboard, milestone-kpis, gamification, progress, goal-tree, vision-activity, seed.

### API Routes Kept

- `/api/ai/classify-activity` — AI categorization
- `/api/ai/generate-time-insights` — AI insights
- `/api/ai/suggest-tags` — tag suggestions
- `/api/ai/generate-coaching-nudge` — NEW: coaching nudges
- `/api/calendar/*` — full Google Calendar integration
- `/api/time-blocks/*` — time block CRUD + bulk update
- `/api/event-categorizations` — persist categorizations
- `/api/tags` — custom tags
- `/api/detected-projects` — auto-detected projects
- `/api/meeting-categories` — meeting types
- `/api/leverage/*` — leverage items + analytics
- `/api/network` — friend inventory (if exists)
- `/api/team` + `/api/sharing/*` — team sharing
- `/api/stripe/*` — payment infrastructure (dormant)
- `/api/user/*` — profile, settings, subscription
- `/api/profile` — profile read
- `/api/feedback` — user feedback
- `/api/admin/*` — admin panel
- `/api/dashboard/stats` — REBUILT for time-centric data

---

## Database Strategy

### Approach
**Do NOT drop tables from Supabase.** Data stays in the database. We only remove Drizzle schema definitions and API routes from the codebase. If a feature is restored later, the data is still there.

### Tables Kept (~20)
- `profiles`, `user_settings`
- `time_blocks`, `time_block_meeting_details`, `time_block_tags`, `time_block_tag_assignments`, `time_block_leverage_links`
- `activity_categories`, `event_categorizations`, `detected_projects`, `meeting_categories`
- `audit_snapshots`, `user_charts`
- `leverage_items`
- `friend_inventory`
- `team_members`, `tab_permissions`, `item_permissions`, `share_invitations`, `task_comments`
- `calendar_sync_settings`, `calendar_sync_records`, `calendar_webhook_channels`
- `ai_usage_logs`, `beta_feedback`, `beta_invitations`, `pro_tips`

### Tables Archived from Schema (~38)
All others: `visions`, `power_goals`, `monthly_targets`, `weekly_targets`, `daily_actions`, `mins`, `routines`, `routine_steps`, `routine_completions`, `pomodoro_sessions`, `daily_reviews`, `key_results`, `key_result_updates`, `projects` (V2), `project_key_results`, `project_key_result_logs`, `milestones_v2`, `tasks`, `daily_checkins`, `strategic_discoveries`, `backtrack_plans`, `quarterly_targets`, `vision_kpis`, `kpi_logs`, `kpi_streaks`, `kpi_progress_cache`, `north_star_metrics`, `metric_logs`, `weekly_scorecards`, `milestone_kpis`, `vision_board_images`, `daily_affirmation_completions`, `non_negotiables`, `non_negotiable_completions`, `vision_review_reminders`, `achievements`, `user_achievements`, `user_gamification`, `streaks_v2`, `rewards`, `reward_claims`.

---

## Git Strategy

1. Create `archive/v1-full` branch from current main (preserves all code)
2. All removal work happens on a feature branch off main
3. Merge to main when complete
