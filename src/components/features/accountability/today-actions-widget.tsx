'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
  Loader2,
  CalendarCheck,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface DailyAction {
  id: string;
  title: string;
  description?: string;
  estimated_minutes: number;
  status: string;
  weekly_targets?: {
    monthly_targets?: {
      power_goals?: {
        visions?: {
          id: string;
          title: string;
          color: string;
        };
      };
    };
  };
}

interface VisionGroup {
  visionId: string;
  visionTitle: string;
  visionColor: string;
  actions: DailyAction[];
  completedCount: number;
  totalCount: number;
}

interface TodayData {
  date: string;
  totalActions: number;
  completedActions: number;
  totalEstimatedMinutes: number;
  completionPercentage: number;
  actionsByVision: VisionGroup[];
  upcomingDeadlines: Array<{
    type: 'weekly' | 'monthly';
    id: string;
    title: string;
    dueDate: string;
    daysRemaining: number;
    visionTitle: string;
    visionColor: string;
  }>;
}

interface TodayActionsWidgetProps {
  className?: string;
  compact?: boolean;
}

export function TodayActionsWidget({ className, compact = false }: TodayActionsWidgetProps) {
  const [data, setData] = useState<TodayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    try {
      const response = await fetch('/api/today');
      if (!response.ok) throw new Error('Failed to fetch today\'s data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching today data:', err);
      setError('Failed to load today\'s actions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (actionId: string, currentStatus: string) => {
    setCompletingId(actionId);
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    try {
      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          completedActions: newStatus === 'completed'
            ? prev.completedActions + 1
            : prev.completedActions - 1,
          completionPercentage: Math.round(
            ((newStatus === 'completed'
              ? prev.completedActions + 1
              : prev.completedActions - 1) / prev.totalActions) * 100
          ),
          actionsByVision: prev.actionsByVision.map((group) => ({
            ...group,
            actions: group.actions.map((action) =>
              action.id === actionId ? { ...action, status: newStatus } : action
            ),
            completedCount:
              group.actions.find((a) => a.id === actionId)
                ? newStatus === 'completed'
                  ? group.completedCount + 1
                  : group.completedCount - 1
                : group.completedCount,
          })),
        };
      });

      // TODO: Implement API call to update action status
      // await fetch(`/api/daily-actions/${actionId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus }),
      // });

      if (newStatus === 'completed') {
        toast.success('Action completed!');
      }
    } catch (err) {
      console.error('Error updating action:', err);
      toast.error('Failed to update action');
      fetchTodayData(); // Revert on error
    } finally {
      setCompletingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchTodayData} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalActions === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Today&apos;s Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Circle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground mb-4">No actions scheduled for today</p>
          <Link href="/backtrack">
            <Button variant="outline" size="sm">
              Create a Backtrack Plan
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Today&apos;s Actions
          </CardTitle>
          <Badge variant={data.completionPercentage === 100 ? 'default' : 'secondary'}>
            {data.completedActions}/{data.totalActions}
          </Badge>
        </div>
        <div className="space-y-1">
          <Progress value={data.completionPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data.completionPercentage}% complete</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {Math.round(data.totalEstimatedMinutes / 60)}h {data.totalEstimatedMinutes % 60}m estimated
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions by Vision */}
        {data.actionsByVision.slice(0, compact ? 2 : undefined).map((group) => (
          <div key={group.visionId} className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: group.visionColor }}
              />
              <span className="text-sm font-medium truncate">{group.visionTitle}</span>
              <Badge variant="outline" className="text-xs ml-auto">
                {group.completedCount}/{group.totalCount}
              </Badge>
            </div>
            <div className="space-y-1 pl-5">
              {group.actions.slice(0, compact ? 3 : 5).map((action) => (
                <div
                  key={action.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg transition-colors',
                    action.status === 'completed'
                      ? 'bg-muted/30 opacity-60'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <Checkbox
                    checked={action.status === 'completed'}
                    onCheckedChange={() => handleToggleComplete(action.id, action.status)}
                    disabled={completingId === action.id}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm truncate',
                        action.status === 'completed' && 'line-through text-muted-foreground'
                      )}
                    >
                      {action.title}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {action.estimated_minutes}m
                  </span>
                </div>
              ))}
              {group.actions.length > (compact ? 3 : 5) && (
                <p className="text-xs text-muted-foreground pl-6">
                  +{group.actions.length - (compact ? 3 : 5)} more
                </p>
              )}
            </div>
          </div>
        ))}

        {data.actionsByVision.length > (compact ? 2 : 999) && (
          <p className="text-sm text-muted-foreground text-center">
            +{data.actionsByVision.length - 2} more visions
          </p>
        )}

        {/* Upcoming Deadlines */}
        {!compact && data.upcomingDeadlines.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Upcoming Deadlines
            </h4>
            <div className="space-y-2">
              {data.upcomingDeadlines.slice(0, 3).map((deadline) => (
                <div
                  key={deadline.id}
                  className="flex items-center justify-between text-sm p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: deadline.visionColor }}
                    />
                    <span className="truncate">{deadline.title}</span>
                  </div>
                  <Badge
                    variant={deadline.daysRemaining <= 2 ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {deadline.daysRemaining === 0
                      ? 'Today'
                      : deadline.daysRemaining === 1
                      ? 'Tomorrow'
                      : `${deadline.daysRemaining}d`}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View All Link */}
        <Link href="/today">
          <Button variant="outline" className="w-full gap-2">
            View All Actions
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
