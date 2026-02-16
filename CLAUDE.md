# Goal Achiever Pro

## Quick Overview

A comprehensive goal-setting and time-optimization web app built on **proven productivity and time optimization methodologies**. Helps entrepreneurs define visions, create Impact Projects, track time, and optimize productivity.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.x (App Router) |
| Language | TypeScript (strict mode) |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| State | Zustand (UI state), TanStack React Query (server state) |
| Forms | React Hook Form + Zod validation |
| Database | Supabase (PostgreSQL) - Project: `uomrqmsbmuzlyghaocrj` |
| ORM | Drizzle ORM |
| AI | Anthropic Claude (via @anthropic-ai/sdk) |
| Payments | Stripe |
| Auth | Supabase Auth |
| Testing | Vitest + React Testing Library + jsdom |
| Linting | ESLint 9 (flat config) with next/core-web-vitals + next/typescript |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup, callback
│   ├── (dashboard)/         # Protected routes (all user-facing features)
│   │   ├── vision/          # Vision & SMART goals
│   │   ├── goals/           # Impact Projects (12 annual projects)
│   │   ├── mins/            # Most Important Next Steps
│   │   ├── time-audit/      # Time tracking (15-min blocks)
│   │   ├── drip/            # Value Matrix analysis
│   │   ├── routines/        # Morning/evening/midday routines
│   │   ├── pomodoro/        # Focus timer
│   │   ├── reviews/         # Daily reviews (3x daily)
│   │   ├── leverage/        # 4 C's tracking
│   │   ├── network/         # Friend inventory
│   │   ├── analytics/       # Dashboard & charts
│   │   └── settings/        # User settings & subscription
│   ├── (marketing)/         # Public pages
│   ├── (onboarding)/        # Onboarding flow
│   └── api/                 # API routes
│       ├── ai/              # AI generation endpoints
│       ├── visions/         # Vision CRUD
│       ├── power-goals/     # Power goals CRUD
│       ├── targets/         # Monthly/weekly targets
│       ├── stripe/          # Payment processing
│       └── calendar/        # Google Calendar integration
├── components/
│   ├── layout/              # Header, Sidebar, PageHeader
│   ├── ui/                  # shadcn/ui components (DO NOT manually edit)
│   ├── features/            # Domain-specific components
│   │   ├── vision/          # SmartGoalEditor, AIProjectPlanner, KPIAccountabilitySystem
│   │   ├── goals/           # GoalForm, GoalsGrid
│   │   ├── time-audit/      # Calendar views, DRIP matrix
│   │   ├── analytics/       # Charts and trends
│   │   └── targets/         # Target generation wizard
│   └── shared/              # Reusable components
├── lib/
│   ├── db/                  # Drizzle schema & migrations
│   ├── supabase/            # Supabase client & middleware
│   ├── stripe/              # Stripe integration
│   ├── hooks/               # Custom hooks (useTheme, etc.)
│   ├── stores/              # Zustand stores
│   └── validations/         # Zod schemas
├── types/                   # TypeScript interfaces
├── constants/               # Routes and constants
└── middleware.ts            # Auth middleware (delegates to supabase/middleware)
```

---

## Architecture & Data Flow

### Goal Hierarchy
```
Vision (SMART Goals)
  └── 12 Impact Projects (annual projects, 4 quarters)
       └── Monthly Targets
            └── Weekly Targets
                 └── Daily Actions
