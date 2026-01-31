# UAT Issues: Phase 10 Plan 01

**Tested:** 2026-01-29
**Source:** .planning/phases/10-streaks-daily-goals/10-01-SUMMARY.md
**Tester:** User via /gsd:verify-work

## Open Issues

[None]

## Resolved Issues

### UAT-001: MinForm crashes with empty string Select value ✅

**Discovered:** 2026-01-29
**Resolved:** 2026-01-31
**Phase/Plan:** 10-01
**Severity:** Blocker
**Feature:** Create MIN form
**Description:** When opening the MinForm to create a new MIN, the page crashes with "A `<Select.Item />` must have a value prop that is not an empty string."
**Expected:** Form opens without errors and allows creating a MIN
**Actual:** Runtime error crashes the page
**Repro:**
1. Go to /mins
2. Click to add a new MIN
3. Form crashes immediately

**Root Cause:** Lines 282 and 307 in `src/components/features/mins/min-form.tsx` use `value=""` for the "Not categorized" and "No linked impact project" options. Radix Select component doesn't allow empty string values.

**Fix Applied:** Changed `value=""` to `value="__none__"` sentinel value and updated the `onValueChange` handlers to transform `__none__` back to empty string or null as appropriate.

---

*Phase: 10-streaks-daily-goals*
*Plan: 01*
*Tested: 2026-01-29*
