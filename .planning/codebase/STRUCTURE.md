# Codebase Structure

**Analysis Date:** 2026-01-11

## Directory Layout

```
goal-achiever-pro/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes (login, signup, callback)
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── (marketing)/        # Public pages (pricing)
│   │   ├── (onboarding)/       # Onboarding flow
│   │   └── api/                # API route handlers
│   ├── components/
│   │   ├── layout/             # Header, Sidebar, navigation
│   │   ├── ui/                 # shadcn/ui component library
│   │   └── features/           # Domain-specific components
│   ├── lib/
│   │   ├── db/                 # Drizzle ORM schema
│   │   ├── supabase/           # Supabase clients
│   │   ├── stripe/             # Stripe integration
│   │   ├── hooks/              # Custom React hooks
│   │   ├── stores/             # Zustand global state
│   │   ├── utils/              # Utility functions
│   │   └── validations/        # Zod schemas
│   ├── types/                  # TypeScript definitions
│   ├── constants/              # Routes, subscription plans, DRIP
│   └── middleware.ts           # Auth middleware
├── drizzle/                    # Database migrations
├── .planning/                  # GSD planning documents
├── docs/                       # Documentation
├── images/                     # Static images
├── CLAUDE.md                   # Project instructions
└── package.json                # Dependencies
```

## Directory Purposes

**src/app/(dashboard)/:**
- Purpose: Protected dashboard pages requiring authentication
- Contains: Vision, goals, time-audit, analytics, settings pages
- Key files: `layout.tsx` (auth check, sidebar), `dashboard/page.tsx` (main dashboard)
- Subdirectories: One per feature (vision/, goals/, time-audit/, etc.)

**src/app/api/:**
- Purpose: API route handlers for all data operations
- Contains: REST-style endpoints organized by domain
- Key files: `visions/route.ts`, `time-blocks/route.ts`, `ai/generate-*/route.ts`
- Subdirectories: ai/, calendar/, stripe/, visions/, power-goals/, targets/, etc.

**src/components/features/:**
- Purpose: Domain-specific React components
- Contains: Complex feature components organized by domain
- Key files: `vision/smart-goal-editor.tsx`, `time-audit/weekly-calendar-view.tsx`
- Subdirectories: vision/, goals/, time-audit/, analytics/, reviews/, etc.

**src/components/ui/:**
- Purpose: shadcn/ui design system components
- Contains: Button, Card, Dialog, Form, Input, etc.
- Key files: `button.tsx`, `card.tsx`, `dialog.tsx`, `form.tsx`

**src/lib/db/:**
- Purpose: Database schema and migrations
- Contains: Drizzle ORM table definitions
- Key files: `schema.ts` (all table definitions - 1068 lines)

**src/lib/supabase/:**
- Purpose: Supabase client instances
- Contains: Browser, server, admin clients + middleware
- Key files: `client.ts`, `server.ts`, `admin.ts`, `middleware.ts`

**src/lib/hooks/:**
- Purpose: Custom React hooks for data and logic
- Contains: Time blocks, calendar, analytics, tags hooks
- Key files: `use-time-blocks.ts`, `use-google-calendar.ts`, `use-analytics-data.ts`

**src/lib/stores/:**
- Purpose: Zustand global state stores
- Contains: UI preferences, calendar sync state
- Key files: `ui-store.ts`, `calendar-store.ts`

## Key File Locations

**Entry Points:**
- `src/middleware.ts` - Next.js middleware (auth + session)
- `src/app/layout.tsx` - Root layout (fonts, theme)
- `src/app/(dashboard)/layout.tsx` - Dashboard shell with auth check

**Configuration:**
- `tsconfig.json` - TypeScript config (strict mode)
- `next.config.ts` - Next.js config (minimal)
- `drizzle.config.ts` - Database configuration
- `eslint.config.mjs` - ESLint 9 flat config

**Core Logic:**
- `src/lib/db/schema.ts` - All database tables
- `src/app/api/visions/route.ts` - Vision CRUD
- `src/app/api/time-blocks/route.ts` - Time block operations
- `src/app/api/ai/generate-smart/route.ts` - AI generation

**Testing:**
- Not configured (no test files exist)

**Documentation:**
- `CLAUDE.md` - Project summary and instructions
- `docs/` - Additional documentation

## Naming Conventions

**Files:**
- kebab-case.tsx for components: `smart-goal-editor.tsx`, `tag-manager.tsx`
- kebab-case.ts for hooks: `use-time-blocks.ts`, `use-analytics-data.ts`
- route.ts for API routes (Next.js convention)
- UPPERCASE.md for important docs: `CLAUDE.md`, `README.md`

**Directories:**
- kebab-case for all directories: `time-audit/`, `power-goals/`
- Plural for collections: `components/`, `hooks/`, `stores/`
- Route groups with parentheses: `(dashboard)/`, `(auth)/`

**Special Patterns:**
- `[id]/route.ts` for dynamic routes
- `layout.tsx` for route layouts
- `page.tsx` for route pages
- `index.ts` for barrel exports

## Where to Add New Code

**New Feature:**
- Page: `src/app/(dashboard)/[feature-name]/page.tsx`
- Components: `src/components/features/[feature-name]/`
- API: `src/app/api/[feature-name]/route.ts`
- Types: Add to `src/types/database.ts`

**New Component:**
- Feature component: `src/components/features/[domain]/`
- UI component: `src/components/ui/` (shadcn style)
- Export from barrel: `src/components/features/[domain]/index.ts`

**New API Route:**
- Definition: `src/app/api/[resource]/route.ts`
- Dynamic route: `src/app/api/[resource]/[id]/route.ts`
- Follow pattern: getUserId, adminClient, try/catch, camelCase transform

**New Hook:**
- Implementation: `src/lib/hooks/use-[name].ts`
- Pattern: fetch API calls, return { data, loading, error, actions }

**New Store:**
- Implementation: `src/lib/stores/[name]-store.ts`
- Pattern: create<Type>()(persist(...))

**Utilities:**
- Shared helpers: `src/lib/utils/[name].ts`
- Type definitions: `src/types/[name].ts`

## Special Directories

**drizzle/:**
- Purpose: Database migrations
- Source: Generated by drizzle-kit
- Committed: Yes

**.next/:**
- Purpose: Next.js build output
- Source: Generated by build/dev
- Committed: No (gitignored)

**node_modules/:**
- Purpose: npm dependencies
- Source: npm install
- Committed: No (gitignored)

**.planning/:**
- Purpose: GSD planning documents
- Source: /gsd:* commands
- Committed: Yes

---

*Structure analysis: 2026-01-11*
*Update when directory structure changes*
