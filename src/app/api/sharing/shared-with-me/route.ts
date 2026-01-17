import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSharedWithMe } from '@/lib/permissions';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/sharing/shared-with-me - Get all content shared with the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || DEMO_USER_ID;

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
