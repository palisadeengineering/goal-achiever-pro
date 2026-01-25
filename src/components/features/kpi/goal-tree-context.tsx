'use client';

/**
 * Goal Tree Context
 *
 * Provides state management for expand/collapse, selection, and focus
 * across the goal hierarchy tree. Used by GoalTreeNode for coordinated
 * tree behavior and by breadcrumb for path derivation.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { KpiTreeNode } from '@/lib/progress';

/**
 * Context value interface for the goal tree state
 */
export interface GoalTreeContextValue {
  // Expanded state (which nodes are open)
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setExpanded: (ids: string[]) => void;

  // Selection state (which node is selected)
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;

  // Focus state (which node has keyboard focus - for roving tabindex)
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;

  // Tree data (for breadcrumb path derivation)
  tree: KpiTreeNode[];
  visionTitle: string;
}

const GoalTreeContext = createContext<GoalTreeContextValue | null>(null);

/**
 * Recursively collect all node IDs from the tree
 */
function collectAllIds(nodes: KpiTreeNode[]): string[] {
  const ids: string[] = [];

  function traverse(nodeList: KpiTreeNode[]): void {
    for (const node of nodeList) {
      ids.push(node.id);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return ids;
}

interface GoalTreeProviderProps {
  children: ReactNode;
  tree: KpiTreeNode[];
  visionTitle: string;
  defaultExpanded?: string[];
}

/**
 * Provider component for goal tree state management
 *
 * @param children - React children to render within provider
 * @param tree - The KPI tree data structure
 * @param visionTitle - Title of the vision for breadcrumb display
 * @param defaultExpanded - Optional array of node IDs to expand by default
 */
export function GoalTreeProvider({
  children,
  tree,
  visionTitle,
  defaultExpanded,
}: GoalTreeProviderProps) {
  // Expanded state - which nodes are open
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(defaultExpanded ?? [])
  );

  // Selection state - which node is selected
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Focus state - which node has keyboard focus (roving tabindex)
  const [focusedId, setFocusedId] = useState<string | null>(null);

  /**
   * Toggle expanded state for a single node
   */
  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * Expand all nodes in the tree
   */
  const expandAll = useCallback(() => {
    const allIds = collectAllIds(tree);
    setExpandedIds(new Set(allIds));
  }, [tree]);

  /**
   * Collapse all nodes in the tree
   */
  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  /**
   * Set expanded state for multiple nodes at once
   * Useful for restoring state or setting default open nodes
   */
  const setExpanded = useCallback((ids: string[]) => {
    setExpandedIds(new Set(ids));
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<GoalTreeContextValue>(
    () => ({
      expandedIds,
      toggleExpanded,
      expandAll,
      collapseAll,
      setExpanded,
      selectedId,
      setSelectedId,
      focusedId,
      setFocusedId,
      tree,
      visionTitle,
    }),
    [
      expandedIds,
      toggleExpanded,
      expandAll,
      collapseAll,
      setExpanded,
      selectedId,
      focusedId,
      tree,
      visionTitle,
    ]
  );

  return (
    <GoalTreeContext.Provider value={contextValue}>
      {children}
    </GoalTreeContext.Provider>
  );
}

/**
 * Hook to access goal tree context
 *
 * @throws Error if used outside of GoalTreeProvider
 */
export function useGoalTreeContext(): GoalTreeContextValue {
  const context = useContext(GoalTreeContext);

  if (!context) {
    throw new Error(
      'useGoalTreeContext must be used within a GoalTreeProvider'
    );
  }

  return context;
}
