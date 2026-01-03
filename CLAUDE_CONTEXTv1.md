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

### AI-Assisted Vision & Goal Setting (Latest)
1. **AI-Assisted Vision Creation** - Users can enter their main vision and click "Generate with AI" to automatically generate SMART metrics:
   - Specific, Measurable, Attainable, Realistic fields auto-populated
   - Suggested deadline included
   - Uses OpenAI GPT-4o-mini model
   - API endpoint: `/api/ai/generate-smart`

2. **AI Project Planner** - Based on vision and SMART goals, generates a 12-month roadmap:
   - 12 Power Goals (3 per quarter)
   - Quarterly breakdown with expandable sections
   - Category-based organization (business, health, wealth, etc.)
   - Key milestones for each project
   - API endpoint: `/api/ai/generate-projects`

3. **Dark/Light Mode Toggle** - Added to header:
   - Toggle button with sun/moon icons in header
   - Settings page theme selector synced with toggle
   - Uses shared `useTheme` hook for consistency
   - Persists to localStorage

4. **Home Navigation Fix** - Logo icon in sidebar now navigates to home page (`/`) instead of dashboard

5. **Testing Phase Access** - Full premium access for `joel@pe-se.com`:
   - Configured in dashboard layout
   - User gets `premium` tier during testing phase
   - No payment required

### Landing Page Updates (Earlier)
1. **Centered "with Clarity"** - Hero headline now has "with Clarity" on its own centered line
2. **Added "How It Works" flow diagram** - 4-step visual process

### Google Calendar Integration Fixes
1. **Event details display** - Fixed API to return full ISO datetime strings
2. **Categorized events on calendar** - Added `getCategorization` lookup
3. **Sync timeframe options** - Added dropdown to sync 1 week, 2 weeks, or 1 month

## Key Files
- `src/app/page.tsx` - Landing page with hero, flow diagram, features
- `src/app/(dashboard)/vision/page.tsx` - Vision page with AI planner integration
- `src/components/features/vision/smart-goal-editor.tsx` - SMART goal editor with AI generation
- `src/components/features/vision/ai-project-planner.tsx` - AI-powered 12-month roadmap generator
- `src/app/api/ai/generate-smart/route.ts` - API for SMART goal generation
- `src/app/api/ai/generate-projects/route.ts` - API for project plan generation
- `src/components/ui/theme-toggle.tsx` - Dark/light mode toggle component
- `src/lib/hooks/use-theme.ts` - Shared theme hook
- `src/components/layout/header.tsx` - Header with theme toggle
- `src/components/layout/sidebar.tsx` - Sidebar with home navigation
- `src/app/(dashboard)/layout.tsx` - Dashboard layout with testing access config

## Environment Variables Required
- `OPENAI_API_KEY` - For AI-assisted features

## Current State
- Build successful
- All features implemented and ready for testing
- AI features require OPENAI_API_KEY in environment

## Potential Next Tasks
- Add OPENAI_API_KEY to Vercel environment variables
- Test AI generation features with real API calls
- Save generated Power Goals to database
- Add more AI-assisted features
