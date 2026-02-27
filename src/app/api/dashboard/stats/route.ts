import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

type Period = 'week' | '2weeks' | 'month' | '3months';

const VALID_PERIODS: Period[] = ['week', '2weeks', 'month', '3months'];

/**
 * Calculate start/end dates for a period ending today,
 * and the equivalent previous period for trend comparison.
 */
function getDateRanges(period: Period) {
  const now = new Date();
  // Normalize to start of today (UTC)
  const todayEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  let daysBack: number;
  switch (period) {
    case 'week':
      daysBack = 7;
      break;
    case '2weeks':
      daysBack = 14;
      break;
    case 'month':
      daysBack = 30;
      break;
    case '3months':
      daysBack = 90;
      break;
  }

  const currentStart = new Date(todayEnd);
  currentStart.setUTCDate(currentStart.getUTCDate() - daysBack + 1);

  const previousEnd = new Date(currentStart);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);

  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - daysBack + 1);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  return {
    current: { start: fmt(currentStart), end: fmt(todayEnd) },
    previous: { start: fmt(previousStart), end: fmt(previousEnd) },
  };
}

/**
 * Sum duration_minutes grouped by drip_quadrant from time block rows.
 */
function sumByQuadrant(blocks: Array<{ drip_quadrant: string | null; duration_minutes: number | null }>) {
  const totals = { production: 0, investment: 0, replacement: 0, delegation: 0 };
  for (const b of blocks) {
    const mins = b.duration_minutes ?? 0;
    const q = (b.drip_quadrant ?? '').toLowerCase();
    if (q === 'production') totals.production += mins;
    else if (q === 'investment') totals.investment += mins;
    else if (q === 'replacement') totals.replacement += mins;
    else if (q === 'delegation') totals.delegation += mins;
  }
  return totals;
}

function minutesToHours(mins: number): number {
  return Math.round((mins / 60) * 100) / 100;
}

/**
 * Calculate % change between previous and current values.
 * Returns 0 if previous is 0 to avoid division by zero.
 */
function pctChange(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Get the Monday-based start of each week for the last 5 weeks.
 * Returns [{ start, end }, ...] from oldest to newest.
 */
function getLast5WeekRanges() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  // Find the most recent Monday (or today if it's Monday)
  const dayOfWeek = today.getUTCDay(); // 0=Sun, 1=Mon, ...
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const currentMonday = new Date(today);
  currentMonday.setUTCDate(currentMonday.getUTCDate() - daysToMonday);

  const ranges: Array<{ start: string; end: string }> = [];
  for (let i = 4; i >= 0; i--) {
    const weekStart = new Date(currentMonday);
    weekStart.setUTCDate(weekStart.getUTCDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    ranges.push({
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
    });
  }
  return ranges;
}

// GET: Dashboard stats for a given period
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Parse and validate period query param
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period') || 'week';
    const period: Period = VALID_PERIODS.includes(periodParam as Period)
      ? (periodParam as Period)
      : 'week';

    const { current, previous } = getDateRanges(period);

    // ---- Parallel queries ----

    // 1. Current period time blocks
    const currentBlocksPromise = supabase
      .from('time_blocks')
      .select('id, activity_name, notes, drip_quadrant, duration_minutes, energy_rating')
      .eq('user_id', userId)
      .gte('block_date', current.start)
      .lte('block_date', current.end);

    // 2. Previous period time blocks (for trend)
    const previousBlocksPromise = supabase
      .from('time_blocks')
      .select('drip_quadrant, duration_minutes')
      .eq('user_id', userId)
      .gte('block_date', previous.start)
      .lte('block_date', previous.end);

    // 3. Active leverage items count
    const leverageCountPromise = supabase
      .from('leverage_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'archived');

    // 4. Network contacts count (non-archived)
    const networkCountPromise = supabase
      .from('friend_inventory')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_archived', false);

    // 5. Last 5 weeks of production hours (for sparkline)
    const weekRanges = getLast5WeekRanges();
    const sparklineStart = weekRanges[0].start;
    const sparklineEnd = weekRanges[weekRanges.length - 1].end;

    const sparklineBlocksPromise = supabase
      .from('time_blocks')
      .select('block_date, drip_quadrant, duration_minutes')
      .eq('user_id', userId)
      .eq('drip_quadrant', 'production')
      .gte('block_date', sparklineStart)
      .lte('block_date', sparklineEnd);

    // Execute all in parallel
    const [
      currentBlocksResult,
      previousBlocksResult,
      leverageCountResult,
      networkCountResult,
      sparklineBlocksResult,
    ] = await Promise.all([
      currentBlocksPromise,
      previousBlocksPromise,
      leverageCountPromise,
      networkCountPromise,
      sparklineBlocksPromise,
    ]);

    // Check for errors
    if (currentBlocksResult.error) {
      console.error('Error fetching current blocks:', currentBlocksResult.error);
      return NextResponse.json({ error: 'Failed to fetch time blocks' }, { status: 500 });
    }
    if (previousBlocksResult.error) {
      console.error('Error fetching previous blocks:', previousBlocksResult.error);
      return NextResponse.json({ error: 'Failed to fetch previous period data' }, { status: 500 });
    }

    const currentBlocks = currentBlocksResult.data || [];
    const previousBlocks = previousBlocksResult.data || [];

    // ---- Compute DRIP hours ----
    const currentTotals = sumByQuadrant(currentBlocks);
    const previousTotals = sumByQuadrant(previousBlocks);

    const drip = {
      production: minutesToHours(currentTotals.production),
      investment: minutesToHours(currentTotals.investment),
      replacement: minutesToHours(currentTotals.replacement),
      delegation: minutesToHours(currentTotals.delegation),
    };

    const dripTrend = {
      production: pctChange(previousTotals.production, currentTotals.production),
      investment: pctChange(previousTotals.investment, currentTotals.investment),
      replacement: pctChange(previousTotals.replacement, currentTotals.replacement),
      delegation: pctChange(previousTotals.delegation, currentTotals.delegation),
    };

    // ---- Total hours ----
    const totalMinutes = currentBlocks.reduce(
      (sum, b) => sum + (b.duration_minutes ?? 0),
      0
    );
    const totalHours = minutesToHours(totalMinutes);

    // ---- Uncategorized events ----
    const uncategorizedCount = currentBlocks.filter(
      (b) => !b.drip_quadrant || b.drip_quadrant === 'na'
    ).length;

    // ---- Leverage & network counts ----
    const leverageItemCount = leverageCountResult.count ?? 0;
    const networkTouchCount = networkCountResult.count ?? 0;

    // ---- Sparkline: production hours per week ----
    const sparklineBlocks = sparklineBlocksResult.data || [];
    const productionTrend = weekRanges.map((range) => {
      const weekMins = sparklineBlocks
        .filter((b) => b.block_date >= range.start && b.block_date <= range.end)
        .reduce((sum, b) => sum + (b.duration_minutes ?? 0), 0);
      return minutesToHours(weekMins);
    });

    // ---- Events list ----
    const events = currentBlocks.map((b) => ({
      id: b.id,
      title: b.activity_name,
      description: b.notes ?? null,
      hours: minutesToHours(b.duration_minutes ?? 0),
      quadrant: b.drip_quadrant ?? null,
      energyRating: b.energy_rating ?? null,
    }));

    return NextResponse.json({
      drip,
      dripTrend,
      totalHours,
      uncategorizedCount,
      leverageItemCount,
      networkTouchCount,
      productionTrend,
      events,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
