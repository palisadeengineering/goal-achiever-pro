# PRD: Backtrack Planning Calendar Integration & Progress Dashboard

## Executive Summary

Transform the backtrack planning system into a seamless goal execution engine by:
1. **Automatic Google Calendar sync** when plans are created
2. **Enhanced Today page** for easy daily action tracking
3. **KPI Progress Dashboard** for visual progress tracking
4. **Goal hierarchy progress** with automatic calculation

## Problem Statement

Currently, users create backtrack plans but:
- Daily actions are NOT automatically synced to Google Calendar
- Must manually navigate to Today page and click "Sync to Calendar"
- No dedicated KPI progress visualization
- Progress tracking is fragmented across pages
- Calendar-centric users lose track of their goals

## User Story

> "As a goal-oriented entrepreneur who lives by my Google Calendar, I want my backtrack plan's daily actions automatically added to my calendar so I see exactly what to work on each day, and I want a dashboard showing my KPI progress so I know if I'm on track."

---

## Feature Specifications

### Feature 1: Automatic Calendar Sync on Plan Creation

**Goal**: When user confirms a backtrack plan, automatically sync all daily actions to Google Calendar.

#### Implementation

1. **Add to Backtrack Wizard Step 5 (Confirm)**:
   - Show checkbox: "Sync daily actions to Google Calendar" (default: checked)
   - If Google not connected, show "Connect Google Calendar" button
   - Show preview: "X daily actions will be synced"

2. **API Enhancement**: `POST /api/backtrack` (save plan)
   - Accept `syncToCalendar: boolean` parameter
   - After saving plan, if `syncToCalendar` is true:
     - Fetch all created daily actions
     - Call calendar sync for each action
     - Store sync records in `calendar_sync_records`

3. **Background Sync Service**:
   - Create `/api/calendar/sync-backtrack-plan` endpoint
   - Accept `backtrackPlanId`
   - Sync all daily actions for that plan
   - Handle rate limiting (batch 10 events at a time)
   - Return sync status/errors

4. **Sync Status Indicators**:
   - Show sync status icon on each daily action
   - States: not_synced, syncing, synced, error
   - Tooltip shows last sync time or error

#### Database Changes
- Add `calendar_synced_at` to `daily_actions` table
- Add `calendar_event_id` to `daily_actions` table (direct reference)

---

### Feature 2: Enhanced Today Page

**Goal**: Make daily action completion fast and calendar-aware.

#### UI Enhancements

1. **Header Actions**:
   - Large "Sync All to Calendar" button (primary)
   - Calendar connection status badge
   - Today's progress ring (X/Y completed)

2. **Action Cards** (redesigned):
   ```
   ┌─────────────────────────────────────────────────────────┐
   │ [✓] Action Title                              [📅] 45m │
   │     From: Vision > Impact Project > Weekly Target          │
   │     ─────────────────────────────────────────────────── │
   │     [On Calendar ✓] or [Add to Calendar]               │
   └─────────────────────────────────────────────────────────┘
   ```

3. **Keyboard Shortcuts**:
   - `Space` - Toggle completion on focused action
   - `C` - Sync focused action to calendar
   - `A` - Sync all to calendar
   - Arrow keys - Navigate actions

4. **Quick Actions Bar** (sticky):
   - Completion progress bar
   - "Complete All" / "Sync All" buttons
   - Filter: All / Pending / Completed

5. **Calendar Preview Panel** (collapsible):
   - Show today's calendar alongside actions
   - Visual timeline of scheduled actions
   - Gaps/conflicts highlighted

#### API Enhancements

- `PUT /api/today/complete-all` - Bulk complete actions
- `POST /api/today/sync-all` - Sync all pending actions to calendar
- Add `calendarEventId` and `calendarSyncStatus` to daily action response

---

### Feature 3: KPI Progress Dashboard

**Goal**: Dedicated page showing all KPIs with visual progress tracking.

#### New Page: `/progress`

1. **Overview Section**:
   - Total KPIs being tracked
   - Overall completion rate
   - Current streaks summary
   - Week-over-week trend indicator

