# External Integrations

**Analysis Date:** 2026-01-11

## APIs & External Services

**AI/LLM Services:**
- Anthropic Claude API - AI-powered goal/KPI generation
  - SDK/Client: @anthropic-ai/sdk 0.71.2 - `src/app/api/ai/*`
  - Models: claude-3-5-sonnet, claude-3-haiku, claude-opus-4-20250514
  - Auth: ANTHROPIC_API_KEY env var
  - Endpoints: generate-smart, generate-power-goals, generate-kpis, generate-targets, suggest-vision, suggest-tags, generate-affirmation
  - Usage tracking: `src/lib/utils/ai-usage.ts` (logs token usage to database)

**Payment Processing:**
- Stripe - Subscription billing and one-time payments
  - SDK/Client: stripe 14.25.0, @stripe/stripe-js 8.6.0 - `src/lib/stripe/`
  - Auth: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET env vars
  - Endpoints: `src/app/api/stripe/create-checkout/route.ts`, `create-portal/route.ts`, `webhook/route.ts`
  - Subscription tiers: Free, Pro, Premium (monthly/yearly) - `src/lib/stripe/config.ts`
  - Price IDs: STRIPE_PRO_MONTHLY_PRICE_ID, STRIPE_PRO_YEARLY_PRICE_ID, STRIPE_PREMIUM_*

## Data Storage

**Databases:**
- PostgreSQL on Supabase - Primary data store
  - Connection: DATABASE_URL env var
  - Client: Drizzle ORM 0.45.1 - `src/lib/db/schema.ts`
  - Migrations: drizzle-kit 0.31.8 (migrations in `drizzle/` directory)

**Supabase Clients:**
- Browser client (anon key, RLS enforced) - `src/lib/supabase/client.ts`
- Server client (async operations) - `src/lib/supabase/server.ts`
- Admin client (service role key, RLS bypassed) - `src/lib/supabase/admin.ts`

**File Storage:**
- Not currently implemented

**Caching:**
- React Query client-side caching - 1-minute stale time - `src/components/providers.tsx`
- localStorage for time blocks and calendar events - `src/lib/hooks/use-local-storage.ts`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Email/password + OAuth
  - Implementation: @supabase/ssr with server-side session management
  - Token storage: httpOnly cookies via @supabase/ssr
  - Session middleware: `src/lib/supabase/middleware.ts`, `src/middleware.ts`
  - Demo mode: DEMO_USER_ID fallback for development

**OAuth Integrations:**
- Google OAuth - Google Calendar access (not sign-in)
  - Credentials: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
  - Scopes: calendar, calendar.events

## Monitoring & Observability

**Error Tracking:**
- None configured (console.error only)

**Analytics:**
- None configured

**Logs:**
- Vercel logs - stdout/stderr only

**AI Usage Tracking:**
- Custom implementation - `src/lib/utils/ai-usage.ts`
- Logs to ai_usage_logs table in database
- Admin view: `src/app/api/admin/ai-usage/route.ts`

## CI/CD & Deployment

**Hosting:**
- Vercel - Next.js app hosting
  - Deployment: Automatic on main branch push
  - Environment vars: Configured in Vercel dashboard

**CI Pipeline:**
- Not configured (no GitHub Actions workflows)

## Environment Configuration

**Development:**
- Required env vars:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - DATABASE_URL
  - ANTHROPIC_API_KEY
- Optional: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, STRIPE_* vars
- Secrets location: .env.local (gitignored)
- Demo mode: NEXT_PUBLIC_DEMO_MODE=true for development

**Production:**
- Secrets management: Vercel environment variables
- Database: Supabase production project

## Webhooks & Callbacks

**Incoming:**
- Stripe webhooks - `/api/stripe/webhook`
  - Verification: stripe.webhooks.constructEvent with STRIPE_WEBHOOK_SECRET
  - Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted

- Google Calendar webhooks - `/api/calendar/webhook`
  - Calendar sync notifications

**Outgoing:**
- None

## Calendar Integration

**Google Calendar:**
- OAuth flow - `src/app/api/calendar/google/route.ts`, `callback/route.ts`
- Events API - `src/app/api/calendar/google/events/route.ts`
- Sync operations - `src/app/api/calendar/sync/route.ts`, `sync-actions/route.ts`
- Status check - `src/app/api/calendar/google/status/route.ts`
- OAuth Scopes: https://www.googleapis.com/auth/calendar, https://www.googleapis.com/auth/calendar.events
- Token storage: Database (oauth_tokens table via Supabase)

---

*Integration audit: 2026-01-11*
*Update when adding/removing external services*
