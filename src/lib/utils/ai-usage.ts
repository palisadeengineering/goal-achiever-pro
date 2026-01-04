import { createClient } from '@/lib/supabase/server';

// Pricing per 1M tokens (in cents) - GPT-4o-mini
const PRICING = {
  'gpt-4o-mini': {
    input: 15, // $0.15 per 1M tokens = 15 cents
    output: 60, // $0.60 per 1M tokens = 60 cents
  },
  // Claude pricing if needed
  'claude-3-5-sonnet': {
    input: 300, // $3 per 1M tokens
    output: 1500, // $15 per 1M tokens
  },
  'claude-3-haiku': {
    input: 25, // $0.25 per 1M tokens
    output: 125, // $1.25 per 1M tokens
  },
};

type ModelName = keyof typeof PRICING;

interface LogAIUsageParams {
  userId: string;
  endpoint: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  requestType: string;
  success?: boolean;
  errorMessage?: string;
  responseTimeMs?: number;
}

/**
 * Calculate estimated cost in cents based on token usage
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = PRICING[model as ModelName] || PRICING['gpt-4o-mini'];

  // Cost = (tokens / 1,000,000) * price_per_million
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Log AI API usage to the database
 */
export async function logAIUsage({
  userId,
  endpoint,
  model,
  promptTokens,
  completionTokens,
  requestType,
  success = true,
  errorMessage,
  responseTimeMs,
}: LogAIUsageParams): Promise<void> {
  try {
    const supabase = await createClient();
    if (!supabase) return;

    const totalTokens = promptTokens + completionTokens;
    const estimatedCostCents = calculateCost(model, promptTokens, completionTokens);

    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      endpoint,
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      estimated_cost_cents: estimatedCostCents,
      request_type: requestType,
      success,
      error_message: errorMessage,
      response_time_ms: responseTimeMs,
    });
  } catch (error) {
    // Don't throw - logging should not break the main flow
    console.error('Failed to log AI usage:', error);
  }
}

/**
 * Extract token usage from OpenAI API response
 */
export function extractOpenAIUsage(response: {
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}): { promptTokens: number; completionTokens: number } {
  return {
    promptTokens: response.usage?.prompt_tokens || 0,
    completionTokens: response.usage?.completion_tokens || 0,
  };
}

/**
 * Wrapper to time and log AI API calls
 */
export async function withAILogging<T>(
  userId: string,
  endpoint: string,
  requestType: string,
  model: string,
  apiCall: () => Promise<T & { usage?: { prompt_tokens?: number; completion_tokens?: number } }>
): Promise<T> {
  const startTime = Date.now();

  try {
    const response = await apiCall();
    const responseTimeMs = Date.now() - startTime;
    const { promptTokens, completionTokens } = extractOpenAIUsage(response);

    // Log usage in the background
    logAIUsage({
      userId,
      endpoint,
      model,
      promptTokens,
      completionTokens,
      requestType,
      success: true,
      responseTimeMs,
    });

    return response;
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;

    // Log the error
    logAIUsage({
      userId,
      endpoint,
      model,
      promptTokens: 0,
      completionTokens: 0,
      requestType,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs,
    });

    throw error;
  }
}
