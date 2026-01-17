// Validation schemas for targets API (monthly, weekly, daily)
import { z } from 'zod';
import {
  uuidSchema,
  titleSchema,
  descriptionSchema,
  optionalDateSchema,
  yearSchema,
  monthSchema,
  nonNegativeIntSchema,
  safeStringSchema,
  statusSchema,
} from './common';

// Create monthly target
export const createMonthlyTargetSchema = z.object({
  powerGoalId: uuidSchema,
  title: titleSchema,
  description: descriptionSchema,
  targetMonth: monthSchema,
  targetYear: yearSchema,
  keyMetric: safeStringSchema(200).optional().nullable(),
  targetValue: z.number().optional().nullable(),
  sortOrder: nonNegativeIntSchema.optional().default(0),
  // Assignee
  assigneeId: uuidSchema.optional().nullable(),
  assigneeName: safeStringSchema(200).optional().nullable(),
});

// Update monthly target
export const updateMonthlyTargetSchema = z.object({
  id: uuidSchema,
  title: titleSchema.optional(),
  description: descriptionSchema,
  keyMetric: safeStringSchema(200).optional().nullable(),
  targetValue: z.number().optional().nullable(),
  currentValue: z.number().optional().nullable(),
  status: statusSchema.optional(),
  sortOrder: nonNegativeIntSchema.optional(),
  assigneeId: uuidSchema.optional().nullable(),
  assigneeName: safeStringSchema(200).optional().nullable(),
});

// Create weekly target
export const createWeeklyTargetSchema = z.object({
  monthlyTargetId: uuidSchema,
  title: titleSchema,
  description: descriptionSchema,
  weekNumber: z.number().int().min(1).max(5),
  weekStartDate: optionalDateSchema,
  weekEndDate: optionalDateSchema,
  keyMetric: safeStringSchema(200).optional().nullable(),
  targetValue: z.number().optional().nullable(),
  sortOrder: nonNegativeIntSchema.optional().default(0),
  assigneeId: uuidSchema.optional().nullable(),
  assigneeName: safeStringSchema(200).optional().nullable(),
});

// Update weekly target
export const updateWeeklyTargetSchema = z.object({
  id: uuidSchema,
  title: titleSchema.optional(),
  description: descriptionSchema,
  keyMetric: safeStringSchema(200).optional().nullable(),
  targetValue: z.number().optional().nullable(),
  currentValue: z.number().optional().nullable(),
  status: statusSchema.optional(),
  sortOrder: nonNegativeIntSchema.optional(),
  assigneeId: uuidSchema.optional().nullable(),
  assigneeName: safeStringSchema(200).optional().nullable(),
});

// Create daily action
export const createDailyActionSchema = z.object({
  weeklyTargetId: uuidSchema,
  title: titleSchema,
  description: descriptionSchema,
  actionDate: optionalDateSchema,
  estimatedMinutes: nonNegativeIntSchema.optional().default(30),
  keyMetric: safeStringSchema(200).optional().nullable(),
  targetValue: z.number().optional().nullable(),
  sortOrder: nonNegativeIntSchema.optional().default(0),
  assigneeId: uuidSchema.optional().nullable(),
  assigneeName: safeStringSchema(200).optional().nullable(),
  // Scheduling
  scheduledStartTime: z.string().optional().nullable(),
  scheduledEndTime: z.string().optional().nullable(),
});

// Update daily action
export const updateDailyActionSchema = z.object({
  id: uuidSchema,
  title: titleSchema.optional(),
  description: descriptionSchema,
  actionDate: optionalDateSchema,
  estimatedMinutes: nonNegativeIntSchema.optional(),
  keyMetric: safeStringSchema(200).optional().nullable(),
  targetValue: z.number().optional().nullable(),
  currentValue: z.number().optional().nullable(),
  status: statusSchema.optional(),
  sortOrder: nonNegativeIntSchema.optional(),
  assigneeId: uuidSchema.optional().nullable(),
  assigneeName: safeStringSchema(200).optional().nullable(),
  scheduledStartTime: z.string().optional().nullable(),
  scheduledEndTime: z.string().optional().nullable(),
});

// Bulk save targets (from AI generation)
const dayOfWeekSchema = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

const dailyActionItemSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  title: titleSchema,
  description: descriptionSchema,
  estimatedMinutes: nonNegativeIntSchema.optional().default(30),
  keyMetric: safeStringSchema(200).optional().nullable(),
  targetValue: z.number().optional().nullable(),
});

const weeklyTargetItemSchema = z.object({
  weekNumber: z.number().int().min(1).max(5),
  title: titleSchema,
  description: descriptionSchema,
  keyMetric: safeStringSchema(200).optional().nullable(),
  targetValue: z.number().optional().nullable(),
  dailyActions: z.array(dailyActionItemSchema).optional().default([]),
});

const monthlyTargetItemSchema = z.object({
  month: monthSchema,
  monthName: safeStringSchema(20),
  title: titleSchema,
  description: descriptionSchema,
  keyMetric: safeStringSchema(200).optional().nullable(),
  targetValue: z.number().optional().nullable(),
  weeklyTargets: z.array(weeklyTargetItemSchema).optional().default([]),
});

export const bulkSaveTargetsSchema = z.object({
  powerGoalId: uuidSchema,
  year: yearSchema,
  monthlyTargets: z.array(monthlyTargetItemSchema)
    .min(1, 'At least one monthly target is required')
    .max(12, 'Cannot create more than 12 monthly targets'),
});

export type CreateMonthlyTargetInput = z.infer<typeof createMonthlyTargetSchema>;
export type UpdateMonthlyTargetInput = z.infer<typeof updateMonthlyTargetSchema>;
export type CreateWeeklyTargetInput = z.infer<typeof createWeeklyTargetSchema>;
export type UpdateWeeklyTargetInput = z.infer<typeof updateWeeklyTargetSchema>;
export type CreateDailyActionInput = z.infer<typeof createDailyActionSchema>;
export type UpdateDailyActionInput = z.infer<typeof updateDailyActionSchema>;
export type BulkSaveTargetsInput = z.infer<typeof bulkSaveTargetsSchema>;
