# Phase 10: Streaks & Daily Goals - Context

## Phase Goal

Track consecutive completion days, daily targets, visual streak indicators, and MINS integration.

## Additional Scope (from user feedback)

1. Daily actions from vision plan auto-populate in Daily & Weekly MINS
2. When MINS are completed, mark corresponding plan actions complete
3. Calendar heat map for habit/action tracking (like GitHub contribution graph)
4. Success rate metric (% of days goal was met)

---

## Discovery Findings

### What Already Exists

#### 1. Activity Heat Map (FULLY IMPLEMENTED)
- **Component**: `src/components/features/vision/vision-activity-heatmap.tsx`
- **API**: `/api/vision-activity/route.ts`
- **Features**:
  - 365-day calendar view (GitHub-style)
  - Composite scoring from multiple sources
  - Intensity levels 0-4 based on score
  - Tracks: affirmations, non-negotiables, KPI logs, reviews, goals completed
  - Already integrated with daily_actions table

**Status**: ✅ Complete - No work needed for heat map

#### 2. Streak Calculation (Partial)
- **API**: `/api/non-negotiables/streaks/route.ts`
- **Function**: `calculateStreak()` - handles current/longest streak calculation
- **Scope**: Only for non-negotiables, not generalized

**Status**: ⚠️ Exists but needs generalization for KPIs and daily activities

#### 3. KPI Streak UI (FULLY IMPLEMENTED)
- **Component**: `src/components/features/kpi/daily-kpi-dashboard.tsx`
- **Features**:
  - `getStreakLevel()` - milestone tracking (3, 7, 14, 21, 30, 60, 90, 180, 365)
  - `getStreakBadge()` - visual badges (Starting → Legendary)
  - Level-up toast notifications
  - Progress bars to next milestone
  - Streak display per KPI

**Status**: ✅ Complete streak UI for KPIs

#### 4. Gamification Foundation (Phase 9)
- **Tables**: `user_gamification`, `achievements`, `user_achievements`
- **Service**: `src/lib/services/gamification.ts`
- **Fields**: `current_streak`, `longest_streak`, `last_activity_date`
- **Functions**: `awardXp()` already accepts `metadata.streakCount`

**Status**: ✅ Foundation ready, needs streak calculation integration

#### 5. KPI Streaks Table
- **Table**: `kpi_streaks` in schema.ts (lines 1099-1106)
- **Fields**: `current_streak`, `longest_streak`, `last_completed_date`

**Status**: ✅ Schema exists

#### 6. MINS and Daily Actions Tables
- **MINS**: `src/lib/db/schema.ts` lines 315-345
  - Has `impactProjectId` (power_goal_id) for linking to Impact Projects
  - Has `status`, `completedAt`, `scheduledDate`
- **Daily Actions**: `src/lib/db/schema.ts` lines 280-310
  - Linked to `weeklyTargets`
  - Has `status`, `completedAt`, `actionDate`

**Status**: ✅ Schema exists

### What's Missing

#### 1. MINS Database Integration 🔴 Critical
- **Current state**: `src/app/(dashboard)/mins/page.tsx` uses **mock data**
- **Missing**:
  - MINS CRUD API endpoints (`/api/mins`)
  - React Query hooks for MINS
  - Real database fetching in MINS page

#### 2. Daily Actions ↔ MINS Sync 🔴 Critical
- **Missing**:
  - No link between daily_actions and mins tables
  - No auto-population of daily actions into MINS
  - No bidirectional completion sync

#### 3. Global Daily Streak Service 🟡 Enhancement
- **Current state**: Streaks only tracked per KPI and per non-negotiable
- **Missing**:
  - Global "daily activity" streak (did user complete ANY goal today?)
  - Integration with gamification service's streak fields
  - Streak update on any completion

#### 4. Success Rate Metrics 🟡 Enhancement
- **Missing**:
  - Success rate calculation (% of days goal was met)
  - API endpoint for success metrics
  - UI to display success rates

#### 5. Today Dashboard Integration 🟡 Enhancement
- **Missing**:
  - Gamification XP/level display on Today page
  - Daily streak indicator on dashboard
  - Integration with new gamification hooks

---

## Architecture Decisions

### D10-01: MINS as Primary Task Interface
MINS should be the user-facing task management system. Daily Actions are plan-driven and should sync TO MINS rather than replacing them.

### D10-02: Optional Linking
MINS ↔ Daily Actions linking should be optional. Users can create standalone MINS or link them to plan actions.

### D10-03: Streak Calculation Location
Daily streak calculation should happen in the gamification service, not in individual API routes. Single source of truth.

### D10-04: Activity Date Tracking
`last_activity_date` in user_gamification determines streak continuity. Any completion updates this date.

---

## Plan Breakdown

Given the scope, recommend 3-4 plans:

### Plan 10-01: MINS API and Database Integration (~8-12 tasks)
- CRUD API endpoints for MINS
- React Query hooks
- Connect MINS page to database
- Import existing mock functionality

### Plan 10-02: Daily Actions ↔ MINS Sync (~6-8 tasks)
- Add FK from mins to daily_actions (optional link)
- Auto-generate MINS from daily actions API
- Bidirectional completion sync
- UI for linking/unlinking

### Plan 10-03: Streak Service and Gamification Integration (~5-7 tasks)
- Daily streak calculation service
- Update gamification on any completion
- Streak restoration logic (handle missed days)
- Today dashboard gamification display

### Plan 10-04: Success Rate Metrics (~4-6 tasks)
- Success rate calculation logic
- API endpoint
- UI components
- Integration into stats displays

---

## Files Reference

### Key Files to Modify
- `src/app/(dashboard)/mins/page.tsx` - Convert from mock to real data
- `src/lib/services/gamification.ts` - Add streak calculation
- `src/app/(dashboard)/today/page.tsx` - Add gamification display

### New Files to Create
- `src/app/api/mins/route.ts` - MINS CRUD
- `src/app/api/mins/[id]/route.ts` - Single MIN operations
- `src/lib/hooks/use-mins.ts` - React Query hooks
- `src/lib/services/streaks.ts` - Dedicated streak service

### Existing Files (no changes needed)
- `src/components/features/vision/vision-activity-heatmap.tsx` ✅
- `src/app/api/vision-activity/route.ts` ✅
- `src/components/features/kpi/daily-kpi-dashboard.tsx` ✅ (streak UI)

---

*Context created: 2026-01-29*
