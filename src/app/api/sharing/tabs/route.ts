import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { GrantTabPermissionRequest } from '@/types/sharing';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// GET /api/sharing/tabs - List tab permissions for a team member
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || DEMO_USER_ID;

    const { searchParams } = new URL(request.url);
    const teamMemberId = searchParams.get('teamMemberId');
    const tabName = searchParams.get('tabName');

    let query = supabase
      .from('tab_permissions')
      .select(`
        *,
        team_members (
          id,
          name,
          email,
          avatar_url,
          role
        )
      `)
      .eq('owner_id', userId)
      .eq('is_active', true);

    if (teamMemberId) {
      query = query.eq('team_member_id', teamMemberId);
    }

    if (tabName) {
      query = query.eq('tab_name', tabName);
    }

    const { data: permissions, error } = await query;

    if (error) {
      console.error('Error fetching tab permissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch permissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      permissions: permissions.map((p) => ({
        id: p.id,
        ownerId: p.owner_id,
        teamMemberId: p.team_member_id,
        tabName: p.tab_name,
        permissionLevel: p.permission_level,
        isActive: p.is_active,
        createdAt: p.created_at,
        teamMember: p.team_members,
      })),
    });
  } catch (error) {
    console.error('Error in GET /api/sharing/tabs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/sharing/tabs - Grant tab permission
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || DEMO_USER_ID;

    const body: GrantTabPermissionRequest = await request.json();
    const { teamMemberId, tabName, permissionLevel } = body;

    if (!teamMemberId || !tabName || !permissionLevel) {
      return NextResponse.json(
        { error: 'teamMemberId, tabName, and permissionLevel are required' },
        { status: 400 }
      );
    }

    // Verify team member belongs to this owner
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('id', teamMemberId)
      .eq('owner_id', userId)
      .single();

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Upsert the permission
    const { data: permission, error } = await supabase
      .from('tab_permissions')
      .upsert(
        {
          owner_id: userId,
          team_member_id: teamMemberId,
          tab_name: tabName,
          permission_level: permissionLevel,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'owner_id,team_member_id,tab_name',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error creating tab permission:', error);
      return NextResponse.json(
        { error: 'Failed to create permission' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      permission: {
        id: permission.id,
        tabName: permission.tab_name,
        permissionLevel: permission.permission_level,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/sharing/tabs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