```

### Request Flow
1. Browser → Next.js middleware (auth check via Supabase session refresh)
2. App Router → Server Components or Client Components
3. API routes → Supabase client (server-side) → PostgreSQL
4. AI routes → Anthropic SDK → structured JSON response

### State Management Strategy
- **Zustand stores** (`src/lib/stores/`): UI-only state (sidebar open, theme, modals)
- **React Query** (`@tanstack/react-query`): All server state (fetching, caching, mutations)
- **React Hook Form + Zod**: Form state and validation
- **NEVER use localStorage as primary store** for user data (see Lessons Learned)

---

## Coding Standards

### TypeScript
- **Strict mode is ON** — no `any` types unless absolutely necessary
- Use `@/*` path alias (maps to `./src/*`)
- All API responses should be properly typed
- Use Zod schemas for runtime validation at API boundaries

### React / Next.js
- Use App Router conventions (page.tsx, layout.tsx, loading.tsx, error.tsx)
- Prefer Server Components; use `"use client"` only when needed (hooks, interactivity)
- Use shadcn/ui components from `@/components/ui/` — do NOT manually edit these files
- New UI components go in `@/components/features/` (domain-specific) or `@/components/shared/`

### API Routes
- Always authenticate via Supabase server client
- Always null-check the Supabase client:
  ```typescript
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
  ```
- Instantiate Anthropic client INSIDE route handlers, not at module level
- Use parameterized queries — never interpolate user input into SQL

### Database (Drizzle ORM)
- Schema lives in `src/lib/db/schema.ts`
- Migrations output to `./drizzle/`
- Use `npx drizzle-kit push` to push schema changes (interactive — verify it ran)
- All tables are user-scoped via `user_id` column
- Soft deletes use `archived_at` or `is_active` flags — never hard delete user data

### Styling
- Tailwind CSS 4 with `tw-animate-css` for animations
- Use `cn()` utility (clsx + tailwind-merge) for conditional classes
- No custom CSS files unless absolutely necessary
- Dark mode supported via `next-themes`

### Error Handling
- API routes: return proper HTTP status codes with JSON error messages
- Client: use React Query error states, Sonner toast for user notifications
- Never swallow errors silently — always log or surface them

---

## Security Requirements

- **NEVER use `NEXT_PUBLIC_` prefix** for server-side secrets or feature flags
- **OAuth state params must be HMAC-signed** to prevent CSRF
- **Rate limit AI endpoints** — per-minute and daily limits
- **CSP headers** are configured in `next.config.ts` — update when adding new external domains
- Security headers (X-Frame-Options, HSTS, etc.) are in `next.config.ts`
- Never commit `.env` or `.env.local` files
- Demo mode uses whitelisted email: `joel@pe-se.com`

---

## Subscription Tiers

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Vision & Impact Projects | Yes | Yes | Yes |
| Basic Time Tracking | Yes | Yes | Yes |
| Biweekly Time Audit | No | Yes | Yes |
| Leverage/Network | No | Yes | Yes |
| Midday Reviews | No | Yes | Yes |
| Monthly Time Audit | No | No | Yes |
| Accountability Features | No | No | Yes |

Tier gating is enforced at the route level via `src/constants/routes.ts`.

---

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (extends Supabase auth) |
| `visions` | SMART goals with 300% scores |
| `power_goals` | 12 annual projects linked to visions |
| `monthly_targets` | Monthly breakdown of power goals |
| `weekly_targets` | Weekly breakdown |
| `daily_actions` | Daily breakdown |
| `mins` | Most Important Next Steps |
| `time_blocks` | 15-min increments with Value Matrix + energy ratings |
| `activity_categories` | Custom activity types |
| `routines` / `routine_steps` | Daily routines |
| `daily_reviews` | 3x daily review entries |
| `north_star_metrics` | Primary KPIs |
| `metric_logs` | KPI history |
| `friend_inventory` | Network relationships |

---

## Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Production build — ALWAYS run after changes
npm run lint             # ESLint check

# Testing
npm run test             # Run all tests (vitest)
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report

# Database
npx drizzle-kit push     # Push schema to DB (interactive — verify success)
npx drizzle-kit generate # Generate migration files
```

---

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

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Google Calendar (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Database schema (Drizzle) |
| `src/middleware.ts` | Auth & route protection |
| `src/lib/supabase/middleware.ts` | Session refresh logic |
| `src/app/(dashboard)/layout.tsx` | Dashboard layout with sidebar |
| `src/components/layout/sidebar.tsx` | Navigation (tier-aware) |
| `src/lib/supabase/client.ts` | Supabase browser client |
| `src/lib/supabase/server.ts` | Supabase server client |
| `src/constants/routes.ts` | Route definitions & tier requirements |
| `next.config.ts` | Security headers, CSP |
| `drizzle.config.ts` | Drizzle ORM config |
| `vitest.config.ts` | Test runner config |
| `eslint.config.mjs` | ESLint flat config |

---

## Production Checklist (Before Deploy)

1. `npm run build` passes with zero errors
2. `npm run lint` passes
3. `npm run test` passes
4. No `console.log` left in production code (use proper error handling)
5. All new environment variables documented above
6. Database migrations applied and verified
7. CSP headers updated if new external domains added
8. Subscription tier gating verified for new features

---

## Lessons Learned (DO NOT REPEAT)

### UI/UX

1. **Don't move floating elements without visual verification**
   - Moving the Feedback button from bottom-right to bottom-left caused overlap with sidebar
   - Always consider full layout context when repositioning fixed/floating elements
   - Bottom-right is the standard position for FABs

2. **Check visual impact of position changes**
   - Fixed-position elements can overlap with other layout components
   - The sidebar occupies the left side — don't place floating elements there

### Data & State Management

1. **NEVER use localStorage as the primary store for user data that needs to work across devices**
   - localStorage is per-browser, per-device — it does NOT sync
   - Any user-facing data MUST be saved to the database FIRST, with localStorage only as a cache/fallback
   - When adding a new feature that stores user data, ALWAYS persist to DB from day one
   - When building with localStorage, immediately ask: "Does this need to work on another device?" If yes, add DB persistence in the SAME PR

2. **When adding DB sync to existing localStorage-only features, always make it bidirectional from the start**
   - Upload existing local data → DB (so other devices can see it)
   - Download DB data → local (so this device sees data from other devices)
   - Never ship one-directional sync — it silently loses data

3. **After adding a new DB table, always verify it was actually created** by querying it — don't assume `drizzle-kit push` ran successfully

### Code Quality

1. **Always run `npm run build` after making changes** to catch TypeScript errors early
2. **When adding new exports to a library file**, check all files that import from it
3. **Supabase client can return null** — always add null checks (see Coding Standards above)

### Verification

1. **NEVER claim a fix is done without visually verifying the end-to-end user outcome**
   - API calls returning 200 OK is NOT verification — the data must appear correctly in the UI
   - After fixing a bug, reproduce the exact user-reported scenario and confirm the UI shows the expected result
   - Take a snapshot/screenshot of the FINAL state showing the fix worked, not just intermediate network calls
   - If events should appear on a calendar, verify events are visible on the calendar — not just that the fetch returned data

2. **If you cannot fully verify, say so explicitly**
   - Never say "everything works" or "all tests pass" based on partial evidence
   - State exactly what you verified and what you could not verify

### Security

1. **Never use `NEXT_PUBLIC_` prefix for server-side feature flags**
2. **OAuth state parameters must be cryptographically signed** (HMAC)
3. **Rate limiting is essential for AI endpoints** — per-minute and daily limits
