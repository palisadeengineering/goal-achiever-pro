# Architecture

**Analysis Date:** 2026-01-24

## Pattern Overview

**Overall:** Next.js 16 Full-Stack Monolith (App Router)

**Key Characteristics:**
- Server Components as default, Client Components for interactivity
- API routes as serverless functions
- File-based routing with route groups
- Type-safe database layer with Drizzle ORM

## Layers

**Presentation Layer:**
- Purpose: UI rendering and user interaction
- Contains: React components (Server + Client), pages, layouts
- Location: `src/components/`, `src/app/(dashboard)/`, `src/app/(auth)/`
- Depends on: API layer for data, stores for global state
- Used by: Users via browser

**API Layer:**
- Purpose: HTTP endpoints for data operations
- Contains: Route handlers (GET, POST, PUT, DELETE)
- Location: `src/app/api/` (flat hierarchy by domain)
- Depends on: Data layer (Supabase + Drizzle), external services (Anthropic, Stripe)
- Used by: Presentation layer via fetch()

**Data Layer:**
- Purpose: Database access and schema definition
- Contains: Drizzle schema, Supabase clients
- Location: `src/lib/db/`, `src/lib/supabase/`
- Depends on: PostgreSQL (Supabase), environment variables
- Used by: API layer

**State Layer:**
- Purpose: Client-side state management
- Contains: Zustand stores, React Query configuration
- Location: `src/lib/stores/`, `src/components/providers.tsx`
- Depends on: React, persistence middleware
- Used by: Presentation layer

**Utility Layer:**
- Purpose: Shared helpers and cross-cutting concerns
- Contains: Hooks, validation, utilities
- Location: `src/lib/hooks/`, `src/lib/utils/`, `src/lib/validations/`
- Depends on: External libraries (date-fns, zod)
- Used by: All other layers

## Data Flow

**HTTP Request (API Route):**

1. User action triggers fetch() in Client Component
2. Request hits Next.js edge runtime
3. Route handler authenticates via Supabase client
4. If unauthenticated, fallback to DEMO_USER_ID (development)
5. Admin client used to bypass RLS for database operations
6. Data fetched/mutated via Drizzle-like Supabase queries
7. Response transformed (snake_case → camelCase)
8. JSON response returned to client
9. React Query caches and updates UI

**AI Generation Flow:**

1. Client: POST /api/ai/generate-* with context
2. Route handler validates auth and input
3. Anthropic SDK instantiated inside handler
4. Prompt constructed with user context
5. Claude API called with structured output request
6. Response parsed as JSON
7. AI usage logged to database (`src/lib/utils/ai-usage.ts`)
8. Result returned to client for form population

**State Management:**
- Server state: React Query with 1-minute stale time
- Global UI state: Zustand stores with localStorage persistence
- Form state: React Hook Form (ephemeral)
- Local persistence: useLocalStorage hook for time blocks cache

## Time Audit Data Flow

**Time Block Creation (Time Audit Page):**

1. User creates/edits time block in `src/app/(dashboard)/time-audit/page.tsx`
2. Data saved to database via `POST /api/time-blocks`
3. **Also cached in localStorage** via `useLocalStorage<TimeBlock[]>('time-blocks', [])`
4. Local state updated for immediate UI feedback

**Time Block Data Model (`src/lib/db/schema.ts:337`):**
- `activityName` - User-entered activity description
- `activityCategory` - Free-text category (NOT linked to projects)
- `dripQuadrant` - Value Matrix categorization (delegation/replacement/investment/production)
- `energyRating` - green/yellow/red energy level
- `time_block_tags` - Many-to-many custom tags via junction table

**Missing Features (No AI/Project Recognition):**
- ❌ No `project_id` field linking to projects or impact projects
- ❌ No `meeting` type flag or meeting detection
- ❌ No AI endpoint for recognizing projects/meetings from activity names
- ❌ No automatic categorization based on patterns

