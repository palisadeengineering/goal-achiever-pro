# Test Plan: Enhanced Time Audit Analytics with AI Classification

## Overview
This test plan covers the Enhanced Analytics feature including:
- AI-powered activity classification
- Activity type breakdown (projects, meetings, commute, deep work, admin)
- Time by project analytics
- Meeting load metrics
- Integration into both Analytics page and Time Audit Insights tab

---

## Prerequisites

1. **Database**: Run migrations and seed data
   ```bash
   node scripts/migrate-analytics.mjs
   node scripts/seed-meeting-categories.mjs
   ```

2. **Environment**: Dev server running at `http://localhost:3000`

3. **Authentication**: Logged in user account

---

## Test Suite 1: AI Classification API

### Test 1.1: Classify Meeting Activity
**Endpoint**: `POST /api/ai/classify-activity`
**Input**:
```json
{
  "activityName": "Sprint planning with team",
  "description": "Q1 roadmap discussion",
  "attendeeCount": 5
}
```
**Expected Output**:
- `activityType`: "meeting"
- `confidence`: >= 0.7
- Reasoning should mention multiple attendees and "planning" keyword

### Test 1.2: Classify Commute Activity
**Input**:
```json
{
  "activityName": "Drive to office"
}
```
**Expected Output**:
- `activityType`: "commute"
- `confidence`: >= 0.7

### Test 1.3: Classify Project Activity
**Input**:
```json
{
  "activityName": "Project Alpha development"
}
```
**Expected Output**:
- `activityType`: "project"
- `projectName`: Should extract "Project Alpha" or similar
- `confidence`: >= 0.7

### Test 1.4: Classify Deep Work Activity
**Input**:
```json
{
  "activityName": "Deep focus writing documentation"
}
```
**Expected Output**:
- `activityType`: "deep_work"
- `confidence`: >= 0.7

### Test 1.5: Classify Admin Activity
**Input**:
```json
{
  "activityName": "Email and slack catchup"
}
```
**Expected Output**:
- `activityType`: "admin"
- `confidence`: >= 0.7

---

## Test Suite 2: Time Blocks API with Activity Types

### Test 2.1: Create Time Block with Activity Type
**Endpoint**: `POST /api/time-blocks`
**Input**:
```json
{
  "date": "2025-01-25",
  "startTime": "09:00",
  "endTime": "10:00",
  "activityName": "Client call",
  "dripQuadrant": "production",
  "energyRating": "green",
  "activityType": "meeting"
}
```
**Expected**: Block created with `activity_type` = "meeting"

### Test 2.2: Fetch Time Blocks with Date Range
**Endpoint**: `GET /api/time-blocks?startDate=2025-01-20&endDate=2025-01-25`
**Expected**: Returns array of time blocks within date range

---

## Test Suite 3: Detected Projects API

### Test 3.1: Create Detected Project
**Endpoint**: `POST /api/detected-projects`
**Input**:
```json
{
  "name": "Website Redesign"
}
```
**Expected**: Project created with normalized name

### Test 3.2: List Detected Projects
**Endpoint**: `GET /api/detected-projects`
**Expected**: Returns array of projects with stats

### Test 3.3: Link Project to Power Goal
**Endpoint**: `PUT /api/detected-projects/[id]`
**Input**:
```json
{
  "powerGoalId": "<valid-power-goal-id>"
}
```
**Expected**: Project linked to power goal

### Test 3.4: Archive Project
**Endpoint**: `PUT /api/detected-projects/[id]`
**Input**:
```json
{
  "isArchived": true
}
```
**Expected**: Project archived

---

## Test Suite 4: Meeting Categories API

### Test 4.1: List Default Meeting Categories
**Endpoint**: `GET /api/meeting-categories`
**Expected**: Returns 6 default categories:
- 1:1
- Team Meeting
- Client Call
- Interview
- Training
- Ad-hoc

### Test 4.2: Create Custom Category
**Endpoint**: `POST /api/meeting-categories`
**Input**:
```json
{
  "name": "Board Meeting",
  "color": "#ff5733",
  "description": "Monthly board meetings"
}
```
**Expected**: Category created

---

## Test Suite 5: Analytics Page UI

