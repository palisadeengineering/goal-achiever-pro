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
  useCreateKpi,
  type LogKpiRequest,
  type LogKpiResponse,
  type OverrideProgressRequest,
  type UseLogKpiReturn,
  type UseOverrideProgressReturn,
  type CreateKpiInput,
  type CreateKpiResponse,
} from './use-kpi-mutations';

// Cascade generation mutation hook
export {
  useGenerateCascade,
  type GenerateCascadeInput,
  type GenerateCascadeResponse,
} from './use-cascade-generation';

// Gamification hooks
export {
  useGamificationStats,
  useAchievements,
  gamificationKeys,
  type AchievementWithProgress,
} from './use-gamification';

// MINS hooks
export {
  useMins,
  useMin,
  useCreateMin,
  useUpdateMin,
  useDeleteMin,
  useToggleMinComplete,
  minsKeys,
  type Min,
  type CreateMinInput,
  type UpdateMinInput,
} from './use-mins';
