import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { generateBetaInvitationEmailHtml } from '@/lib/email/templates/beta-invitation';
import { generateInviteToken } from '@/lib/permissions/check-access';

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

// POST - Resend invitation email with new token
export async function POST(
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

    // Get the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('beta_invitations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status === 'accepted') {
      return NextResponse.json({ error: 'Cannot resend - invitation already accepted' }, { status: 400 });
    }

    // Generate new token and update invitation
    const newToken = generateInviteToken();
    const { error: updateError } = await supabase
      .from('beta_invitations')
      .update({
        invite_token: newToken,
        status: 'pending',
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 });
    }

    // Send new invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://goalachieverpro.com';
    const inviteUrl = `${appUrl}/invite/${newToken}`;

    const emailHtml = generateBetaInvitationEmailHtml({
      inviteUrl,
      inviteeEmail: invitation.email,
    });

    const emailResult = await sendEmail({
      to: invitation.email,
      subject: "You're Invited to Goal Achiever Pro",
      html: emailHtml,
      from: 'Goal Achiever Pro <hello@goalachieverpro.com>',
    });

    if (!emailResult.success) {
      console.error('Failed to resend invitation email:', emailResult.error);
      return NextResponse.json({
        error: 'Failed to send email',
        details: emailResult.error,
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailSent: true });
  } catch (error) {
    console.error('Error in beta invitation resend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
