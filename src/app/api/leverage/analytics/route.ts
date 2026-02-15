import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { validateDateParam } from '@/lib/validations/common';

export type LeverageType = 'code' | 'content' | 'capital' | 'collaboration';

export interface LeverageTimeData {
  leverageType: LeverageType;
  totalMinutes: number;
  blockCount: number;
  percentage: number;
}

export interface WeeklyTrend {
  weekStart: string;
  code: number;
  content: number;
  capital: number;
  collaboration: number;
  total: number;
}

export interface LeverageItemROI {
  id: string;
  title: string;
  leverageType: LeverageType;
  hoursInvested: number;
  estimatedHoursSaved: number;
  actualHoursSaved: number;
  roi: number; // (actualHoursSaved / hoursInvested) or estimated if no actual
}

export interface LeverageAnalyticsResponse {
  byType: LeverageTimeData[];
  weeklyTrends: WeeklyTrend[];
  itemROI: LeverageItemROI[];
  summary: {
    totalLeverageMinutes: number;
    totalMinutesTracked: number;
    leveragePercentage: number;
    topType: LeverageType | null;
    estimatedWeeklyHoursSaved: number;
  };
}

// GET: Fetch leverage analytics for a date range
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

    const { searchParams } = new URL(request.url);
    const startDate = validateDateParam(searchParams.get('startDate'));
    const endDate = validateDateParam(searchParams.get('endDate'));

    // Default to last 30 days if no date range provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch time blocks with leverage type
    const { data: timeBlocks, error: blocksError } = await supabase
      .from('time_blocks')
      .select('id, block_date, duration_minutes, leverage_type')
      .eq('user_id', userId)
      .gte('block_date', start)
      .lte('block_date', end)
      .order('block_date', { ascending: true });

    if (blocksError) {
      console.error('Error fetching time blocks:', blocksError);
      return NextResponse.json({ error: 'Failed to fetch time blocks' }, { status: 500 });
    }

    // Fetch leverage items for ROI calculation
    const { data: leverageItems, error: itemsError } = await supabase
      .from('leverage_items')
      .select('id, title, leverage_type, estimated_hours_saved_weekly, actual_hours_saved_weekly')
      .eq('user_id', userId);

    if (itemsError) {
      console.error('Error fetching leverage items:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch leverage items' }, { status: 500 });
    }

    // Fetch time block to leverage item links
    const { data: leverageLinks, error: linksError } = await supabase
      .from('time_block_leverage_links')
      .select('time_block_id, leverage_item_id')
      .in('time_block_id', (timeBlocks || []).map(b => b.id));

    if (linksError) {
      console.error('Error fetching leverage links:', linksError);
      // Continue without links - they're optional
    }

    // Calculate aggregates by leverage type
    const leverageTypes: LeverageType[] = ['code', 'content', 'capital', 'collaboration'];
    const byType: Record<LeverageType, { minutes: number; count: number }> = {
      code: { minutes: 0, count: 0 },
      content: { minutes: 0, count: 0 },
      capital: { minutes: 0, count: 0 },
      collaboration: { minutes: 0, count: 0 },
    };

    let totalMinutesTracked = 0;
    let totalLeverageMinutes = 0;

    // Weekly trends data structure
    const weeklyData: Record<string, { code: number; content: number; capital: number; collaboration: number; total: number }> = {};

    for (const block of timeBlocks || []) {
      const minutes = block.duration_minutes || 0;
      totalMinutesTracked += minutes;

      // Get week start for this block
      const blockDate = new Date(block.block_date);
      const weekStart = getWeekStart(blockDate);

      if (!weeklyData[weekStart]) {
        weeklyData[weekStart] = { code: 0, content: 0, capital: 0, collaboration: 0, total: 0 };
      }

      if (block.leverage_type && leverageTypes.includes(block.leverage_type as LeverageType)) {
        const lt = block.leverage_type as LeverageType;
        byType[lt].minutes += minutes;
        byType[lt].count += 1;
        totalLeverageMinutes += minutes;
        weeklyData[weekStart][lt] += minutes;
        weeklyData[weekStart].total += minutes;
      }
    }

    // Format byType response
    const byTypeResponse: LeverageTimeData[] = leverageTypes.map(lt => ({
      leverageType: lt,
      totalMinutes: byType[lt].minutes,
      blockCount: byType[lt].count,
      percentage: totalLeverageMinutes > 0 ? (byType[lt].minutes / totalLeverageMinutes) * 100 : 0,
    }));

    // Format weekly trends
    const weeklyTrends: WeeklyTrend[] = Object.entries(weeklyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, data]) => ({
        weekStart,
        ...data,
      }));

    // Calculate ROI for each leverage item
    const hoursInvestedByItem: Record<string, number> = {};
    for (const link of leverageLinks || []) {
      const block = (timeBlocks || []).find(b => b.id === link.time_block_id);
      if (block) {
        if (!hoursInvestedByItem[link.leverage_item_id]) {
          hoursInvestedByItem[link.leverage_item_id] = 0;
        }
        hoursInvestedByItem[link.leverage_item_id] += (block.duration_minutes || 0) / 60;
      }
    }

    const itemROI: LeverageItemROI[] = (leverageItems || []).map(item => {
      const hoursInvested = hoursInvestedByItem[item.id] || 0;
      const estimatedHoursSaved = parseFloat(item.estimated_hours_saved_weekly) || 0;
      const actualHoursSaved = parseFloat(item.actual_hours_saved_weekly) || 0;
      const hoursSaved = actualHoursSaved > 0 ? actualHoursSaved : estimatedHoursSaved;
      const roi = hoursInvested > 0 ? hoursSaved / hoursInvested : 0;

      return {
        id: item.id,
        title: item.title,
        leverageType: item.leverage_type as LeverageType,
        hoursInvested,
        estimatedHoursSaved,
        actualHoursSaved,
        roi,
      };
    });

    // Find top leverage type
    let topType: LeverageType | null = null;
    let maxMinutes = 0;
    for (const lt of leverageTypes) {
      if (byType[lt].minutes > maxMinutes) {
        maxMinutes = byType[lt].minutes;
        topType = lt;
      }
    }

    // Calculate total estimated hours saved per week
    const estimatedWeeklyHoursSaved = (leverageItems || []).reduce((sum, item) => {
      return sum + (parseFloat(item.estimated_hours_saved_weekly) || 0);
    }, 0);

    const response: LeverageAnalyticsResponse = {
      byType: byTypeResponse,
      weeklyTrends,
      itemROI,
      summary: {
        totalLeverageMinutes,
        totalMinutesTracked,
        leveragePercentage: totalMinutesTracked > 0 ? (totalLeverageMinutes / totalMinutesTracked) * 100 : 0,
        topType,
        estimatedWeeklyHoursSaved,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Leverage analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch leverage analytics' }, { status: 500 });
  }
}

// Helper function to get week start (Monday) for a given date
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}
