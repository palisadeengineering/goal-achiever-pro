# MVP Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Strip the app down to 6 feature areas (Dashboard, Time Audit, Analytics, Leverage, Network, Team) + Settings by removing 18 pages, ~25 API routes, ~38 DB schema definitions, simplifying navigation, removing all tier gating, rebuilding the Dashboard as a time-centric reporting page, and adding AI coaching nudges.

**Architecture:** Surgical removal from existing codebase. Delete pages/routes/schema definitions for cut features. Rebuild Dashboard with 3 visualization modes (Value Matrix quadrant grid, stacked timeline, bubble chart). Add new `/api/ai/generate-coaching-nudge` endpoint. All subscription tier gating removed — everything free during PMF validation.

**Tech Stack:** Next.js 16 (App Router), TypeScript, React 19, Tailwind CSS 4, shadcn/ui, Drizzle ORM, Supabase, Anthropic Claude AI, Recharts (charts), Zustand, TanStack React Query.

**Design Doc:** `docs/plans/2026-02-26-mvp-simplification-design.md`

**Archive Branch:** `archive/v1-full` (created at `e6c7d8f`)

---

## Phase 1: Bulk Page Deletion

### Task 1: Delete cut dashboard pages

**Files:**
- Delete: `src/app/(dashboard)/today/`
- Delete: `src/app/(dashboard)/progress/`
- Delete: `src/app/(dashboard)/vision-planner/`
- Delete: `src/app/(dashboard)/projects/`
- Delete: `src/app/(dashboard)/vision/`
- Delete: `src/app/(dashboard)/okrs/`
- Delete: `src/app/(dashboard)/goals/`
- Delete: `src/app/(dashboard)/mins/`
- Delete: `src/app/(dashboard)/planner/`
- Delete: `src/app/(dashboard)/backtrack/`
- Delete: `src/app/(dashboard)/drip/`
- Delete: `src/app/(dashboard)/routines/`
- Delete: `src/app/(dashboard)/pomodoro/`
- Delete: `src/app/(dashboard)/reviews/`
- Delete: `src/app/(dashboard)/rewards/`
- Delete: `src/app/(dashboard)/guide/`
- Delete: `src/app/(dashboard)/dev/`

**Step 1: Delete all cut page directories**

```bash
rm -rf src/app/\(dashboard\)/today
rm -rf src/app/\(dashboard\)/progress
rm -rf src/app/\(dashboard\)/vision-planner
rm -rf src/app/\(dashboard\)/projects
rm -rf src/app/\(dashboard\)/vision
rm -rf src/app/\(dashboard\)/okrs
rm -rf src/app/\(dashboard\)/goals
rm -rf src/app/\(dashboard\)/mins
rm -rf src/app/\(dashboard\)/planner
rm -rf src/app/\(dashboard\)/backtrack
rm -rf src/app/\(dashboard\)/drip
rm -rf src/app/\(dashboard\)/routines
rm -rf src/app/\(dashboard\)/pomodoro
rm -rf src/app/\(dashboard\)/reviews
rm -rf src/app/\(dashboard\)/rewards
rm -rf src/app/\(dashboard\)/guide
rm -rf src/app/\(dashboard\)/dev
```

**Step 2: Verify only kept pages remain**

```bash
ls src/app/\(dashboard\)/
```

Expected remaining: `dashboard/`, `time-audit/`, `analytics/`, `leverage/`, `network/`, `team/`, `settings/`, `admin/`, `layout.tsx`, any shared files.

**Step 3: Commit**

```bash
git add -A
git commit -m "simplify: remove 17 cut dashboard pages

Removes: today, progress, vision-planner, projects, vision, okrs,
goals, mins, planner, backtrack, drip, routines, pomodoro, reviews,
rewards, guide, dev. Archive at branch archive/v1-full."
```

---

### Task 2: Delete cut API routes

