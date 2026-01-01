'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Target,
  Calendar,
  GripVertical,
  Play,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DRIP_QUADRANTS } from '@/constants/drip';
import type { DripQuadrant } from '@/types/database';

export interface MinItemProps {
  id: string;
  title: string;
  description?: string;
  scheduledTime?: string;
  durationMinutes: number;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed';
  dripQuadrant?: DripQuadrant;
  powerGoalTitle?: string;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStartPomodoro?: (id: string) => void;
  isDraggable?: boolean;
}

export function MinItem({
  id,
  title,
  description,
  scheduledTime,
  durationMinutes,
  priority,
  status,
  dripQuadrant,
  powerGoalTitle,
  onToggleComplete,
  onEdit,
  onDelete,
  onStartPomodoro,
  isDraggable = false,
}: MinItemProps) {
  const isCompleted = status === 'completed';
  const quadrantInfo = dripQuadrant ? DRIP_QUADRANTS[dripQuadrant] : null;

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const priorityColors = {
    1: 'bg-red-100 text-red-800 border-red-200',
    2: 'bg-orange-100 text-orange-800 border-orange-200',
    3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    4: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <div
      className={`
        group flex items-start gap-3 p-3 rounded-lg border transition-all
        ${isCompleted ? 'bg-muted/50 border-muted' : 'bg-background hover:bg-muted/30'}
        ${status === 'in_progress' ? 'ring-2 ring-primary ring-offset-2' : ''}
      `}
    >
      {isDraggable && (
        <button className="mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      <Checkbox
        checked={isCompleted}
        onCheckedChange={(checked) => onToggleComplete(id, !!checked)}
        className="mt-1"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className={`font-medium ${
                isCompleted ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {title}
            </p>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            {status === 'pending' && onStartPomodoro && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={() => onStartPomodoro(id)}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {priority <= 3 && (
            <Badge
              variant="outline"
              className={priorityColors[priority as keyof typeof priorityColors]}
            >
              P{priority}
            </Badge>
          )}

          {quadrantInfo && (
            <Badge
              variant="outline"
              style={{
                backgroundColor: `${quadrantInfo.color}15`,
                color: quadrantInfo.color,
                borderColor: `${quadrantInfo.color}40`,
              }}
            >
              {quadrantInfo.name}
            </Badge>
          )}

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDuration(durationMinutes)}
          </div>

          {scheduledTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {scheduledTime}
            </div>
          )}

          {powerGoalTitle && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              {powerGoalTitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
