import { createServiceRoleClient } from '@/lib/supabase/server';
import type {
  TabName,
  EntityType,
  PermissionLevel,
  SharedContent,
  TabPermission,
} from '@/types/sharing';

/**
 * Check if a user has tab-level access to another user's content
 */
export async function hasTabAccess(
  userId: string,
  ownerId: string,
  tabName: TabName,
  requiredLevel?: PermissionLevel
): Promise<boolean> {
  // User always has access to their own content
  if (userId === ownerId) {
    return true;
  }

  // Use service role client to bypass RLS for cross-user permission checks
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return false;
  }

  // First, find the team member record for this user under the owner
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!teamMember) {
    return false;
  }

  // Check for tab permission
  const query = supabase
    .from('tab_permissions')
    .select('id, permission_level')
    .eq('owner_id', ownerId)
    .eq('team_member_id', teamMember.id)
    .eq('tab_name', tabName)
    .eq('is_active', true)
    .single();

  const { data: permission } = await query;

  if (!permission) {
    return false;
  }

  // If a specific level is required, check it
  if (requiredLevel === 'edit' && permission.permission_level === 'view') {
    return false;
  }

  return true;
}

/**
 * Check if a user has item-level access to a specific entity
 */
export async function hasItemAccess(
  userId: string,
  ownerId: string,
  entityType: EntityType,
  entityId: string,
  requiredLevel?: PermissionLevel
): Promise<{ hasAccess: boolean; permissionLevel: PermissionLevel | null }> {
  // User always has full access to their own content
  if (userId === ownerId) {
    return { hasAccess: true, permissionLevel: 'edit' };
  }

  // Use service role client to bypass RLS for cross-user permission checks
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return { hasAccess: false, permissionLevel: null };
  }

  // First, find the team member record for this user under the owner
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!teamMember) {
    return { hasAccess: false, permissionLevel: null };
  }

  // Check for item-level permission first
  const { data: itemPermission } = await supabase
    .from('item_permissions')
    .select('id, permission_level')
    .eq('owner_id', ownerId)
    .eq('team_member_id', teamMember.id)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('is_active', true)
    .single();

  if (itemPermission) {
    const level = itemPermission.permission_level as PermissionLevel;
    if (requiredLevel === 'edit' && level === 'view') {
      return { hasAccess: false, permissionLevel: level };
    }
    return { hasAccess: true, permissionLevel: level };
  }

  // Check for tab-level permission that might grant access
  const tabName = entityTypeToTab(entityType);
  if (tabName) {
    const { data: tabPermission } = await supabase
      .from('tab_permissions')
      .select('id, permission_level')
      .eq('owner_id', ownerId)
      .eq('team_member_id', teamMember.id)
      .eq('tab_name', tabName)
      .eq('is_active', true)
      .single();

    if (tabPermission) {
      const level = tabPermission.permission_level as PermissionLevel;
      if (requiredLevel === 'edit' && level === 'view') {
        return { hasAccess: false, permissionLevel: level };
      }
      return { hasAccess: true, permissionLevel: level };
    }
  }

  return { hasAccess: false, permissionLevel: null };
}

/**
 * Get all content shared with a user (grouped by owner)
 */
