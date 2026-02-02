import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import type { CreateTeamMemberInput } from '@/types/team';

// GET /api/team - List all team members
export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { data: members, error } = await adminClient
      .from('team_members')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching team members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    // Transform snake_case to camelCase for frontend
    const transformedMembers = (members || []).map(member => ({
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
    }));

    return NextResponse.json(transformedMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST /api/team - Create a new team member
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const body: CreateTeamMemberInput = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const { data: member, error } = await adminClient
      .from('team_members')
      .insert({
        owner_id: userId,
        name: body.name,
        email: body.email || null,
        role: body.role || 'member',
        access_level: body.accessLevel || 'limited',
        phone: body.phone || null,
        title: body.title || null,
        department: body.department || null,
        notes: body.notes || null,
        invite_status: 'pending',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating team member:', error);
      return NextResponse.json(
        { error: 'Failed to create team member' },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const transformedMember = {
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

    return NextResponse.json(transformedMember, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}
