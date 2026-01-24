# Phase 1 Plan 1: Add Parent KPI FK Constraint Summary

**One-liner:** Self-referential FK on vision_kpis.parent_kpi_id with SET NULL cascade, btree index for hierarchy queries

## Metadata

| Field | Value |
|-------|-------|
| Phase | 01-schema-foundation |
| Plan | 01 |
| Status | Partial - Database Application Pending |
| Duration | 26 minutes |
| Completed | 2026-01-23 |

## Objective

Add proper foreign key constraint and index to the existing parent_kpi_id column in vision_kpis table, enabling database-enforced referential integrity for KPI hierarchy relationships.

## Tasks Completed

### Task 1: Update schema.ts with FK reference and generate migration

**Status:** Complete
**Commit:** 78136f5

**Changes:**
- Updated `parentKpiId` column definition to include self-referential FK:
  ```typescript
  parentKpiId: uuid('parent_kpi_id').references((): ReturnType<typeof uuid> => visionKpis.id, { onDelete: 'set null' }),
  ```
- Added btree index in table definition:
  ```typescript
  parentKpiIdx: index('vision_kpis_parent_kpi_idx').on(table.parentKpiId),
  ```
- Created migration file: `drizzle/migrations/0001_add_parent_kpi_fk.sql`

**Files Modified:**
- `src/lib/db/schema.ts` (lines 943, 963)
- `drizzle/migrations/0001_add_parent_kpi_fk.sql` (created)

### Task 2: Apply migration and validate constraint

**Status:** Blocked - Database Connectivity Issue
**Reason:** drizzle-kit push command times out during schema introspection phase

The remote Supabase database is either:
1. Hibernated (free tier auto-pause)
2. Experiencing connectivity issues
3. Under heavy load causing timeout

**Migration Ready:** Yes - the SQL migration file is complete and ready to apply manually or when database is available.

## Migration SQL

```sql
-- Add FK constraint with NOT VALID first (non-blocking for existing data)
ALTER TABLE "vision_kpis"
ADD CONSTRAINT "vision_kpis_parent_kpi_id_fkey"
FOREIGN KEY ("parent_kpi_id")
REFERENCES "vision_kpis"("id")
ON DELETE SET NULL
NOT VALID;

-- Validate constraint in separate step
ALTER TABLE "vision_kpis" VALIDATE CONSTRAINT "vision_kpis_parent_kpi_id_fkey";

-- Add btree index for efficient hierarchy queries
CREATE INDEX IF NOT EXISTS "vision_kpis_parent_kpi_idx" ON "vision_kpis" USING btree ("parent_kpi_id");
```

## Artifacts Created

| Artifact | Path | Status |
|----------|------|--------|
| Schema update | `src/lib/db/schema.ts` | Committed |
| Migration SQL | `drizzle/migrations/0001_add_parent_kpi_fk.sql` | Committed |

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| onDelete: SET NULL | Deleting parent KPI promotes children to root level rather than cascading deletion |
| NOT VALID first | Non-blocking constraint addition for existing data, separate validation step |
| btree index | Standard index type for equality/range queries on UUID column |

## Verification Checklist

- [x] Schema.ts has `.references()` call on parentKpiId
- [x] Schema.ts has parentKpiIdx index defined
- [x] Migration file contains FOREIGN KEY constraint
- [x] Migration file contains CREATE INDEX statement
- [ ] FK constraint exists in database (pending application)
- [ ] Index exists in database (pending application)
- [ ] FK enforcement verified (pending application)

## Next Steps

When database is accessible:

1. Run `npx drizzle-kit push` or apply migration manually via Supabase SQL Editor
2. Verify constraint: `SELECT conname FROM pg_constraint WHERE conrelid = 'vision_kpis'::regclass;`
3. Verify index: `SELECT indexname FROM pg_indexes WHERE tablename = 'vision_kpis';`
4. Test enforcement: Attempt insert with invalid parent_kpi_id

## Deviations from Plan

### Database Connectivity Issue

**Type:** Blocking - External Dependency
**Found during:** Task 2
**Issue:** drizzle-kit push times out during schema introspection (>5 minutes on "Pulling schema from database")
**Impact:** Cannot apply migration or verify database-level constraints
**Resolution:** Migration file is ready; application deferred until database is accessible

## Dependencies Provided

- **Schema:** visionKpis.parentKpiId now has explicit FK definition for ORM-level type safety
- **Migration:** Ready-to-apply SQL for database-level enforcement
- **Foundation:** Required for Phase 2+ cascade features that depend on FK-enforced hierarchy
