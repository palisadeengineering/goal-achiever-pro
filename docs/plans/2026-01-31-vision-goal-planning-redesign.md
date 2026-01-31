# Vision & Goal Planning System Redesign

## Overview

Complete redesign of the vision and goal planning features to create a unified, calendar-centric project management system with gamification and real rewards.

**Core Problem:** Current system has 5 competing hierarchies (Visions, Impact Projects, Targets, MINS, Backtrack Plans) causing confusion and disconnected planning/execution.

**Solution:** One unified hierarchy where everything connects, with calendar as the execution hub.

---

## Design Principles

1. **Everything rolls up** - Task → Milestone → Key Result → Project progress
2. **One source of truth** - No competing systems
3. **Calendar is command center** - Planning meets execution on the calendar
4. **Metrics built-in** - Key Results ARE the metrics, not bolted on
5. **Progressive disclosure** - Start simple, add detail as needed
6. **Gamification with real stakes** - XP, combos, streaks, AND real rewards

### Frameworks Preserved
- **Dan Martell**: SMART goals, 300% Rule (Clarity/Belief/Consistency), Value Matrix (DRIP), 4 C's
- **Alex Hormozi**: Revenue math calculator for money goals (LTV, CAC, conversion math)

---

## Data Model

### New Unified Hierarchy

```
PROJECT (replaces "Vision")
├── SMART Goal definition (S-M-A-R-T fields)
├── 300% Scores (Clarity, Belief, Consistency) - daily check-in
├── Timeline (start date → target date)
├── Revenue Math (for money goals - optional)
│
├── KEY RESULTS (replaces disconnected "KPIs")
│   ├── Metric name + target value + current value
│   ├── Unit type (number, currency, percentage)
│   └── Weight (importance to project success)
│
├── MILESTONES (replaces "Impact Projects" / quarterly targets)
│   ├── Checkpoint name + target date
│   ├── Quarter assignment (Q1-Q4)
│   ├── Linked Key Results
│   └── Linked Rewards (optional)
│
└── TASKS (replaces "Weekly/Daily Targets", "MINS", "Daily Actions")
    ├── Description + estimated duration
    ├── Parent milestone (optional)
    ├── Key Result impact (optional)
    ├── Value Matrix tag (D/R/I/P)
    ├── 4 C's tag (Code/Content/Capital/Collaboration)
    ├── Scheduled time (calendar link)
    ├── Recurrence (one-time, daily, weekly)
    ├── Priority level
    └── Google Calendar event ID (for sync)
```

### Database Changes

**New/Modified Tables:**
- `projects` - replaces `visions` table with unified structure
- `key_results` - replaces `north_star_metrics` / `vision_kpis`
- `milestones` - replaces `power_goals` with cleaner structure
- `tasks` - replaces `mins`, `daily_actions`, `weekly_targets`, `monthly_targets`
- `daily_checkins` - new table for 300% score tracking
- `rewards` - new table for custom rewards
- `reward_claims` - track when rewards are unlocked/claimed

**Tables to Archive:**
- `visions` → archive
- `power_goals` → archive
- `monthly_targets` → archive
- `weekly_targets` → archive
- `daily_actions` → archive
- `mins` → archive (keep table, mark as legacy)
- `backtrack_plans` → archive
- `quarterly_targets` → archive
- `strategic_discoveries` → archive

---

## User Interface

### Navigation (Sidebar)

```
Dashboard              (rolls up all project stats, rewards)
Today                  (daily command center)
Progress               (cross-project visualization)

VISION & PLANNING
Vision Planner         (conversational setup with AI + revenue math)
Projects               (was "Vision" - list of all projects)
Key Results            (aggregated from all projects)
Milestones             (aggregated from all projects)
MINS                   (tasks from all projects)

EXECUTION
Team

DAILY SYSTEMS
Time Audit             (enhanced with project linking)
Value Matrix
Routines
Pomodoro
Reviews

ADVANCED
Leverage
Network
Rewards                (NEW)

Guide
Settings
```

### Today View (Daily Command Center)

