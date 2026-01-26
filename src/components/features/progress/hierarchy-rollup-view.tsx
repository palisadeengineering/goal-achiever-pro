'use client';

/**
 * Hierarchy Rollup View Component
 *
 * Displays the goal hierarchy as a roll-up visualization showing
 * Vision -> Quarterly -> Monthly -> Weekly -> Daily with progress
 * percentages at each level.
 */

import { useState, useMemo } from 'react';
import { ChevronRight, Target, Calendar, CalendarDays, CalendarRange, Clock } from 'lucide-react';
import { useGoalTree } from '@/lib/hooks/use-goal-tree';
import type { KpiTreeNode } from '@/lib/progress';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusIndicator } from '@/components/features/kpi/status-indicator';
import { cn } from '@/lib/utils';

interface HierarchyRollupViewProps {
  visionId: string;
  visionTitle: string;
  visionColor: string;
  className?: string;
}

interface LevelSummary {
  level: string;
  count: number;
  completed: number;
  averageProgress: number;
  nodes: KpiTreeNode[];
}

const LEVEL_CONFIG: Record<string, { icon: typeof Target; label: string; order: number }> = {
  quarterly: { icon: CalendarRange, label: 'Quarterly', order: 1 },
  monthly: { icon: Calendar, label: 'Monthly', order: 2 },
  weekly: { icon: CalendarDays, label: 'Weekly', order: 3 },
  daily: { icon: Clock, label: 'Daily', order: 4 },
};

/**
 * Flatten the tree and group by level
 */
function groupByLevel(nodes: KpiTreeNode[]): Map<string, KpiTreeNode[]> {
  const levels = new Map<string, KpiTreeNode[]>();

  function traverse(node: KpiTreeNode) {
    const level = node.level;
    if (!levels.has(level)) {
      levels.set(level, []);
    }
    levels.get(level)!.push(node);
    node.children?.forEach(traverse);
  }

  nodes.forEach(traverse);
  return levels;
}

/**
 * Calculate level summary statistics
 */
function calculateLevelSummary(nodes: KpiTreeNode[]): LevelSummary {
  const completed = nodes.filter(n => n.progress >= 100).length;
  const totalProgress = nodes.reduce((sum, n) => sum + n.progress, 0);
  const averageProgress = nodes.length > 0 ? Math.round(totalProgress / nodes.length) : 0;

  return {
    level: nodes[0]?.level || '',
    count: nodes.length,
    completed,
    averageProgress,
    nodes,
  };
}

/**
 * Get status from progress percentage
 */
function getStatusFromProgress(progress: number): string {
  if (progress >= 75) return 'on_track';
  if (progress >= 40) return 'at_risk';
  return 'behind';
}

export function HierarchyRollupView({
  visionId,
  visionTitle,
  visionColor,
  className,
}: HierarchyRollupViewProps) {
  const { data, isLoading, error } = useGoalTree(visionId);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());

  // Group nodes by level and calculate summaries
  const levelSummaries = useMemo(() => {
    if (!data?.tree) return [];

    const levels = groupByLevel(data.tree);
    const summaries: LevelSummary[] = [];

    for (const [level, nodes] of levels) {
      if (LEVEL_CONFIG[level]) {
        summaries.push(calculateLevelSummary(nodes));
      }
    }

    // Sort by level order
    return summaries.sort(
      (a, b) => (LEVEL_CONFIG[a.level]?.order || 99) - (LEVEL_CONFIG[b.level]?.order || 99)
    );
  }, [data?.tree]);

  // Calculate vision-level progress (average of quarterly)
  const visionProgress = useMemo(() => {
    const quarterly = levelSummaries.find(s => s.level === 'quarterly');
    if (quarterly) return quarterly.averageProgress;
    // Fall back to overall average
    const total = levelSummaries.reduce((sum, s) => sum + s.averageProgress * s.count, 0);
    const count = levelSummaries.reduce((sum, s) => sum + s.count, 0);
    return count > 0 ? Math.round(total / count) : 0;
  }, [levelSummaries]);

  const toggleLevel = (level: string) => {
    setExpandedLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        Failed to load hierarchy: {error.message}
      </div>
    );
  }

  if (!data?.tree || data.tree.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        No KPIs found for this vision.
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Vision Level - Root */}
      <div
        className="p-4 rounded-lg border-2"
        style={{ borderColor: visionColor }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: visionColor }}
            />
            <div>
              <div className="font-semibold">{visionTitle}</div>
              <div className="text-sm text-muted-foreground">Vision</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusIndicator status={getStatusFromProgress(visionProgress)} size="sm" />
            <span className="text-2xl font-bold">{visionProgress}%</span>
          </div>
        </div>
        <Progress value={visionProgress} className="mt-3 h-2" />
      </div>

      {/* Hierarchy Levels */}
      {levelSummaries.map((summary, index) => {
        const config = LEVEL_CONFIG[summary.level];
        if (!config) return null;

        const Icon = config.icon;
        const isExpanded = expandedLevels.has(summary.level);
        const levelStatus = getStatusFromProgress(summary.averageProgress);

        return (
          <div
            key={summary.level}
            className="rounded-lg border"
            style={{ marginLeft: `${(index + 1) * 12}px` }}
          >
            <button
              onClick={() => toggleLevel(summary.level)}
              className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                />
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">{config.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {summary.completed}/{summary.count} complete
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusIndicator status={levelStatus} size="sm" />
                <span className="font-bold">{summary.averageProgress}%</span>
              </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t px-3 pb-3">
                <div className="grid gap-2 mt-3">
                  {summary.nodes.slice(0, 5).map(node => (
                    <div
                      key={node.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <StatusIndicator status={node.status} size="sm" />
                        <span className="truncate">{node.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Progress value={node.progress} className="w-16 h-1.5" />
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {Math.round(node.progress)}%
                        </span>
                      </div>
                    </div>
                  ))}
                  {summary.nodes.length > 5 && (
                    <div className="text-center text-xs text-muted-foreground pt-1">
                      +{summary.nodes.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t">
        {levelSummaries.map(summary => {
          const config = LEVEL_CONFIG[summary.level];
          if (!config) return null;
          return (
            <div key={summary.level} className="text-center">
              <div className="text-lg font-bold">{summary.count}</div>
              <div className="text-[10px] text-muted-foreground">{config.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
