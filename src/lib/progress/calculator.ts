/**
 * Progress Calculator
 *
 * Core weighted progress calculation logic using decimal.js for precision.
 * Provides formula transparency for UI display (PROG-05).
 */

import Decimal from 'decimal.js';
import type {
  WeightedKPI,
  ProgressFormula,
  ProgressComponent,
} from './types';

// Configure decimal.js for percentage precision
Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculate weighted progress from child KPIs
 * Returns progress percentage 0-100 rounded to 2 decimal places
 *
 * Formula: sum(progress_i * weight_i) / sum(weight_i)
 *
 * Edge cases:
 * - Empty children array: returns 0
 * - Zero total weight: returns 0
 * - Null/undefined weights: defaults to 1
 * - Null/undefined progress: defaults to 0
 */
export function calculateWeightedProgress(children: WeightedKPI[]): number {
  if (children.length === 0) return 0;

  const totalWeight = children.reduce(
    (sum, c) => sum.plus(new Decimal(c.weight || 1)),
    new Decimal(0)
  );

  if (totalWeight.isZero()) return 0;

  const weightedSum = children.reduce(
    (sum, c) =>
      sum.plus(
        new Decimal(c.progress || 0).times(new Decimal(c.weight || 1))
      ),
    new Decimal(0)
  );

  return weightedSum.dividedBy(totalWeight).toDecimalPlaces(2).toNumber();
}

/**
 * Build transparent formula breakdown for UI (PROG-05)
 *
 * Creates a human-readable formula explanation and component breakdown
 * that can be displayed in the UI to show exactly how progress was calculated.
 *
 * @param children - Array of child KPIs with their progress and weights
 * @param options - Optional manual override settings
 * @returns ProgressFormula with breakdown and human-readable explanation
 */
export function buildProgressFormula(
  children: WeightedKPI[],
  options?: {
    manualOverride?: number;
    overrideReason?: string;
    overrideBy?: string;
  }
): ProgressFormula {
  if (children.length === 0) {
    return {
      resultPercentage: options?.manualOverride ?? 0,
      method: options?.manualOverride !== undefined ? 'manual_override' : 'auto',
      components: [],
      formula: 'No child items',
      overrideReason: options?.overrideReason,
    };
  }

  const totalWeight = new Decimal(
    children.reduce((sum, c) => sum + (c.weight || 1), 0)
  );

  const components: ProgressComponent[] = children.map((c) => {
    const weight = new Decimal(c.weight || 1);
    const progress = new Decimal(c.progress || 0);
    const contribution = totalWeight.isZero()
      ? 0
      : progress
          .times(weight)
          .dividedBy(totalWeight)
          .toDecimalPlaces(2)
          .toNumber();

    return {
      kpiId: c.id,
      kpiTitle: c.title,
      progress: c.progress || 0,
      weight: c.weight || 1,
      contribution,
    };
  });

  const calculatedProgress = calculateWeightedProgress(children);

  // Build human-readable formula
  const parts = children.map((c) => `(${c.progress || 0}% x ${c.weight || 1})`);
  const formula = `(${parts.join(' + ')}) / ${totalWeight.toNumber()} = ${calculatedProgress.toFixed(2)}%`;

  const isManualOverride = options?.manualOverride !== undefined;

  return {
    resultPercentage: isManualOverride
      ? options!.manualOverride!
      : calculatedProgress,
    method: isManualOverride ? 'manual_override' : 'auto',
    components,
    formula: isManualOverride
      ? `Manual override: ${options.manualOverride}% (auto-calc would be ${calculatedProgress.toFixed(2)}%)`
      : formula,
    overrideReason: options?.overrideReason,
    overrideBy: options?.overrideBy,
    overrideAt: isManualOverride ? new Date() : undefined,
  };
}

/**
 * Derive status from progress percentage
 *
 * Status levels:
 * - completed: >= 100%
 * - not_started: exactly 0%
 * - at_risk: overdue and < 80%, or progress < 30%
 * - on_track: >= 70%
 * - in_progress: >= 30%
 */
export function deriveStatus(
  progressPercentage: number,
  options?: { isOverdue?: boolean }
): 'not_started' | 'in_progress' | 'at_risk' | 'on_track' | 'completed' {
  if (progressPercentage >= 100) return 'completed';
  if (progressPercentage === 0) return 'not_started';
  if (options?.isOverdue && progressPercentage < 80) return 'at_risk';
  if (progressPercentage >= 70) return 'on_track';
  if (progressPercentage >= 30) return 'in_progress';
  return 'at_risk';
}

/**
 * Count completed children (progress >= 100)
 */
export function countCompletedChildren(children: WeightedKPI[]): number {
  return children.filter((c) => c.progress >= 100).length;
}
