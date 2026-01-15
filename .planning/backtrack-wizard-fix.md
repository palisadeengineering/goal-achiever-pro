# Backtrack Planning Wizard - Fix Plan

## Status: ✅ FULLY COMPLETE (January 15, 2026)

All issues with the Backtrack Planning Wizard have been resolved and tested end-to-end.

---

## Issue 1: JSON Parsing Error (Resolved January 14, 2026)

**Problem**: The Backtrack Planning Wizard showed "Failed to parse AI response" error when clicking "Generate Backtrack Plan".

**Root Cause**:
- AI generated massive JSON responses (25,000+ characters)
- JSON parsing failed due to truncated responses (max_tokens limit hit)
- Malformed JSON from AI (trailing commas, unclosed brackets)

**Solution Applied**:

Changes made to `src/app/api/ai/generate-backtrack/route.ts`:

| Parameter | Before | After |
|-----------|--------|-------|
| `max_tokens` | 8000 | 4000 |
| Daily actions limit | 25 | 15 |
| Weekly targets limit | 8 | 4 |
| Monthly targets limit | 6 | 4 |

Also added:
- Comprehensive `debug` object in API responses
- JSON repair logic for truncated responses
- Detailed logging for debugging

**Result**: Plan generates successfully with 4 quarterly targets, 12 power goals, 4 monthly targets, 4 weekly targets, and 15 daily actions.

---

## Issue 2: Calendar Sync 401 Error (Resolved January 15, 2026)

**Problem**: After saving a backtrack plan, Google Calendar sync failed with 401 "Not connected to Google Calendar" even though the UI showed "Google Calendar connected".

**Root Cause**:
- Status endpoint (`/api/calendar/google/status`) checked `user_integrations` database table
- Sync endpoint (`/api/calendar/sync-backtrack-plan`) checked for `google_calendar_tokens` cookie
- Inconsistent token storage locations caused mismatch

**Solution Applied**:

Changes made to `src/app/api/calendar/sync-backtrack-plan/route.ts`:

1. Added `getTokensFromDatabase()` function to read tokens from `user_integrations` table
2. Try database tokens first, fall back to cookies for compatibility
3. Auto-refresh expired tokens and update database
4. Added demo mode support to match status endpoint behavior

**Commit**: `fafa7a9 Fix calendar sync for backtrack plans to read tokens from database`

**Result**: All 15 daily actions synced successfully to Google Calendar with `[GAP]` prefix.

---

## Verification Testing (January 15, 2026)

Full end-to-end test completed:

1. ✅ Opened Backtrack Planning Wizard from vision page
2. ✅ Set time parameters (20 hrs/week, 52 weeks)
3. ✅ Generated plan via AI (no JSON parsing errors)
4. ✅ Reviewed generated plan (4 quarterly, 12 power goals, 4 monthly, 4 weekly, 15 daily)
5. ✅ Saved plan to database
6. ✅ Synced 15 daily actions to Google Calendar
7. ✅ Verified events appear in Google Calendar with `[GAP]` prefix

---

## Files Modified

| File | Changes |
|------|---------|
| `src/app/api/ai/generate-backtrack/route.ts` | Reduced complexity, added debug info, JSON repair |
| `src/app/api/calendar/sync-backtrack-plan/route.ts` | Read tokens from database, demo mode support |

---

## Archive: Previous Investigation Notes

<details>
<summary>Click to expand investigation notes</summary>

### Attempted Fixes (before final solution)
1. Reduced daily actions from 50 to 25
2. Added JSON repair logic for truncated responses
3. Added detailed logging
4. Made prompt stricter about JSON-only output

### Alternative Approaches Considered (not needed)
- Streaming responses
- Split into multiple API calls
- Frontend timeout adjustments

### Related Context
- Vision ID tested: `67068c1e-bdef-47f5-a881-8d7fd909d0db`
- Vision: "Build a $1M structural engineering firm..."

</details>
