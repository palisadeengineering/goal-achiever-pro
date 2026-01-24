/**
 * Tree Building Module
 *
 * Provides utilities for building nested KPI tree structures from flat database results.
 * Used by the goal-tree API endpoint for instant dashboard loads (API-01).
 */

import type { ProgressFormula } from './types';

/**
 * Flat KPI result from database query with progress cache joined
 * Matches the snake_case column names from the database
 */
export interface FlatKpiWithProgress {
  // Core KPI fields from vision_kpis table
  id: string;
  user_id: string;
  vision_id: string;
  level: string;
  title: string;
  description: string | null;
  target_value: string | null;
  unit: string | null;
  numeric_target: string | null;
  parent_kpi_id: string | null;
  weight: string | null;
  quarter: number | null;
  month: number | null;
  category: string | null;
  tracking_method: string | null;
  leads_to: string | null;
  best_time: string | null;
  time_required: string | null;
  why_it_matters: string | null;
  success_formula: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;

  // Progress cache fields (from LEFT JOIN)
  progress_percentage: string | null;
  status: string | null;
  child_count: number | null;
  completed_child_count: number | null;
  calculation_method: string | null;
  last_calculated_at: string | null;
}

/**
 * Nested KPI tree node for frontend consumption
 * Uses camelCase for frontend consistency
 */
export interface KpiTreeNode {
  // Core identity
  id: string;
  visionId: string;
  level: string;
  title: string;
  description: string | null;

  // Target configuration
  targetValue: string | null;
  unit: string | null;
  numericTarget: number | null;
  weight: number;

  // Hierarchy
  parentKpiId: string | null;
  sortOrder: number;

  // Time context
  quarter: number | null;
  month: number | null;

  // Additional metadata
  category: string | null;
  trackingMethod: string | null;
  leadsTo: string | null;
  bestTime: string | null;
  timeRequired: string | null;
  whyItMatters: string | null;

  // Progress from cache
  progress: number;
  status: string;
  childCount: number;
  completedChildCount: number;
  calculationMethod: string | null;
  lastCalculatedAt: string | null;

  // Nested children
  children: KpiTreeNode[];

  // Optional formula for transparency
  formula?: ProgressFormula;
}

/**
 * Transform a flat KPI with progress to a tree node
 * Handles null coalescing and type conversions
 */
function flatKpiToTreeNode(flat: FlatKpiWithProgress): KpiTreeNode {
  return {
    id: flat.id,
    visionId: flat.vision_id,
    level: flat.level,
    title: flat.title,
    description: flat.description,
    targetValue: flat.target_value,
    unit: flat.unit,
    numericTarget: flat.numeric_target ? parseFloat(flat.numeric_target) : null,
    weight: flat.weight ? parseFloat(flat.weight) : 1,
    parentKpiId: flat.parent_kpi_id,
    sortOrder: flat.sort_order ?? 0,
    quarter: flat.quarter,
    month: flat.month,
    category: flat.category,
    trackingMethod: flat.tracking_method,
    leadsTo: flat.leads_to,
    bestTime: flat.best_time,
    timeRequired: flat.time_required,
    whyItMatters: flat.why_it_matters,
    progress: flat.progress_percentage ? parseFloat(flat.progress_percentage) : 0,
    status: flat.status ?? 'not_started',
    childCount: flat.child_count ?? 0,
    completedChildCount: flat.completed_child_count ?? 0,
    calculationMethod: flat.calculation_method,
    lastCalculatedAt: flat.last_calculated_at,
    children: [], // Will be populated by buildKpiTree
  };
}

/**
 * Build a nested KPI tree from a flat array of KPIs with progress cache
 *
 * Algorithm:
 * 1. Create a Map<id, KpiTreeNode> for O(1) lookup
 * 2. Initialize each node with empty children array
 * 3. Iterate flat list, add each node to its parent's children array
 * 4. Return nodes where parentKpiId is null (root nodes)
 * 5. Sort children by sortOrder at each level
 *
 * @param flatKpis - Flat array of KPIs with their progress cache joined
 * @returns Nested tree structure with root nodes at top level
 */
export function buildKpiTree(flatKpis: FlatKpiWithProgress[]): KpiTreeNode[] {
  if (!flatKpis || flatKpis.length === 0) {
    return [];
  }

  // Step 1 & 2: Create lookup map and convert to tree nodes
  const nodeMap = new Map<string, KpiTreeNode>();

  for (const flat of flatKpis) {
    const node = flatKpiToTreeNode(flat);
    nodeMap.set(flat.id, node);
  }

  // Step 3: Link children to parents
  const rootNodes: KpiTreeNode[] = [];

  for (const flat of flatKpis) {
    const node = nodeMap.get(flat.id);
    if (!node) continue;

    if (flat.parent_kpi_id) {
      const parent = nodeMap.get(flat.parent_kpi_id);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not in results (may be filtered out), treat as root
        rootNodes.push(node);
      }
    } else {
      // No parent - this is a root node
      rootNodes.push(node);
    }
  }

  // Step 4 & 5: Sort children at each level recursively
  function sortChildrenRecursively(nodes: KpiTreeNode[]): void {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortChildrenRecursively(node.children);
      }
    }
  }

  sortChildrenRecursively(rootNodes);

  return rootNodes;
}

/**
 * Get total KPI count from a tree (including nested children)
 */
export function countTreeNodes(tree: KpiTreeNode[]): number {
  let count = 0;

  function countRecursive(nodes: KpiTreeNode[]): void {
    for (const node of nodes) {
      count++;
      if (node.children.length > 0) {
        countRecursive(node.children);
      }
    }
  }

  countRecursive(tree);
  return count;
}

/**
 * Get the most recent lastCalculatedAt timestamp from a tree
 */
export function getLatestCalculationTime(tree: KpiTreeNode[]): string | null {
  let latest: string | null = null;

  function findLatest(nodes: KpiTreeNode[]): void {
    for (const node of nodes) {
      if (node.lastCalculatedAt) {
        if (!latest || node.lastCalculatedAt > latest) {
          latest = node.lastCalculatedAt;
        }
      }
      if (node.children.length > 0) {
        findLatest(node.children);
      }
    }
  }

  findLatest(tree);
  return latest;
}
