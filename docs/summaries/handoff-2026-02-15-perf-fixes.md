# Handoff: Performance Fixes (Post-Security Hardening)

**Date**: 2026-02-15
**Session objective**: Diagnose and fix app slowdown caused by security hardening commit `23f60ac`
**Status**: Complete. All fixes committed and pushed to main.
**Commits**: `b555c68`, `c600857`

---

## Problem

After the security hardening session, the app became noticeably slow and the settings page would not load (infinite spinner).

## Root Cause Analysis

### CRITICAL: CSP blocking React hydration (commit `c600857`)

The security commit removed `'unsafe-inline'` from `script-src` in the CSP header (`next.config.ts`). Next.js uses inline `<script>` tags for hydration and RSC data streaming. Without `'unsafe-inline'`, the browser blocked those scripts silently. React never hydrated, so pages rendered as static HTML with spinners that never resolved.

- **Fix**: Restored `'unsafe-inline'` in `script-src`.
- **File**: `next.config.ts`
- **OPEN**: A nonce-based CSP is the proper long-term solution. This requires middleware-level nonce generation and passing nonces to Next.js `<Script>` components. Not done yet.

### CRITICAL: Double auth calls on every API request (commit `b555c68`)

The middleware matcher (`src/middleware.ts`) did not exclude `/api/` routes, so every API call went through middleware (which calls `supabase.auth.getUser()`) AND then the API route handler called `getAuthenticatedUser()` (another `supabase.auth.getUser()`). That's 2 auth network roundtrips per API call where only 1 is needed.

- **Fix**: Added `api/` to the middleware matcher's negative lookahead regex.
- **File**: `src/middleware.ts`
- **Security impact**: None. All API routes handle their own auth via `getAuthenticatedUser()`. The middleware auth check was redundant for API routes (middleware redirects to /login, which is wrong behavior for API calls anyway).

### MODERATE: Redundant Supabase client creation in auth helpers (commit `b555c68`)

`getAuthenticatedUserWithTier()` and `getAuthenticatedAdmin()` in `src/lib/auth/api-auth.ts` each called `getAuthenticatedUser()` (which creates client #1 + calls getUser()) then created client #2 for a profile query. Combined with the middleware issue, AI routes had 3 Supabase client instantiations + 3 network calls per request.

- **Fix**: Refactored both functions to create a single client and reuse it for auth + DB query.
- **File**: `src/lib/auth/api-auth.ts`

### MODERATE: Sequential DB queries in dashboard layout (commit `c600857`)

`src/app/(dashboard)/layout.tsx` ran 3 sequential `await` calls before rendering any content: `auth.getUser()`, profiles query, beta_invitations query. The profile and beta queries had no dependency on each other but ran sequentially.

- **Fix**: Parallelized profile and beta queries with `Promise.all()`.
- **File**: `src/app/(dashboard)/layout.tsx`

### MINOR: Dual-client pattern in settings API routes (commit `c600857`)

`/api/user/settings` and `/api/calendar/google/status` each created a Supabase client inside `getAuthenticatedUser()` then created a second client for DB queries. Refactored to use a single client. Also removed debug `console.log` statements from calendar status route.

- **Files**: `src/app/api/user/settings/route.ts`, `src/app/api/calendar/google/status/route.ts`

---

## Files Changed

| File | Change |
|------|--------|
| `next.config.ts` | Restored `'unsafe-inline'` in CSP `script-src` |
| `src/middleware.ts` | Excluded `/api/` routes from middleware matcher |
| `src/lib/auth/api-auth.ts` | Single-client pattern for `getAuthenticatedUserWithTier()` and `getAuthenticatedAdmin()` |
| `src/app/(dashboard)/layout.tsx` | Parallelized profile + beta queries via `Promise.all()` |
| `src/app/api/user/settings/route.ts` | Single-client auth + query, removed `getAuthenticatedUser` import |
| `src/app/api/calendar/google/status/route.ts` | Single-client auth + query, removed debug logs |

---

## Open Items

1. **OPEN**: Nonce-based CSP for `script-src` — the proper way to remove `'unsafe-inline'` without breaking Next.js. Requires middleware nonce generation. Not urgent but would improve XSS protection.
2. **OPEN**: ~96 other API routes still use the dual-client pattern (`getAuthenticatedUser()` + separate `createClient()`). Each creates 2 Supabase clients per request. Could be refactored for a modest perf gain, but not critical since the middleware exclusion already eliminated the biggest overhead.
3. **ASSUMED**: The `theme-init.js` external script (added in security commit to avoid `unsafe-inline`) is now redundant since we restored `'unsafe-inline'`. Could revert to inline script for slightly faster first paint. Left as-is since impact is minimal.

---

## Decisions

| Decision | Rationale |
|----------|-----------|
| Restore `'unsafe-inline'` instead of implementing nonce-based CSP | User needed the app working immediately. Nonce-based CSP is a larger change requiring middleware modifications. |
| Exclude all `/api/` routes from middleware | API routes handle their own auth and need 401 JSON responses, not login redirects. Zero security impact. |
| Parallelize layout queries instead of caching | `Promise.all()` is simple and correct. Caching profile data adds complexity and staleness concerns. |
