# Phase 8: Progress Page - Gap Analysis

**Analyzed:** 2026-01-25
**Status:** PARTIAL - Significant work needed

## Requirements Coverage

| Requirement | Status | Implementation | Gap |
|-------------|--------|----------------|-----|
| PRGS-01 | ❌ Missing | Progress page shows KPIs by vision | No roll-up visualization |
| PRGS-02 | ❌ Missing | vision-activity API exists | No activity feed UI |
| PRGS-03 | ❌ Missing | vision-activity API has data | No trend charts |
| PRGS-04 | ❌ Missing | - | No zombie goal detection |
| PRGS-05 | ⚠️ Partial | KPIs grouped by vision | No date/status filters |
| PRGS-06 | ❌ Missing | - | No impact indicators |

## Existing Implementation

### Progress Page (`src/app/(dashboard)/progress/page.tsx`)
- ~480 lines
- Shows KPIs by vision with completion badges
- Streak leaderboard with milestones
- Summary stats (daily KPIs, actions, best streak, total KPIs)
- Quick links to Today, Vision, Backtrack

### Vision Activity API (`src/app/api/vision-activity/route.ts`)
- Returns 365 days of activity data
- Aggregates: affirmations, non-negotiables, KPI logs, reviews, goals completed
- Calculates composite score per day (0-100)
- Supports vision filtering via query param
- **Could power**: PRGS-02 (activity feed), PRGS-03 (trend charts)

### Goal Tree API (`src/app/api/goal-tree/[visionId]/route.ts`)
- Returns nested hierarchy with progress percentages
- **Could power**: PRGS-01 (roll-up visualization), PRGS-06 (impact indicators)

## Gaps to Close

### Gap 1: Roll-up Visualization (PRGS-01)
**Current:** Progress page shows flat KPI list grouped by vision
**Needed:** Hierarchical visualization showing Vision -> Quarter -> Month -> Week -> Day

**Solution:**
- Create `HierarchyRollupView` component
- Use existing `useGoalTree` hook for data
- Display as nested progress bars or Sankey-style flow diagram
- Show progress % at each level

**Estimated effort:** 2-3 hours

### Gap 2: Activity Feed (PRGS-02)
**Current:** No activity feed showing recent completions
**Needed:** Chronological list of recent KPI completions across hierarchy

**Solution:**
- Create `/api/progress/activity-feed` endpoint
- Query kpi_logs ordered by created_at DESC
- Join with vision_kpis to get title, level, vision info
- Create `ActivityFeed` component with infinite scroll
- Show: KPI title, level badge, vision color, timestamp

**Estimated effort:** 2-3 hours

### Gap 3: Trend Charts (PRGS-03)
**Current:** vision-activity API has data but no chart UI
**Needed:** Line/bar charts showing progress over time

**Solution:**
- Create `ProgressTrendChart` component using Recharts
- Fetch from vision-activity API
- Show composite score, KPI completions, 300% scores over time
- Add date range selector (7d, 30d, 90d, 365d)

**Estimated effort:** 2-3 hours

### Gap 4: Zombie Goal Detection (PRGS-04)
**Current:** No mechanism to flag stale goals
**Needed:** Identify KPIs with no activity in 14+ days

**Solution:**
- Update `/api/progress/summary` to include zombieGoals array
- Query kpi_logs for each KPI to find last activity date
- Flag KPIs where last_activity > 14 days ago
- Create `ZombieGoalsWidget` showing flagged items with "Revive" actions

**Estimated effort:** 1-2 hours

### Gap 5: Filters (PRGS-05)
**Current:** KPIs grouped by vision, no filtering
**Needed:** Filter by quarter, month, status, vision

**Solution:**
- Add filter controls to Progress page header
- Vision selector (dropdown)
- Status filter (on-track, at-risk, behind, all)
- Date range selector (this quarter, this month, custom)
- Pass filters to API and update UI

**Estimated effort:** 1-2 hours

### Gap 6: Impact Indicators (PRGS-06)
**Current:** No indication of which daily actions drive top-level goals
**Needed:** Show which daily KPIs have highest weight/impact on vision progress

**Solution:**
- Calculate "impact score" based on path weight to vision
- Daily KPI with weight 2 under a monthly with weight 3 = higher impact
- Show impact badge (High/Medium/Low) on daily KPIs
- Create "Top Impact" section showing most influential daily actions

**Estimated effort:** 2-3 hours

## Recommended Plan Structure

Given the scope (all 6 requirements need work), split into 3 plans:

**08-01: Roll-up Visualization & Filters**
- PRGS-01: Hierarchy roll-up view
- PRGS-05: Filter controls

**08-02: Activity Feed & Trend Charts**
- PRGS-02: Activity feed with recent completions
- PRGS-03: Progress trend charts

**08-03: Goal Health & Impact**
- PRGS-04: Zombie goal detection
- PRGS-06: Impact indicators

**Total estimated effort:** 10-16 hours

## Data Sources

| Data Need | API Endpoint | Status |
|-----------|--------------|--------|
| Hierarchy tree | /api/goal-tree/[visionId] | ✅ Exists |
| Daily activity | /api/vision-activity | ✅ Exists |
| KPI progress | /api/progress/summary | ✅ Exists |
| Recent logs | /api/progress/activity-feed | ❌ Create |
| Zombie detection | /api/progress/summary (enhance) | 🔄 Enhance |

---
*Gap analysis: 2026-01-25*
