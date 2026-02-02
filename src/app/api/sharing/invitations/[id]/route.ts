import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// DELETE /api/sharing/invitations/[id] - Revoke a pending invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
