import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// POST - Mark invitation as accepted
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Require email in request body to verify the accepting user
    let body: { email?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body with email is required' }, { status: 400 });
    }

    const { email } = body;
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Fetch the invitation first to verify email match
    const { data: invitation, error: fetchError } = await supabase
      .from('beta_invitations')
      .select('*')
      .eq('invite_token', token)
      .eq('status', 'pending')
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found or already processed' }, { status: 404 });
    }

    // Verify the accepting user's email matches the invitation
    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 403 });
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('beta_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error accepting invitation:', updateError);
      return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
