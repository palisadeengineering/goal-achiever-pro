import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpdatePermissionRequest } from '@/types/sharing';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// PUT /api/sharing/tabs/[id] - Update tab permission level
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
    }
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
      .from('tab_permissions')
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
        tabName: permission.tab_name,
        permissionLevel: permission.permission_level,
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/sharing/tabs/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/sharing/tabs/[id] - Revoke tab permission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || DEMO_USER_ID;

    const { error } = await supabase
      .from('tab_permissions')
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
    console.error('Error in DELETE /api/sharing/tabs/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
