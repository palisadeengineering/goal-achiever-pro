/**
 * Progress Calculation Types
 *
 * Core types for the weighted progress calculation system.
 * Enables PROG-01 (parent updates), PROG-02 (full chain rollup),
 * PROG-03 (weights), and PROG-05 (formula transparency).
 */

// CalculationMethod - how progress was calculated
export type CalculationMethod = 'auto' | 'manual_override';

// WeightedKPI - input for progress calculations
export interface WeightedKPI {
  id: string;
  title: string;
  progress: number; // 0-100
  weight: number; // Default 1, user-configurable
}

// ProgressComponent - individual contribution to parent progress
export interface ProgressComponent {
  kpiId: string;
  kpiTitle: string;
  progress: number;
  weight: number;
  contribution: number; // (weight * progress) / totalWeight
}

// ProgressFormula - transparent breakdown for UI (PROG-05)
export interface ProgressFormula {
  resultPercentage: number;
  method: CalculationMethod;
  components: ProgressComponent[];
  formula: string; // Human-readable: "((85% * 2) + (60% * 1)) / 3 = 76.67%"
  overrideReason?: string;
  overrideBy?: string;
  overrideAt?: Date;
}

// ProgressResult - return type from calculation functions
export interface ProgressResult {
  kpiId: string;
  progressPercentage: number;
  formula: ProgressFormula;
  childCount: number;
  completedChildCount: number;
  weightedProgress: number;
  totalWeight: number;
  status: 'not_started' | 'in_progress' | 'at_risk' | 'on_track' | 'completed';
}

// KpiAncestor - result from recursive ancestor query
export interface KpiAncestor {
  id: string;
  parentKpiId: string | null;
  level: string;
  title: string;
  depth: number;
}
