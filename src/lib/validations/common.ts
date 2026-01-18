// Common validation schemas and utilities
import { z } from 'zod';

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Date string validation (YYYY-MM-DD)
export const dateStringSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format'
);

// Optional date that can be null, undefined, or empty string
export const optionalDateSchema = z.union([
  dateStringSchema,
  z.literal(''),  // Allow empty string
  z.null(),
  z.undefined(),
]).transform(val => val && val !== '' ? val : null);  // Transform empty string to null

// Time string validation (HH:MM or HH:MM:SS)
export const timeStringSchema = z.string().regex(
  /^\d{2}:\d{2}(:\d{2})?$/,
  'Time must be in HH:MM or HH:MM:SS format'
);

// Safe string that prevents XSS - strips HTML tags
export const safeStringSchema = (maxLength: number = 10000) =>
  z.string()
    .max(maxLength, `Text must be ${maxLength} characters or less`)
    .transform(val => val.replace(/<[^>]*>/g, '')); // Strip HTML tags

// Title field (required, non-empty)
export const titleSchema = z.string()
  .min(1, 'Title is required')
  .max(200, 'Title must be 200 characters or less')
  .transform(val => val.trim());

// Description field (optional)
export const descriptionSchema = z.string()
  .max(5000, 'Description must be 5000 characters or less')
  .transform(val => val.trim())
  .optional()
  .nullable();

// Color hex validation
export const colorSchema = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #6366f1)')
  .optional()
  .default('#6366f1');

// Score validation (0-100)
export const scoreSchema = z.number()
  .int('Score must be a whole number')
  .min(0, 'Score must be at least 0')
  .max(100, 'Score must be at most 100')
  .optional()
  .default(0);

// Priority validation (1-5)
export const prioritySchema = z.number()
  .int('Priority must be a whole number')
  .min(1, 'Priority must be at least 1')
  .max(5, 'Priority must be at most 5')
  .optional()
  .default(1);

// Year validation
export const yearSchema = z.number()
  .int('Year must be a whole number')
  .min(2020, 'Year must be 2020 or later')
  .max(2100, 'Year must be 2100 or earlier');

// Quarter validation (1-4)
export const quarterSchema = z.number()
  .int('Quarter must be a whole number')
  .min(1, 'Quarter must be 1-4')
  .max(4, 'Quarter must be 1-4');

// Month validation (1-12)
export const monthSchema = z.number()
  .int('Month must be a whole number')
  .min(1, 'Month must be 1-12')
  .max(12, 'Month must be 1-12');

// Email validation
export const emailSchema = z.string()
  .email('Invalid email address')
  .max(254, 'Email must be 254 characters or less')
  .transform(val => val.toLowerCase().trim());

// URL validation
export const urlSchema = z.string()
  .url('Invalid URL')
  .max(2000, 'URL must be 2000 characters or less');

// Positive integer
export const positiveIntSchema = z.number()
  .int('Must be a whole number')
  .positive('Must be a positive number');

// Non-negative integer
export const nonNegativeIntSchema = z.number()
  .int('Must be a whole number')
  .min(0, 'Must be 0 or greater');

// Status enum for common statuses
export const statusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

// DRIP quadrant validation
export const dripQuadrantSchema = z.enum(['delegation', 'replacement', 'investment', 'production']);

// Energy rating validation
export const energyRatingSchema = z.enum(['green', 'yellow', 'red']);

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

// Helper to create a safe parse function that returns formatted errors
export function parseWithErrors<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  errors: { field: string; message: string }[];
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((err: z.ZodIssue) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return {
    success: false,
    error: errors.map((e: { field: string; message: string }) => `${e.field}: ${e.message}`).join(', '),
    errors,
  };
}