**Files:**
- Delete: `src/app/api/visions/`
- Delete: `src/app/api/power-goals/`
- Delete: `src/app/api/targets/`
- Delete: `src/app/api/mins/`
- Delete: `src/app/api/routines/`
- Delete: `src/app/api/reviews/`
- Delete: `src/app/api/pomodoro/`
- Delete: `src/app/api/daily-checkins/`
- Delete: `src/app/api/milestones-v2/`
- Delete: `src/app/api/projects-v2/`
- Delete: `src/app/api/project-key-results/`
- Delete: `src/app/api/tasks-v2/`
- Delete: `src/app/api/rewards-v2/`
- Delete: `src/app/api/streaks-v2/`
- Delete: `src/app/api/non-negotiables/`
- Delete: `src/app/api/vision-kpis/`
- Delete: `src/app/api/kpi-dashboard/`
- Delete: `src/app/api/milestone-kpis/`
- Delete: `src/app/api/gamification/`
- Delete: `src/app/api/progress/`
- Delete: `src/app/api/goal-tree/`
- Delete: `src/app/api/vision-activity/`
- Delete: `src/app/api/seed/`
- Delete: `src/app/api/backtrack/`
- Delete: `src/app/api/key-results/`
- Delete: `src/app/api/today/`
- Delete: `src/app/api/dashboard/` (will be rebuilt later)
- Delete: `src/app/api/user-charts/` (if only used by cut features — verify first)

**Step 1: Delete cut API route directories**

```bash
# Core cut features
rm -rf src/app/api/visions
rm -rf src/app/api/power-goals
rm -rf src/app/api/targets
rm -rf src/app/api/mins
rm -rf src/app/api/routines
rm -rf src/app/api/reviews
rm -rf src/app/api/pomodoro
rm -rf src/app/api/daily-checkins
rm -rf src/app/api/backtrack
rm -rf src/app/api/key-results
rm -rf src/app/api/today

# V2 system
rm -rf src/app/api/milestones-v2
rm -rf src/app/api/projects-v2
rm -rf src/app/api/project-key-results
rm -rf src/app/api/tasks-v2
rm -rf src/app/api/rewards-v2
rm -rf src/app/api/streaks-v2

# KPI/gamification
rm -rf src/app/api/non-negotiables
rm -rf src/app/api/vision-kpis
rm -rf src/app/api/kpi-dashboard
rm -rf src/app/api/milestone-kpis
rm -rf src/app/api/gamification
rm -rf src/app/api/progress
rm -rf src/app/api/goal-tree
rm -rf src/app/api/vision-activity

# Seed data
rm -rf src/app/api/seed

# Dashboard (will rebuild)
rm -rf src/app/api/dashboard
```

**Step 2: Verify kept API routes remain**

```bash
ls src/app/api/
```

Expected remaining: `ai/`, `calendar/`, `time-blocks/`, `event-categorizations/`, `tags/`, `detected-projects/`, `meeting-categories/`, `leverage/`, `team/`, `sharing/`, `stripe/`, `user/`, `profile/`, `feedback/`, `admin/`, `invite/`, `auth/`, `user-charts/` (if used by analytics).

**Step 3: Commit**

```bash
git add -A
git commit -m "simplify: remove ~25 cut API routes

Removes routes for: visions, power-goals, targets, mins, routines,
reviews, pomodoro, daily-checkins, backtrack, key-results, today,
milestones-v2, projects-v2, project-key-results, tasks-v2, rewards-v2,
streaks-v2, non-negotiables, vision-kpis, kpi-dashboard, milestone-kpis,
gamification, progress, goal-tree, vision-activity, seed, dashboard."
```

---

### Task 3: Delete cut AI endpoints

**Files:**
- Delete or verify each AI route. Keep only: `classify-activity`, `generate-time-insights`, `suggest-tags`, `suggest-event-cleanup`.
- Delete: `generate-smart`, `generate-power-goals`, `generate-kpis`, `generate-targets`, `suggest-vision`, `generate-projects`, `generate-backtrack`, `generate-affirmation`, `generate-monthly-projects`, `suggest-non-negotiables`, `generate-questions`, `generate-metric-questions`, `generate-plan-from-metrics`, `generate-pricing-models`, `calculate-revenue`, `suggest-date`, `edit-kpi`, `strategic-discovery`.

**Step 1: Delete cut AI routes**

```bash
rm -rf src/app/api/ai/generate-smart
rm -rf src/app/api/ai/generate-power-goals
rm -rf src/app/api/ai/generate-kpis
rm -rf src/app/api/ai/generate-targets
rm -rf src/app/api/ai/suggest-vision
rm -rf src/app/api/ai/generate-projects
rm -rf src/app/api/ai/generate-backtrack
rm -rf src/app/api/ai/generate-affirmation
rm -rf src/app/api/ai/generate-monthly-projects
rm -rf src/app/api/ai/suggest-non-negotiables
rm -rf src/app/api/ai/generate-questions
rm -rf src/app/api/ai/generate-metric-questions
rm -rf src/app/api/ai/generate-plan-from-metrics
rm -rf src/app/api/ai/generate-pricing-models
rm -rf src/app/api/ai/calculate-revenue
rm -rf src/app/api/ai/suggest-date
rm -rf src/app/api/ai/edit-kpi
rm -rf src/app/api/ai/strategic-discovery
```

