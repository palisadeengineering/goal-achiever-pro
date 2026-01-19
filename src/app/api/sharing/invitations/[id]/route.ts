import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// DELETE /api/sharing/invitations/[id] - Revoke a pending invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
    }

    // Use service role client for admin operations (bypasses RLS)
    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || DEMO_USER_ID;

    // Verify ownership and update status (use admin client to bypass RLS)
    const { data: invitation, error } = await adminClient
      .from('share_invitations')
      .update({ status: 'revoked' })
      .eq('id', id)
      .eq('owner_id', userId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or cannot be revoked' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation revoked',
    });
  } catch (error) {
    console.error('Error in DELETE /api/sharing/invitations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