### Test 5.1: Navigate to Analytics Page
**Steps**:
1. Go to `http://localhost:3000/analytics`
2. Observe page loads without errors

**Expected**:
- Page displays with tabbed interface
- Summary KPI cards visible
- Date range selector functional

### Test 5.2: Activity Breakdown Chart
**Preconditions**: Time blocks with various activity types exist

**Steps**:
1. Select date range that includes test data
2. Look for "Activity Breakdown" section

**Expected**:
- Pie chart displays activity distribution
- Legend shows: Project Work, Meetings, Deep Work, Commute, Admin, etc.
- Percentages sum to 100%

### Test 5.3: Time by Project Chart
**Preconditions**: Time blocks with project data exist

**Steps**:
1. Look for "Time by Project" section

**Expected**:
- Horizontal bar chart shows hours per project
- Project list with details (blocks count, duration, trend)
- Linked goals shown if applicable

### Test 5.4: Meeting Load Widget
**Preconditions**: Meeting time blocks exist

**Steps**:
1. Look for "Meeting Load" section

**Expected**:
- Shows total meeting time
- Shows meeting-free time
- Shows percentage of total time in meetings
- Category breakdown pie chart
- Busiest meeting day highlighted

### Test 5.5: Period Comparison
**Steps**:
1. Look for "Period Comparison" section

**Expected**:
- Shows current vs previous period stats
- Delta indicators (up/down arrows)
- Percentage changes calculated correctly

### Test 5.6: Date Range Selector
**Steps**:
1. Change date range to "This Week"
2. Change to "Last 30 Days"
3. Change to "This Month"

**Expected**:
- Charts update with new data
- Loading state shown during fetch
- Data refreshes correctly

---

## Test Suite 6: Time Audit Insights Tab UI

### Test 6.1: Navigate to Time Audit Insights
**Steps**:
1. Go to `http://localhost:3000/time-audit`
2. Click on "Insights" tab

**Expected**:
- Insights view loads
- Existing DRIP/Energy analytics visible
- New enhanced analytics sections visible below existing content

### Test 6.2: Enhanced Analytics in Insights Tab
**Preconditions**: Time blocks with various activity types exist

**Steps**:
1. On Insights tab, scroll down past "Daily Energy Flow" section

**Expected**:
- "Activity Breakdown" chart visible (CategoryBreakdownChart)
- "Time by Project" chart visible (TimeByProjectChart)
- "Meeting Load" widget visible (MeetingLoadWidget)

### Test 6.3: Date Range Sync
**Steps**:
1. Change date range preset (e.g., "Last Week" → "Last 30 Days")
2. Observe all charts

**Expected**:
- Both existing insights and enhanced analytics update
- Data is consistent between sections

### Test 6.4: Filter Interaction
**Steps**:
1. Apply DRIP filter (e.g., "Production" only)
2. Observe enhanced analytics

**Expected**:
- Note: Enhanced analytics fetch from API independently
- Enhanced analytics should still show all activity types (not filtered by DRIP)

---

## Test Suite 7: Data Integrity

### Test 7.1: Activity Type Inference Accuracy
**Steps**:
1. Create time blocks with various activity names:
   - "Team standup" → should infer "meeting"
   - "Uber to client site" → should infer "commute"
   - "Focus time: writing specs" → should infer "deep_work"
   - "Expense reports" → should infer "admin"
2. Check analytics breakdown

**Expected**:
- Activities correctly categorized
- Totals match sum of individual blocks

### Test 7.2: Duration Calculations
**Steps**:
1. Create a time block: 09:00-10:30 (90 minutes)
2. Create another: 10:30-12:00 (90 minutes)
3. Check analytics

**Expected**:
- Total shows 3 hours (180 minutes)
- No rounding errors

### Test 7.3: Period Comparison Accuracy
**Steps**:
1. Create time blocks for last week
2. Create time blocks for this week
3. Check period comparison

**Expected**:
- Percentage changes calculated correctly
- Positive changes show green/up arrow
- Negative changes show red/down arrow

---

## Test Suite 8: Error Handling

### Test 8.1: Empty Data State
**Steps**:
1. Select a date range with no time blocks

**Expected**:
- Charts show "No time tracked" or similar message
- No JS errors in console
- Page remains functional

### Test 8.2: API Error Handling
**Steps**:
1. Temporarily break API (e.g., invalid env)
2. Load analytics page

