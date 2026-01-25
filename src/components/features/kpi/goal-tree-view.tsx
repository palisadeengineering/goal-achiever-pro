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

import { useState, useMemo, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useGoalTree } from '@/lib/hooks/use-goal-tree';
import { useLogKpi } from '@/lib/hooks/use-kpi-mutations';
import type { KpiTreeNode } from '@/lib/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { GoalTreeProvider } from './goal-tree-context';
import { GoalTreeNode } from './goal-tree-node';
import { GoalTreeBreadcrumb, deriveBreadcrumbPath } from './goal-tree-breadcrumb';

export interface GoalTreeViewProps {
  visionId: string;
  visionTitle: string;
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

  // Tree ref for keyboard navigation
  const treeRef = useRef<HTMLUListElement>(null);

  // Selection and focus state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

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

  // Derive breadcrumb path from selected node
  const breadcrumbPath = useMemo(
    () => deriveBreadcrumbPath(selectedId, data?.tree ?? [], visionTitle),
    [selectedId, data?.tree, visionTitle]
  );

  // Keyboard navigation handler (Arrow keys, Home, End)
  useEffect(() => {
    const tree = treeRef.current;
    if (!tree) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if focus is within the tree
      if (!tree.contains(document.activeElement)) return;

      const items = Array.from(tree.querySelectorAll('[role="treeitem"]'));
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
    };

    tree.addEventListener('keydown', handleKeyDown);
    return () => tree.removeEventListener('keydown', handleKeyDown);
  }, [focusedId]);

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = (id: string) => {
    if (id === 'vision') {
      setSelectedId(null);
    } else {
      setSelectedId(id);
      // Scroll to and focus the node
      const node = treeRef.current?.querySelector(`[data-id="${id}"]`);
      if (node) {
        (node as HTMLElement).focus();
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Handle KPI logging
  const handleLogKpi = (kpiId: string, isCompleted: boolean) => {
    logKpi({ kpiId, isCompleted });
  };

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
        >
          {data.tree.map((node, index) => (
            <GoalTreeNode
              key={node.id}
              node={node}
              level={1}
              posInSet={index + 1}
              setSize={data.tree.length}
              onLogKpi={handleLogKpi}
            />
          ))}
        </ul>

        {/* Metadata footer */}
        {data.metadata && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {data.metadata.totalKpis} KPIs
            {data.metadata.lastCalculated && (
              <span className="ml-2">
                | Last updated: {new Date(data.metadata.lastCalculated).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </div>
    </GoalTreeProvider>
  );
}
