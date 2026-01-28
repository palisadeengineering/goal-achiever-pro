# Issues Log

Deferred issues and enhancements discovered during development.

## Active Issues

### ISS-001: Backtrack Plan metrics not connected to KPIs tab

**Discovered**: Phase 8.1, Task 4 (2026-01-28)
**Severity**: Medium (UX confusion, not crash)
**Status**: Deferred to future phase

**Description**:
When a user creates a Vision with a Backtrack Plan, the quarterly targets contain `keyMetric` and `targetValue` fields (e.g., "Monthly Recurring Revenue: 0/8000"). However, the KPIs tab shows "No KPIs Yet" because it reads from a different data source.

**Root Cause**:
- Backtrack Plan stores data in `quarterly_targets` table
- KPIs tab reads from `vision_kpis` table (populated by generate-cascade API)
- These are separate systems with no automatic connection

**Current Workaround**:
Users must manually click "Generate KPI Cascade" after creating a backtrack plan to populate the KPIs tab.

**Proposed Solutions**:
1. Auto-trigger generate-cascade after backtrack plan creation
2. Add prominent UI guidance to run generate-cascade
3. Modify generate-cascade to read backtrack plan metrics as source data
4. Unify the two systems (significant refactor)

**Recommended Phase**: Consider for Phase 10+ when enhancing KPI/tracking features

---

## Resolved Issues

(none yet)

---
*Last updated: 2026-01-28*
