// Validation schemas for AI API endpoints
import { z } from 'zod';
import {
  uuidSchema,
  safeStringSchema,
  yearSchema,
  quarterSchema,
  monthSchema,
  optionalDateSchema,
} from './common';

// Generate SMART goals from vision
export const generateSmartSchema = z.object({
  vision: safeStringSchema(2000)
    .refine(val => val.length >= 10, 'Vision must be at least 10 characters'),
  context: safeStringSchema(2000).optional(),
});

// Generate impact projects from SMART goals
export const generateImpactProjectsSchema = z.object({
  visionId: uuidSchema,
  vision: safeStringSchema(2000),
  specific: safeStringSchema(2000).optional(),
  measurable: safeStringSchema(2000).optional(),
  attainable: safeStringSchema(2000).optional(),
  realistic: safeStringSchema(2000).optional(),
  timeBound: optionalDateSchema,
  year: yearSchema.optional(),
  numberOfGoals: z.number().int().min(1).max(12).optional().default(12),
});

// Generate KPIs
export const generateKpisSchema = z.object({
  visionId: uuidSchema,
  visionTitle: safeStringSchema(200),
  visionDescription: safeStringSchema(2000).optional(),
  specific: safeStringSchema(2000).optional(),
  measurable: safeStringSchema(2000).optional(),
  targetDate: optionalDateSchema,
});

// Generate targets (monthly/weekly)
export const generateTargetsSchema = z.object({
  impactProjectId: uuidSchema,
  impactProjectTitle: safeStringSchema(200),
  impactProjectDescription: safeStringSchema(2000).optional(),
  targetMonth: monthSchema.optional(),
  targetYear: yearSchema.optional(),
  granularity: z.enum(['monthly', 'weekly', 'daily']).optional().default('monthly'),
});

// Suggest vision improvements
export const suggestVisionSchema = z.object({
  vision: safeStringSchema(2000)
    .refine(val => val.length >= 5, 'Vision must be at least 5 characters'),
  currentSmart: z.object({
    specific: safeStringSchema(2000).optional(),
    measurable: safeStringSchema(2000).optional(),
    attainable: safeStringSchema(2000).optional(),
    realistic: safeStringSchema(2000).optional(),
  }).optional(),
});

// Generate affirmation
export const generateAffirmationSchema = z.object({
  visionTitle: safeStringSchema(200),
  visionDescription: safeStringSchema(2000).optional(),
  specific: safeStringSchema(2000).optional(),
  style: z.enum(['motivational', 'calm', 'powerful', 'grateful']).optional().default('motivational'),
});

// Suggest non-negotiables
export const suggestNonNegotiablesSchema = z.object({
  visionId: uuidSchema,
  visionTitle: safeStringSchema(200),
  visionDescription: safeStringSchema(2000).optional(),
  existingNonNegotiables: z.array(safeStringSchema(200)).optional().default([]),
});

// Suggest tags
export const suggestTagsSchema = z.object({
  activityName: safeStringSchema(200),
  activityDescription: safeStringSchema(500).optional(),
  existingTags: z.array(safeStringSchema(50)).optional().default([]),
});

// Suggest date
export const suggestDateSchema = z.object({
  goalTitle: safeStringSchema(200),
  goalDescription: safeStringSchema(2000).optional(),
  context: safeStringSchema(1000).optional(),
});

// Generate backtrack plan
export const generateBacktrackSchema = z.object({
  visionId: uuidSchema,
  visionTitle: safeStringSchema(200),
  targetDate: optionalDateSchema,
  availableHoursPerWeek: z.number().min(1).max(168),
  startDate: optionalDateSchema,
});

// Generate monthly projects
export const generateMonthlyProjectsSchema = z.object({
  impactProjectId: uuidSchema,
  impactProjectTitle: safeStringSchema(200),
  impactProjectDescription: safeStringSchema(2000).optional(),
  quarter: quarterSchema,
  year: yearSchema,
});

// Generate questions (strategic discovery)
export const generateQuestionsSchema = z.object({
  topic: safeStringSchema(200),
  context: safeStringSchema(2000).optional(),
  previousAnswers: z.record(z.string(), safeStringSchema(2000)).optional(),
});

// Strategic discovery
export const strategicDiscoverySchema = z.object({
  visionId: uuidSchema,
  section: z.enum(['revenue', 'positioning', 'product', 'acquisition']),
  userInput: safeStringSchema(5000),
  previousContext: z.record(z.string(), z.unknown()).optional(),
});

// Calculate revenue
export const calculateRevenueSchema = z.object({
  revenueTarget: z.number().positive(),
  pricingModel: z.enum(['mass_market', 'prosumer', 'enterprise', 'hybrid']),
  basePrice: z.number().min(0).optional(),
  premiumPrice: z.number().min(0).optional(),
});

// Generate pricing models
export const generatePricingModelsSchema = z.object({
  revenueTarget: z.number().positive(),
  productDescription: safeStringSchema(2000).optional(),
  targetCustomer: safeStringSchema(500).optional(),
});

// Edit KPI
export const editKpiSchema = z.object({
  kpiId: uuidSchema,
  currentTitle: safeStringSchema(200),
  currentTarget: safeStringSchema(200).optional(),
  editInstruction: safeStringSchema(500),
});

// Suggest event cleanup
export const suggestEventCleanupSchema = z.object({
  events: z.array(z.object({
    id: z.string(),
    title: safeStringSchema(200),
    startTime: z.string(),
    endTime: z.string(),
  })).max(100),
});

export type GenerateSmartInput = z.infer<typeof generateSmartSchema>;
export type GenerateImpactProjectsInput = z.infer<typeof generateImpactProjectsSchema>;
// Backwards compatibility alias
export const generatePowerGoalsSchema = generateImpactProjectsSchema;
export type GeneratePowerGoalsInput = GenerateImpactProjectsInput;
export type GenerateKpisInput = z.infer<typeof generateKpisSchema>;
export type GenerateTargetsInput = z.infer<typeof generateTargetsSchema>;
export type SuggestVisionInput = z.infer<typeof suggestVisionSchema>;
export type GenerateAffirmationInput = z.infer<typeof generateAffirmationSchema>;