Default landing page showing:
1. **300% Check-in** at top (10 seconds, can't miss it)
2. **Focus section** - scheduled tasks for primary project
3. **Unscheduled tasks** - drag to calendar or quick schedule
4. **Mini calendar strip** - visual of the day
5. **[Plan My Day AI]** button - one-click AI scheduling
6. **Momentum stats** - streaks, XP, level progress

### Project Hub (Single Unified View)

One page showing everything for a project:
- SMART goal + timeline at top
- 300% score with check-in button
- Key Results with progress bars (always visible, not hidden in tab)
- Milestones on quarterly timeline
- This week's tasks with completion status
- Time stats (hours this week, Value Matrix breakdown, alignment score)
- Linked rewards progress

### Vision Planner (Conversational Setup)

Adaptive flow based on goal type:

**For Revenue Goals:**
1. Natural language input: "Grow from $1M to $2M"
2. System asks revenue math questions:
   - Average project/deal value?
   - Projects completed last year?
   - Close rate on proposals?
   - How do you get leads?
3. Calculates required metrics (customers needed, proposals needed, leads needed)
4. Suggests Key Results based on math
5. Offers to generate milestones and tasks

**For Non-Revenue Goals:**
- Standard SMART breakdown with relevant questions

**Three Creation Modes (for every element):**
1. AI-Generated - system creates, user approves/edits
2. AI-Assisted - user writes, AI suggests improvements
3. Manual - full control, no AI

---

## 300% Check-In System

### Daily Quick Check (30 seconds)

```
Clarity: Do you know exactly what to do today? [1-10]
Belief: Do you believe you'll hit your target? [1-10]
Consistency: Did you show up yesterday? [1-10]
```

### Score-Based Prompts

- **Low Clarity (<7):** "Let's get clear. Here are your top 3 tasks..."
- **Low Belief (<7):** Shows progress made, wins, suggests timeline adjustment
- **Low Consistency (<7):** "Streak recovery mode" - smaller wins to rebuild

### Gamification Integration
- 7+ consecutive days at 250%+ = XP multiplier
- Score improvement from yesterday = bonus XP
- Perfect 300 = celebration + achievement

---

## Calendar Integration

### Four Scheduling Methods

1. **Manual drag & drop** - pull tasks onto time slots
2. **AI auto-scheduling** - system suggests optimal times based on patterns, energy, deadlines
3. **Time blocking** - allocate recurring blocks per project, system fills with tasks
4. **Hybrid** - set deadlines/priorities, AI suggests daily plan to adjust

### Google Calendar Sync (Preserve Existing)

- Two-way sync already working - DO NOT BREAK
- Tasks scheduled in app → appear on Google Calendar
- Events from Google → can be linked to projects/tagged

### Time Audit Integration

**Smart Time Block Population:**
- If task was scheduled → auto-populate project/tags from task
- If no task scheduled → suggest project based on activity category
- Manual override always available

**New Features:**
- Project linking field on time blocks
- "Plan vs Actual" tab - compare scheduled vs completed
- Overlay on weekly view - ghost layer showing scheduled tasks
- Daily summary card - "Planned: 6 / Completed: 4 / Alignment: 67%"
- Project alignment score - "68% of time went toward $2M goal"

---

## Gamification System

### XP Sources

| Action | Base XP | Multipliers |
|--------|---------|-------------|
| Complete task | 10 XP | +50% high-priority, +25% before deadline |
| Log time block | 5 XP | +25% if Production quadrant |
| Daily check-in | 15 XP | +10% per streak day (caps +100%) |
| Move Key Result | 50 XP | +100% if milestone unlocked |
| Hit 300% score | 30 XP | +50% if perfect 300 |
| Complete milestone | 200 XP | +25% per linked KR improved |

### Combo System

Stack multiple bonuses in one action:
- Complete high-priority task (+50%)
- During 7-day streak (+10%)
- That moved a Key Result (+50 XP)
- In Production time (+25%)
= Combo multiplier announcement with total

### Streaks

- **Daily Execution** - completed 1+ task per day
- **Check-in Streak** - did 300% pulse check
- **Production Streak** - logged 4+ hours Production time
- **Project Streak** - worked on main project daily

**Streak Recovery:** Complete 3 tasks to restore lost streak (1x per week)

### Levels

| Level | XP Required | Unlock |
|-------|-------------|--------|
| 1-5 | 0-500 | Basic features |
| 6-10 | 500-2000 | Custom themes, advanced analytics |
| 11-20 | 2000-10000 | AI scheduling priority, badge showcase |
| 21+ | 10000+ | Prestige badges, leaderboard |

---

## Rewards System

### Reward Types

1. **Milestone-based** - "Close 10 projects → AirPods"
2. **Key Result-based** - "KR1 at 100% → Weekend trip"
3. **XP-based (redeemable)** - "5,000 XP = $100 fun money"

### Reward Features

- Custom rewards - user defines what and trigger
- Progress tracking - see how close to each reward
- Claim confirmation - mark as claimed (accountability)
- Reward history - past rewards earned
- Celebration moment - confetti + notification when unlocked

### Rewards Page

Dedicated page under ADVANCED showing:
- Milestone rewards with progress
- Key Result rewards with progress
- XP rewards with redeem buttons
- Unlocked rewards pending claim
- Claimed reward history

---

## Implementation Phases

### Phase 1: Foundation (Database + Core Models)
- Create new database schema (projects, key_results, milestones, tasks, etc.)
- Archive old tables (don't delete, just stop using)
- Create basic CRUD APIs for new models
- Update TypeScript types

**Files to modify:**
- `src/lib/db/schema.ts` - new tables
- `src/types/` - new interfaces
- `src/app/api/` - new API routes

### Phase 2: Project Hub
- Build unified Project view component
- SMART goal display + edit
- Key Results section with progress
- Milestones timeline view
- Tasks list with add/edit
- Connect to new APIs

**Files to create/modify:**
- `src/app/(dashboard)/projects/page.tsx` - list view
- `src/app/(dashboard)/projects/[id]/page.tsx` - project hub
- `src/components/features/projects/` - new components

### Phase 3: Today View
- Daily command center page
- 300% check-in component
- Focus tasks section
- Mini calendar strip
- Momentum stats display

**Files to create/modify:**
- `src/app/(dashboard)/today/page.tsx` - enhance existing
- `src/components/features/today/` - new components
- `src/lib/db/schema.ts` - daily_checkins table

### Phase 4: Vision Planner (Conversational Setup)
- Goal type detection
- Revenue math calculator for money goals
- Adaptive question flow
- AI generation integration
- Three creation modes (AI/Assisted/Manual)

**Files to create/modify:**
- `src/app/(dashboard)/vision-planner/page.tsx`
- `src/components/features/vision-planner/` - wizard components
- `src/app/api/ai/` - revenue math + generation endpoints

### Phase 5: Calendar + Time Audit Enhancement
- Task scheduling UI (4 methods)
- Project linking on time blocks
- Plan vs Actual view/tab
- Smart suggestions for unscheduled blocks
- Alignment score calculation
- Preserve Google Calendar sync

**Files to modify:**
- `src/app/(dashboard)/time-audit/page.tsx`
- `src/components/features/time-audit/` - enhance existing
- `src/lib/db/schema.ts` - add project_id to time_blocks

### Phase 6: Gamification Enhancement
- XP combo system
- Streak tracking with recovery
- Level system with unlocks
- Achievement notifications

**Files to modify:**
- `src/lib/services/gamification.ts` - enhance existing
- `src/lib/db/schema.ts` - enhance gamification tables
- `src/components/features/gamification/` - new UI components

### Phase 7: Rewards System
- Rewards database schema
- Rewards CRUD API
- Rewards page UI
- Reward unlock detection
- Celebration animations
- Claim tracking

**Files to create:**
- `src/app/(dashboard)/rewards/page.tsx`
- `src/components/features/rewards/`
- `src/app/api/rewards/`
- `src/lib/services/rewards.ts`

### Phase 8: Navigation + Polish
- Update sidebar navigation
- Dashboard rollup stats
- Progress page enhancement
- Rename/redirect old routes
- Final UI polish

**Files to modify:**
- `src/components/layout/sidebar.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/constants/routes.ts`

---

## Migration Strategy

**Approach: Fresh Start**
- Archive old data (don't delete tables)
- Users start fresh with new system
- Old pages redirect to new equivalents
- No complex data migration logic needed

---

## Key Files Reference

### Current Files to Study
- `src/lib/db/schema.ts` - current schema
- `src/app/(dashboard)/vision/` - current vision pages
- `src/app/(dashboard)/goals/` - current goals pages
- `src/app/(dashboard)/time-audit/` - time audit (enhance, don't break)
- `src/components/layout/sidebar.tsx` - navigation
- `src/lib/services/gamification.ts` - existing gamification

### Critical Integrations to Preserve
- Google Calendar two-way sync (`src/app/api/calendar/`)
- Supabase auth flow
- Existing Time Audit functionality
- Value Matrix and 4 C's tagging

---

## Verification Plan

### After Each Phase
1. Run `npm run build` - ensure no build errors
2. Run `npm run lint` - no lint errors
3. Manual test in browser:
   - Create/edit/delete operations work
   - Data persists correctly
   - UI renders without errors

### End-to-End Testing
1. **Project Creation Flow:**
   - Create project via Vision Planner
   - Add Key Results, Milestones, Tasks
   - Verify all appear in Project Hub

2. **Daily Execution Flow:**
   - Open Today view
   - Complete 300% check-in
   - Schedule tasks to calendar
   - Mark tasks complete
   - Verify XP awarded

3. **Time Audit Flow:**
   - Log time blocks
   - Link to projects
   - Check Plan vs Actual view
   - Verify alignment score

4. **Rewards Flow:**
   - Create custom reward
   - Complete trigger condition
   - Verify reward unlocks
   - Claim reward

5. **Google Calendar:**
   - Schedule task in app
   - Verify appears in Google Calendar
   - Create event in Google
   - Verify syncs to app

---

## Comprehensive Test Plan

### Phase 1: Foundation Tests

#### Database Schema Tests
| Test Case | Expected Result | How to Verify |
|-----------|-----------------|---------------|
| Create `projects` table | Table exists with all columns | `npx drizzle-kit push` succeeds, check Supabase |
| Create `key_results` table | Table with foreign key to projects | Query table structure in Supabase |
| Create `milestones` table | Table with project_id, quarter fields | Query table structure |
| Create `tasks` table | Table with all scheduling fields | Query table structure |
| Create `daily_checkins` table | Table with clarity/belief/consistency | Query table structure |
| Create `rewards` table | Table with trigger_type, trigger_value | Query table structure |
| Create `reward_claims` table | Table with claimed_at timestamp | Query table structure |
| Foreign key constraints | Deleting project cascades to children | Delete a project, verify children removed |

#### API Route Tests
| Endpoint | Method | Test Case | Expected |
|----------|--------|-----------|----------|
| `/api/projects` | GET | List all projects for user | Returns array, filtered by user_id |
| `/api/projects` | POST | Create project with SMART fields | Returns created project with ID |
| `/api/projects/[id]` | GET | Get single project | Returns project with nested KRs, milestones |
| `/api/projects/[id]` | PUT | Update project | Returns updated project |
| `/api/projects/[id]` | DELETE | Delete project | Returns 200, project archived |
| `/api/key-results` | POST | Create KR linked to project | Returns KR with project_id |
| `/api/key-results/[id]` | PUT | Update KR current_value | Returns updated KR, triggers progress calc |
| `/api/milestones` | POST | Create milestone with quarter | Returns milestone |
| `/api/milestones/[id]` | PUT | Mark milestone complete | Returns milestone, checks reward triggers |
| `/api/tasks` | GET | List tasks (filterable) | Returns tasks, supports ?project_id, ?date filters |
| `/api/tasks` | POST | Create task with scheduling | Returns task with calendar fields |
| `/api/tasks/[id]` | PUT | Complete task | Returns task, triggers XP award |
| `/api/daily-checkins` | POST | Submit 300% check-in | Returns scores, triggers XP if applicable |
| `/api/daily-checkins` | GET | Get today's check-in | Returns existing or null |
| `/api/rewards` | GET | List all rewards | Returns rewards with progress |
| `/api/rewards` | POST | Create custom reward | Returns reward |
| `/api/rewards/[id]/claim` | POST | Claim unlocked reward | Returns claimed reward |

### Phase 2: Project Hub Tests

#### Component Rendering Tests
| Component | Test Case | Expected |
|-----------|-----------|----------|
| ProjectHub | Renders with project data | Shows SMART goal, timeline, 300% score |
| ProjectHub | Empty state | Shows "Create your first project" CTA |
| KeyResultsSection | Displays progress bars | Each KR shows current/target with visual bar |
| KeyResultsSection | Edit KR value | Clicking opens edit modal, saves on submit |
| MilestonesTimeline | Shows quarterly layout | Q1-Q4 columns with milestones positioned |
| MilestonesTimeline | Milestone status colors | Completed=green, In Progress=blue, Upcoming=gray |
| TasksList | Shows this week's tasks | Filtered to current week, sorted by date |
| TasksList | Check/uncheck task | Toggles completion, awards XP with animation |
| TasksList | Add task button | Opens task form, creates task on submit |
| TasksList | AI Fill button | Calls AI endpoint, populates suggested tasks |
| TimeStats | Shows hours this week | Calculated from time_blocks with project_id |
| TimeStats | Value Matrix breakdown | Pie chart with D/R/I/P percentages |

#### User Flow Tests
| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Create project manually | Click +New → Fill SMART fields → Save | Project appears in list, navigates to hub |
| Add Key Result | In Project Hub → Click +KR → Fill form → Save | KR appears in list with 0% progress |
| Update KR progress | Click KR → Edit current value → Save | Progress bar updates, XP awarded if milestone hit |
| Add milestone | Click +Milestone → Set quarter, date → Save | Milestone appears in timeline |
| Complete milestone | Click milestone → Mark complete | Status changes, checks reward triggers |
| Add task manually | Click +Task → Fill details → Save | Task appears in list |
| Complete task | Check task checkbox | Task marked done, XP awarded, combo shown if applicable |

### Phase 3: Today View Tests

#### Component Tests
| Component | Test Case | Expected |
|-----------|-----------|----------|
| CheckInWidget | First visit today | Shows input sliders for C/B/C |
| CheckInWidget | Already checked in | Shows current scores, "Update" option |
| CheckInWidget | Submit scores | Saves to DB, shows streak if applicable |
| CheckInWidget | Low clarity prompt | If clarity <7, shows top tasks suggestion |
| FocusTasks | Shows primary project tasks | Only shows tasks from "focused" project |
| FocusTasks | Start button | Begins timer/tracking for task |
| UnscheduledTasks | Lists unscheduled | Shows tasks without scheduled_at |
| UnscheduledTasks | Drag to calendar | Moves task to time slot |
| MiniCalendar | Shows day blocks | Visual representation of scheduled tasks |
| PlanMyDayButton | Click action | Calls AI endpoint, suggests schedule |
| MomentumStats | Shows streaks | Current streak count with fire emoji |
| MomentumStats | Shows XP/level | Current XP, level, progress to next |

#### Edge Case Tests
| Scenario | Test | Expected |
|----------|------|----------|
| No projects exist | Load Today view | Shows "Create a project to get started" |
| No tasks scheduled | Load Today view | Shows empty focus area, suggests planning |
| Streak broken yesterday | Load Today view | Shows streak recovery option |
| Perfect 300 score | Submit check-in | Triggers celebration animation |
| Multiple projects | Focus selection | Shows selector to choose focus project |

### Phase 4: Vision Planner Tests

#### Conversational Flow Tests
| Input | Detection | Expected Flow |
|-------|-----------|---------------|
| "Grow revenue to $2M" | Revenue goal | Asks: avg deal, deals/year, close rate, lead sources |
| "Lose 30 pounds" | Health goal | Asks: timeline, current weight, past attempts |
| "Launch my SaaS" | Product goal | Asks: target date, MVP features, tech stack |
| "Write a book" | Creative goal | Asks: genre, word count, deadline |
| "Save $50,000" | Financial goal | Asks: current savings, monthly income, timeline |

#### Revenue Math Calculator Tests
| Inputs | Calculation | Expected Output |
|--------|-------------|-----------------|
| Current: $1M, Target: $2M, Avg deal: $50K, Close rate: 50% | Gap: $1M ÷ $50K = 20 deals, 20 ÷ 0.5 = 40 proposals | KR1: 20 deals, KR2: 40 proposals |
| Current: $500K, Target: $1M, Avg deal: $10K, Close rate: 25% | 50 deals needed, 200 proposals needed | Shows stretch warning if unrealistic |
| Zero avg deal entered | Validation | Error: "Please enter average deal value" |
| Close rate > 100% | Validation | Error: "Close rate must be between 0-100%" |

#### Creation Mode Tests
| Mode | Test | Expected |
|------|------|----------|
| AI-Generated | Click "Generate" | AI creates full project with KRs, milestones, tasks |
| AI-Generated | Edit suggestion | User can modify before saving |
| AI-Assisted | User types goal | AI suggests improvements inline |
| AI-Assisted | Accept/reject | User controls final content |
| Manual | Full form | No AI involvement, all fields editable |

### Phase 5: Calendar + Time Audit Tests

#### Scheduling Method Tests
| Method | Test | Expected |
|--------|------|----------|
| Manual drag | Drag task to 9am slot | Task scheduled_at = 9:00, appears on calendar |
| Manual drag | Drag to occupied slot | Shows conflict warning, option to stack |
| AI auto-schedule | Click "Plan My Day" | AI suggests times based on priority, duration |
| AI auto-schedule | Reject suggestion | Task remains unscheduled |
| Time blocking | Create recurring block | Block appears weekly, tasks fill automatically |
| Hybrid | Set priority + deadline | AI schedules high-priority first, respects deadline |

#### Time Audit Enhancement Tests
| Feature | Test | Expected |
|---------|------|----------|
| Project linking | Log block for scheduled task | Auto-populates project from task |
| Project linking | Log block, no task | Suggests project based on category |
| Project linking | Manual override | User can change suggested project |
| Plan vs Actual tab | View tab | Shows side-by-side: scheduled vs actual |
| Plan vs Actual | Calculate alignment | (Completed tasks ÷ Scheduled tasks) × 100 |
| Overlay mode | Toggle overlay | Ghost blocks show scheduled tasks behind actual |
| Summary card | View card | "Planned: X / Completed: Y / Alignment: Z%" |

#### Google Calendar Sync Regression Tests
| Test | Steps | Expected | CRITICAL |
|------|-------|----------|----------|
| App → Google | Schedule task in app | Event appears in Google Calendar | YES |
| Google → App | Create event in Google | Event appears in app calendar | YES |
| Update sync | Change task time in app | Google event updates | YES |
| Delete sync | Delete task in app | Google event removed | YES |
| Conflict handling | Same time in both | Proper merge, no duplicates | YES |
| Auth flow | Reconnect Google | OAuth works, sync resumes | YES |

### Phase 6: Gamification Tests

#### XP Award Tests
| Action | Base XP | Conditions | Total XP |
|--------|---------|------------|----------|
| Complete task | 10 | None | 10 |
| Complete task | 10 | High priority (+50%) | 15 |
| Complete task | 10 | Before deadline (+25%) | 12.5 |
| Complete task | 10 | High priority + before deadline | 17.5 |
| Log time block | 5 | Production quadrant (+25%) | 6.25 |
| Daily check-in | 15 | Day 1 of streak | 15 |
| Daily check-in | 15 | Day 7 of streak (+70%) | 25.5 |
| Daily check-in | 15 | Day 10+ (+100% cap) | 30 |
| Move Key Result | 50 | Normal | 50 |
| Move Key Result | 50 | Unlocks milestone (+100%) | 100 |
| Complete milestone | 200 | No linked KRs | 200 |
| Complete milestone | 200 | 2 KRs improved (+50%) | 300 |

#### Combo System Tests
| Scenario | Components | Expected Display |
|----------|------------|------------------|
| Simple combo | Task + streak | "COMBO! Task completed during 5-day streak: 15 XP" |
| Triple combo | Task + streak + KR moved | "MEGA COMBO! 88 XP (35% bonus)" |
| Max combo | All bonuses | Animated celebration, confetti |

#### Streak Tests
| Streak Type | Break Condition | Recovery Test |
|-------------|-----------------|---------------|
| Daily Execution | No task completed | Complete 3 tasks to restore |
| Check-in | Missed check-in | Check in + 3 tasks |
| Production | <4 hrs Production | Log 4+ hrs Production time |
| Project | Didn't work on main | 3 tasks on main project |
| Recovery limit | Already used this week | No recovery available, streak resets |

#### Level System Tests
| XP | Expected Level | Unlocks Verified |
|----|----------------|------------------|
| 0 | 1 | Basic features only |
| 500 | 6 | Custom themes accessible |
| 2000 | 11 | AI scheduling priority works |
| 10000 | 21 | Prestige badge visible |

### Phase 7: Rewards System Tests

#### Reward Creation Tests
| Trigger Type | Setup | Expected |
|--------------|-------|----------|
| Milestone | Link to specific milestone | Progress shows milestone % |
| Key Result | Link to KR at 100% | Progress shows KR % |
| XP threshold | Set 5000 XP | Progress shows current XP / 5000 |
| Invalid | No trigger selected | Validation error |

#### Reward Unlock Tests
| Scenario | Trigger | Expected |
|----------|---------|----------|
| Milestone complete | Mark milestone done | Reward status → "Unlocked", notification |
| KR hits 100% | Update KR to target | Reward unlocks, confetti |
| XP threshold reached | Earn enough XP | Reward available to redeem |
| Already claimed | Try to claim again | Error: "Already claimed" |

#### Rewards Page Tests
| Section | Test | Expected |
|---------|------|----------|
| Milestone rewards | List view | Shows all with progress bars |
| KR rewards | List view | Shows all with progress bars |
| XP rewards | List view | Shows redeemable vs locked |
| Unlocked section | Claim button | Moves to claimed history on click |
| History | View past | Shows claimed date, reward name |

### Phase 8: Navigation + Integration Tests

#### Sidebar Navigation Tests
| Link | Expected Destination | Data Loads |
|------|---------------------|------------|
| Dashboard | `/dashboard` | Rollup stats from all projects |
| Today | `/today` | Today's tasks, check-in widget |
| Progress | `/progress` | Cross-project visualization |
| Vision Planner | `/vision-planner` | Conversational setup |
| Projects | `/projects` | List of all projects |
| Key Results | `/key-results` | Aggregated KRs |
| Milestones | `/milestones` | Aggregated milestones |
| MINS | `/mins` | All tasks (renamed from MINS) |
| Time Audit | `/time-audit` | Enhanced with project linking |
| Rewards | `/rewards` | Rewards page (new) |

#### Old Route Redirect Tests
| Old Route | New Route | Status |
|-----------|-----------|--------|
| `/vision` | `/projects` | 301 redirect |
| `/vision/[id]` | `/projects/[id]` | 301 redirect |
| `/goals` | `/milestones` | 301 redirect |
| `/goals/[id]` | `/milestones/[id]` | 301 redirect |

#### Cross-Feature Integration Tests
| Test | Steps | Verifies |
|------|-------|----------|
| Full creation flow | Vision Planner → Create → Hub | Project appears correctly |
| Task to calendar | Create task → Schedule → View calendar | Shows in both places |
| Task to time audit | Complete task → Log time → View audit | Project auto-linked |
| KR to reward | KR hits 100% → Check rewards | Reward unlocked |
| Check-in to XP | Submit 300% → Check level | XP awarded correctly |
| Streak to multiplier | Build 7-day streak → Complete task | Bonus XP applied |

### Regression Test Checklist

Before deploying, verify these existing features still work:

#### Time Audit (MUST NOT BREAK)
- [ ] Weekly calendar view renders
- [ ] 15-minute blocks can be logged
- [ ] Value Matrix (D/R/I/P) tagging works
- [ ] Activity categories work
- [ ] Energy ratings work
- [ ] Insights view loads
- [ ] Date range picker works
- [ ] AI insights generation works
- [ ] Ignore button works

#### Google Calendar (MUST NOT BREAK)
- [ ] OAuth connection flow
- [ ] Events sync from Google → App
- [ ] Tasks sync from App → Google
- [ ] Two-way update sync
- [ ] Disconnect/reconnect works

#### Existing Gamification
- [ ] XP awards on KPI completion (legacy)
- [ ] Achievement tracking
- [ ] User stats display

#### Auth & Subscription
- [ ] Login/logout flow
- [ ] Demo mode works
- [ ] Subscription tier gating
- [ ] Protected routes

### Performance Tests

| Test | Threshold | How to Verify |
|------|-----------|---------------|
| Project list load | <500ms | Chrome DevTools Network |
| Project hub load | <800ms | Full render with KRs, milestones |
| Today view load | <500ms | First meaningful paint |
| Calendar render | <300ms | With 50+ tasks |
| Time audit load | <600ms | With 1000+ time blocks |

### Error Handling Tests

| Scenario | Expected Behavior |
|----------|-------------------|
| API returns 500 | Toast error, retry button |
| Network offline | Optimistic UI, sync when back |
| Invalid form data | Validation messages inline |
| Session expired | Redirect to login |
| Rate limited | Backoff message, retry after delay |

---

## Sources

Research conducted on best project planning software:
- [monday.com Goal Tracking](https://monday.com/blog/project-management/best-goal-tracking-software-project-manager-tech-cm/)
- [Wrike OKR Management](https://www.wrike.com/use-cases/okr-goal-management/)
- [Best OKR Software 2026](https://peoplemanagingpeople.com/tools/okr-software/)
- [Gamification Metrics](https://mambo.io/gamification-guide/gamification-metrics-and-kpis)
- [Goal Tracking Apps](https://clickup.com/blog/goal-tracking-apps/)
- [Productivity Gamification Examples](https://trophy.so/blog/productivity-gamification-examples)
