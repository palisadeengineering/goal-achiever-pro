import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// DELETE /api/sharing/invitations/[id] - Revoke a pending invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || DEMO_USER_ID;

    // Verify ownership and update status
    const { data: invitation, error } = await supabase
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
