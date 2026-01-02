# Goal Achiever Pro - Session Context

## Important: Correct Project Path
**Use this path:** `c:\Users\joelh\.claude\projects\goal-achiever-pro`

(Not `DM Goal Achievement` - that folder is empty)

## What We're Building
A productivity app based on Dan Martell's DRIP methodology for goal achievement. Features include:
- Vision & SMART Goals tracking
- 12 Power Goals system
- Time & Energy Audit with 15-minute blocks
- DRIP Matrix (Delegation, Replacement, Investment, Production)
- Pomodoro timer & routines
- Google Calendar integration with OAuth
- Pattern learning for event categorization

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Radix UI components
- Prisma (database)
- NextAuth for authentication
- Vercel deployment (auto-deploys from GitHub)

## Repository
- GitHub: `palisadeengineering/goal-achiever-pro`
- Local path: `c:\Users\joelh\.claude\projects\goal-achiever-pro`

## Recent Work (Jan 2, 2026)

### Landing Page Updates
1. **Centered "with Clarity"** - Hero headline now has "with Clarity" on its own centered line
2. **Added "How It Works" flow diagram** - 4-step visual process:
   - Set Your Vision → Audit Your Time → Build Systems → Achieve Goals
   - Uses bordered boxes with arrows connecting them
   - Responsive: horizontal on desktop, vertical on mobile
   - Final step highlighted in green with trophy icon

### Google Calendar Integration Fixes
1. **Event details display** - Fixed API to return full ISO datetime strings (`start.dateTime`, `end.dateTime`) so bulk categorization view shows date, time, and duration
2. **Categorized events on calendar** - Added `getCategorization` lookup to merge categorized Google events into the weekly calendar view
3. **Sync timeframe options** - Added dropdown to sync 1 week, 2 weeks, or 1 month of events (persisted to localStorage)

## Key Files
- `src/app/page.tsx` - Landing page with hero, flow diagram, features
- `src/app/(dashboard)/time-audit/page.tsx` - Time audit with Google Calendar sync
- `src/components/features/time-audit/bulk-categorization-view.tsx` - Bulk event categorization UI
- `src/app/api/calendar/google/events/route.ts` - Google Calendar API endpoint
- `src/hooks/use-event-patterns.ts` - Pattern learning for event categorization

## Current State
- All changes committed and pushed to GitHub
- Vercel auto-deployment should be live
- Landing page flow diagram is centered with boxes and arrows

## Potential Next Tasks
- Test Google Calendar sync with different timeframes
- Verify categorized events appear on weekly calendar
- Add more features to the app as needed