**Expected**:
- Graceful error handling
- Loading state doesn't persist forever
- Console logs helpful error message

### Test 8.3: Network Failure
**Steps**:
1. Disconnect network
2. Try to change date range

**Expected**:
- Shows error or uses cached data
- Doesn't crash

---

## Test Suite 9: Performance

### Test 9.1: Large Dataset Performance
**Steps**:
1. Create 100+ time blocks across 30 days
2. Load analytics page

**Expected**:
- Page loads within 3 seconds
- Charts render smoothly
- No browser freezing

### Test 9.2: Parallel API Calls
**Steps**:
1. Open Network tab in DevTools
2. Load analytics page

**Expected**:
- Current and comparison period fetched in parallel
- Both `/api/time-blocks` calls complete efficiently

---

## Test Suite 10: Cross-browser Compatibility

### Test 10.1: Chrome
- All charts render correctly
- Tooltips work on hover

### Test 10.2: Firefox
- All charts render correctly
- Date pickers work

### Test 10.3: Safari
- All charts render correctly
- No layout issues

### Test 10.4: Mobile (Responsive)
- Charts adapt to smaller screens
- Touch interactions work for date pickers

---

## Test Execution Checklist

| Suite | Test | Status | Notes |
|-------|------|--------|-------|
| 1.1 | Classify Meeting | [ ] | |
| 1.2 | Classify Commute | [ ] | |
| 1.3 | Classify Project | [ ] | |
| 1.4 | Classify Deep Work | [ ] | |
| 1.5 | Classify Admin | [ ] | |
| 2.1 | Create Time Block | [ ] | |
| 2.2 | Fetch with Date Range | [ ] | |
| 3.1 | Create Project | [ ] | |
| 3.2 | List Projects | [ ] | |
| 3.3 | Link to Goal | [ ] | |
| 3.4 | Archive Project | [ ] | |
| 4.1 | List Categories | [ ] | |
| 4.2 | Create Category | [ ] | |
| 5.1 | Analytics Page Load | [ ] | |
| 5.2 | Activity Breakdown | [ ] | |
| 5.3 | Time by Project | [ ] | |
| 5.4 | Meeting Load | [ ] | |
| 5.5 | Period Comparison | [ ] | |
| 5.6 | Date Range Selector | [ ] | |
| 6.1 | Insights Tab Nav | [ ] | |
| 6.2 | Enhanced Analytics | [ ] | |
| 6.3 | Date Range Sync | [ ] | |
| 6.4 | Filter Interaction | [ ] | |
| 7.1 | Type Inference | [ ] | |
| 7.2 | Duration Calcs | [ ] | |
| 7.3 | Period Comparison | [ ] | |
| 8.1 | Empty Data | [ ] | |
| 8.2 | API Error | [ ] | |
| 8.3 | Network Failure | [ ] | |
| 9.1 | Large Dataset | [ ] | |
| 9.2 | Parallel Calls | [ ] | |
| 10.1 | Chrome | [ ] | |
| 10.2 | Firefox | [ ] | |
| 10.3 | Safari | [ ] | |
| 10.4 | Mobile | [ ] | |

---

## Quick Smoke Test (5 minutes)

Run these tests for a quick sanity check:

1. **API Health**:
   ```bash
   curl http://localhost:3000/api/meeting-categories
   ```
   Expected: Returns 6 categories

2. **Analytics Page**: Navigate to `/analytics`, confirm charts load

3. **Insights Tab**: Navigate to `/time-audit`, click Insights, scroll to enhanced analytics

4. **Create Test Data**:
   ```bash
   curl -X POST http://localhost:3000/api/time-blocks \
     -H "Content-Type: application/json" \
     -d '{"date":"2025-01-25","startTime":"14:00","endTime":"15:00","activityName":"Test meeting","dripQuadrant":"production","energyRating":"green"}'
   ```

5. **Verify Update**: Refresh analytics, confirm new block appears

---

## Known Limitations

1. Enhanced analytics in Insights tab fetch data independently from API; they don't use the DRIP/Energy/Tag filters
2. Activity type inference is heuristic-based; complex activity names may miscategorize
3. Period comparison assumes symmetrical periods (7 days vs 7 days)
