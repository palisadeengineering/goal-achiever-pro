import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateSuccessRate, type SuccessRate } from '@/lib/services/streaks';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const userId = await getUserId(supabase);
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period');
    const period: SuccessRate['period'] =
      periodParam === 'week' || periodParam === 'month' || periodParam === 'quarter' || periodParam === 'year'
        ? periodParam
        : 'month';

    const successRate = await calculateSuccessRate(userId, period);

    // Get all periods for comparison
    const [week, month, quarter, year] = await Promise.all([
      calculateSuccessRate(userId, 'week'),
      calculateSuccessRate(userId, 'month'),
      calculateSuccessRate(userId, 'quarter'),
      calculateSuccessRate(userId, 'year'),
    ]);

    return NextResponse.json({
      current: successRate,
      comparison: { week, month, quarter, year },
    });
  } catch (error) {
    console.error('GET /api/gamification/success-rate error:', error);
    return NextResponse.json({ error: 'Failed to calculate success rate' }, { status: 500 });
  }
}
