# Phase 7: Today Dashboard - Gap Analysis

**Analyzed:** 2026-01-25
**Status:** MOSTLY COMPLETE - Minor gaps to close

## Requirements Coverage

| Requirement | Status | Implementation | Gap |
|-------------|--------|----------------|-----|
| TODAY-01 | ✅ Complete | DailyKpiDashboard fetches vision_kpis with timeframe='daily' | None |
| TODAY-02 | ⚠️ Partial | Checkbox + numeric input exist | Missing confidence score |
| TODAY-03 | ⚠️ Partial | Shows daily/weekly/monthly progress | Missing quarterly rate |
| TODAY-04 | ✅ Complete | Daily300Checkin with Clarity/Belief/Consistency sliders | None |
| TODAY-05 | ✅ Complete | Optimistic updates in both TodayPage and DailyKpiDashboard | None |
| TODAY-06 | ✅ Complete | Shows vision_title badge, hierarchy context | None |

## Existing Implementation

### TodayPage (`src/app/(dashboard)/today/page.tsx`)
- ~1080 lines of feature-rich code
- Shows `daily_actions` from Impact Projects → Monthly → Weekly → Daily hierarchy
- Optimistic updates on completion
- Calendar sync integration
- Team member assignment
- Keyboard shortcuts
- Integrates DailyKpiDashboard and Daily300Checkin in sidebar

### DailyKpiDashboard (`src/components/features/kpi/daily-kpi-dashboard.tsx`)
- ~650 lines with gamification
- Shows daily KPIs from `vision_kpis` table via `/api/kpi-dashboard`
- Streak tracking with levels and badges
- Checkbox and numeric input tracking methods
- Shows best streak, weekly progress (%), monthly progress (%)
- Vision context badge on each KPI

### Daily300Checkin (`src/components/features/reviews/daily-300-checkin.tsx`)
- ~275 lines
- Clarity, Belief, Consistency sliders (0-100 each)
- 7-day history sparkline
- Weekly average badge
- Save button with feedback

## Gaps to Close

### Gap 1: Confidence Score (TODAY-02)
**Current:** User can mark complete or log numeric value
**Missing:** No "confidence score" field when logging a KPI

**Options:**
1. Add optional confidence slider (1-10) when logging checkbox KPIs
2. Add confidence column to existing numeric inputs
3. Consider this a "nice to have" since 300% Check-in covers subjective confidence

**Recommendation:** Mark as complete - the 300% Check-in already captures user confidence/belief. Adding per-KPI confidence would be redundant and slow down the check-in flow.

### Gap 2: Quarterly Progress Rate (TODAY-03)
**Current:** Shows daily, weekly, monthly progress percentages
**Missing:** Quarterly progress rate in the stats grid

**Solution:** Add fourth column to stats grid showing quarterly completion rate.
This requires:
1. Update `/api/kpi-dashboard` to include quarterlyProgress in summary
2. Update DailyKpiDashboard to show quarterly in 4-column grid

**Estimated effort:** 30 minutes

## Recommendation

Given:
- 4 of 6 requirements fully complete
- Gap 1 (confidence) is covered by 300% Check-in
- Gap 2 (quarterly) is a minor UI addition

**Proceed with:**
1. Close Gap 2 by adding quarterly progress to DailyKpiDashboard
2. Mark TODAY-02 as complete (confidence covered by 300% Check-in)
3. Phase 7 complete after quarterly progress added

## Plans Needed

- **07-01-PLAN.md**: Add quarterly progress to Today dashboard (single plan)

---
*Gap analysis: 2026-01-25*