**Tags System (`src/lib/db/schema.ts:395`):**
- `time_block_tags` table for custom user tags
- `time_block_tag_assignments` junction table
- Can be used manually but not AI-populated

## Analytics/Insights Data Flow

**Critical Issue: Analytics reads from localStorage, NOT database**

**Current Flow (BROKEN):**

1. Analytics page loads `src/app/(dashboard)/analytics/page.tsx`
2. Calls `useAnalyticsData(dateRange)` hook
3. Hook reads from **localStorage**: `useLocalStorage<TimeBlock[]>('time-blocks', [])`
4. Computes metrics from localStorage cache
5. **Does NOT fetch from database API**

**Files:**
- Page: `src/app/(dashboard)/analytics/page.tsx`
- Hook: `src/lib/hooks/use-analytics-data.ts:93` - reads localStorage
- Components: `src/components/features/analytics/weekly-trends-chart.tsx`, `productivity-heatmap.tsx`

**Metrics Displayed:**
- Production percentage (Value Matrix)
- Total hours tracked
- Energy balance
- Peak productivity hour/day
- Weekly trends chart
- Value Matrix/Energy pie charts
- Productivity heatmap

**Time Range Filtering:**
- Implemented in page via `dateRangeOption` state (1week, 2weeks, 1month, 3months)
- Filters localStorage array in `useAnalyticsData` hook
- Date range passed to hook, filtered via `isWithinInterval()`

**Separate Metrics Systems (NOT connected to Time Audit):**
- `north_star_metrics` - User-defined KPIs linked to visions
- `metric_logs` - Log entries for north star metrics
- `weekly_scorecards` - Weekly aggregated scores
- `audit_snapshots` - Weekly time audit aggregations (NOT used by analytics page)

## Key Abstractions

**getUserId() Helper:**
- Purpose: Extract authenticated user ID with demo fallback
- Location: Replicated in API routes (should be centralized)
- Pattern: `async function getUserId(supabase) { return user?.id || DEMO_USER_ID }`

**Admin Client Pattern:**
- Purpose: Bypass RLS for simplified server-side queries
- Location: `src/lib/supabase/admin.ts`
- Usage: Most API routes use admin client, filter by user_id manually

**CamelCase Transformation:**
- Purpose: Convert PostgreSQL snake_case to TypeScript camelCase
- Location: API route handlers
- Pattern: Manual mapping in response transformation

**Tier-Based Access Control:**
- Purpose: Feature gating by subscription level
- Location: `src/constants/routes.ts`, component-level checks
- Pattern: `tierHierarchy[userTier] >= tierHierarchy[requiredTier]`

## Entry Points

**Next.js Middleware:**
- Location: `src/middleware.ts`
- Triggers: All routes (except static files)
- Responsibilities: Auth session refresh, route protection

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page render
- Responsibilities: Fonts, theme script, global styles

**Dashboard Layout:**
- Location: `src/app/(dashboard)/layout.tsx`
- Triggers: All dashboard routes
- Responsibilities: Auth check, sidebar, header, providers

**Auth Callback:**
- Location: `src/app/(auth)/callback/route.ts`
- Triggers: OAuth redirect
- Responsibilities: Token exchange, session creation

## Error Handling

**Strategy:** Try/catch in route handlers, error boundaries in components

**Patterns:**
- API routes: catch errors, log to console, return { error: message } with HTTP status
- Components: Loading states, error states tracked in hooks
- Validation: Zod schemas at API boundary (partial implementation)

## Cross-Cutting Concerns

**Logging:**
- console.error for errors, console.log for debugging
- No structured logging (should implement)

**Validation:**
- Zod schemas in `src/lib/validations/` (underutilized)
- Manual validation in route handlers
- React Hook Form for client-side

**Authentication:**
- Supabase Auth middleware on all routes
- Demo mode fallback for development
- Subscription tier checks in components and routes

**Theme:**
- next-themes with dark/light mode
- Theme script in layout for flash prevention

---

*Architecture analysis: 2026-01-11*
*Update when major patterns change*
