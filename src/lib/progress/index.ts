/**
 * Progress Calculation Library
 *
 * Provides weighted progress calculation, formula transparency,
 * and hierarchical rollup for the KPI cascade system.
 *
 * Usage:
 *   import { calculateWeightedProgress, buildProgressFormula } from '@/lib/progress';
 */

// Types
export type {
  CalculationMethod,
  WeightedKPI,
  ProgressComponent,
  ProgressFormula,
  ProgressResult,
  KpiAncestor,
} from './types';

// Calculator functions
export {
  calculateWeightedProgress,
  buildProgressFormula,
  deriveStatus,
  countCompletedChildren,
} from './calculator';

// Rollup functions
export {
  getAncestorsCteQuery,
  getChildrenWithProgressQuery,
  calculateKpiProgress,
  buildCacheUpdateData,
} from './rollup';

// Ancestor rollup utilities
export {
  rollupProgressToAncestors,
  recalculateParentChain,
  type AncestorProgressUpdate,
} from './ancestor-rollup';

// Tree building utilities
export {
  buildKpiTree,
  countTreeNodes,
  getLatestCalculationTime,
  type KpiTreeNode,
  type FlatKpiWithProgress,
} from './tree';
