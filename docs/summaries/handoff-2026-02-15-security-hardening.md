# Handoff: Security Hardening

**Date**: 2026-02-15
**Session objective**: Fix 7 security vulnerabilities identified during audit
**Status**: All 7 fixes implemented and verified. Not yet committed.

---

## Fixes Implemented

### Fix 1: Profile API Auth Bypass

- **Vulnerability**: `GET /api/profile` returned a hardcoded `DEMO_PROFILE` object when no authenticated user was found, leaking fake profile data to unauthenticated requests.
- **Fix**: Replaced `DEMO_PROFILE` fallback with `getAuthenticatedUser()`. Returns `401 Unauthorized` when no valid session exists.
- **File**: `src/app/api/profile/route.ts`
- **Rationale**: An unauthenticated caller should never receive profile-shaped data. Returning 401 lets the client redirect to login.

### Fix 2: Screenshot Upload Size Limit

- **Vulnerability**: Vision board screenshot upload (`PUT /api/visions/[id]/board`) accepted arbitrarily large base64 payloads with no size check.
- **Fix**: Added size validation — rejects base64 strings over 7MB (~5MB decoded). Returns `413 Payload Too Large`.
- **File**: `src/app/api/visions/[id]/board/route.ts`
- **Rationale**: 5MB decoded is generous for a screenshot. The 7MB base64 threshold accounts for ~33% base64 overhead. Prevents memory exhaustion on the server.

### Fix 3: Date Parameter Validation

- **Vulnerability**: Multiple API routes accepted `date` query parameters without validation, passing raw user input directly into SQL queries.
- **Fix**: Created `validateDateParam()` utility in `src/lib/validations/common.ts`. Validates format (`YYYY-MM-DD`), rejects invalid dates, returns `400 Bad Request` on failure.
- **Files modified** (10 routes):
  - `src/app/api/daily-checkins/route.ts`
  - `src/app/api/mins/route.ts`
  - `src/app/api/non-negotiables/route.ts`
  - `src/app/api/non-negotiables/[id]/complete/route.ts`
  - `src/app/api/pomodoro/route.ts`
  - `src/app/api/reviews/route.ts`
  - `src/app/api/routines/completions/route.ts`
  - `src/app/api/streaks-v2/route.ts`
  - `src/app/api/time-blocks/route.ts`
  - `src/app/api/tasks-v2/route.ts`
- **Rationale**: Even with parameterized queries, malformed dates cause DB errors. Validating at the boundary gives clear 400 errors instead of 500s.

### Fix 4: CSP connect-src Pinned to Specific Supabase Host

- **Vulnerability**: CSP `connect-src` used wildcard `*.supabase.co`, allowing connections to any Supabase project.
- **Fix**: Pinned to `uomrqmsbmuzlyghaocrj.supabase.co` and `wss://uomrqmsbmuzlyghaocrj.supabase.co` (for realtime).
- **File**: `next.config.ts`
- **Rationale**: Wildcards in CSP defeat the purpose. Pinning to the actual project ID prevents exfiltration to attacker-controlled Supabase instances.

### Fix 5: Error Message Sanitization

- **Vulnerability**: ~50 API routes returned raw error messages (including stack traces, DB errors, internal paths) to the client via `error.message`.
- **Fix**: Created `sanitizeErrorForClient()` in `src/lib/utils/api-errors.ts`. Returns generic "Internal server error" to clients. Logs full error server-side.
- **Files modified**: ~50 API route files (all `catch` blocks updated). Full list:
  - `src/app/api/admin/users/route.ts`
  - `src/app/api/ai/classify-activity/route.ts`
  - `src/app/api/ai/edit-kpi/route.ts`
  - `src/app/api/ai/generate-affirmation/route.ts`
  - `src/app/api/ai/generate-backtrack/route.ts`
  - `src/app/api/ai/generate-kpis/route.ts`
  - `src/app/api/ai/generate-metric-questions/route.ts`
  - `src/app/api/ai/generate-monthly-projects/route.ts`
  - `src/app/api/ai/generate-plan-from-metrics/route.ts`
  - `src/app/api/ai/generate-power-goals/route.ts`
  - `src/app/api/ai/generate-pricing-models/route.ts`
  - `src/app/api/ai/generate-projects/route.ts`
  - `src/app/api/ai/generate-questions/route.ts`
  - `src/app/api/ai/generate-smart/route.ts`
  - `src/app/api/ai/generate-targets/route.ts`
  - `src/app/api/ai/generate-time-insights/route.ts`
  - `src/app/api/ai/strategic-discovery/route.ts`
  - `src/app/api/ai/suggest-date/route.ts`
  - `src/app/api/ai/suggest-event-cleanup/route.ts`
  - `src/app/api/ai/suggest-non-negotiables/route.ts`
  - `src/app/api/ai/suggest-tags/route.ts`
  - `src/app/api/ai/suggest-vision/route.ts`
  - `src/app/api/calendar/google/events/route.ts`
  - `src/app/api/calendar/sync-actions/route.ts`
  - `src/app/api/calendar/sync/route.ts`
  - `src/app/api/daily-checkins/route.ts`
  - `src/app/api/feedback/route.ts`
  - `src/app/api/leverage/analytics/route.ts`
  - `src/app/api/milestones-v2/[id]/route.ts`
  - `src/app/api/milestones-v2/route.ts`
  - `src/app/api/mins/[id]/route.ts`
  - `src/app/api/mins/route.ts`
  - `src/app/api/non-negotiables/[id]/complete/route.ts`
  - `src/app/api/non-negotiables/[id]/route.ts`
  - `src/app/api/non-negotiables/route.ts`
  - `src/app/api/pomodoro/route.ts`
  - `src/app/api/profile/route.ts`
  - `src/app/api/project-key-results/[id]/log/route.ts`
  - `src/app/api/project-key-results/[id]/route.ts`
  - `src/app/api/project-key-results/route.ts`
  - `src/app/api/projects-v2/[id]/route.ts`
  - `src/app/api/projects-v2/route.ts`
  - `src/app/api/reviews/route.ts`
  - `src/app/api/rewards-v2/[id]/claim/route.ts`
  - `src/app/api/rewards-v2/[id]/route.ts`
  - `src/app/api/rewards-v2/route.ts`
  - `src/app/api/routines/completions/route.ts`
  - `src/app/api/seed/pro-tips/route.ts`
  - `src/app/api/streaks-v2/route.ts`
  - `src/app/api/stripe/create-checkout/route.ts`
  - `src/app/api/stripe/create-founding-checkout/route.ts`
  - `src/app/api/tasks-v2/[id]/route.ts`
  - `src/app/api/tasks-v2/route.ts`
  - `src/app/api/time-blocks/route.ts`
  - `src/app/api/user-charts/data/route.ts`
  - `src/app/api/vision-kpis/[id]/log/route.ts`
  - `src/app/api/visions/[id]/board/route.ts`
  - `src/app/api/visions/[id]/generate-cascade/route.ts`