**Step 2: Verify kept AI routes**

```bash
ls src/app/api/ai/
```

Expected remaining: `classify-activity/`, `generate-time-insights/`, `suggest-tags/`, `suggest-event-cleanup/`.

**Step 3: Commit**

```bash
git add -A
git commit -m "simplify: remove 18 cut AI endpoints

Keeps only: classify-activity, generate-time-insights, suggest-tags,
suggest-event-cleanup. All vision/goal/KPI AI generation removed."
```

---

## Phase 2: Schema & Type Cleanup

### Task 4: Archive cut table definitions from Drizzle schema

**Files:**
- Modify: `src/lib/db/schema.ts`

**Important:** Do NOT drop tables in Supabase. Only remove the Drizzle schema definitions from the codebase so they don't generate type errors when referencing cut features.

**Step 1: Create `src/lib/db/schema-archived.ts`**

Move the following table definitions (and their associated relations) from `schema.ts` to `schema-archived.ts`. This preserves them in-codebase for reference while removing them from active compilation:

Tables to move:
- `visions` and `visionsRelations`
- `strategicDiscoveries` and relations
- `backtrackPlans` and relations
- `quarterlyTargets` and relations
- `impactProjects` and relations
- `monthlyTargets` and relations
- `weeklyTargets` and relations
- `dailyActions` and relations
- `mins` and relations
- `routines`, `routineSteps`, `routineCompletions` and relations
- `pomodoroSessions` and relations
- `dailyReviews` and relations
- `northStarMetrics`, `metricLogs` and relations
- `weeklyScorecards` and relations
- `accountabilityPartners` and relations
- `visionBoardImages` and relations
- `dailyAffirmationCompletions` and relations
- `nonNegotiables`, `nonNegotiableCompletions` and relations
- `visionReviewReminders` and relations
- `visionKpis`, `kpiLogs`, `kpiStreaks`, `kpiProgressCache` and relations
- `milestoneKpis` and relations
- `achievements`, `userAchievements`, `userGamification` and relations
- `projects` (V2), `projectKeyResults`, `projectKeyResultLogs` and relations
- `milestonesV2` and relations
- `tasks` and relations
- `dailyCheckins` and relations
- `streaksV2` and relations
- `rewards`, `rewardClaims` and relations
- `keyResults`, `keyResultUpdates` and relations

Also move unused enums: `achievementCategoryEnum`, `rewardTriggerTypeEnum`, `taskPriorityEnum`, `taskRecurrenceEnum`, `streakTypeEnum`. Keep `fourCsTypeEnum` (used by `leverageItems`).

**Step 2: Remove relation references from kept tables that point to cut tables**

In `schema.ts`, any remaining relation definitions that reference cut tables need their FK references removed. For example, `profilesRelations` may reference `visions`, `impactProjects`, etc. — remove those relation fields.

**Step 3: Verify build**

```bash
npm run build
```

Fix any import errors in kept files that reference cut schema exports.

**Step 4: Commit**

```bash
git add -A
git commit -m "simplify: archive 38 cut table definitions from schema

Moved to schema-archived.ts for reference. Tables remain in Supabase DB.
Kept tables: profiles, time_blocks, activity_categories, event_categorizations,
detected_projects, meeting_categories, leverage_items, friend_inventory,
team/sharing tables, calendar sync tables, admin tables."
```

---

### Task 5: Clean up sharing types

**Files:**
- Modify: `src/types/sharing.ts`

**Step 1: Reduce `TabName` type to kept tabs only**

```typescript
export type TabName =
  | 'time_audit'
  | 'leverage'
  | 'network'
  | 'analytics';
```

**Step 2: Update `TAB_DISPLAY_INFO` — keep only 4 entries**

```typescript
export const TAB_DISPLAY_INFO: Record<TabName, { displayName: string; description: string }> = {
  time_audit: { displayName: 'Time Audit', description: 'Time tracking and analysis' },
  leverage: { displayName: 'Leverage', description: "4 C's tracking" },
  network: { displayName: 'Network', description: 'Friend inventory' },
  analytics: { displayName: 'Analytics', description: 'Dashboard and charts' },
};
```

**Step 3: Update `ROUTE_TO_TAB` and `TAB_TO_ROUTE` — keep only 4 entries**

