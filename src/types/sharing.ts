// Types for team member sharing functionality

export type PermissionLevel = 'view' | 'edit';
export type ShareType = 'tab' | 'item' | 'both';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

// All shareable tabs in the application
export type TabName =
  | 'today'
  | 'progress'
  | 'vision'
  | 'goals'
  | 'okrs'
  | 'milestones'
  | 'mins'
  | 'time_audit'
  | 'drip'
  | 'routines'
  | 'pomodoro'
  | 'reviews'
  | 'leverage'
  | 'network'
  | 'analytics'
  | 'backtrack';

// All shareable entity types
export type EntityType =
  | 'vision'
  | 'power_goal'
  | 'monthly_target'
  | 'weekly_target'
  | 'daily_action'
  | 'time_block'
  | 'routine'
  | 'key_result'
  | 'min'
  | 'leverage_item'
  | 'friend'
  | 'metric';

// Tab permission record
export interface TabPermission {
  id: string;
  ownerId: string;
  teamMemberId: string;
  tabName: TabName;
  permissionLevel: PermissionLevel;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined data
  owner?: OwnerInfo;
  teamMember?: TeamMemberInfo;
}

// Item permission record
export interface ItemPermission {
  id: string;
  ownerId: string;
  teamMemberId: string;
  entityType: EntityType;
  entityId: string;
  permissionLevel: PermissionLevel;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined data
  owner?: OwnerInfo;
  teamMember?: TeamMemberInfo;
}

// Share invitation record
export interface ShareInvitation {
  id: string;
  ownerId: string;
  email: string;
  inviteToken: string;
  expiresAt: string;
  status: InvitationStatus;
  shareType: ShareType;
  tabPermissions: TabPermissionData[];
  itemPermissions: ItemPermissionData[];
  createdAt: string;
  acceptedAt?: string;
  acceptedBy?: string;
  // Joined data
  owner?: OwnerInfo;
}

// Data stored in invitation JSON fields
export interface TabPermissionData {
  tabName: TabName;
  permissionLevel: PermissionLevel;
}

export interface ItemPermissionData {
  entityType: EntityType;
  entityId: string;
  permissionLevel: PermissionLevel;
  entityTitle?: string; // For display purposes
}

// Owner info for display
export interface OwnerInfo {
  id: string;
  fullName: string | null;
  email: string;
  avatarUrl?: string | null;
}

// Team member info for display
export interface TeamMemberInfo {
  id: string;
  name: string;
  email: string | null;
  avatarUrl?: string | null;
  role: string;
}

// Content shared with a user (grouped by owner)
export interface SharedContent {
  owner: OwnerInfo;
  tabs: TabPermission[];
  itemCount: number;
}

// API request/response types
export interface SendInviteRequest {
  email: string;
  shareType: ShareType;
  tabPermissions?: TabPermissionData[];
  itemPermissions?: ItemPermissionData[];
}

export interface GrantTabPermissionRequest {
  teamMemberId: string;
  tabName: TabName;
  permissionLevel: PermissionLevel;
}

export interface GrantItemPermissionRequest {
  teamMemberId: string;
  entityType: EntityType;
  entityId: string;
  permissionLevel: PermissionLevel;
}

export interface UpdatePermissionRequest {
  permissionLevel: PermissionLevel;
}

// For the share dialog
export interface ShareDialogTab {
  tabName: TabName;
  displayName: string;
  description: string;
  icon: string;
}

// Tab display names and descriptions
export const TAB_DISPLAY_INFO: Record<TabName, { displayName: string; description: string }> = {
  today: { displayName: 'Today', description: 'Daily tasks and calendar' },
  progress: { displayName: 'Progress', description: 'Goal completion trends' },
  vision: { displayName: 'Vision', description: 'SMART goals and vision board' },
  goals: { displayName: 'Goals', description: 'Power Goals and milestones' },
  okrs: { displayName: 'OKRs', description: 'Key Results and objectives' },
  milestones: { displayName: 'Milestones', description: 'Major project milestones' },
  mins: { displayName: 'MINS', description: 'Most Important Next Steps' },
  time_audit: { displayName: 'Time Audit', description: 'Time tracking and analysis' },
  drip: { displayName: 'DRIP', description: 'DRIP Matrix analysis' },
  routines: { displayName: 'Routines', description: 'Daily routines' },
  pomodoro: { displayName: 'Pomodoro', description: 'Focus timer sessions' },
  reviews: { displayName: 'Reviews', description: 'Daily reviews' },
  leverage: { displayName: 'Leverage', description: '4 C\'s tracking' },
  network: { displayName: 'Network', description: 'Friend inventory' },
  analytics: { displayName: 'Analytics', description: 'Dashboard and charts' },
  backtrack: { displayName: 'Backtrack Plans', description: 'Vision planning and progress' },
};

// Map routes to tab names
export const ROUTE_TO_TAB: Record<string, TabName> = {
  '/today': 'today',
  '/progress': 'progress',
  '/vision': 'vision',
  '/goals': 'goals',
  '/okrs': 'okrs',
  '/milestones': 'milestones',
  '/mins': 'mins',
  '/time-audit': 'time_audit',
  '/drip': 'drip',
  '/routines': 'routines',
  '/pomodoro': 'pomodoro',
  '/reviews': 'reviews',
  '/leverage': 'leverage',
  '/network': 'network',
  '/analytics': 'analytics',
  '/backtrack': 'backtrack',
};

// Map tab names to routes
export const TAB_TO_ROUTE: Record<TabName, string> = {
  today: '/today',
  progress: '/progress',
  vision: '/vision',
  goals: '/goals',
  okrs: '/okrs',
  milestones: '/milestones',
  mins: '/mins',
  time_audit: '/time-audit',
  drip: '/drip',
  routines: '/routines',
  pomodoro: '/pomodoro',
  reviews: '/reviews',
  leverage: '/leverage',
  network: '/network',
  analytics: '/analytics',
  backtrack: '/backtrack',
};
