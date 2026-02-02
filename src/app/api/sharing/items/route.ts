import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import type { GrantItemPermissionRequest } from '@/types/sharing';

// GET /api/sharing/items - List item permissions
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
    }

    // Use service role client for queries that join with team_members (bypasses RLS)
    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const teamMemberId = searchParams.get('teamMemberId');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    let query = adminClient
      .from('item_permissions')
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

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data: permissions, error } = await query;

    if (error) {
      console.error('Error fetching item permissions:', error);
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
        entityType: p.entity_type,
        entityId: p.entity_id,
        permissionLevel: p.permission_level,
        isActive: p.is_active,
        createdAt: p.created_at,
        teamMember: p.team_members,
      })),
    });
  } catch (error) {
    console.error('Error in GET /api/sharing/items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/sharing/items - Grant item permission
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
    }

    // Use service role client for admin operations (bypasses RLS)
    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body: GrantItemPermissionRequest = await request.json();
    const { teamMemberId, entityType, entityId, permissionLevel } = body;

    if (!teamMemberId || !entityType || !entityId || !permissionLevel) {
      return NextResponse.json(
        { error: 'teamMemberId, entityType, entityId, and permissionLevel are required' },
        { status: 400 }
      );
    }

    // Verify team member belongs to this owner (use admin client to bypass RLS)
    const { data: teamMember } = await adminClient
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

    // Upsert the permission (use admin client to bypass RLS)
    const { data: permission, error } = await adminClient
      .from('item_permissions')
      .upsert(
        {
          owner_id: userId,
          team_member_id: teamMemberId,
          entity_type: entityType,
          entity_id: entityId,
          permission_level: permissionLevel,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'team_member_id,entity_type,entity_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error creating item permission:', error);
      return NextResponse.json(
        { error: 'Failed to create permission' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      permission: {
        id: permission.id,
        entityType: permission.entity_type,
        entityId: permission.entity_id,
        permissionLevel: permission.permission_level,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/sharing/items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