**Step 4: Update `EntityType` — remove cut entity types**

Keep only entity types relevant to time_audit, leverage, network. Remove: `vision`, `power_goal`, `monthly_target`, `weekly_target`, `daily_action`, `min`, `routine`, `key_result`, `milestone`, `project`, `task`, `backtrack_plan`.

**Step 5: Build and fix any type errors**

```bash
npm run build
```

**Step 6: Commit**

```bash
git add -A
git commit -m "simplify: reduce sharing types to 4 kept tabs"
```

---

### Task 6: Delete cut feature components

**Files:**
- Delete: `src/components/features/vision/`
- Delete: `src/components/features/goals/`
- Delete: `src/components/features/targets/`
- Verify: `src/components/features/time-audit/` stays
- Verify: `src/components/features/analytics/` stays

**Step 1: Delete cut component directories**

```bash
rm -rf src/components/features/vision
rm -rf src/components/features/goals
rm -rf src/components/features/targets
```

**Step 2: Check for other cut-feature components scattered elsewhere**

Search for components imported only by cut pages:

```bash
# Find any remaining imports referencing cut features
grep -r "from.*features/vision\|from.*features/goals\|from.*features/targets" src/ --include="*.tsx" --include="*.ts" -l
```

Delete any orphaned files found.

**Step 3: Commit**

```bash
git add -A
git commit -m "simplify: remove cut feature components (vision, goals, targets)"
```

---

### Task 7: Delete cut hooks and stores

**Files:**
- Check: `src/lib/hooks/` for hooks only used by cut features
- Check: `src/lib/stores/` for stores only used by cut features

**Step 1: Identify hooks used only by cut features**

For each hook in `src/lib/hooks/`, grep the codebase to see if any KEPT file imports it. If only cut (now-deleted) files imported it, delete it.

```bash
# List all hooks
ls src/lib/hooks/

# For each, check remaining usage
grep -r "use-<hook-name>" src/app src/components --include="*.tsx" --include="*.ts" -l
```

Likely candidates for deletion: any hook named `use-vision*`, `use-goals*`, `use-milestones*`, `use-routines*`, `use-pomodoro*`, `use-reviews*`, `use-rewards*`, `use-streaks*`, `use-gamification*`, `use-kpi*`, `use-checkin*`.

**Step 2: Same for stores**

```bash
ls src/lib/stores/
```

**Step 3: Delete orphaned hooks and stores**

**Step 4: Build verify**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "simplify: remove orphaned hooks and stores for cut features"
```

---

### Task 8: Delete cut test files

**Files:**
- Check: `src/__tests__/` for tests referencing cut features

**Step 1: Identify and delete cut test files**

Tests referencing visions, goals, milestones, routines, pomodoro, reviews, rewards, streaks, gamification, KPIs should be deleted if they test code that no longer exists.

```bash
ls src/__tests__/
```

Keep tests for: bulk-categorization, bulk-update-api, time-audit related, analytics, leverage, security, any shared utilities still in use.

**Step 2: Run remaining tests**

```bash
npm run test
```

Fix any failures from missing imports.

**Step 3: Commit**

```bash
git add -A
git commit -m "simplify: remove test files for cut features"
```

---

## Phase 3: Navigation & Routing Cleanup

### Task 9: Simplify the sidebar

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

**Step 1: Replace all nav item arrays with simplified structure**

Remove the 6 separate arrays (`mainNavItems`, `visionPlanningItems`, `executionItems`, `systemNavItems`, `advancedNavItems`, `bottomNavItems`) and replace with:

```typescript
const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: ROUTES.dashboard, icon: LayoutDashboard },
  { title: 'Time Audit', href: ROUTES.timeAudit, icon: Clock },
  { title: 'Analytics', href: ROUTES.analytics, icon: BarChart3 },
];

const toolNavItems: NavItem[] = [
  { title: 'Leverage', href: ROUTES.leverage, icon: Zap },
  { title: 'Network', href: ROUTES.network, icon: Users },
];

const teamNavItems: NavItem[] = [
  { title: 'Team', href: ROUTES.team, icon: UserPlus },
];

