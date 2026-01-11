# Codebase Concerns

**Analysis Date:** 2026-01-11

## Tech Debt

**Hardcoded Demo User ID scattered across codebase:**
- Issue: DEMO_USER_ID replicated in 20+ API route files
- Files: `src/app/api/visions/route.ts:6`, `src/app/api/time-blocks/route.ts:5`, `src/app/api/ai/generate-power-goals/route.ts:6`, and many more
- Why: Rapid development with demo mode support
- Impact: Hard to disable demo mode consistently, duplicated code
- Fix approach: Centralize to `src/lib/auth/demo.ts` utility

**getUserId() function duplicated in every API route:**
- Issue: Same 5-line function copied to every route handler
- Files: All files in `src/app/api/`
- Why: No shared utility created during development
- Impact: Inconsistent implementations, maintenance burden
- Fix approach: Create `src/lib/auth/get-user-id.ts` shared helper

**Large files exceeding maintainability threshold:**
- Issue: Several files over 1000 lines
- Files:
  - `src/app/(dashboard)/time-audit/page.tsx` (1751 lines)
  - `src/components/features/time-audit/weekly-calendar-view.tsx` (1320 lines)
  - `src/app/(dashboard)/backtrack/[id]/page.tsx` (1272 lines)
  - `src/app/(dashboard)/guide/page.tsx` (1120 lines)
  - `src/lib/db/schema.ts` (1068 lines)
  - `src/app/(dashboard)/goals/[id]/page.tsx` (1054 lines)
- Why: Features grew organically without refactoring
- Impact: Hard to navigate, test, and maintain
- Fix approach: Extract components and utilities into smaller files

## Known Bugs

**Incomplete action status update:**
- Symptoms: TODO comments indicate unimplemented feature
- Trigger: Attempting to update action completion status
- Files: `src/app/(dashboard)/today/page.tsx:199`, `src/components/features/accountability/today-actions-widget.tsx:131`
- Workaround: None - feature incomplete
- Root cause: Implementation not finished
- Fix: Implement the API call to update action status

## Security Considerations

**Admin client bypasses RLS:**
- Risk: All API routes use admin client (service role key), bypassing Row Level Security
- Files: Every file in `src/app/api/` uses `createAdminClient()`
- Current mitigation: Manual user_id filtering in queries
- Recommendations: Implement proper RLS policies, use regular client for user-scoped queries

**Theme script uses dangerouslySetInnerHTML:**
- Risk: Potential XSS vector (though script is static)
- File: `src/app/layout.tsx:68-79`
- Current mitigation: Script is hardcoded, not user-generated
- Recommendations: Consider next-themes built-in solution or separate script file

**Insecure random ID generation:**
- Risk: Math.random() used for ID generation
- File: `src/app/api/visions/[id]/board/route.ts` - uses `Math.random().toString(36).substring(7)`
- Current mitigation: None
- Recommendations: Use crypto.randomUUID() for unpredictable IDs

**Google OAuth tokens in database:**
- Risk: Sensitive tokens stored in database
- File: `src/app/api/calendar/google/events/route.ts:136-145`
- Current mitigation: Supabase RLS and service role key protection
- Recommendations: Ensure SUPABASE_SERVICE_ROLE_KEY is properly secured

## Performance Bottlenecks

**Calendar data fetching:**
- Problem: Fetches 9 months of data (3 months back, 6 months forward)
- File: `src/app/(dashboard)/time-audit/page.tsx:98`
- Measurement: Not measured, but could be slow with large calendars
- Cause: No pagination or lazy loading
- Improvement path: Implement infinite scroll, fetch only visible weeks

**N+1 query pattern in time blocks:**
- Problem: Fetches time blocks, then separately fetches tag assignments
- File: `src/app/api/time-blocks/route.ts:56-66`
- Measurement: Not measured
- Cause: Separate queries for related data
- Improvement path: Use JOIN or batch fetch with proper includes

**localStorage for time blocks cache:**
- Problem: Stores entire events array without size limits
- File: `src/lib/hooks/use-google-calendar.ts:51-63`
- Measurement: Could exceed 5MB localStorage limit with large calendars
- Cause: No cache eviction policy
- Improvement path: Implement LRU cache with size limits

## Test Coverage Gaps

**No automated tests configured:**
- What's not tested: Entire codebase
- Risk: Regressions go unnoticed, especially in complex logic
- Priority: Critical
- Difficulty to test: Requires test framework setup first

**Critical untested areas:**
- AI generation endpoints (`src/app/api/ai/`) - JSON parsing could fail silently
- Stripe webhook handling (`src/app/api/stripe/webhook/route.ts`) - Payment flow
- Google Calendar OAuth (`src/app/api/calendar/google/`) - Token refresh logic
- Time block calculations (`src/lib/hooks/use-time-blocks.ts`) - Core feature

## Dependencies at Risk

**Extraneous npm packages:**
- Risk: Unused packages in node_modules
- Impact: Increased install time, potential security vulnerabilities
- Packages: @emnapi/core, @emnapi/runtime, @napi-rs/wasm-runtime, openai (replaced by anthropic)
- Migration plan: Run `npm prune` to clean up

**OpenAI package installed but unused:**
- Risk: Confusion, potential security updates needed for unused code
- File: `package.json` may still reference openai
- Impact: Minor - just extra dependency
- Migration plan: Remove openai package, using @anthropic-ai/sdk

## Missing Critical Features

**Test infrastructure:**
- Problem: No test framework configured
- Current workaround: Manual testing only
- Blocks: Confident refactoring, CI/CD automation
- Implementation complexity: Low (add Vitest + basic config)

**Structured logging:**
- Problem: Using console.log/error only
- Current workaround: Check Vercel logs manually
- Blocks: Production debugging, error tracking
- Implementation complexity: Medium (add pino or winston)

**Environment variable documentation:**
- Problem: `.env.example` is minimal
- Current workaround: Copy from existing .env.local
- Blocks: New developer onboarding
- Implementation complexity: Low (expand .env.example with descriptions)

## Fragile Areas

**Time audit page (`src/app/(dashboard)/time-audit/page.tsx`):**
- Why fragile: 1751 lines with complex state management
- Common failures: State sync issues between calendar views
- Safe modification: Extract smaller components first
- Test coverage: None

**AI response parsing:**
- Why fragile: JSON.parse on AI responses without validation
- Files: `src/app/api/ai/generate-power-goals/route.ts:122` and similar
- Common failures: Invalid JSON from AI causes 500 error
- Safe modification: Add Zod validation for AI responses
- Test coverage: None

**Google Calendar integration:**
- Why fragile: OAuth token refresh, external API dependency
- Files: `src/app/api/calendar/google/events/route.ts`
- Common failures: Token expiry, API rate limits
- Safe modification: Add proper error handling and retry logic
- Test coverage: None

---

*Concerns audit: 2026-01-11*
*Update as issues are fixed or new ones discovered*
