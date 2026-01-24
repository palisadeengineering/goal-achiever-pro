'use client';

/**
 * KPI Tree Widget
 *
 * Minimal component that demonstrates optimistic updates with the useGoalTree
 * and useLogKpi hooks. Shows a flat list of KPIs with checkboxes and progress bars.
 *
 * Phase 6 will build the full collapsible tree UI with breadcrumbs and status indicators.
 *
 * Features:
 * - Optimistic updates: checkbox changes immediately before server confirms
 * - Rollback on error: reverts to previous state with toast notification
 * - Loading states: skeleton during initial load, indicator during updates
 */

import { useGoalTree, useLogKpi } from '@/lib/hooks';
import type { KpiTreeNode } from '@/lib/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiTreeWidgetProps {
  visionId: string;
}

/**
 * Flattens a nested KPI tree into a single array for rendering.
 * Preserves hierarchy information via indentation level tracking.
 */
function flattenTree(nodes: KpiTreeNode[], depth = 0): Array<KpiTreeNode & { depth: number }> {
  return nodes.flatMap((node) => [
    { ...node, depth },
    ...flattenTree(node.children || [], depth + 1),
  ]);
}

/**
 * Renders a skeleton loading state with placeholder cards
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function KpiTreeWidget({ visionId }: KpiTreeWidgetProps) {
  // Fetch goal tree data with loading and updating states
  const { data, isLoading, isUpdating, error, refetch } = useGoalTree(visionId);

  // Mutation hook for logging KPI completion with optimistic updates
  const { mutate: logKpi, isLoggingKpi } = useLogKpi(visionId, {
    onError: (err) => toast.error(`Failed to update: ${err.message}`),
  });

  // Show skeleton during initial load
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Show error state with retry button
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-3">
          {error.message || 'Failed to load KPI tree'}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Handle empty tree
  const tree = data?.tree || [];
  if (tree.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          No KPIs found for this vision. Add KPIs to track your progress.
        </p>
      </div>
    );
  }

  // Flatten tree for simple list rendering
  const flatKpis = flattenTree(tree);

  // Handle checkbox toggle - uses optimistic updates
  const handleToggle = (kpi: KpiTreeNode & { depth: number }) => {
    const isCompleted = kpi.progress >= 100;
    logKpi({
      kpiId: kpi.id,
      isCompleted: !isCompleted,
    });
  };

  return (
    <div className="space-y-3">
      {/* Updating indicator */}
      {isUpdating && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Updating...
        </div>
      )}

      {/* KPI list */}
      {flatKpis.map((kpi) => {
        const isCompleted = kpi.progress >= 100;
        const indentPx = kpi.depth * 16;

        return (
          <div
            key={kpi.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border transition-colors',
              isCompleted
                ? 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800'
                : 'bg-background'
            )}
            style={{ marginLeft: `${indentPx}px` }}
          >
            {/* Checkbox */}
            <Checkbox
              checked={isCompleted}
              onCheckedChange={() => handleToggle(kpi)}
              disabled={isLoggingKpi}
              className="h-5 w-5"
            />

            {/* KPI info */}
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  'font-medium text-sm',
                  isCompleted && 'line-through text-muted-foreground'
                )}
              >
                {kpi.title}
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2 mt-1">
                <Progress value={kpi.progress} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {Math.round(kpi.progress)}%
                </span>
              </div>

              {/* Level badge */}
              {kpi.level && (
                <span className="text-xs text-muted-foreground capitalize">
                  {kpi.level.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Metadata footer */}
      {data?.metadata && (
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
  );
}