const bottomNavItems: NavItem[] = [
  { title: 'Settings', href: ROUTES.settings, icon: Settings },
];
```

**Step 2: Remove tier gating logic**

Remove the `hasAccess` function (lines ~158-161) and all tier badge / opacity / redirect logic from the nav item rendering. Every item is accessible.

Remove the `NavItem.tier` field from the interface.

**Step 3: Simplify the section rendering**

Update the `SidebarContent` component to render the new arrays with simple dividers between sections. Remove section labels like "Vision & Planning", "Daily Systems", etc.

**Step 4: Clean up the "Shared with me" section**

Keep it, but update the `TAB_TO_ROUTE` import — it now only maps 4 tabs.

**Step 5: Remove unused icon imports**

Delete icon imports for cut features (Target, BookOpen, Star, Timer, RefreshCw, Gift, Compass, etc.).

**Step 6: Build verify**

```bash
npm run build
```

**Step 7: Commit**

```bash
git add -A
git commit -m "simplify: rebuild sidebar with 7 nav items, remove tier gating"
```

---

### Task 10: Clean up routes.ts

**Files:**
- Modify: `src/constants/routes.ts`

**Step 1: Remove cut routes from `ROUTES` object**

Remove: `today`, `progress`, `visionPlanner`, `vision`, `goals`, `projects`, `mins`, `planner`, `backtrack`, `drip`, `routines`, `pomodoro`, `reviews`, `rewards`, `guide`, `okrs`, `accountability`. Also remove function-shaped routes: `backtrackDetail`, `goalDetail`, `projectDetail`, `routineDetail`, `okrDetail`.

Keep: `dashboard`, `timeAudit`, `timeAuditProjects`, `leverage`, `network`, `analytics`, `team`, `settings`, `settingsSubscription`, `settingsProfile`, `adminAIUsage`, `adminBetaAccess`, `adminFeedback`, `login`, `signup`, `forgotPassword`, `acceptInvite`, `teamMember`.

**Step 2: Remove `TIER_REQUIRED_ROUTES` entirely**

```typescript
// DELETE THIS — everything is free
export const TIER_REQUIRED_ROUTES: Record<string, 'pro' | 'elite'> = { ... };
```

**Step 3: Clean up `PROTECTED_ROUTES`**

Remove cut routes from the array. Keep protection for: `/dashboard`, `/time-audit`, `/analytics`, `/leverage`, `/network`, `/team`, `/settings`, `/admin`.

**Step 4: Build verify**

```bash
npm run build
```

Fix any files importing removed route constants.

**Step 5: Commit**

```bash
git add -A
git commit -m "simplify: remove cut routes and tier gating from routes.ts"
```

---

### Task 11: Clean up middleware tier gating

**Files:**
- Modify: `src/lib/supabase/middleware.ts`

**Step 1: Remove the duplicated `TIER_REQUIRED_ROUTES` dict (lines ~99-106)**

**Step 2: Remove the entire tier-checking block (lines ~99-142)**

This block queries `profiles.subscription_tier` and redirects to upgrade page. Remove it entirely — no tier gating.

**Step 3: Clean up `protectedPaths` array (lines ~62-85)**

Remove paths for cut features. Keep: `/dashboard`, `/time-audit`, `/analytics`, `/leverage`, `/network`, `/team`, `/settings`, `/admin`.

**Step 4: Build verify**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "simplify: remove tier gating from middleware, clean protected paths"
```

---

## Phase 4: Clean Up Kept Features

### Task 12: Clean up Time Audit page

**Files:**
- Modify: `src/app/(dashboard)/time-audit/page.tsx`

**Step 1: Remove references to cut features**

Search for and remove:
- Any "Link to Impact Project" or vision linking in categorization flows
- Tier gating checks (biweekly/monthly view gates)
- Subscription upgrade prompts or banners
- Imports from cut modules

**Step 2: Build verify**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add -A
git commit -m "simplify: remove cut feature refs from time audit page"
```

---

### Task 13: Clean up Analytics page

**Files:**
- Modify: `src/app/(dashboard)/analytics/page.tsx`
- Modify: `src/components/features/analytics/leverage-breakdown-chart.tsx` (move or remove)

**Step 1: Remove Leverage Breakdown Chart from analytics**

This chart moves to the Leverage page (or gets removed from analytics and reimplemented on leverage later). For now, remove the import and rendering.

**Step 2: Remove "Link to Impact Project" from project edit dialogs**

In the Projects tab, the chart lets you click a project to edit it. Remove the "link to Impact Project" field from that dialog.

**Step 3: Remove tier gating on date ranges**

**Step 4: Build verify**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "simplify: clean analytics page, remove cut feature references"
```

---

### Task 14: Clean up Leverage page

**Files:**
- Modify: `src/app/(dashboard)/leverage/page.tsx`

