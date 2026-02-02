import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { getSharedWithMe } from '@/lib/permissions';

// GET /api/sharing/shared-with-me - Get all content shared with the current user
export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const sharedContent = await getSharedWithMe(userId);

    return NextResponse.json({
      sharedContent,
    });
  } catch (error) {
    console.error('Error in GET /api/sharing/shared-with-me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
