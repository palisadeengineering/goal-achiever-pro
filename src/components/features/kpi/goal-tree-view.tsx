'use client';

/**
 * Goal Tree View Component
 *
 * Main component for displaying the complete KPI goal hierarchy.
 * Integrates context, nodes, breadcrumb, keyboard navigation, and hooks
 * for a fully accessible tree UI.
 *
 * Features:
 * - WAI-ARIA tree role structure
 * - Keyboard navigation (Arrow Up/Down, Home/End)
 * - Breadcrumb path navigation
 * - Progress tracking with optimistic updates
 * - Loading, error, and empty states
 */

import { useMemo, useRef, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useGoalTree } from '@/lib/hooks/use-goal-tree';
import { useLogKpi } from '@/lib/hooks/use-kpi-mutations';
import type { KpiTreeNode } from '@/lib/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { GoalTreeProvider, useGoalTreeContext } from './goal-tree-context';
import { GoalTreeNode } from './goal-tree-node';
import { GoalTreeBreadcrumb, deriveBreadcrumbPath } from './goal-tree-breadcrumb';

export interface GoalTreeViewProps {
  visionId: string;
  visionTitle: string;
}

/**
 * Inner tree content component that uses context for keyboard navigation
 */
interface TreeContentProps {
  tree: KpiTreeNode[];
  visionTitle: string;
  isUpdating: boolean;
  isLoggingKpi: boolean;
  onLogKpi: (kpiId: string, isCompleted: boolean) => void;
  metadata?: { totalKpis: number; lastCalculated?: string };
}

function TreeContent({
  tree,
  visionTitle,
  isUpdating,
  isLoggingKpi,
  onLogKpi,
  metadata,
}: TreeContentProps) {
  const treeRef = useRef<HTMLUListElement>(null);
  const { focusedId, setFocusedId, selectedId, setSelectedId } = useGoalTreeContext();

  // Derive breadcrumb path from selected node
  const breadcrumbPath = useMemo(
    () => deriveBreadcrumbPath(selectedId, tree, visionTitle),
    [selectedId, tree, visionTitle]
  );

  // Keyboard navigation handler (Arrow keys, Home, End)
  const handleTreeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const treeEl = treeRef.current;
      if (!treeEl) return;

      const items = Array.from(treeEl.querySelectorAll('[role="treeitem"]'));
      const currentIndex = items.findIndex(
        (item) => item.getAttribute('data-id') === focusedId
      );

      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = Math.min(currentIndex + 1, items.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = items.length - 1;
          break;
        default:
          return;
      }

      if (nextIndex !== currentIndex && items[nextIndex]) {
        const newId = items[nextIndex].getAttribute('data-id');
        if (newId) {
          setFocusedId(newId);
          (items[nextIndex] as HTMLElement).focus();
        }
      }
    },
    [focusedId, setFocusedId]
  );

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = useCallback(
    (id: string) => {
      if (id === 'vision') {
        setSelectedId(null);
      } else {
        setSelectedId(id);
        // Scroll to and focus the node
        const node = treeRef.current?.querySelector(`[data-id="${id}"]`);
        if (node) {
          setFocusedId(id);
          (node as HTMLElement).focus();
          node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
    [setSelectedId, setFocusedId]
  );

  return (
    <div className="space-y-4">
      {/* Breadcrumb navigation */}
      <GoalTreeBreadcrumb
        path={breadcrumbPath}
        onNavigate={handleBreadcrumbNavigate}
      />

      {/* Updating indicator */}
      {(isUpdating || isLoggingKpi) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Updating...
        </div>
      )}

      {/* Tree */}
      <ul
        ref={treeRef}
        role="tree"
        aria-label={`${visionTitle} goal hierarchy`}
        className="space-y-1"
        onKeyDown={handleTreeKeyDown}
      >
        {tree.map((node, index) => (
          <GoalTreeNode
            key={node.id}
            node={node}
            level={1}
            posInSet={index + 1}
            setSize={tree.length}
            onLogKpi={onLogKpi}
          />
        ))}
      </ul>

      {/* Metadata footer */}
      {metadata && (
        <div className="text-xs text-muted-foreground pt-2 border-t">
          {metadata.totalKpis} KPIs
          {metadata.lastCalculated && (
            <span className="ml-2">
              | Last updated: {new Date(metadata.lastCalculated).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Main tree view component that orchestrates all the pieces:
 * - Data fetching via useGoalTree hook
 * - Mutations via useLogKpi hook
 * - Context provider for tree state
 * - Breadcrumb navigation
 * - Keyboard navigation (roving tabindex)
 *
 * @example
 * ```tsx
 * <GoalTreeView visionId={vision.id} visionTitle={vision.title} />
 * ```
 */
export function GoalTreeView({ visionId, visionTitle }: GoalTreeViewProps) {
  // Data fetching
  const { data, isLoading, error, refetch, isUpdating } = useGoalTree(visionId);
  const { mutate: logKpi, isLoggingKpi } = useLogKpi(visionId, {
    onError: (err) => toast.error(`Failed to update: ${err.message}`),
  });

  // Calculate default expanded IDs - expand first 2 levels by default
  const defaultExpanded = useMemo(() => {
    if (!data?.tree) return [];
    const ids: string[] = [];

    function collectLevel(nodes: KpiTreeNode[], depth: number) {
      for (const node of nodes) {
        if (depth <= 2) {
          ids.push(node.id);
          if (node.children?.length) {
            collectLevel(node.children, depth + 1);
          }
        }
      }
    }

    collectLevel(data.tree, 1);
    return ids;
  }, [data?.tree]);

  // Handle KPI logging
  const handleLogKpi = useCallback(
    (kpiId: string, isCompleted: boolean) => {
      logKpi({ kpiId, isCompleted });
    },
    [logKpi]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (!data?.tree || data.tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Sparkles className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground mb-2">No KPIs found for this vision.</p>
        <p className="text-sm text-muted-foreground">
          Generate KPIs from the Details tab to start tracking progress.
        </p>
      </div>
    );
  }

  return (
    <GoalTreeProvider
      tree={data.tree}
      visionTitle={visionTitle}
      defaultExpanded={defaultExpanded}
    >
      <TreeContent
        tree={data.tree}
        visionTitle={visionTitle}
        isUpdating={isUpdating}
        isLoggingKpi={isLoggingKpi}
        onLogKpi={handleLogKpi}
        metadata={data.metadata}
      />
    </GoalTreeProvider>
  );
}
