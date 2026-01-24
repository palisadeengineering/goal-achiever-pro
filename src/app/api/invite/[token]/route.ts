import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// GET - Validate invite token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { data: invitation, error } = await supabase
      .from('beta_invitations')
      .select('email, status')
      .eq('invite_token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    if (invitation.status === 'accepted') {
      return NextResponse.json({ error: 'Invitation already accepted', status: 'accepted' }, { status: 400 });
    }

    if (invitation.status === 'revoked') {
      return NextResponse.json({ error: 'Invitation has been revoked', status: 'revoked' }, { status: 400 });
    }

    return NextResponse.json({ email: invitation.email, status: invitation.status });
  } catch (error) {
    console.error('Error validating invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
