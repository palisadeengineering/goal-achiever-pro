# Goal Achiever Pro - Project Summary

## Quick Overview

A comprehensive goal-setting and time-optimization web app built on **Dan Martell's "Buy Back Your Time" methodology**. Helps entrepreneurs define visions, create Power Goals, track time, and optimize productivity.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript (strict mode) |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| State | Zustand, TanStack React Query |
| Database | Supabase (PostgreSQL) - Project: `uomrqmsbmuzlyghaocrj` |
| ORM | Drizzle ORM |
| AI | OpenAI GPT-4o-mini |
| Payments | Stripe |
| Auth | Supabase Auth |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup, callback
│   ├── (dashboard)/         # Protected routes
│   │   ├── vision/          # Vision & SMART goals
│   │   ├── goals/           # Power Goals (12 annual projects)
│   │   ├── mins/            # Most Important Next Steps
│   │   ├── time-audit/      # Time tracking (15-min blocks)
│   │   ├── drip/            # DRIP Matrix analysis
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
│   ├── ui/                  # shadcn/ui components
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
└── middleware.ts            # Auth middleware
```

## Core Features

### Goal Hierarchy
```
Vision (SMART Goals)
  └── 12 Power Goals (annual projects, 4 quarters)
       └── Monthly Targets
            └── Weekly Targets
                 └── Daily Actions
```

### Key Modules
- **Vision**: SMART goal framework with AI-assisted generation
- **Power Goals**: 12 annual projects per Dan Martell's method
- **MINs**: Most Important Next Steps scheduling
- **Time Audit**: 15-minute block tracking with DRIP categorization
- **DRIP Matrix**: Delegation, Replacement, Investment, Production quadrants
- **300% Rule**: Track Clarity, Belief, Consistency scores
- **KPI Tracking**: AI-generated KPIs aligned with vision
- **Leverage (4 C's)**: Code, Content, Capital, Collaboration tracking

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
| `time_blocks` | 15-min increments with DRIP + energy ratings |
| `activity_categories` | Custom activity types |
| `routines` / `routine_steps` | Daily routines |
| `daily_reviews` | 3x daily review entries |
| `north_star_metrics` | Primary KPIs |
| `metric_logs` | KPI history |
| `friend_inventory` | Network relationships |

## API Endpoints

### AI Generation
- `POST /api/ai/generate-smart` - Generate SMART components from vision
- `POST /api/ai/generate-power-goals` - Create Power Goals from SMART goals
- `POST /api/ai/generate-kpis` - Generate aligned KPIs
- `POST /api/ai/generate-targets` - Generate monthly/weekly targets
- `POST /api/ai/suggest-vision` - AI vision improvement suggestions

### Data CRUD
- `/api/visions` - Vision management
- `/api/power-goals` - Power Goals management
- `/api/targets` - Target management

### Integrations
- `/api/stripe/*` - Checkout, webhooks, billing portal
- `/api/calendar/google/*` - Google Calendar sync

## Key Patterns

### Authentication
- Supabase Auth with JWT tokens
- Demo mode for testing (whitelisted email: `joel@pe-se.com`)
- Subscription tiers: free, pro, premium with route-level gating

### State Management
- **Zustand**: Global UI state
- **React Query**: Server state caching
- **React Hook Form + Zod**: Form handling

### Database Patterns
- Hierarchical goal structure
- Soft deletes (`archived_at`, `is_active` flags)
- User-scoped queries via `user_id`

### AI Integration
- Anthropic Claude instantiated inside route handlers (not at module level)
- Structured JSON output parsing
- Demo user fallback for development

## Subscription Tiers

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Vision & Power Goals | Yes | Yes | Yes |
| Basic Time Tracking | Yes | Yes | Yes |
| Biweekly Time Audit | No | Yes | Yes |
| Leverage/Network | No | Yes | Yes |
| Midday Reviews | No | Yes | Yes |
| Monthly Time Audit | No | No | Yes |
| Accountability Features | No | No | Yes |

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

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Google Calendar (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Recent Changes (Git History)

1. **Fix auth bypass** for demo mode and vision saving
2. **Fix Power Goals saving** with vision
3. **Add Generate Power Goals** from SMART goals feature
4. **Add KPI accountability system** and multi-vision support
5. **Add vision improvements**: date input, AI suggestions, KPI generation

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Database schema (Drizzle) |
| `src/middleware.ts` | Auth & route protection |
| `src/app/(dashboard)/layout.tsx` | Dashboard layout with sidebar |
| `src/components/layout/sidebar.tsx` | Navigation (tier-aware) |
| `src/lib/supabase/client.ts` | Supabase browser client |
| `src/lib/supabase/server.ts` | Supabase server client |
| `src/constants/routes.ts` | Route definitions & tier requirements |
