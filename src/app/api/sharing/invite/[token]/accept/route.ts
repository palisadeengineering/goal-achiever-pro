import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { TabPermissionData, ItemPermissionData } from '@/types/sharing';

// POST /api/sharing/invite/[token]/accept - Accept an invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Use regular client for auth check
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
    }

    // Use service role client for admin operations (bypasses RLS)
    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      console.error('Service role client not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find the invitation (use admin client to bypass RLS)
    const { data: invitation, error: inviteError } = await adminClient
      .from('share_invitations')
      .select('*')
      .eq('invite_token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or already processed' },
        { status: 404 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      await adminClient
        .from('share_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // SECURITY: Verify the accepting user's email matches the invitation
    // This prevents unauthorized users from accepting invitations meant for others
    if (invitation.email && user.email) {
      const invitedEmail = invitation.email.toLowerCase().trim();
      const userEmail = user.email.toLowerCase().trim();

      if (invitedEmail !== userEmail) {
        return NextResponse.json(
          { error: 'This invitation was sent to a different email address. Please sign in with the correct account.' },
          { status: 403 }
        );
      }
    }

    // Find or create team member record (use admin client to bypass RLS)
    let teamMemberId: string;

    const { data: existingMember } = await adminClient
      .from('team_members')
      .select('id')
      .eq('owner_id', invitation.owner_id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      teamMemberId = existingMember.id;

      // Update the existing member to active
      await adminClient
        .from('team_members')
        .update({
          is_active: true,
          invite_status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', teamMemberId);
    } else {
      // Get user profile for the name (can use regular client since user reads their own profile)
      const { data: profile } = await adminClient
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      // Create new team member (use admin client to bypass RLS)
      const { data: newMember, error: memberError } = await adminClient
        .from('team_members')
        .insert({
          owner_id: invitation.owner_id,
          user_id: user.id,
          email: user.email,
          name: profile?.full_name || user.email?.split('@')[0] || 'Team Member',
          role: 'member',
          access_level: 'limited',
          invite_status: 'accepted',
          accepted_at: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (memberError || !newMember) {
        console.error('Error creating team member:', memberError);
        return NextResponse.json(
          { error: 'Failed to create team member' },
          { status: 500 }
        );
      }

      teamMemberId = newMember.id;
    }

    // Create tab permissions (use admin client to bypass RLS)
    const tabPermissions = invitation.tab_permissions_data as TabPermissionData[];
    if (tabPermissions && tabPermissions.length > 0) {
      const tabPermsToInsert = tabPermissions.map((tp) => ({
        owner_id: invitation.owner_id,
        team_member_id: teamMemberId,
        tab_name: tp.tabName,
        permission_level: tp.permissionLevel,
        is_active: true,
      }));

      const { error: tabPermError } = await adminClient
        .from('tab_permissions')
        .upsert(tabPermsToInsert, {
          onConflict: 'owner_id,team_member_id,tab_name',
        });

      if (tabPermError) {
        console.error('Error creating tab permissions:', tabPermError);
      }
    }

    // Create item permissions (use admin client to bypass RLS)
    const itemPermissions = invitation.item_permissions_data as ItemPermissionData[];
    if (itemPermissions && itemPermissions.length > 0) {
      const itemPermsToInsert = itemPermissions.map((ip) => ({
        owner_id: invitation.owner_id,
        team_member_id: teamMemberId,
        entity_type: ip.entityType,
        entity_id: ip.entityId,
        permission_level: ip.permissionLevel,
        is_active: true,
      }));

      const { error: itemPermError } = await adminClient
        .from('item_permissions')
        .upsert(itemPermsToInsert, {
          onConflict: 'team_member_id,entity_type,entity_id',
        });

      if (itemPermError) {
        console.error('Error creating item permissions:', itemPermError);
      }
    }

    // Update invitation status (use admin client to bypass RLS)
    await adminClient
      .from('share_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      })
      .eq('id', invitation.id);

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      redirectTo: '/today', // Redirect to the main dashboard
    });
  } catch (error) {
    console.error('Error in POST /api/sharing/invite/[token]/accept:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
