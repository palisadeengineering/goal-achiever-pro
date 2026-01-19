import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// GET /api/sharing/invite/[token] - Get invitation details (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Use service role client to access invitations (bypasses RLS)
    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
    }

    // Find the invitation
    const { data: invitation, error } = await supabase
      .from('share_invitations')
      .select(`
        id,
        email,
        expires_at,
        status,
        share_type,
        tab_permissions_data,
        item_permissions_data,
        created_at,
        profiles!share_invitations_owner_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('invite_token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt && invitation.status === 'pending') {
      // Mark as expired
      await supabase
        .from('share_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation is ${invitation.status}` },
        { status: 410 }
      );
    }

    const owner = invitation.profiles as unknown as {
      id: string;
      full_name: string | null;
      email: string;
      avatar_url: string | null;
    };

    return NextResponse.json({
      id: invitation.id,
      email: invitation.email,
      expiresAt: invitation.expires_at,
      status: invitation.status,
      shareType: invitation.share_type,
      tabPermissions: invitation.tab_permissions_data,
      itemPermissions: invitation.item_permissions_data,
      owner: {
        id: owner.id,
        fullName: owner.full_name,
        email: owner.email,
        avatarUrl: owner.avatar_url,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/sharing/invite/[token]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
