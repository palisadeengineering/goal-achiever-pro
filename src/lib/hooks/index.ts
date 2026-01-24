/**
 * Hooks Barrel Export
 *
 * Centralized exports for custom React hooks.
 */

// Query key factory for external cache manipulation
export { goalTreeKeys, type GoalTreeKeys } from './query-keys';

// Goal tree and KPI mutation hooks
export {
  useGoalTree,
  getGoalTreeQueryKey,
  type GoalTreeResponse,
  type UseGoalTreeReturn,
} from './use-goal-tree';
export {
  useLogKpi,
  useOverrideProgress,
  type LogKpiRequest,
  type LogKpiResponse,
  type OverrideProgressRequest,
  type UseLogKpiReturn,
  type UseOverrideProgressReturn,
} from './use-kpi-mutations';
