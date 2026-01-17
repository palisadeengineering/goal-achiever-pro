import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInviteToken } from '@/lib/permissions';
import { sendEmail, generateShareInvitationEmail } from '@/lib/email';
import type { SendInviteRequest, TabPermissionData, ItemPermissionData, TabName } from '@/types/sharing';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// POST /api/sharing/invite - Send a share invitation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || DEMO_USER_ID;

    const body: SendInviteRequest = await request.json();
    const { email, shareType, tabPermissions, itemPermissions } = body;

    if (!email || !shareType) {
      return NextResponse.json(
        { error: 'Email and shareType are required' },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvite } = await supabase
      .from('share_invitations')
      .select('id')
      .eq('owner_id', userId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation is already pending for this email' },
        { status: 409 }
      );
    }

    // Generate invite token and expiry (7 days)
    const inviteToken = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the invitation
    const { data: invitation, error } = await supabase
      .from('share_invitations')
      .insert({
        owner_id: userId,
        email: email.toLowerCase(),
        invite_token: inviteToken,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        share_type: shareType,
        tab_permissions_data: tabPermissions || [],
        item_permissions_data: itemPermissions || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Get owner info for the response
    const { data: owner } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    // Send email notification to the invitee
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const acceptUrl = `${appUrl}/accept-invite/${inviteToken}`;

    const emailHtml = generateShareInvitationEmail({
      ownerName: owner?.full_name || '',
      ownerEmail: owner?.email || '',
      inviteeName: '', // We don't know the invitee's name yet
      tabs: (tabPermissions || []).map((tp: TabPermissionData) => ({
        tabName: tp.tabName as TabName,
        permissionLevel: tp.permissionLevel,
      })),
      acceptUrl,
      expiresAt,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: `${owner?.full_name || 'Someone'} has invited you to collaborate on Goal Achiever Pro`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.warn('Failed to send invitation email:', emailResult.error);
      // Don't fail the request if email fails - invitation is still valid
    }

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        shareType: invitation.share_type,
        expiresAt: invitation.expires_at,
        inviteUrl: acceptUrl,
      },
      owner: {
        name: owner?.full_name || 'A user',
        email: owner?.email,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/sharing/invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
