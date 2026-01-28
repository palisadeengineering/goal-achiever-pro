// Validation schemas for impact-projects API (formerly power-goals)
import { z } from 'zod';
import {
  uuidSchema,
  titleSchema,
  descriptionSchema,
  optionalDateSchema,
  yearSchema,
  quarterSchema,
  nonNegativeIntSchema,
  safeStringSchema,
} from './common';

// Create impact project request
export const createImpactProjectSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  visionId: uuidSchema.optional().nullable(),
  targetDate: optionalDateSchema,
  year: yearSchema,
  quarter: quarterSchema.optional().nullable(),
  category: safeStringSchema(100).optional().nullable(),
  milestonePeriod: z.enum(['monthly', 'quarterly']).optional().default('quarterly'),
  estimatedHours: nonNegativeIntSchema.optional().nullable(),
  sortOrder: nonNegativeIntSchema.optional().default(0),
});

// Update impact project request
export const updateImpactProjectSchema = z.object({
  id: uuidSchema,
  title: titleSchema.optional(),
  description: descriptionSchema,
  visionId: uuidSchema.optional().nullable(),
  targetDate: optionalDateSchema,
  year: yearSchema.optional(),
  quarter: quarterSchema.optional().nullable(),
  category: safeStringSchema(100).optional().nullable(),
  milestonePeriod: z.enum(['monthly', 'quarterly']).optional(),
  estimatedHours: nonNegativeIntSchema.optional().nullable(),
  progressPercentage: z.number().min(0).max(100).optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  sortOrder: nonNegativeIntSchema.optional(),
  // Assignee
  assigneeId: uuidSchema.optional().nullable(),
  assigneeName: safeStringSchema(200).optional().nullable(),
});

// Query params for getting impact projects
export const getImpactProjectsQuerySchema = z.object({
  year: z.string().transform(val => parseInt(val, 10)).pipe(yearSchema).optional(),
  visionId: uuidSchema.optional(),
  status: z.enum(['active', 'completed', 'archived', 'all']).optional().default('active'),
});

// Delete impact project
export const deleteImpactProjectSchema = z.object({
  id: uuidSchema,
});

// Bulk create impact projects (from AI generation)
const impactProjectItemSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  quarter: quarterSchema,
  category: safeStringSchema(100).optional().nullable(),
  targetDate: optionalDateSchema,
});

export const bulkCreateImpactProjectsSchema = z.object({
  impactProjects: z.array(impactProjectItemSchema)
    .min(1, 'At least one impact project is required')
    .max(12, 'Cannot create more than 12 impact projects at once'),
  visionId: uuidSchema.optional().nullable(),
});

export type CreateImpactProjectInput = z.infer<typeof createImpactProjectSchema>;
export type UpdateImpactProjectInput = z.infer<typeof updateImpactProjectSchema>;
export type GetImpactProjectsQuery = z.infer<typeof getImpactProjectsQuerySchema>;
export type DeleteImpactProjectInput = z.infer<typeof deleteImpactProjectSchema>;
export type BulkCreateImpactProjectsInput = z.infer<typeof bulkCreateImpactProjectsSchema>;

// Backwards compatibility aliases
export const createPowerGoalSchema = createImpactProjectSchema;
export const updatePowerGoalSchema = updateImpactProjectSchema;
export const getPowerGoalsQuerySchema = getImpactProjectsQuerySchema;
export const deletePowerGoalSchema = deleteImpactProjectSchema;
export const bulkCreatePowerGoalsSchema = bulkCreateImpactProjectsSchema;
export type CreatePowerGoalInput = CreateImpactProjectInput;
export type UpdatePowerGoalInput = UpdateImpactProjectInput;
export type GetPowerGoalsQuery = GetImpactProjectsQuery;
export type DeletePowerGoalInput = DeleteImpactProjectInput;
export type BulkCreatePowerGoalsInput = BulkCreateImpactProjectsInput;