export async function getSharedWithMe(userId: string): Promise<SharedContent[]> {
  // Use service role client to bypass RLS for cross-user queries
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return [];
  }

  // Find all team memberships where this user is linked
  const { data: memberships } = await supabase
    .from('team_members')
    .select(`
      id,
      owner_id,
      profiles!team_members_owner_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('invite_status', 'accepted');

  if (!memberships || memberships.length === 0) {
    return [];
  }

  const sharedContent: SharedContent[] = [];

  for (const membership of memberships) {
    // Get tab permissions for this membership
    const { data: tabPerms } = await supabase
      .from('tab_permissions')
      .select('*')
      .eq('team_member_id', membership.id)
      .eq('is_active', true);

    // Get item permissions count for this membership
    const { count: itemCount } = await supabase
      .from('item_permissions')
      .select('*', { count: 'exact', head: true })
      .eq('team_member_id', membership.id)
      .eq('is_active', true);

    // Only include if there are actual permissions
    if ((tabPerms && tabPerms.length > 0) || (itemCount && itemCount > 0)) {
      const ownerProfile = membership.profiles as unknown as {
        id: string;
        full_name: string | null;
        email: string;
        avatar_url: string | null;
      };

      sharedContent.push({
        owner: {
          id: ownerProfile.id,
          fullName: ownerProfile.full_name,
          email: ownerProfile.email,
          avatarUrl: ownerProfile.avatar_url,
        },
        tabs: (tabPerms || []).map((p) => ({
          id: p.id,
          ownerId: p.owner_id,
          teamMemberId: p.team_member_id,
          tabName: p.tab_name as TabName,
          permissionLevel: p.permission_level as PermissionLevel,
          isActive: p.is_active,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })),
        itemCount: itemCount || 0,
      });
    }
  }

  return sharedContent;
}

/**
 * Get all team members with their permissions for a specific tab
 */
export async function getTabShares(
  ownerId: string,
  tabName: TabName
): Promise<TabPermission[]> {
  // Use service role client to bypass RLS for cross-table joins
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return [];
  }

  const { data: permissions } = await supabase
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
    .eq('owner_id', ownerId)
    .eq('tab_name', tabName)
    .eq('is_active', true);

  if (!permissions) {
    return [];
  }

  return permissions.map((p) => ({
    id: p.id,
    ownerId: p.owner_id,
    teamMemberId: p.team_member_id,
    tabName: p.tab_name as TabName,
    permissionLevel: p.permission_level as PermissionLevel,
    isActive: p.is_active,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    teamMember: p.team_members
      ? {
          id: p.team_members.id,
          name: p.team_members.name,
          email: p.team_members.email,
          avatarUrl: p.team_members.avatar_url,
          role: p.team_members.role,
        }
      : undefined,
  }));
}

/**
 * Get the permission level a user has for viewing another user's content
 */
export async function getPermissionLevel(
  userId: string,
  ownerId: string,
  tabName?: TabName,
  entityType?: EntityType,
  entityId?: string
): Promise<PermissionLevel | null> {
  if (userId === ownerId) {
    return 'edit'; // Owner has full access
  }

  // Use service role client to bypass RLS for cross-user permission checks
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return null;
  }

  // Find team membership
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!teamMember) {
    return null;
  }

  // Check item-level permission first if entity info provided
  if (entityType && entityId) {
    const { data: itemPerm } = await supabase
      .from('item_permissions')
      .select('permission_level')
      .eq('team_member_id', teamMember.id)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('is_active', true)
      .single();

    if (itemPerm) {
      return itemPerm.permission_level as PermissionLevel;
    }
  }

  // Check tab-level permission
  if (tabName) {
    const { data: tabPerm } = await supabase
      .from('tab_permissions')
      .select('permission_level')
      .eq('team_member_id', teamMember.id)
      .eq('tab_name', tabName)
      .eq('is_active', true)
      .single();

    if (tabPerm) {
      return tabPerm.permission_level as PermissionLevel;
    }
  }

  return null;
}

/**
 * Map entity types to their corresponding tabs
 */
function entityTypeToTab(entityType: EntityType): TabName | null {
  const mapping: Partial<Record<EntityType, TabName>> = {
    time_block: 'time_audit',
    leverage_item: 'leverage',
    friend: 'network',
  };

  return mapping[entityType] || null;
}

/**
 * Generate a cryptographically secure random token for invitations
 */
export function generateInviteToken(): string {
  // Use Web Crypto API which works in both Node.js and Edge/Browser
  // 24 bytes = 32 base64url characters with good entropy
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  // Convert to base64url
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
