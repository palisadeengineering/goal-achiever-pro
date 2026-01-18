'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Edit,
  Eye,
  GitBranch,
  Target,
  Quote,
  Calendar,
  Flame,
  TrendingUp,
  CheckCircle2,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Vision {
  id: string;
  title: string;
  description: string | null;
  specific: string | null;
  measurable: string | null;
  attainable: string | null;
  realistic: string | null;
  time_bound: string | null;
  clarity_score: number;
  belief_score: number;
  consistency_score: number;
  is_active: boolean;
  color: string | null;
  affirmation_text: string | null;
}

interface BacktrackPlan {
  id: string;
  vision_id: string;
  status: string;
}

interface VisionKanbanColumnProps {
  vision: Vision;
  backtrackPlan?: BacktrackPlan;
  onEdit: () => void;
  onViewDetails: () => void;
  // Optional: stats from backtrack plan
  nonNegotiableStreak?: number;
  completedActions?: number;
  totalActions?: number;
}

export function VisionKanbanColumn({
  vision,
  backtrackPlan,
  onEdit,
  onViewDetails,
  nonNegotiableStreak = 0,
  completedActions = 0,
  totalActions = 0,
}: VisionKanbanColumnProps) {
  const threeHundredPercent =
    vision.clarity_score + vision.belief_score + vision.consistency_score;

  const scoreColor =
    threeHundredPercent >= 240
      ? 'text-cyan-600 bg-cyan-50'
      : threeHundredPercent >= 180
      ? 'text-yellow-600 bg-yellow-50'
      : 'text-red-600 bg-red-50';

  const progressColor =
    threeHundredPercent >= 240
      ? 'bg-cyan-500'
      : threeHundredPercent >= 180
      ? 'bg-yellow-500'
      : 'bg-red-500';

  const hasSmart = !!(
    vision.specific ||
    vision.measurable ||
    vision.attainable ||
    vision.realistic
  );

  return (
    <div className="flex-shrink-0 w-[320px] flex flex-col h-full">
      {/* Column Header */}
      <div
        className="rounded-t-lg px-4 py-3"
        style={{ backgroundColor: `${vision.color || '#6366f1'}20` }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: vision.color || '#6366f1' }}
            />
            <h3 className="font-semibold text-sm truncate">{vision.title}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Vision
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {vision.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {vision.description}
          </p>
        )}
      </div>

      {/* Column Content */}
      <Card className="flex-1 rounded-t-none border-t-0 flex flex-col">
        <ScrollArea className="flex-1">
          <CardContent className="p-4 space-y-4">
            {/* 300% Score Card */}
            <div className={`rounded-lg p-3 ${scoreColor.split(' ')[1]}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  300% Score
                </span>
                <span className={`text-lg font-bold ${scoreColor.split(' ')[0]}`}>
                  {threeHundredPercent}%
                </span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressColor} transition-all`}
                  style={{ width: `${threeHundredPercent / 3}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div className="text-center">
                  <div className="font-medium">{vision.clarity_score}%</div>
                  <div className="text-muted-foreground">Clarity</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{vision.belief_score}%</div>
                  <div className="text-muted-foreground">Belief</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{vision.consistency_score}%</div>
                  <div className="text-muted-foreground">Consistency</div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2">
              {/* Backtrack Plan Status */}
              <div className="rounded-lg border p-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <GitBranch className="h-3 w-3" />
                  Plan
                </div>
                {backtrackPlan ? (
                  <Badge
                    variant={backtrackPlan.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {backtrackPlan.status === 'active' ? 'Active' : backtrackPlan.status}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Not created</span>
                )}
              </div>

              {/* Streak */}
              {nonNegotiableStreak > 0 && (
                <div className="rounded-lg border p-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    Streak
                  </div>
                  <span className="text-sm font-semibold">{nonNegotiableStreak} days</span>
                </div>
              )}

              {/* Actions Progress */}
              {totalActions > 0 && (
                <div className="rounded-lg border p-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Actions
                  </div>
                  <span className="text-sm font-semibold">
                    {completedActions}/{totalActions}
                  </span>
                </div>
              )}
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap gap-1">
              {hasSmart && (
                <Badge variant="outline" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  SMART Goals
                </Badge>
              )}
              {vision.affirmation_text && (
                <Badge variant="outline" className="text-xs">
                  <Quote className="h-3 w-3 mr-1" />
                  Affirmation
                </Badge>
              )}
              {vision.time_bound && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(vision.time_bound).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </Badge>
              )}
            </div>

            {/* SMART Goals Preview (if set) */}
            {hasSmart && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">SMART Goals</h4>
                <div className="space-y-1.5 text-xs">
                  {vision.specific && (
                    <div className="flex gap-2">
                      <span className="font-medium text-primary w-4">S</span>
                      <span className="text-muted-foreground line-clamp-1">
                        {vision.specific}
                      </span>
                    </div>
                  )}
                  {vision.measurable && (
                    <div className="flex gap-2">
                      <span className="font-medium text-primary w-4">M</span>
                      <span className="text-muted-foreground line-clamp-1">
                        {vision.measurable}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </ScrollArea>

        {/* Column Footer - Actions */}
        <div className="p-3 border-t bg-muted/30">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
            <Button variant="default" size="sm" className="flex-1" onClick={onViewDetails}>
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Details
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