**Step 1: Remove references to Visions/Impact Projects**

Remove any linking or filtering by vision/goal.

**Step 2: Remove Pro tier gating**

Remove any tier checks or upgrade prompts.

**Step 3: Build verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add -A
git commit -m "simplify: clean leverage page, remove cut feature refs and tier gating"
```

---

### Task 15: Clean up Network page

**Files:**
- Modify: `src/app/(dashboard)/network/page.tsx`

**Step 1: Remove Pro tier gating and upgrade prompts**

**Step 2: Remove references to goal hierarchy**

**Step 3: Build verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add -A
git commit -m "simplify: clean network page, remove tier gating"
```

---

### Task 16: Clean up Team/Sharing

**Files:**
- Modify: `src/app/(dashboard)/team/page.tsx`
- Modify: `src/app/api/sharing/tabs/route.ts` (if it references cut tab types)

**Step 1: Verify sharing API only serves kept tabs**

The `TabName` type was already reduced in Task 5. Verify the API routes respect this.

**Step 2: Build verify**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add -A
git commit -m "simplify: clean team/sharing to only support kept tabs"
```

---

### Task 17: Clean up Dashboard layout

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`

**Step 1: Remove beta invite tier upgrade logic (lines ~69-71)**

The layout currently upgrades free users with accepted beta invites to `elite`. Since there's no tier gating, this logic is unnecessary. Remove it.

**Step 2: Simplify tier passing**

The layout passes `userTier` and `subscriptionTier` to Sidebar. Since there's no tier gating, these can be simplified or passed as constants.

**Step 3: Build verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add -A
git commit -m "simplify: clean dashboard layout, remove beta tier upgrade logic"
```

---

### Task 18: Clean up marketing/pricing pages

**Files:**
- Modify: `src/lib/stripe/config.ts`
- Modify: `src/app/(marketing)/pricing/page.tsx`

**Step 1: Update `PRICING_TIERS` to reflect simplified app**

Since everything is free during PMF, update the pricing page to show a single "Free — All Features" tier, or show future pricing with a "Currently Free During Beta" badge. Decision for implementer — but the feature lists must only reference kept features.

Update feature strings to remove: Vision & SMART Goals, Impact Projects, MINS, Pomodoro, Reviews, Accountability Partners, AI Goal Suggestions, etc.

Replace with features like: Time Audit & AI Categorization, Value Matrix (DRIP), Analytics & Insights, AI Coaching Nudges, Leverage System, Network Audit, Team Sharing.

**Step 2: Update `FEATURE_COMPARISON` similarly**

**Step 3: Build verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add -A
git commit -m "simplify: update pricing to reflect MVP features"
```

---

## Phase 5: First Build Gate

### Task 19: Full build verification

**Step 1: Run build**

```bash
npm run build
```

**Step 2: Fix ALL TypeScript errors**

Common issues to expect:
- Imports from deleted modules
- References to removed ROUTES constants
- Type errors from reduced schema
- Hook calls to deleted API endpoints

Fix each error. This may take multiple iterations.

**Step 3: Run linter**

```bash
npm run lint
```

**Step 4: Run tests**

```bash
npm run test
```

Delete or fix failing tests that reference cut features.

**Step 5: Commit all fixes**

```bash
git add -A
git commit -m "fix: resolve all build errors from simplification

Fix import errors, remove stale references, update types."
```

---

## Phase 6: Rebuild Dashboard

### Task 20: Create Dashboard API endpoint

**Files:**
- Create: `src/app/api/dashboard/stats/route.ts`

**Step 1: Write the failing test**

Create `src/__tests__/dashboard-stats-api.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('GET /api/dashboard/stats', () => {
  it('returns DRIP breakdown, uncategorized count, and trends', () => {
    // Test the response shape
    const expectedShape = {
      drip: {
        production: expect.any(Number),
        investment: expect.any(Number),
        replacement: expect.any(Number),
        delegation: expect.any(Number),
      },
      dripTrend: {
        production: expect.any(Number),
        investment: expect.any(Number),
        replacement: expect.any(Number),
        delegation: expect.any(Number),
      },
      totalHours: expect.any(Number),
      uncategorizedCount: expect.any(Number),
      leverageItemCount: expect.any(Number),
      networkTouchCount: expect.any(Number),
      productionTrend: expect.any(Array),
    };
    // Implementation test goes here once route exists
    expect(expectedShape).toBeDefined();
  });
});
```

**Step 2: Implement the dashboard stats API**

