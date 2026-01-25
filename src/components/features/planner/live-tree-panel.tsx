'use client';

import { useState } from 'react';
import { useMetricsChat, type TreeNode } from './metrics-chat-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  Target,
  Calendar,
  CalendarDays,
  CalendarCheck,
  Repeat,
  Edit2,
  Check,
  X,
  TreePine,
} from 'lucide-react';

const levelConfig = {
  quarterly: {
    icon: Target,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: 'Quarterly',
  },
  monthly: {
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Monthly',
  },
  weekly: {
    icon: CalendarDays,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Weekly',
  },
  daily: {
    icon: CalendarCheck,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'Daily',
  },
};

interface TreeNodeComponentProps {
  node: TreeNode;
  depth: number;
  onEdit: (node: TreeNode) => void;
}

function TreeNodeComponent({ node, depth, onEdit }: TreeNodeComponentProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2); // Expand first 2 levels by default

  const config = levelConfig[node.level];
  const Icon = node.title.startsWith('🔄') ? Repeat : config.icon;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer group transition-colors',
          'hover:bg-muted/50',
          node.status === 'building' && 'animate-pulse opacity-70'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-5" /> // Spacer for alignment
        )}

        {/* Level icon */}
        <Icon className={cn('h-4 w-4 shrink-0', config.color)} />

        {/* Node content */}
        <div className="flex-1 min-w-0" onClick={() => onEdit(node)}>
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{node.title}</span>
            {node.kpi && (
              <span className="text-xs text-muted-foreground shrink-0">
                {node.kpi.currentValue} → {node.kpi.targetValue} {node.kpi.unit}
              </span>
            )}
          </div>
          {node.description && (
            <p className="text-xs text-muted-foreground truncate">{node.description}</p>
          )}
        </div>

        {/* Edit button (visible on hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(node);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
        >
          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface EditDialogProps {
  node: TreeNode | null;
  onSave: (updates: Partial<TreeNode>) => void;
  onClose: () => void;
}

function EditDialog({ node, onSave, onClose }: EditDialogProps) {
  const [title, setTitle] = useState(node?.title || '');
  const [description, setDescription] = useState(node?.description || '');
  const [targetValue, setTargetValue] = useState(node?.kpi?.targetValue || '');

  const handleSave = () => {
    const updates: Partial<TreeNode> = {
      title,
      description,
    };
    if (node?.kpi) {
      updates.kpi = {
        ...node.kpi,
        targetValue,
      };
    }
    onSave(updates);
  };

  if (!node) return null;

  const config = levelConfig[node.level];

  return (
    <Dialog open={!!node} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <config.icon className={cn('h-5 w-5', config.color)} />
            Edit {config.label} Target
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description..."
              className="resize-none"
              rows={3}
            />
          </div>

          {node.kpi && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Target Value</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {node.kpi.currentValue} →
                </span>
                <Input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">
                  {node.kpi.unit}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-1" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LiveTreePanel() {
  const { state, editNode, saveNodeEdit, cancelNodeEdit } = useMetricsChat();
  const [editingNode, setEditingNode] = useState<TreeNode | null>(null);

  const handleEdit = (node: TreeNode) => {
    setEditingNode(node);
    editNode(node.id);
  };

  const handleSave = (updates: Partial<TreeNode>) => {
    if (editingNode) {
      saveNodeEdit(editingNode.id, updates);
      setEditingNode(null);
    }
  };

  const handleClose = () => {
    setEditingNode(null);
    cancelNodeEdit();
  };

  // Count nodes by level
  const countByLevel = state.treeNodes.reduce((acc, node) => {
    const count = (n: TreeNode): Record<string, number> => {
      const result: Record<string, number> = { [n.level]: 1 };
      n.children.forEach(child => {
        const childCounts = count(child);
        Object.keys(childCounts).forEach(level => {
          result[level] = (result[level] || 0) + childCounts[level];
        });
      });
      return result;
    };
    const nodeCounts = count(node);
    Object.keys(nodeCounts).forEach(level => {
      acc[level] = (acc[level] || 0) + nodeCounts[level];
    });
    return acc;
  }, {} as Record<string, number>);

  const isEmpty = state.treeNodes.length === 0;

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-2">
          <TreePine className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Goal Tree</h2>
        </div>
        {!isEmpty && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {countByLevel.quarterly > 0 && (
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5 text-purple-500" />
                {countByLevel.quarterly}
              </span>
            )}
            {countByLevel.monthly > 0 && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                {countByLevel.monthly}
              </span>
            )}
            {countByLevel.weekly > 0 && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5 text-green-500" />
                {countByLevel.weekly}
              </span>
            )}
            {countByLevel.daily > 0 && (
              <span className="flex items-center gap-1">
                <CalendarCheck className="h-3.5 w-3.5 text-orange-500" />
                {countByLevel.daily}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <TreePine className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium text-muted-foreground mb-2">
              Your goal tree will appear here
            </h3>
            <p className="text-sm text-muted-foreground/70 max-w-xs">
              As you answer questions and approve your plan, watch your goals cascade from quarterly targets down to daily actions.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {state.treeNodes.map((node) => (
              <TreeNodeComponent
                key={node.id}
                node={node}
                depth={0}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      {!isEmpty && (
        <div className="px-4 py-2 border-t bg-background">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3 text-purple-500" /> Quarterly
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-blue-500" /> Monthly
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3 text-green-500" /> Weekly
            </span>
            <span className="flex items-center gap-1">
              <CalendarCheck className="h-3 w-3 text-orange-500" /> Daily
            </span>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <EditDialog
        node={editingNode}
        onSave={handleSave}
        onClose={handleClose}
      />
    </div>
  );
}
