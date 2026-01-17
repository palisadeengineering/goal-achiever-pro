// Validation schemas for power-goals API
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

// Create power goal request
export const createPowerGoalSchema = z.object({
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

// Update power goal request
export const updatePowerGoalSchema = z.object({
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

// Query params for getting power goals
export const getPowerGoalsQuerySchema = z.object({
  year: z.string().transform(val => parseInt(val, 10)).pipe(yearSchema).optional(),
  visionId: uuidSchema.optional(),
  status: z.enum(['active', 'completed', 'archived', 'all']).optional().default('active'),
});

// Delete power goal
export const deletePowerGoalSchema = z.object({
  id: uuidSchema,
});

// Bulk create power goals (from AI generation)
const powerGoalItemSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  quarter: quarterSchema,
  category: safeStringSchema(100).optional().nullable(),
  targetDate: optionalDateSchema,
});

export const bulkCreatePowerGoalsSchema = z.object({
  powerGoals: z.array(powerGoalItemSchema)
    .min(1, 'At least one power goal is required')
    .max(12, 'Cannot create more than 12 power goals at once'),
  visionId: uuidSchema.optional().nullable(),
});

export type CreatePowerGoalInput = z.infer<typeof createPowerGoalSchema>;
export type UpdatePowerGoalInput = z.infer<typeof updatePowerGoalSchema>;
export type GetPowerGoalsQuery = z.infer<typeof getPowerGoalsQuerySchema>;
export type DeletePowerGoalInput = z.infer<typeof deletePowerGoalSchema>;
export type BulkCreatePowerGoalsInput = z.infer<typeof bulkCreatePowerGoalsSchema>;
