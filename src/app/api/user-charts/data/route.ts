import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// GET: Fetch chart data (aggregated time by tags)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tagIds = searchParams.get('tagIds'); // comma-separated
    const aggregation = searchParams.get('aggregation') || 'daily'; // daily, weekly, monthly

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Get all time blocks in the date range
    const { data: timeBlocks, error: blocksError } = await supabase
      .from('time_blocks')
      .select(`
        id,
        block_date,
        duration_minutes,
        activity_name
      `)
      .eq('user_id', userId)
      .gte('block_date', startDate)
      .lte('block_date', endDate);

    if (blocksError) {
      console.error('Error fetching time blocks:', blocksError);
      return NextResponse.json(
        { error: 'Failed to fetch time blocks' },
        { status: 500 }
      );
    }

    // Get tag assignments for these blocks
    const blockIds = (timeBlocks || []).map(b => b.id);

    let tagAssignments: Array<{
      time_block_id: string;
      tag_id: string;
      tag: { id: string; name: string; color: string };
    }> = [];

    if (blockIds.length > 0) {
      const { data: assignments, error: assignError } = await supabase
        .from('time_block_tag_assignments')
        .select(`
          time_block_id,
          tag_id,
          tag:time_block_tags(id, name, color)
        `)
        .in('time_block_id', blockIds);

      if (assignError) {
        console.error('Error fetching tag assignments:', assignError);
      } else {
        tagAssignments = (assignments || []).map(a => ({
          time_block_id: a.time_block_id,
          tag_id: a.tag_id,
          tag: Array.isArray(a.tag) ? a.tag[0] : a.tag,
        }));
      }
    }

    // Filter by tagIds if provided
    let filteredTagIds: string[] | null = null;
    if (tagIds) {
      filteredTagIds = tagIds.split(',').filter(Boolean);
    }

    // Create a map of block_id to tags
    const blockTagMap = new Map<string, Array<{ id: string; name: string; color: string }>>();
    for (const assignment of tagAssignments) {
      if (!assignment.tag) continue;
      if (filteredTagIds && !filteredTagIds.includes(assignment.tag_id)) continue;

      const existing = blockTagMap.get(assignment.time_block_id) || [];
      existing.push(assignment.tag);
      blockTagMap.set(assignment.time_block_id, existing);
    }

    // Aggregate data by tag
    const tagTotals = new Map<string, {
      tagId: string;
      tagName: string;
      tagColor: string;
      totalMinutes: number;
    }>();

    // Aggregate data by date and tag (for trend charts)
    const dateTagTotals = new Map<string, Map<string, number>>();

    for (const block of timeBlocks || []) {
      const tags = blockTagMap.get(block.id);
      const minutes = block.duration_minutes || 0;
      const date = block.block_date;

      if (tags && tags.length > 0) {
        // Distribute time evenly across tags if multiple
        const minutesPerTag = minutes / tags.length;

        for (const tag of tags) {
          // Update total
          const existing = tagTotals.get(tag.id);
          if (existing) {
            existing.totalMinutes += minutesPerTag;
          } else {
            tagTotals.set(tag.id, {
              tagId: tag.id,
              tagName: tag.name,
              tagColor: tag.color,
              totalMinutes: minutesPerTag,
            });
          }

          // Update date totals
          if (!dateTagTotals.has(date)) {
            dateTagTotals.set(date, new Map());
          }
          const dateMap = dateTagTotals.get(date)!;
          dateMap.set(tag.id, (dateMap.get(tag.id) || 0) + minutesPerTag);
        }
      }
    }

    // Convert to arrays
    const distributionData = Array.from(tagTotals.values())
      .sort((a, b) => b.totalMinutes - a.totalMinutes);

    // Build trend data based on aggregation level
    const trendData: Array<{
      date: string;
      tagData: Array<{
        tagId: string;
        tagName: string;
        tagColor: string;
        minutes: number;
      }>;
    }> = [];

    // Get all unique tags
    const allTags = Array.from(tagTotals.values());

    // Aggregate by date (for now, daily - can expand to weekly/monthly)
    const sortedDates = Array.from(dateTagTotals.keys()).sort();

    if (aggregation === 'daily') {
      for (const date of sortedDates) {
        const dateMap = dateTagTotals.get(date)!;
        const tagData = allTags.map(tag => ({
          tagId: tag.tagId,
          tagName: tag.tagName,
          tagColor: tag.tagColor,
          minutes: dateMap.get(tag.tagId) || 0,
        }));
        trendData.push({ date, tagData });
      }
    } else if (aggregation === 'weekly') {
      // Group by week
      const weekMap = new Map<string, Map<string, number>>();
      for (const date of sortedDates) {
        const d = new Date(date);
        // Get start of week (Sunday)
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, new Map());
        }
        const weekData = weekMap.get(weekKey)!;
        const dateData = dateTagTotals.get(date)!;

        for (const [tagId, minutes] of dateData) {
          weekData.set(tagId, (weekData.get(tagId) || 0) + minutes);
        }
      }

      for (const [weekStart, weekData] of Array.from(weekMap.entries()).sort()) {
        const tagData = allTags.map(tag => ({
          tagId: tag.tagId,
          tagName: tag.tagName,
          tagColor: tag.tagColor,
          minutes: weekData.get(tag.tagId) || 0,
        }));
        trendData.push({ date: weekStart, tagData });
      }
    } else if (aggregation === 'monthly') {
      // Group by month
      const monthMap = new Map<string, Map<string, number>>();
      for (const date of sortedDates) {
        const monthKey = date.substring(0, 7); // YYYY-MM

        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, new Map());
        }
        const monthData = monthMap.get(monthKey)!;
        const dateData = dateTagTotals.get(date)!;

        for (const [tagId, minutes] of dateData) {
          monthData.set(tagId, (monthData.get(tagId) || 0) + minutes);
        }
      }

      for (const [month, monthData] of Array.from(monthMap.entries()).sort()) {
        const tagData = allTags.map(tag => ({
          tagId: tag.tagId,
          tagName: tag.tagName,
          tagColor: tag.tagColor,
          minutes: monthData.get(tag.tagId) || 0,
        }));
        trendData.push({ date: month, tagData });
      }
    }

    // Calculate total for percentages
    const totalMinutes = distributionData.reduce((sum, d) => sum + d.totalMinutes, 0);

    return NextResponse.json({
      distribution: distributionData.map(d => ({
        ...d,
        percentage: totalMinutes > 0 ? (d.totalMinutes / totalMinutes) * 100 : 0,
        hours: d.totalMinutes / 60,
      })),
      trend: trendData,
      summary: {
        totalMinutes,
        totalHours: totalMinutes / 60,
        tagCount: distributionData.length,
        dateRange: { startDate, endDate },
      },
    });
  } catch (error) {
    console.error('Get chart data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}