2. **KPI Grid** (by Vision):
   ```
   ┌──────────────────────────────────────────────────────────┐
   │ VISION: Build $500K App Business                        │
   ├──────────────────────────────────────────────────────────┤
   │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
   │ │ Daily Users │ │ MRR         │ │ Content     │        │
   │ │ ████████░░  │ │ ██████░░░░  │ │ ████░░░░░░  │        │
   │ │ 80/100      │ │ $6K/$10K    │ │ 4/10 posts  │        │
   │ │ 🔥 12 days  │ │ ↑ 15%       │ │ 🔥 3 days   │        │
   │ └─────────────┘ └─────────────┘ └─────────────┘        │
   └──────────────────────────────────────────────────────────┘
   ```

3. **Progress Charts**:
   - Line chart: KPI values over time (last 30 days)
   - Bar chart: Weekly completion rates
   - Burndown: Days to deadline vs progress

4. **Streak Leaderboard**:
   - Top KPIs by streak
   - Streak milestones (7 days, 30 days, etc.)
   - Broken streaks alert

5. **Quick Log Panel**:
   - Inline KPI logging without leaving page
   - Today's checkoffs at a glance
   - Missing logs highlighted

#### API Endpoints

- `GET /api/progress/summary` - Aggregated KPI stats
- `GET /api/progress/trends?days=30` - Historical data for charts
- `GET /api/progress/streaks` - Streak leaderboard

---

### Feature 4: Goal Hierarchy Progress

**Goal**: Automatic progress calculation bubbling up from actions to vision.

#### Progress Calculation Logic

```
Daily Action (complete/incomplete)
    ↓ aggregates to
Weekly Target (X of Y actions complete = Z%)
    ↓ aggregates to
Monthly Target (avg of weekly targets = Z%)
    ↓ aggregates to
Impact Project (avg of monthly targets = Z%)
    ↓ aggregates to
Quarterly Target (avg of impact projects = Z%)
    ↓ aggregates to
Vision (avg of quarterly targets = Z%)
```

#### Implementation

1. **Trigger**: When daily action status changes
2. **Cascade Update**:
   - Update weekly_target.progress_percentage
   - Update monthly_target.progress_percentage
   - Update power_goal.progress_percentage
   - Update quarterly_target.progress_percentage
   - Update vision 300% score (weighted)

3. **Background Job** (optional):
   - Nightly recalculation of all progress
   - Handles any missed updates

#### Visual Progress Indicators

- Color-coded progress bars at each level
- On-track (green) / Behind (yellow) / At-risk (red)
- Days remaining vs expected progress

---

## Implementation Plan

### Phase 1: Calendar Auto-Sync (Day 1)
1. Add `calendar_synced_at` column to daily_actions
2. Create `/api/calendar/sync-backtrack-plan` endpoint
3. Update backtrack wizard confirm step
4. Add sync status indicators to Today page

### Phase 2: Enhanced Today Page (Day 1-2)
1. Redesign action cards with calendar status
2. Add keyboard shortcuts
3. Add quick actions bar
4. Create bulk sync/complete endpoints

### Phase 3: Progress Dashboard (Day 2-3)
1. Create `/progress` page layout
2. Implement KPI grid component
3. Add progress charts (line, bar)
4. Create streak leaderboard

### Phase 4: Goal Hierarchy Progress (Day 3)
1. Implement cascade progress calculation
2. Add progress indicators to all views
3. Create nightly recalculation job (optional)

---

## Success Metrics

- **Calendar Sync Rate**: >90% of daily actions synced within 1 minute of plan creation
- **Daily Completion Rate**: Increase by 25% (visibility drives action)
- **KPI Engagement**: >80% of users log KPIs daily
- **User Feedback**: "I can see my goals on my calendar" sentiment

---

## Technical Considerations

1. **Rate Limiting**: Google Calendar API limits (batch requests)
2. **Token Refresh**: Handle expired OAuth tokens gracefully
3. **Offline Support**: Queue syncs when offline, process when online
4. **Performance**: Lazy load charts, paginate large KPI lists

---

## Out of Scope (Future)

- Mobile app with push notifications
- Apple Calendar / Outlook integration
- AI-powered rescheduling suggestions
- Team progress dashboards