Create `src/app/api/dashboard/stats/route.ts`:

Query `time_blocks` for:
- This week's DRIP distribution (hours per quadrant)
- Last week's DRIP distribution (for % change calculation)
- Count of uncategorized events (no `value_quadrant` set)
- Total hours tracked this week
- `leverage_items` count (active)
- `friend_inventory` count (recent contacts)
- Last 5 weeks of Production hours (sparkline data)

**Step 3: Run test, verify it passes**

```bash
npm run test -- dashboard-stats
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add time-centric dashboard stats API endpoint"
```

---

### Task 21: Create AI coaching nudge endpoint

**Files:**
- Create: `src/app/api/ai/generate-coaching-nudge/route.ts`

**Step 1: Write the failing test**

Create `src/__tests__/coaching-nudge-api.test.ts`:

Test that the endpoint returns an array of 1-2 nudges, each with a `message` string and `type` (e.g., 'production_drop', 'delegation_opportunity', 'streak_positive').

**Step 2: Implement the endpoint**

`POST /api/ai/generate-coaching-nudge`

Request body: `{ weeklyDrip: {...}, monthlyDrip: {...}, trends: [...] }`

Prompt Anthropic Claude with the user's DRIP data and ask for 1-2 specific, actionable coaching nudges. Parse structured JSON output.

Follow existing patterns from `classify-activity/route.ts`:
- Authenticate user
- Rate limit
- Instantiate Anthropic inside handler
- Return structured JSON

**Step 3: Run test**

```bash
npm run test -- coaching-nudge
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add AI coaching nudge endpoint"
```

---

### Task 22: Build the Dashboard page — DRIP cards and uncategorized banner

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (full rewrite)

**Step 1: Rewrite the Dashboard page**

Replace the entire current dashboard with:

```
'use client'

- React Query hook fetching `/api/dashboard/stats`
- Uncategorized events banner (top, links to /time-audit)
- 5 stat cards: Production hours, Investment hours, Replacement hours, Delegation hours, Total hours
  - Each shows hours + % change from last week (▲/▼ with color)
- Visualization area (built in next tasks)
- Bottom row: Scorecard + AI Coaching Nudge
```

**Step 2: Build verify**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: rebuild dashboard with DRIP cards and uncategorized banner"
```

---

### Task 23: Build Dashboard — Value Matrix quadrant grid visualization

**Files:**
- Create: `src/components/features/dashboard/value-matrix-grid.tsx`

**Step 1: Build the component**

A read-only 2x2 grid matching the design screenshot:
- Axes: "Makes You Money →" (Y-axis label), "← Lights You Up →" (X-axis label)
- Quadrants: Replacement (top-left, orange border), Production (top-right, green border), Delegation (bottom-left, red/pink border), Investment (bottom-right, cyan border)
- Each quadrant: icon, title, subtitle, count badge, list of event cards (title, description, hours)
- Responsive: stacks to single column on mobile
- Props: `events` array with DRIP categorization, grouped by quadrant

**Step 2: Integrate into Dashboard page**

Add as the default visualization in the switcher area.

**Step 3: Build verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Value Matrix quadrant grid to dashboard"
```

---

### Task 24: Build Dashboard — Stacked Timeline visualization

**Files:**
- Create: `src/components/features/dashboard/stacked-timeline.tsx`

**Step 1: Build the component**

Using Recharts `<BarChart>` with stacked bars:
- X-axis: days of the week (or weeks if period > 1 week)
- Y-axis: hours
- 4 stacked segments: Production (green), Investment (cyan), Replacement (orange), Delegation (red)
- Tooltip showing breakdown per day
- Props: `dailyBreakdown` array from API

**Step 2: Integrate into Dashboard as second visualization option**

**Step 3: Build verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add stacked timeline visualization to dashboard"
```

---

### Task 25: Build Dashboard — Bubble Chart visualization

**Files:**
- Create: `src/components/features/dashboard/bubble-chart.tsx`

**Step 1: Build the component**

Using Recharts `<ScatterChart>`:
- X-axis: "Lights You Up" (energy, low to high)
- Y-axis: "Makes You Money" (revenue impact, low to high)
- Bubbles: sized by hours, colored by DRIP quadrant
- Quadrant background zones matching the Value Matrix colors (subtle)
- Tooltip: event name, hours, quadrant
- Props: `events` array with energy + money scores

**Step 2: Integrate into Dashboard as third visualization option**

**Step 3: Build verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add bubble chart visualization to dashboard"
```

