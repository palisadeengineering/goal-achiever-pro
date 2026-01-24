'use client';

/**
 * Cascade Generation Hook
 *
 * Mutation hook for triggering AI cascade generation from a vision.
 * Supports both full regeneration and incremental mode.
 *
 * Incremental mode (default) preserves existing KPIs and only adds new ones.
 * Full mode generates a complete new cascade (use carefully - may create duplicates).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goalTreeKeys } from './query-keys';

export interface GenerateCascadeInput {
  visionId: string;
  quarters?: number[];
  goalsPerQuarter?: number;
  mode?: 'full' | 'incremental';
}

export interface GenerateCascadeResponse {
  success: boolean;
  visionId: string;
  mode: 'full' | 'incremental';
  summary: string;
  successFormula: string;
  totalEstimatedHours: number;
  saved: {
    powerGoals: number;
    monthlyTargets: number;
    weeklyTargets: number;
    dailyActions: number;
    quarterlyKpis: number;
    monthlyKpis: number;
    weeklyKpis: number;
    dailyKpis: number;
  };
  skipped?: {
    quarterlyKpis: number;
    monthlyKpis: number;
    weeklyKpis: number;
    dailyKpis: number;
  };
  message: string;
}

/**
 * Mutation hook for generating KPI cascade from a vision.
 *
 * @param visionId - The vision ID to generate cascade for
 * @returns Mutation object with mutate, isPending, error, etc.
 *
 * @example
 * ```tsx
 * const { mutate: generate, isPending } = useGenerateCascade(visionId);
 *
 * // Full regeneration (creates new items even if similar exist)
 * generate({ visionId, mode: 'full' });
 *
 * // Incremental (adds new, preserves existing) - DEFAULT
 * generate({ visionId, mode: 'incremental' });
 *
 * // Custom quarters and goals per quarter
 * generate({ visionId, quarters: [1, 2], goalsPerQuarter: 2, mode: 'incremental' });
 * ```
 */
export function useGenerateCascade(visionId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<GenerateCascadeResponse, Error, GenerateCascadeInput>({
    mutationFn: async (input: GenerateCascadeInput) => {
      const response = await fetch(`/api/visions/${input.visionId}/generate-cascade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quarters: input.quarters ?? [1, 2, 3, 4],
          goalsPerQuarter: input.goalsPerQuarter ?? 3,
          mode: input.mode ?? 'incremental', // Default to incremental for safety
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate cascade');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate goal tree to show new/updated KPIs
      if (visionId) {
        queryClient.invalidateQueries({ queryKey: goalTreeKeys.tree(visionId) });
      }
    },
  });
}
