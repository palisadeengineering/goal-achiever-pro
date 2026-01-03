# Claude Session Context

**File Location:** `c:\Users\joelh\.claude\projects\DM Goal Achievement\CLAUDE_CONTEXT.md`

To resume this project in a new Claude session, say:
> "Read c:\Users\joelh\.claude\projects\DM Goal Achievement\CLAUDE_CONTEXT.md and continue from there."

## What We're Building
**Goal Achiever Pro** - A Next.js web application for goal setting and achievement tracking, featuring:
- AI-assisted vision creation with automatic SMART goal generation
- 12 Power Goals project planning (Dan Martell methodology)
- Dark/light mode theming
- Tier-based access control with Supabase authentication

## Key Decisions Made
1. **AI Integration**: Using OpenAI GPT-4o-mini for SMART goal generation and project planning
2. **Theme System**: Shared `useTheme` hook syncs theme between header toggle and settings page, persists to localStorage
3. **Testing Access**: Full premium access granted to `joel@pe-se.com` during testing phase (in `layout.tsx`)
4. **Navigation**: Logo links to home page (`ROUTES.home`), not dashboard
5. **MCP Config**: Created `.mcp.json` to disable Revit MCP tools (not relevant to this web project)

## Tech Stack
- Next.js 16.1.1 with App Router
- TypeScript
- Supabase (auth & database)
- OpenAI API
- Tailwind CSS + shadcn/ui

## Current Status
✅ All features from initial PR implemented and deployed:
- Home navigation fix
- AI-assisted SMART goal generation
- AI-powered 12-month project planner
- Dark/light mode toggle in header
- Testing phase access for joel@pe-se.com

## Important Files
- `src/app/api/ai/generate-smart/route.ts` - SMART goal AI endpoint
- `src/app/api/ai/generate-projects/route.ts` - Project planning AI endpoint
- `src/components/features/vision/smart-goal-editor.tsx` - SMART goal UI with AI button
- `src/components/features/vision/ai-project-planner.tsx` - 12 Power Goals planner
- `src/lib/hooks/use-theme.ts` - Shared theme state hook
- `src/app/(dashboard)/layout.tsx` - Testing access whitelist

## Environment Variables Needed
- `OPENAI_API_KEY` - Required for AI features (must be added to Vercel)

## Potential Next Tasks
- Save generated Power Goals to database
- Add more AI-assisted features
- Implement goal progress tracking
- Add notifications/reminders

## Constraints
- OpenAI client must be instantiated inside route handlers (not at module level) to avoid build errors
- `timeBound` field in vision data can be `Date | null`
- Testing access is email-whitelist based, not role-based

---
*Last updated: January 2, 2026*
*Last commit: 3435931 - "Add AI-assisted vision creation and dark mode toggle"*
