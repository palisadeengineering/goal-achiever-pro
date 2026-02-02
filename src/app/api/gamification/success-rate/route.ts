import { NextRequest, NextResponse } from 'next/server';
import { calculateSuccessRate, type SuccessRate } from '@/lib/services/streaks';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

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
