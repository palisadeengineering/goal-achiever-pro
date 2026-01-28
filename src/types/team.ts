// Team Member Types

export type TeamRole = 'admin' | 'member' | 'viewer' | 'external';
export type AccessLevel = 'full' | 'limited' | 'external';
export type InviteStatus = 'pending' | 'accepted' | 'declined';

export interface TeamMember {
  id: string;
  ownerId: string;
  email?: string;
  name: string;
  avatarUrl?: string;
  role: TeamRole;
  accessLevel: AccessLevel;
  userId?: string;
  inviteStatus: InviteStatus;
  invitedAt?: string;
  acceptedAt?: string;
  inviteToken?: string;
  phone?: string;
  title?: string;
  department?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamMemberInput {
  name: string;
  email?: string;
  role?: TeamRole;
  accessLevel?: AccessLevel;
  phone?: string;
  title?: string;
  department?: string;
  notes?: string;
}

export interface UpdateTeamMemberInput {
  name?: string;
  email?: string;
  role?: TeamRole;
  accessLevel?: AccessLevel;
  phone?: string;
  title?: string;
  department?: string;
  notes?: string;
  isActive?: boolean;
}

// Key Result Types

export type KeyResultStatus = 'on_track' | 'at_risk' | 'behind' | 'achieved' | 'cancelled';

export interface KeyResult {
  id: string;
  userId: string;
  visionId: string;
  impactProjectId?: string; // DB column still named power_goal_id
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  startValue: number;
  unit: string;
  assigneeId?: string;
  assigneeName?: string;
  quarter?: number;
  year?: number;
  dueDate?: string;
  status: KeyResultStatus;
  progressPercentage: number;
  confidenceLevel: number;
  successCriteria?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined relations
  assignee?: TeamMember;
  updates?: KeyResultUpdate[];
}

export interface KeyResultUpdate {
  id: string;
  keyResultId: string;
  previousValue?: number;
  newValue: number;
  previousStatus?: KeyResultStatus;
  newStatus?: KeyResultStatus;
  notes?: string;
  updatedBy?: string;
  updatedByName?: string;
  createdAt: string;
}

export interface CreateKeyResultInput {
  visionId: string;
  impactProjectId?: string; // DB column still named power_goal_id
  title: string;
  description?: string;
  targetValue: number;
  startValue?: number;
  unit: string;
  assigneeId?: string;
  assigneeName?: string;
  quarter?: number;
  year?: number;
  dueDate?: string;
  successCriteria?: string;
  notes?: string;
}

export interface UpdateKeyResultInput {
  title?: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  assigneeId?: string;
  assigneeName?: string;
  quarter?: number;
  year?: number;
  dueDate?: string;
  status?: KeyResultStatus;
  confidenceLevel?: number;
  successCriteria?: string;
  notes?: string;
  isActive?: boolean;
}

// Task Comment Types

export type CommentEntityType = 'daily_action' | 'weekly_target' | 'monthly_target' | 'power_goal' | 'impact_project' | 'key_result';

export interface TaskComment {
  id: string;
  userId: string;
  entityType: CommentEntityType;
  entityId: string;
  content: string;
  parentCommentId?: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  // Joined relations
  userName?: string;
  userAvatarUrl?: string;
  replies?: TaskComment[];
}

// Team Dashboard Types

export interface TeamMemberSummary {
  member: TeamMember;
  assignedTasks: number;
  completedTasks: number;
  keyResultsOwned: number;
  keyResultsOnTrack: number;
}

export interface TeamDashboardData {
  members: TeamMemberSummary[];
  totalTasks: number;
  completedThisWeek: number;
  overdueCount: number;
  keyResultProgress: {
    onTrack: number;
    atRisk: number;
    behind: number;
    achieved: number;
  };
}
