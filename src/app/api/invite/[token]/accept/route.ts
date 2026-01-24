import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// POST - Mark invitation as accepted
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Update invitation status
    const { data: invitation, error } = await supabase
      .from('beta_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('invite_token', token)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      console.error('Error accepting invitation:', error);
      return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
    }

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found or already processed' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
