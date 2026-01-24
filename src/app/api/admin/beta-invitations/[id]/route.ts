import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

// Verify the requesting user is an authenticated admin
async function verifyAdmin(): Promise<{ isAdmin: boolean; error?: string }> {
  const supabase = await createClient();

  if (!supabase) {
    return { isAdmin: false, error: 'Database connection failed' };
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, error: 'Authentication required' };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (error || !profile || !profile.is_admin) {
    return { isAdmin: false, error: 'Admin access required' };
  }

  return { isAdmin: true };
}

// DELETE - Revoke an invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin, error: authError } = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: authError || 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Update status to revoked
    const { data: invitation, error } = await supabase
      .from('beta_invitations')
      .update({ status: 'revoked' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error revoking invitation:', error);
      return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 });
    }

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Error in beta invitation DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