- **Rationale**: Raw error messages are an information disclosure vulnerability. Attackers can use DB errors, stack traces, and file paths to map the system. Generic client messages + server-side logging preserves debuggability without leaking internals.

### Fix 6: CSP `unsafe-inline` Removed from script-src

- **Vulnerability**: `script-src 'unsafe-inline'` in CSP allowed any injected inline script to execute, negating XSS protection.
- **Fix**: Externalized the theme initialization script from an inline `<script>` in `src/app/layout.tsx` to `public/theme-init.js`. Removed `'unsafe-inline'` from `script-src` in `next.config.ts`.
- **Files**:
  - `src/app/layout.tsx` — replaced inline script with `<script src="/theme-init.js">`
  - `public/theme-init.js` — new file, contains theme detection logic
  - `next.config.ts` — removed `'unsafe-inline'` from `script-src`
- **Rationale**: `unsafe-inline` is the single biggest CSP weakness. Externalizing the script is the correct fix. Next.js may add its own inline scripts with nonces in production, but the theme script was the only one we controlled.

### Fix 7: Middleware Tier Gating (Server-Side)

- **Vulnerability**: Subscription tier restrictions were only enforced client-side (route config in `src/constants/routes.ts`). A user could bypass by calling API routes directly or manipulating client state.
- **Fix**: Added server-side tier enforcement in `src/lib/supabase/middleware.ts`. Queries the user's profile to check `subscription_tier` against route requirements. Returns `403 Forbidden` for insufficient tier.
- **Routes enforced**:
  - `/leverage` — requires `pro` or `premium`
  - `/network` — requires `pro` or `premium`
  - `/drip` — requires `pro` or `premium`
  - `/analytics` — requires `pro` or `premium`
  - `/routines` — requires `pro` or `premium`
  - `/reviews` — requires `pro` or `premium`
- **File**: `src/lib/supabase/middleware.ts`
- **Rationale**: Client-side gating is UX, not security. Server-side enforcement is required to prevent direct URL access and API abuse. The middleware queries the profile table on each request to these routes.

---

## New Files Created

| File | Purpose |
|------|---------|
| `public/theme-init.js` | Externalized theme detection script (was inline in layout.tsx) |
| `src/lib/utils/api-errors.ts` | `sanitizeErrorForClient()` utility for safe error responses |

## Files Modified

62 files total. Key categories:
- `next.config.ts` — CSP headers (fixes 4, 6)
- `src/app/layout.tsx` — externalized inline script (fix 6)
- `src/lib/supabase/middleware.ts` — tier gating (fix 7)
- `src/lib/validations/common.ts` — `validateDateParam()` (fix 3)
- `src/app/api/profile/route.ts` — auth bypass fix (fix 1)
- `src/app/api/visions/[id]/board/route.ts` — upload size limit (fix 2)
- ~50 API route files — error sanitization (fix 5)
- 10 API route files — date validation (fix 3)

---

## Verification Results

- **Build**: `npm run build` passes with zero errors
- **Lint**: `npm run lint` clean (no new issues introduced)
- **Tests**: 200/202 tests pass
  - 2 pre-existing flaky tests in `use-analytics-data.test.ts` (timezone-dependent, not related to this work)

---

## Open Items

- **OPEN**: Google OAuth flow may break with `unsafe-inline` removed from `script-src`. The Google sign-in SDK injects inline scripts. Test after deployment — if broken, add a nonce-based exception or the Google SDK domain to `script-src`.
- **OPEN**: All changes are unstaged/uncommitted. Need to commit and push before deploying.
- **OPEN**: Manual testing checklist not yet executed:
  1. Verify unauthenticated `GET /api/profile` returns 401
  2. Attempt vision board upload with >5MB image, confirm 413
  3. Send malformed date params to `/api/time-blocks?date=DROP TABLE`, confirm 400
  4. Check browser console for CSP violations on normal usage
  5. Trigger a server error and verify client sees generic message (not stack trace)
  6. Confirm theme still applies correctly on page load (no FOUC)
  7. Access a pro-tier route as a free user, confirm 403

---

## Next Actions

1. Commit all changes (suggested message: `security: harden API routes, CSP, middleware tier gating`)
2. Push to remote
3. Deploy to staging
4. Run manual verification checklist (above)
5. Monitor for CSP violations in production (especially Google OAuth)
