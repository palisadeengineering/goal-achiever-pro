import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET /api/sharing/invitations - List all pending invitations (owner only)
export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
    }

    // Use service role client for admin operations (bypasses RLS)
    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: invitations, error } = await adminClient
      .from('share_invitations')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        status: inv.status,
        shareType: inv.share_type,
        tabPermissions: inv.tab_permissions_data,
        itemPermissions: inv.item_permissions_data,
        expiresAt: inv.expires_at,
        createdAt: inv.created_at,
        acceptedAt: inv.accepted_at,
      })),
    });
  } catch (error) {
    console.error('Error in GET /api/sharing/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
