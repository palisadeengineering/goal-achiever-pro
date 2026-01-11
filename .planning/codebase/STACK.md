# Technology Stack

**Analysis Date:** 2026-01-11

## Languages

**Primary:**
- TypeScript 5.x (strict mode enabled) - All application code - `package.json`, `tsconfig.json`

**Secondary:**
- JavaScript - Config files, build scripts - `eslint.config.mjs`, `postcss.config.mjs`

## Runtime

**Environment:**
- Node.js (via Next.js 16.1.1) - `package.json`
- No explicit Node.js version pinning (no .nvmrc file detected)

**Package Manager:**
- npm (lockfileVersion 3) - `package-lock.json`

## Frameworks

**Core:**
- Next.js 16.1.1 (App Router, React Server Components) - `package.json`, `next.config.ts`
- React 19.2.3 (with React DOM 19.2.3) - `package.json`
- Tailwind CSS 4.0 (with PostCSS) - `package.json`, `postcss.config.mjs`

**Testing:**
- Not configured (no test framework installed)

**Build/Dev:**
- TypeScript 5.x - Compilation to JavaScript
- ESLint 9.x - `eslint.config.mjs`
- PostCSS with @tailwindcss/postcss - `postcss.config.mjs`

## Key Dependencies

**Critical:**
- @supabase/ssr 0.6.1 - Supabase server-side rendering client - `src/lib/supabase/`
- @anthropic-ai/sdk 0.71.2 - AI generation for goals/KPIs - `src/app/api/ai/`
- stripe 14.25.0 - Payment processing - `src/lib/stripe/`
- drizzle-orm 0.45.1 - Type-safe database queries - `src/lib/db/schema.ts`

**State Management:**
- zustand 5.0.9 - Global UI state - `src/lib/stores/`
- @tanstack/react-query 5.90.16 - Server state caching - `src/components/providers.tsx`

**UI:**
- class-variance-authority 0.7.1 - Component variants - `src/components/ui/`
- lucide-react 0.562.0 - Icons
- recharts 3.6.0 - Charts and visualization - `src/components/features/analytics/`
- @dnd-kit/core 6.3.1 - Drag and drop - `src/components/features/time-audit/`
- sonner 2.0.7 - Toast notifications
- cmdk 1.1.1 - Command palette

**Form Handling:**
- react-hook-form 7.69.0 - Form state management
- zod 4.3.4 - Schema validation - `src/lib/validations/`

**Infrastructure:**
- postgres 3.4.7 - PostgreSQL client for Drizzle
- date-fns 4.1.0 - Date manipulation

## Configuration

**Environment:**
- `.env.local` - Local development secrets (gitignored)
- `.env.example` - Template with required variables
- `.env.vercel` - Vercel production config
- `.env.vercel.local` - Vercel preview config
- Key configs: DATABASE_URL, SUPABASE_*, STRIPE_*, ANTHROPIC_API_KEY, GOOGLE_* required

**Build:**
- `tsconfig.json` - TypeScript compiler options (strict mode, ES2017 target, bundler resolution)
- `next.config.ts` - Minimal Next.js configuration
- `drizzle.config.ts` - Drizzle ORM database configuration
- `eslint.config.mjs` - ESLint 9 flat config with Next.js presets

## Platform Requirements

**Development:**
- macOS/Linux/Windows (any platform with Node.js)
- No Docker required for local development

**Production:**
- Vercel - Next.js app hosting
- Supabase - PostgreSQL database + authentication
- Automatic deployment on main branch push

---

*Stack analysis: 2026-01-11*
*Update after major dependency changes*
