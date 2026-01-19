// Validation schemas for sharing API endpoints
import { z } from 'zod';
import {
  uuidSchema,
  emailSchema,
  safeStringSchema,
} from './common';

// Tab names that can be shared (must match TabName type in src/types/sharing.ts)
export const tabNameSchema = z.enum([
  'today',
  'progress',
  'vision',
  'goals',
  'okrs',
  'milestones',
  'mins',
  'time_audit',
  'drip',
  'routines',
  'pomodoro',
  'reviews',
  'leverage',
  'network',
  'analytics',
  'backtrack',
]);

// Permission level
export const permissionLevelSchema = z.enum(['view', 'edit']);

// Entity type for item-level sharing
export const entityTypeSchema = z.enum([
  'vision',
  'power_goal',
  'monthly_target',
  'weekly_target',
  'daily_action',
  'time_block',
  'routine',
  'key_result',
]);

// Tab permission data
export const tabPermissionDataSchema = z.object({
  tabName: tabNameSchema,
  permissionLevel: permissionLevelSchema,
});

// Item permission data
export const itemPermissionDataSchema = z.object({
  entityType: entityTypeSchema,
  entityId: uuidSchema,
  permissionLevel: permissionLevelSchema,
});

// Create share invitation
export const createInvitationSchema = z.object({
  email: emailSchema,
  shareType: z.enum(['tab', 'item', 'both']),
  tabPermissions: z.array(tabPermissionDataSchema).optional().default([]),
  itemPermissions: z.array(itemPermissionDataSchema).optional().default([]),
  // Optional message to include in invitation email
  message: safeStringSchema(500).optional(),
}).refine(
  (data) => {
    // Ensure at least one permission is provided based on share type
    if (data.shareType === 'tab' && data.tabPermissions.length === 0) {
      return false;
    }
    if (data.shareType === 'item' && data.itemPermissions.length === 0) {
      return false;
    }
    if (data.shareType === 'both' && data.tabPermissions.length === 0 && data.itemPermissions.length === 0) {
      return false;
    }
    return true;
  },
  { message: 'At least one permission must be provided for the selected share type' }
);

// Update invitation
export const updateInvitationSchema = z.object({
  id: uuidSchema,
  status: z.enum(['pending', 'revoked']).optional(),
  tabPermissions: z.array(tabPermissionDataSchema).optional(),
  itemPermissions: z.array(itemPermissionDataSchema).optional(),
});

// Accept invitation (token from URL)
export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
});

// Update tab permissions
export const updateTabPermissionsSchema = z.object({
  teamMemberId: uuidSchema,
  permissions: z.array(tabPermissionDataSchema),
});

// Update item permissions
export const updateItemPermissionsSchema = z.object({
  teamMemberId: uuidSchema,
  permissions: z.array(itemPermissionDataSchema),
});

// Create team member
export const createTeamMemberSchema = z.object({
  email: emailSchema.optional(),
  name: safeStringSchema(200).refine(val => val.length >= 1, 'Name is required'),
  role: z.enum(['admin', 'member', 'viewer', 'external']).optional().default('member'),
  accessLevel: z.enum(['full', 'limited', 'external']).optional().default('limited'),
  title: safeStringSchema(100).optional(),
  department: safeStringSchema(100).optional(),
  phone: safeStringSchema(20).optional(),
  notes: safeStringSchema(1000).optional(),
});

// Update team member
export const updateTeamMemberSchema = z.object({
  id: uuidSchema,
  name: safeStringSchema(200).optional(),
  role: z.enum(['admin', 'member', 'viewer', 'external']).optional(),
  accessLevel: z.enum(['full', 'limited', 'external']).optional(),
  title: safeStringSchema(100).optional(),
  department: safeStringSchema(100).optional(),
  phone: safeStringSchema(20).optional(),
  notes: safeStringSchema(1000).optional(),
  isActive: z.boolean().optional(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type UpdateInvitationInput = z.infer<typeof updateInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