---

### Task 26: Build Dashboard — Visualization switcher and period selector

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

**Step 1: Add the switcher UI**

Three toggle buttons: Matrix | Timeline | Bubble
Period selector dropdown: This Week | 2 Weeks | This Month | 3 Months

Wire up state to show/hide the three visualization components.
Period selector changes the React Query params to refetch data for the selected range.

**Step 2: Build verify**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add visualization switcher and period selector to dashboard"
```

---

### Task 27: Build Dashboard — Scorecard and AI Coaching Nudge

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/components/features/dashboard/coaching-nudge.tsx`
- Create: `src/components/features/dashboard/scorecard.tsx`

**Step 1: Build Scorecard component**

Shows:
- Leverage items active (count from API)
- Network contacts engaged (count from API)
- Production trend: sparkline of last 5 weeks (use Recharts `<Sparkline>` or simple SVG)

**Step 2: Build Coaching Nudge component**

- Fetches from `/api/ai/generate-coaching-nudge` via React Query
- Displays 1-2 nudge cards with AI-generated text
- Loading state while AI generates
- "Refresh" button to regenerate
- Link to "See more insights →" pointing to `/time-audit` Insights tab

**Step 3: Wire both into Dashboard bottom row**

**Step 4: Build verify**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add scorecard and AI coaching nudge to dashboard"
```

---

## Phase 7: Final Cleanup

### Task 28: Clean up AGENTS.md files

**Files:**
- Modify or delete: `src/app/(dashboard)/AGENTS.md`
- Modify or delete: `src/app/api/AGENTS.md`
- Modify or delete: `src/components/AGENTS.md`
- Modify or delete: `src/lib/AGENTS.md`
- Modify or delete: `src/lib/db/AGENTS.md`
- Modify or delete: `AGENTS.md` (root)

**Step 1: Update or remove AGENTS.md files**

These contain codebase documentation that now references cut features. Update them to reflect the simplified app, or delete them if they'll be regenerated.

**Step 2: Commit**

```bash
git add -A
git commit -m "docs: update AGENTS.md files for simplified MVP"
```

---

### Task 29: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Rewrite CLAUDE.md to reflect simplified MVP**

Update:
- Project structure (remove cut directories)
- Database schema table (remove cut tables)
- API endpoints (remove cut routes, add coaching nudge)
- Feature descriptions (only 6 areas + settings)
- Sidebar navigation description
- Remove subscription tier gating section (everything free)
- Remove references to cut features in lessons learned

**Step 2: Commit**

```bash
git add -A
git commit -m "docs: update CLAUDE.md for simplified MVP"
```

---

### Task 30: Final build, lint, test, and verification

**Step 1: Full build**

```bash
npm run build
```

Must pass with zero errors.

**Step 2: Lint**

```bash
npm run lint
```

Must pass.

**Step 3: Tests**

```bash
npm run test
```

All remaining tests must pass.

**Step 4: Manual smoke test checklist**

- [ ] Dashboard loads with DRIP cards
- [ ] Dashboard shows all 3 visualization modes
- [ ] Dashboard period selector works
- [ ] AI coaching nudge loads
- [ ] Uncategorized events banner links to Time Audit
- [ ] Time Audit calendar view loads
- [ ] Google Calendar sync works
- [ ] Bulk categorization works
- [ ] Analytics page loads all 3 tabs
- [ ] Leverage page loads without tier gate
- [ ] Network page loads without tier gate
- [ ] Team page loads
- [ ] Settings page loads
- [ ] Sidebar shows only 7 items (+ admin for admins)
- [ ] No dead links in navigation
- [ ] No console errors

**Step 5: Final commit**

```bash
git add -A
git commit -m "verify: final build passes for simplified MVP"
```

---

## Summary

| Phase | Tasks | What |
|-------|-------|------|
| 1 | 1-3 | Delete 17 pages, ~25 API routes, 18 AI endpoints |
| 2 | 4-8 | Archive schema, clean types, delete components/hooks/tests |
| 3 | 9-11 | Simplify sidebar, routes.ts, middleware |
| 4 | 12-18 | Clean up kept pages (Time Audit, Analytics, Leverage, Network, Team, Layout, Pricing) |
| 5 | 19 | Build gate — fix all errors |
| 6 | 20-27 | Rebuild Dashboard (API, 3 visualizations, scorecard, AI coaching) |
| 7 | 28-30 | Docs, CLAUDE.md, final verification |

**Total: 30 tasks across 7 phases.**
