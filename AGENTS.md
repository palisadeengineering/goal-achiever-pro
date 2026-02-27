# Agent Teams - Goal Achiever Pro

This project uses Claude Code agent teams for parallel, specialized development. Each agent has a defined area of expertise and follows the rules below.

## Team Structure

| Agent | Directory | Responsibility |
|-------|-----------|----------------|
| **API Agent** | `src/app/api/` | Backend route handlers, AI endpoints, Calendar/Stripe integrations |
| **UI Agent** | `src/components/` | React components, shadcn/ui, styling, accessibility |
| **Database Agent** | `src/lib/db/` | Drizzle ORM schema, migrations, query helpers |
| **Dashboard Agent** | `src/app/(dashboard)/` | Feature pages, page-level state, feature logic |
| **Core Libraries Agent** | `src/lib/` | Auth, Supabase clients, Zustand stores, hooks, validation |
| **Test Agent** | `src/__tests__/`, `**/*.test.*` | Unit tests, integration tests, Vitest configuration |

## Shared Rules (All Agents)

### Code Standards
- TypeScript strict mode is enabled — no `any` types, no `@ts-ignore`
- Use absolute imports via `@/` path alias (maps to `src/`)
- Run `npm run build` after changes to catch type errors
- Run `npm run lint` to check ESLint compliance

### Auth & Security
- Supabase client can return `null` — always add null checks
- Never use `NEXT_PUBLIC_` prefix for server-side secrets
- All database queries must be scoped by `user_id`
- Demo mode email whitelist: `joel@pe-se.com`
- Rate-limit AI endpoints (per-minute and daily caps)

### Database Access
- Use Drizzle ORM for all database operations (never raw SQL)
- Schema is defined in `src/lib/db/schema.ts`
- Supabase browser client: `src/lib/supabase/client.ts`
- Supabase server client: `src/lib/supabase/server.ts`

### State Management
- **Server state**: TanStack React Query (caching, fetching)
- **Global UI state**: Zustand stores in `src/lib/stores/`
- **Form state**: React Hook Form + Zod validation schemas

### UI Conventions
- Components use shadcn/ui primitives from `src/components/ui/`
- Tailwind CSS 4 for styling — no inline styles or CSS modules
- Icons from `lucide-react`
- Bottom-right is reserved for floating action buttons — never place FABs on the left (sidebar overlap)

### Core Architecture (Domain Model)
```
Google Calendar Events
  → AI Activity Classification (DRIP category, tags, projects)
    → Value Matrix (Delegation, Replacement, Investment, Production)
      → Analytics & Trends
        → AI Coaching Nudges
```

### Subscription Tiers
Everything is free during beta. Stripe is wired but dormant — no tier gating.

## Coordination Rules

1. **No overlapping edits**: Agents must not modify the same file simultaneously. If a shared file needs changes (e.g., `schema.ts`, `routes.ts`), coordinate via the orchestrating agent.
2. **Schema changes first**: Database schema changes must be completed and pushed before API or UI agents reference new tables/columns.
3. **Type contracts**: When adding new API endpoints, define TypeScript types in `src/types/` first so both API and UI agents share the same contract.
4. **Build verification**: After all agents complete their work, run `npm run build` to verify the full project compiles.
5. **Test coverage**: New features should include tests. Use Vitest with `@testing-library/react` for component tests.

## Commands Reference

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build (type-check)
npm run lint         # ESLint
npm run test         # Vitest run
npm run test:watch   # Vitest watch mode
```

## MCP Servers Available

- **Supabase MCP**: Database management, table inspection, RLS policies
- **Chrome DevTools MCP**: Browser inspection, DOM queries, console access
