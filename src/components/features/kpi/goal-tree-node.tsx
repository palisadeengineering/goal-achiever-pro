'use client';

/**
 * Goal Tree Node Component
 *
 * Recursive tree node component for displaying KPI hierarchy.
 * Uses Radix Collapsible for accessible expand/collapse behavior
 * and follows WAI-ARIA treeitem pattern.
 */

import { ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { KpiTreeNode } from '@/lib/progress';
import { useGoalTreeContext } from './goal-tree-context';

export interface GoalTreeNodeProps {
  node: KpiTreeNode;
  level: number; // For aria-level attribute
  posInSet: number; // Position in sibling list (1-indexed for ARIA)
  setSize: number; // Total siblings at this level
  onLogKpi?: (kpiId: string, isCompleted: boolean) => void; // Optional callback for leaf completion
}

/**
 * Recursive tree node with expand/collapse, progress bar, and ARIA attributes
 *
 * Accessibility features:
 * - role="treeitem" with aria-level, aria-setsize, aria-posinset
 * - aria-expanded on nodes with children
 * - aria-selected for selection state
 * - roving tabindex for keyboard navigation
 */
export function GoalTreeNode({
  node,
  level,
  posInSet,
  setSize,
  onLogKpi,
}: GoalTreeNodeProps) {
  const {
    expandedIds,
    toggleExpanded,
    focusedId,
    setFocusedId,
    selectedId,
    setSelectedId,
  } = useGoalTreeContext();

  // Calculate derived state
  const isExpanded = expandedIds.has(node.id);
  const isFocused = focusedId === node.id;
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !hasChildren;

  // Check if this is a completed leaf node
  const isCompleted = node.status === 'completed' || node.progress >= 100;

  /**
   * Handle checkbox change for leaf node completion
   */
  const handleCheckboxChange = (checked: boolean) => {
    if (onLogKpi) {
      onLogKpi(node.id, checked);
    }
  };

  /**
   * Handle node click for selection
   */
  const handleNodeClick = (e: React.MouseEvent) => {
    // Don't select if clicking on the expand button or checkbox
    const target = e.target as HTMLElement;
    if (target.closest('[data-slot="button"]') || target.closest('[data-slot="checkbox"]')) {
      return;
    }
    setSelectedId(node.id);
  };

  /**
   * Handle focus for roving tabindex
   */
  const handleFocus = () => {
    setFocusedId(node.id);
  };

  return (
    <li
      role="treeitem"
      aria-level={level}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
      data-id={node.id}
      tabIndex={isFocused ? 0 : -1}
      onFocus={handleFocus}
      className="outline-none list-none"
    >
      <Collapsible open={isExpanded} onOpenChange={() => hasChildren && toggleExpanded(node.id)}>
        <div
          onClick={handleNodeClick}
          className={cn(
            'flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer',
            'hover:bg-accent/50',
            'transition-colors duration-150',
            isFocused && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
            isSelected && 'bg-accent'
          )}
          style={{ paddingLeft: `${(level - 1) * 16 + 8}px` }}
        >
          {/* Expand/Collapse trigger */}
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 shrink-0"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isExpanded && 'rotate-90'
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          ) : (
            // Spacer for alignment when no children
            <span className="w-6 shrink-0" aria-hidden="true" />
          )}

          {/* Checkbox for leaf nodes */}
          {isLeaf && onLogKpi && (
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleCheckboxChange}
              aria-label={`Mark ${node.title} as ${isCompleted ? 'incomplete' : 'complete'}`}
              className="shrink-0"
            />
          )}

          {/* Node content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-medium text-sm truncate',
                  isCompleted && 'text-muted-foreground line-through'
                )}
              >
                {node.title}
              </span>
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-2 mt-1">
              <Progress
                value={node.progress}
                className="h-1.5 flex-1"
                aria-label={`${node.title} progress: ${Math.round(node.progress)}%`}
              />
              <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                {Math.round(node.progress)}%
              </span>
            </div>
          </div>
        </div>

        {/* Children - recursive rendering */}
        {hasChildren && (
          <CollapsibleContent>
            <ul
              role="group"
              className="border-l border-border ml-4"
              aria-label={`${node.title} sub-items`}
            >
              {node.children.map((child, index) => (
                <GoalTreeNode
                  key={child.id}
                  node={child}
                  level={level + 1}
                  posInSet={index + 1}
                  setSize={node.children.length}
                  onLogKpi={onLogKpi}
                />
              ))}
            </ul>
          </CollapsibleContent>
        )}
      </Collapsible>
    </li>
  );
}
