'use client';

/**
 * Goal Tree Breadcrumb Component
 *
 * Provides hierarchical breadcrumb navigation from Vision to the currently
 * selected KPI in the goal tree.
 */

import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { KpiTreeNode } from '@/lib/progress';

/**
 * Item in the breadcrumb path
 */
export interface BreadcrumbPathItem {
  /** Unique identifier (use 'vision' for the root vision item) */
  id: string;
  /** Display label */
  label: string;
  /** Optional KPI level for styling (e.g., 'strategic', 'quarterly') */
  level?: string;
}

/**
 * Find the path from root to a target node in the tree
 *
 * @param nodes - Tree nodes to search
 * @param targetId - ID of the node to find
 * @returns Array of nodes from root to target, or null if not found
 */
function findPathToNode(
  nodes: KpiTreeNode[],
  targetId: string
): KpiTreeNode[] | null {
  for (const node of nodes) {
    // Found the target
    if (node.id === targetId) {
      return [node];
    }

    // Search children
    if (node.children?.length) {
      const childPath = findPathToNode(node.children, targetId);
      if (childPath) {
        return [node, ...childPath];
      }
    }
  }

  return null;
}

/**
 * Derives the breadcrumb path from Vision root to the selected node.
 *
 * @param selectedId - ID of the currently selected KPI (null for vision root)
 * @param tree - The full KPI tree structure
 * @param visionTitle - Title of the vision (root node label)
 * @returns Array starting with Vision, then each ancestor KPI down to selected
 *
 * @example
 * ```ts
 * const path = deriveBreadcrumbPath('kpi-123', tree, 'My Vision');
 * // Returns:
 * // [
 * //   { id: 'vision', label: 'My Vision' },
 * //   { id: 'kpi-456', label: 'Q1 Strategic Goal', level: 'strategic' },
 * //   { id: 'kpi-123', label: 'Monthly Target', level: 'quarterly' }
 * // ]
 * ```
 */
export function deriveBreadcrumbPath(
  selectedId: string | null,
  tree: KpiTreeNode[],
  visionTitle: string
): BreadcrumbPathItem[] {
  // Always start with the vision as root
  const rootItem: BreadcrumbPathItem = {
    id: 'vision',
    label: visionTitle || 'Vision',
  };

  // If no selection, just return vision
  if (!selectedId) {
    return [rootItem];
  }

  // Special case: if selectedId is 'vision', return just the vision
  if (selectedId === 'vision') {
    return [rootItem];
  }

  // Find path through tree
  const nodePath = findPathToNode(tree, selectedId);

  if (!nodePath || nodePath.length === 0) {
    // Target not found - return vision only
    return [rootItem];
  }

  // Convert tree nodes to breadcrumb items
  const pathItems = nodePath.map(
    (node): BreadcrumbPathItem => ({
      id: node.id,
      label: node.title,
      level: node.level,
    })
  );

  return [rootItem, ...pathItems];
}

export interface GoalTreeBreadcrumbProps {
  /** Breadcrumb path items to display */
  path: BreadcrumbPathItem[];
  /** Called when clicking a breadcrumb item to navigate */
  onNavigate: (id: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Breadcrumb navigation component for the goal tree
 *
 * Displays the hierarchical path from Vision root to the currently selected
 * KPI, with clickable items for navigation.
 *
 * @example
 * ```tsx
 * const [selectedId, setSelectedId] = useState<string | null>(null);
 * const path = deriveBreadcrumbPath(selectedId, tree, vision.title);
 *
 * <GoalTreeBreadcrumb
 *   path={path}
 *   onNavigate={(id) => setSelectedId(id === 'vision' ? null : id)}
 * />
 * ```
 */
export function GoalTreeBreadcrumb({
  path,
  onNavigate,
  className,
}: GoalTreeBreadcrumbProps) {
  // Don't render if path is empty
  if (!path || path.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {path.map((item, index) => {
          const isLast = index === path.length - 1;

          return (
            <Fragment key={item.id}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(item.id);
                    }}
                  >
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
