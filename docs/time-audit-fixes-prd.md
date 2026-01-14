# Time Audit Google Calendar Sync & Event Management PRD

## Overview
Fix critical Google Calendar sync issues and add event management UI for quick deletion and bulk operations.

## Problem Statement

### Issue 1: User Being Incorrectly Identified as Demo User
When viewing December 7th week and clicking "Sync 1 Month", no Google Calendar events appear - only test/demo events are showing. Even though demo mode is set to `false`, the user is being identified as `DEMO_USER_ID` which triggers demo event generation.

**Root Cause**: Line 186 in `/src/app/api/calendar/google/events/route.ts` checks if user is DEMO_USER_ID and returns generated demo events. The `getUserId()` function may be incorrectly returning `DEMO_USER_ID` for authenticated users, OR the Google Calendar integration check is failing silently.

### Issue 2: No Event Management UI
Users cannot easily view and delete events. Need a clean interface to:
- View all events for the current week/month
- Delete individual events quickly
- Use AI to identify and bulk-delete similar events (e.g., recurring meetings no longer needed)

## User Stories

### US-001: Fix Demo Mode Override for Authenticated Users
**As a** logged-in user with Google Calendar connected
**I want** the app to fetch my real Google Calendar events instead of demo data
**So that** I can see my actual schedule when syncing

**Acceptance Criteria**:
- Demo mode only applies to unauthenticated/demo users
- Authenticated users with Google Calendar connected ALWAYS get real data
- Remove or update the demo mode check in `events/route.ts`
- Verify December 7th week sync shows real Google Calendar events
- Typecheck passes

### US-002: Add Event Management Tab to Time Audit
**As a** user
**I want** a dedicated tab/view to manage my Google Calendar events
**So that** I can quickly review and delete events without leaving the app

**Acceptance Criteria**:
- Add new "Manage Events" tab alongside Calendar and Insights tabs
- Tab shows list of all events in current viewed date range (week/month)
- Events grouped by day with clean card-based UI
- Each event shows: title, time, date, DRIP/energy if categorized
- Each event has a delete button
- Delete removes event from Google Calendar AND local time blocks
- Typecheck passes
- Verify in browser

### US-003: Create Event List Component
**As a** developer
**I want** a reusable EventList component
**So that** the event management UI is clean and maintainable

**Acceptance Criteria**:
- Create `src/components/features/time-audit/event-list.tsx`
- Props: events array, date range, onDelete callback
- Groups events by date (e.g., "Monday, Dec 7", "Tuesday, Dec 8")
- Each event card shows: title, time range, badges for DRIP/energy
- Delete button with confirmation dialog
- Loading and empty states
- Mobile responsive
- Typecheck passes

### US-004: Add AI-Assisted Bulk Delete
**As a** user
**I want** AI to help me identify events I should delete
**So that** I can quickly clean up my calendar

**Acceptance Criteria**:
- Add "AI Suggestions" button in Manage Events tab
- Button calls new `/api/ai/suggest-event-cleanup` endpoint
- AI analyzes event titles, descriptions, patterns
- AI suggests categories of events to delete (e.g., "Old recurring standups", "Cancelled meetings")
- User can review suggestions and bulk-delete by category
- Confirmation dialog before bulk deletion
- Typecheck passes
- Verify in browser

### US-005: Create AI Event Cleanup Endpoint
**As a** developer
**I want** an AI endpoint that analyzes events for cleanup suggestions
**So that** users can get intelligent bulk delete recommendations

**Acceptance Criteria**:
- Create `src/app/api/ai/suggest-event-cleanup/route.ts`
- Accept array of events from frontend
- Use GPT-4o-mini to analyze event patterns
- Identify: recurring events no longer needed, old/past events, duplicates
- Return categorized suggestions with event IDs
- Include reasoning for each suggestion category
- Typecheck passes

### US-006: Add Bulk Delete Confirmation Dialog
**As a** user
**I want** to confirm bulk deletions before they happen
**So that** I don't accidentally delete important events

**Acceptance Criteria**:
- Dialog shows AI suggestion categories
- Each category shows count and sample event names
- User can select/deselect categories
- "Delete Selected" button with count
- Progress indicator during deletion
- Success/error messages
- Typecheck passes
- Verify in browser

### US-007: Update Google Calendar Permissions Documentation
**As a** developer
**I want** clear documentation of required Google Calendar scopes
**So that** users understand what permissions are needed

**Acceptance Criteria**:
- Document current scopes in README or SETUP.md
- Explain why read/write access is needed (two-way sync)
- Add troubleshooting section for common sync issues
- Document demo mode behavior and how to disable it
- Typecheck passes (N/A for docs)

## Technical Notes

### Demo Mode Fix
Current problematic code:
```typescript
// In /src/app/api/calendar/google/events/route.ts line 186
if (IS_DEMO_MODE && userId === DEMO_USER_ID) {
  const demoEvents = generateDemoEvents(new Date(timeMin), new Date(timeMax));
  return NextResponse.json({ events: demoEvents, demo: true });
}
```

**Solution**: Only return demo events if user is NOT connected to Google Calendar, regardless of demo mode. Authenticated users with real Google connections should ALWAYS get real data.

### Current Google Calendar Scopes
Already requesting comprehensive permissions:
- `https://www.googleapis.com/auth/calendar` - Full read/write
- `https://www.googleapis.com/auth/calendar.events` - Events read/write

These are sufficient - no additional permissions needed.

### Event Management UI Structure
```
Time Audit Page
├── Calendar Tab (existing)
├── Insights Tab (existing)
└── Manage Events Tab (NEW)
    ├── Date Range Display (matches current view)
    ├── AI Suggestions Button
    ├── Event List (grouped by day)
    │   ├── Day Section
    │   │   ├── Event Card 1 (with delete button)
    │   │   ├── Event Card 2
    │   │   └── Event Card 3
    │   └── Day Section
    └── Bulk Delete Dialog (when using AI)
```

## Dependencies
- Existing Google Calendar integration
- OpenAI API (for AI suggestions)
- Existing time blocks API

## Out of Scope
- Calendar view improvements (not part of this PRD)
- Event editing UI (only deletion)
- Integration with other calendar providers
- Recurring event rule editing

## Success Metrics
- Real Google Calendar events appear when syncing
- Users can delete events in < 3 clicks
- AI suggestions identify at least 80% of truly deletable events
- Zero accidental deletions due to confirmation dialogs
