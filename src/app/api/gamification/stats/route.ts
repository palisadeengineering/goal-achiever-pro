import { NextResponse } from 'next/server';
import { getOrCreateUserGamification } from '@/lib/services/gamification';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const gamification = await getOrCreateUserGamification(userId);

    return NextResponse.json(gamification);
  } catch (error) {
    console.error('Error fetching gamification stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gamification stats' },
      { status: 500 }
    );
  }
}
