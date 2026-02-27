# Goal Achiever Pro - Project Summary

## Quick Overview

A time-tracking and productivity optimization web app centered on the **DRIP Value Matrix** (Delegation, Replacement, Investment, Production). Syncs with Google Calendar, uses AI to auto-categorize activities into DRIP quadrants, and provides analytics dashboards with AI coaching nudges to help users spend more time on high-value work.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript (strict mode) |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| State | Zustand, TanStack React Query |
| Database | Supabase (PostgreSQL) - Project: `uomrqmsbmuzlyghaocrj` |
| ORM | Drizzle ORM |
| AI | Anthropic Claude (via API) |
| Payments | Stripe (wired but dormant) |
| Auth | Supabase Auth |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup, callback
│   ├── (dashboard)/         # Protected routes
│   │   ├── dashboard/       # Main dashboard (3 viz modes + scorecard + AI coaching)
│   │   ├── time-audit/      # Time tracking calendar & AI categorization
│   │   │   └── projects/    # Detected projects management
│   │   ├── analytics/       # Charts, trends, custom user charts
│   │   ├── leverage/        # 4 C's tracking (Code/Content/Capital/Collaboration)
│   │   ├── network/         # Friend inventory
│   │   ├── team/            # Team sharing & collaboration
│   │   ├── settings/        # User settings, profile, subscription
│   │   └── admin/           # Admin panels (AI usage, beta access, feedback)
│   ├── (marketing)/         # Public pages
│   └── api/                 # API routes
│       ├── ai/              # AI endpoints (classify, insights, tags, coaching)
│       ├── calendar/        # Google Calendar sync
│       ├── time-blocks/     # Time block CRUD
│       ├── event-categorizations/  # Event categorization
│       ├── tags/            # Tag management
│       ├── detected-projects/  # Project detection
│       ├── meeting-categories/ # Meeting categories
│       ├── leverage/        # Leverage CRUD
│       ├── network/         # Network CRUD
│       ├── team/            # Team management
│       ├── sharing/         # Sharing & permissions
│       ├── stripe/          # Payment processing (dormant)
│       ├── user/            # User management
│       ├── profile/         # Profile management
│       ├── feedback/        # Beta feedback
│       ├── admin/           # Admin endpoints
│       ├── dashboard/       # Dashboard stats
│       └── user-charts/     # Custom chart management
├── components/
│   ├── layout/              # Header, Sidebar, PageHeader
│   ├── ui/                  # shadcn/ui components
│   ├── features/            # Domain-specific components
│   │   ├── dashboard/       # Value Matrix grid, Stacked Timeline, Bubble Chart, Scorecard, Coaching Nudge
│   │   ├── time-audit/      # Calendar views, DRIP matrix, categorization
│   │   ├── analytics/       # Charts and trends
│   │   ├── drip/            # DRIP Value Matrix components
│   │   ├── leverage/        # Leverage components
│   │   ├── sharing/         # Team sharing components
│   │   └── feedback/        # Beta feedback components
│   └── shared/              # Reusable components
├── lib/
│   ├── db/                  # Drizzle schema & migrations
│   ├── supabase/            # Supabase client & middleware
│   ├── stripe/              # Stripe integration (dormant)
│   ├── calendar/            # Google Calendar sync utilities
│   ├── hooks/               # Custom hooks (useTheme, etc.)
│   ├── stores/              # Zustand stores
│   ├── validations/         # Zod schemas
│   ├── services/            # Business logic services
│   ├── permissions/         # Team/sharing permission logic
│   └── rate-limit/          # AI endpoint rate limiting
├── types/                   # TypeScript interfaces
├── constants/               # Routes, DRIP constants
└── middleware.ts            # Auth middleware
```

## Core Architecture

```
Google Calendar Events
  → AI Activity Classification (DRIP category, tags, projects)
    → Value Matrix (Delegation, Replacement, Investment, Production)
      → Analytics & Trends
        → AI Coaching Nudges
