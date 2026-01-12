import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UpdateTeamMemberInput } from '@/types/team';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// Transform snake_case to camelCase
function transformMember(member: Record<string, unknown>) {
  return {
    id: member.id,
    ownerId: member.owner_id,
    email: member.email,
    name: member.name,
    avatarUrl: member.avatar_url,
    role: member.role,
    accessLevel: member.access_level,
    userId: member.user_id,
    inviteStatus: member.invite_status,
    invitedAt: member.invited_at,
    acceptedAt: member.accepted_at,
    inviteToken: member.invite_token,
    phone: member.phone,
    title: member.title,
    department: member.department,
    notes: member.notes,
    isActive: member.is_active,
    createdAt: member.created_at,
    updatedAt: member.updated_at,
  };
}

// GET /api/team/[id] - Get a single team member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const { id } = await params;

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    const { data: member, error } = await adminClient
      .from('team_members')
      .select('*')
      .eq('id', id)
      .eq('owner_id', userId)
      .single();

    if (error || !member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transformMember(member));
  } catch (error) {
    console.error('Error fetching team member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team member' },
      { status: 500 }
    );
  }
}

// PUT /api/team/[id] - Update a team member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const { id } = await params;

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);
    const body: UpdateTeamMemberInput = await request.json();

    // Build update object with snake_case keys
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.accessLevel !== undefined) updateData.access_level = body.accessLevel;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;

    const { data: member, error } = await adminClient
      .from('team_members')
      .update(updateData)
      .eq('id', id)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error || !member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transformMember(member));
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

// DELETE /api/team/[id] - Soft delete a team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const { id } = await params;

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const userId = await getUserId(supabase);

    const { error } = await adminClient
      .from('team_members')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('owner_id', userId);

    if (error) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
}
