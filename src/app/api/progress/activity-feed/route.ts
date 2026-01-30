import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

export interface ActivityItem {
  id: string;
  kpiId: string;
  kpiTitle: string;
  level: string;
  visionId: string;
  visionTitle: string;
  visionColor: string;
  completedAt: string;
  value?: number | null;
}

interface VisionData {
  id: string;
  title: string;
  color: string;
}

interface KpiData {
  id: string;
  title: string;
  level: string;
  vision_id: string;
  visions: VisionData;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    // Parse query params
    const { searchParams } = new URL(request.url);
    const visionId = searchParams.get('visionId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    // Get recent completed KPI logs with KPI and vision details
    let query = supabase
      .from('kpi_logs')
      .select(`
        id,
        kpi_id,
        log_date,
        value,
        created_at,
        vision_kpis!inner (
          id,
          title,
          level,
          vision_id,
          visions!inner (
            id,
            title,
            color
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by vision if provided
    if (visionId) {
      query = query.eq('vision_kpis.vision_id', visionId);
    }

    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error('Error fetching activity logs:', logsError);
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
    }

    // Transform to ActivityItem format
    const activities: ActivityItem[] = (logs || []).map(log => {
      const kpi = log.vision_kpis as unknown as KpiData;
      const vision = kpi?.visions as VisionData | undefined;

      return {
        id: log.id,
        kpiId: log.kpi_id,
        kpiTitle: kpi?.title || 'Unknown KPI',
        level: kpi?.level || 'daily',
        visionId: vision?.id || '',
        visionTitle: vision?.title || 'Unknown Vision',
        visionColor: vision?.color || '#6366f1',
        completedAt: log.created_at || log.log_date,
        value: log.value,
      };
    });

    return NextResponse.json({
      activities,
      total: activities.length,
    });
  } catch (error) {
    console.error('Activity feed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}
