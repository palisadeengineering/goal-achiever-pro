/**
 * Data Migration: Link existing KPIs hierarchically and initialize progress cache
 *
 * Run with: npx tsx scripts/migrate-kpi-hierarchy.ts
 *
 * This script:
 * 1. Links existing KPIs to parents based on level hierarchy
 * 2. Initializes progress cache entries for all existing KPIs
 * 3. Updates child counts in the cache
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { visionKpis, kpiProgressCache } from '../src/lib/db/schema';
import { eq, isNull, sql } from 'drizzle-orm';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create database connection
const client = postgres(connectionString);
const db = drizzle(client);

async function migrateKpiHierarchy() {
  console.log('Starting KPI hierarchy migration...');

  // Step 1: Get all KPIs grouped by vision
  const allKpis = await db.select().from(visionKpis).orderBy(visionKpis.visionId, visionKpis.level);

  console.log(`Found ${allKpis.length} KPIs to process`);

  if (allKpis.length === 0) {
    console.log('No KPIs found. Nothing to migrate.');
    return;
  }

  // Group by vision
  const kpisByVision = new Map<string, typeof allKpis>();
  for (const kpi of allKpis) {
    const visionId = kpi.visionId;
    if (!kpisByVision.has(visionId)) {
      kpisByVision.set(visionId, []);
    }
    kpisByVision.get(visionId)!.push(kpi);
  }

  // Step 2: Link KPIs within each vision based on level hierarchy
  // Level order: quarterly (Q1-Q4) -> monthly (within quarter) -> weekly (within month) -> daily (within week)
  let linksCreated = 0;

  for (const [visionId, visionKpiList] of kpisByVision) {
    console.log(`Processing vision ${visionId} with ${visionKpiList.length} KPIs`);

    // Separate by level
    const quarterly = visionKpiList.filter(k => k.level === 'quarterly');
    const monthly = visionKpiList.filter(k => k.level === 'monthly');
    const weekly = visionKpiList.filter(k => k.level === 'weekly');
    const daily = visionKpiList.filter(k => k.level === 'daily');

    // Link monthly to quarterly (by month -> quarter mapping)
    for (const monthlyKpi of monthly) {
      if (monthlyKpi.parentKpiId) continue; // Already linked

      const month = monthlyKpi.month;
      if (!month) continue;

      // Determine quarter from month (1-3 = Q1, 4-6 = Q2, 7-9 = Q3, 10-12 = Q4)
      const quarter = Math.ceil(month / 3);
      const parentQuarterly = quarterly.find(q => q.quarter === quarter);

      if (parentQuarterly) {
        await db.update(visionKpis)
          .set({ parentKpiId: parentQuarterly.id })
          .where(eq(visionKpis.id, monthlyKpi.id));
        linksCreated++;
      }
    }

    // Link weekly to monthly (by proximity - match to first monthly in same vision)
    // Note: Weekly KPIs may not have month field, link to most recent monthly
    for (const weeklyKpi of weekly) {
      if (weeklyKpi.parentKpiId) continue;

      // Find a monthly parent (simplified: first monthly in same vision)
      // In production, would use date-based matching
      const parentMonthly = monthly[0];
      if (parentMonthly) {
        await db.update(visionKpis)
          .set({ parentKpiId: parentMonthly.id })
          .where(eq(visionKpis.id, weeklyKpi.id));
        linksCreated++;
      }
    }

    // Link daily to weekly
    for (const dailyKpi of daily) {
      if (dailyKpi.parentKpiId) continue;

      const parentWeekly = weekly[0];
      if (parentWeekly) {
        await db.update(visionKpis)
          .set({ parentKpiId: parentWeekly.id })
          .where(eq(visionKpis.id, dailyKpi.id));
        linksCreated++;
      }
    }
  }

  console.log(`Created ${linksCreated} parent-child links`);

  // Step 3: Initialize progress cache for all KPIs
  console.log('Initializing progress cache entries...');

  const kpisWithoutCache = await db.select({ id: visionKpis.id, numericTarget: visionKpis.numericTarget })
    .from(visionKpis)
    .leftJoin(kpiProgressCache, eq(visionKpis.id, kpiProgressCache.kpiId))
    .where(isNull(kpiProgressCache.id));

  console.log(`Found ${kpisWithoutCache.length} KPIs without cache entries`);

  let cacheEntriesCreated = 0;
  for (const kpi of kpisWithoutCache) {
    try {
      await db.insert(kpiProgressCache).values({
        kpiId: kpi.id,
        targetValue: kpi.numericTarget?.toString() || null,
        currentValue: '0',
        progressPercentage: '0',
        childCount: 0,
        completedChildCount: 0,
        status: 'not_started',
      }).onConflictDoNothing();
      cacheEntriesCreated++;
    } catch (err) {
      console.warn(`Failed to create cache entry for KPI ${kpi.id}:`, err);
    }
  }

  console.log(`Created ${cacheEntriesCreated} cache entries`);

  // Step 4: Update child counts in cache
  console.log('Updating child counts...');

  await db.execute(sql`
    UPDATE kpi_progress_cache
    SET child_count = (
      SELECT COUNT(*) FROM vision_kpis
      WHERE vision_kpis.parent_kpi_id = kpi_progress_cache.kpi_id
    ),
    updated_at = NOW()
  `);

  console.log('Migration complete!');

  // Summary
  const totalCacheEntries = await db.select({ count: sql<number>`COUNT(*)::int` }).from(kpiProgressCache);
  const linkedKpis = await db.select({ count: sql<number>`COUNT(*)::int` })
    .from(visionKpis)
    .where(sql`parent_kpi_id IS NOT NULL`);

  console.log(`\nSummary:`);
  console.log(`- Total KPIs: ${allKpis.length}`);
  console.log(`- KPIs with parents: ${linkedKpis[0]?.count || 0}`);
  console.log(`- Cache entries: ${totalCacheEntries[0]?.count || 0}`);
}

migrateKpiHierarchy()
  .then(async () => {
    console.log('\nMigration completed successfully!');
    await client.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Migration failed:', err);
    await client.end();
    process.exit(1);
  });
