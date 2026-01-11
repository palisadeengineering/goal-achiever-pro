# Architecture

**Analysis Date:** 2026-01-11

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