```

### Key Modules
- **Dashboard**: Three visualization modes (Value Matrix Grid, Stacked Timeline, Bubble Chart) plus scorecard and AI coaching nudges
- **Time Audit**: Calendar-synced time tracking with AI auto-categorization into DRIP quadrants
- **Analytics**: Charts, trends, and custom user-defined charts
- **Leverage (4 C's)**: Code, Content, Capital, Collaboration tracking
- **Network**: Friend/contact inventory
- **Team**: Collaborative sharing with permissions
- **Admin**: AI usage monitoring, beta access management, feedback review

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (extends Supabase auth) |
| `time_blocks` | Time tracking entries with DRIP category & energy ratings |
| `time_block_meeting_details` | Meeting metadata for time blocks |
| `activity_categories` | Custom activity types |
| `event_categorizations` | AI event categorization results |
| `time_block_tags` | Tag definitions |
| `time_block_tag_assignments` | Tag-to-block links |
| `time_block_leverage_links` | Time block to leverage item links |
| `detected_projects` | AI-detected projects from calendar events |
| `meeting_categories` | Meeting type classifications |
| `user_charts` | Custom user-defined analytics charts |
| `audit_snapshots` | Point-in-time audit summaries |
| `leverage_items` | 4 C's leverage tracking |
| `friend_inventory` | Network relationships |
| `user_settings` | User preferences |
| `pro_tips` | Contextual tips |
| `calendar_sync_settings` | Google Calendar sync config |
| `calendar_sync_records` | Calendar event sync history |
| `calendar_webhook_channels` | Calendar push notification channels |
| `ai_usage_logs` | AI endpoint usage tracking |
| `team_members` | Team collaboration members |
| `tab_permissions` / `item_permissions` | Sharing permissions |
| `share_invitations` | Team invite records |
| `task_comments` | Comments on shared tasks |
| `beta_feedback` | User feedback during beta |
| `beta_invitations` | Beta access invitations |

## API Endpoints

### AI
- `POST /api/ai/classify-activity` - AI categorize activities into DRIP quadrants
- `POST /api/ai/generate-time-insights` - Generate time audit insights
- `POST /api/ai/suggest-tags` - AI tag suggestions
- `POST /api/ai/suggest-event-cleanup` - Suggest calendar cleanup
- `POST /api/ai/generate-coaching-nudge` - AI coaching nudges for dashboard

### Data CRUD
- `/api/time-blocks` - Time block management
- `/api/event-categorizations` - Event categorization
- `/api/tags` - Tag management
- `/api/detected-projects` - Detected project management
- `/api/meeting-categories` - Meeting categories
- `/api/leverage` - Leverage items
- `/api/network` - Friend inventory
- `/api/team` - Team members
- `/api/sharing` - Sharing & permissions
- `/api/user-charts` - Custom chart management
- `/api/dashboard/stats` - Dashboard statistics

### Integrations
- `/api/stripe/*` - Checkout, webhooks, billing portal (dormant)
- `/api/calendar/*` - Google Calendar sync

### User & Admin
- `/api/user` - User management
- `/api/profile` - Profile management
- `/api/feedback` - Beta feedback
- `/api/admin/*` - Admin endpoints

## Subscription Tiers

Everything is free during beta. Stripe is wired but dormant — no active tier gating.

## Key Patterns

### Authentication
- Supabase Auth with JWT tokens
- Demo mode for testing (whitelisted email: `joel@pe-se.com`)

### State Management
- **Zustand**: Global UI state
- **React Query**: Server state caching
- **React Hook Form + Zod**: Form handling

### Database Patterns
- DRIP categorization (delegation, replacement, investment, production)
- Soft deletes (`archived_at`, `is_active` flags)
- User-scoped queries via `user_id`

### AI Integration
- Anthropic Claude instantiated inside route handlers (not at module level)
- Structured JSON output parsing
- Rate limiting (per-minute and daily caps)
- Demo user fallback for development

## Common Commands

```bash
# Development
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run lint         # Run ESLint

# Database
npx drizzle-kit push # Push schema changes
npx drizzle-kit generate # Generate migrations
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=

# Anthropic
ANTHROPIC_API_KEY=

# Stripe (dormant)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Database schema (Drizzle) |
| `src/middleware.ts` | Auth & route protection |
| `src/app/(dashboard)/layout.tsx` | Dashboard layout with sidebar |
| `src/components/layout/sidebar.tsx` | Navigation sidebar |
| `src/app/(dashboard)/dashboard/page.tsx` | Main dashboard with 3 viz modes |
| `src/components/features/dashboard/value-matrix-grid.tsx` | Value Matrix grid visualization |
| `src/components/features/dashboard/stacked-timeline.tsx` | Stacked timeline visualization |
| `src/components/features/dashboard/bubble-chart.tsx` | Bubble chart visualization |
| `src/components/features/dashboard/scorecard.tsx` | Dashboard scorecard |
| `src/components/features/dashboard/coaching-nudge.tsx` | AI coaching nudge component |
| `src/lib/supabase/client.ts` | Supabase browser client |
| `src/lib/supabase/server.ts` | Supabase server client |
| `src/constants/routes.ts` | Route definitions |
| `src/constants/drip.ts` | DRIP Value Matrix constants |

## Claude Lessons Learned (DO NOT REPEAT)

### UI/UX Mistakes

1. **Don't move floating elements without visual verification**
   - Moving the Feedback button from bottom-right to bottom-left caused it to visually overlap with the sidebar, making it look like a duplicate nav item
   - Always consider the full layout context when repositioning fixed/floating elements
   - Bottom-right is the standard position for floating action buttons (FABs)

2. **Check visual impact of position changes**
   - Fixed-position elements can overlap with other layout components
   - The sidebar occupies the left side - don't place floating elements there
   - Test UI changes visually, not just functionally

### Code Quality Rules

1. **Always run `npm run build` after making changes** to catch TypeScript errors early

2. **When adding new exports to a library file**, check all files that import from it to ensure compatibility

3. **Supabase client can return null** - always add null checks:

4. **Verify fixes before presenting to user** - Don't tell the user to verify the fix themselves. Run the dev server, test the feature, and confirm it works. If testing requires credentials or data you don't have access to, explain why you can't test it and what specific verification the user should do. Never dump "verification steps" on the user as if that's their job.
   ```typescript
   const supabase = await createClient();
   if (!supabase) {
     return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
   }
   ```

### Security Patterns

1. **Never use `NEXT_PUBLIC_` prefix for server-side feature flags** - use `DEMO_MODE_ENABLED` not `NEXT_PUBLIC_DEMO_MODE`

2. **OAuth state parameters must be cryptographically signed** - use HMAC to prevent CSRF attacks

3. **Rate limiting is essential for AI endpoints** - add both per-minute and daily limits
