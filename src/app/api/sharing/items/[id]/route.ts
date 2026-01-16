import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpdatePermissionRequest } from '@/types/sharing';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// PUT /api/sharing/items/[id] - Update item permission level
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || DEMO_USER_ID;

    const body: UpdatePermissionRequest = await request.json();
    const { permissionLevel } = body;

    if (!permissionLevel) {
      return NextResponse.json(
        { error: 'permissionLevel is required' },
        { status: 400 }
      );
    }

    const { data: permission, error } = await supabase
      .from('item_permissions')
      .update({
        permission_level: permissionLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error || !permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
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
    console.error('Error in PUT /api/sharing/items/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/sharing/items/[id] - Revoke item permission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || DEMO_USER_ID;

    const { error } = await supabase
      .from('item_permissions')
      .update({ is_active: false })
      .eq('id', id)
      .eq('owner_id', userId);

    if (error) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Permission revoked',
    });
  } catch (error) {
    console.error('Error in DELETE /api/sharing/items/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
