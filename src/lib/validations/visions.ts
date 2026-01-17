// Validation schemas for visions API
import { z } from 'zod';
import {
  uuidSchema,
  titleSchema,
  descriptionSchema,
  optionalDateSchema,
  colorSchema,
  scoreSchema,
  safeStringSchema,
} from './common';

// Create vision request
export const createVisionSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  // SMART components
  specific: safeStringSchema(2000).optional().nullable(),
  measurable: safeStringSchema(2000).optional().nullable(),
  attainable: safeStringSchema(2000).optional().nullable(),
  realistic: safeStringSchema(2000).optional().nullable(),
  timeBound: optionalDateSchema,
  targetDate: optionalDateSchema,
  // 300% Rule scores
  clarityScore: scoreSchema,
  beliefScore: scoreSchema,
  consistencyScore: scoreSchema,
  // Appearance
  color: colorSchema,
  // Affirmation
  affirmationText: safeStringSchema(1000).optional().nullable(),
});

// Update vision request
export const updateVisionSchema = z.object({
  id: uuidSchema,
  title: titleSchema.optional(),
  description: descriptionSchema,
  // SMART components
  specific: safeStringSchema(2000).optional().nullable(),
  measurable: safeStringSchema(2000).optional().nullable(),
  attainable: safeStringSchema(2000).optional().nullable(),
  realistic: safeStringSchema(2000).optional().nullable(),
  timeBound: optionalDateSchema,
  targetDate: optionalDateSchema,
  // 300% Rule scores
  clarityScore: scoreSchema.optional(),
  beliefScore: scoreSchema.optional(),
  consistencyScore: scoreSchema.optional(),
  // Appearance
  color: colorSchema.optional(),
  // Affirmation
  affirmationText: safeStringSchema(1000).optional().nullable(),
});

// Delete vision query params
export const deleteVisionSchema = z.object({
  id: uuidSchema,
});

export type CreateVisionInput = z.infer<typeof createVisionSchema>;
export type UpdateVisionInput = z.infer<typeof updateVisionSchema>;
export type DeleteVisionInput = z.infer<typeof deleteVisionSchema>;
