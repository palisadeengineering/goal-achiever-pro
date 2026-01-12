'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CalendarCheck,
  Calendar,
  Clock,
  Target,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
  RefreshCw,
  Users,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useGoogleCalendar } from '@/lib/hooks/use-google-calendar';
import { Daily300Checkin } from '@/components/features/reviews/daily-300-checkin';
import type { TeamMember } from '@/types/team';

interface DailyAction {
  id: string;
  title: string;
  description?: string;
  estimated_minutes: number;
  status: string;
  key_metric?: string;
  target_value?: number;
  assignee_id?: string;
  assignee_name?: string;
  weekly_targets?: {
    id: string;
    title: string;
    monthly_targets?: {
      id: string;
      title: string;
      power_goals?: {
        id: string;
        title: string;
        category: string;
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

interface Deadline {
  type: 'weekly' | 'monthly';
  id: string;
  title: string;
  dueDate: string;
  daysRemaining: number;
  visionTitle: string;
  visionColor: string;
}

interface TodayData {
  date: string;
  totalActions: number;
  completedActions: number;
  totalEstimatedMinutes: number;
  completionPercentage: number;
  actionsByVision: VisionGroup[];
  upcomingDeadlines: Deadline[];
}

const CATEGORY_COLORS: Record<string, string> = {
  business: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
  career: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  health: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  wealth: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  relationships: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200',
  personal: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
};

export default function TodayPage() {
  const [data, setData] = useState<TodayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [expandedVisions, setExpandedVisions] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  const { isConnected, connect } = useGoogleCalendar();

  // Fetch team members
  const fetchTeamMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/team');
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  }, []);

  const handleSyncToCalendar = async () => {
    if (!isConnected) {
      connect();
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch('/api/calendar/sync-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: data?.date }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync');
      }

      toast.success(result.message || `Synced ${result.synced} actions to calendar`);
    } catch (err) {
      console.error('Calendar sync error:', err);
      toast.error('Failed to sync actions to calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchTodayData = useCallback(async (filter?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const filterParam = filter ?? assigneeFilter;
      const url = filterParam && filterParam !== 'all'
        ? `/api/today?assignee=${filterParam}`
        : '/api/today';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch today\'s data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching today data:', err);
      setError('Failed to load today\'s actions');
    } finally {
      setIsLoading(false);
    }
  }, [assigneeFilter]);

  useEffect(() => {
    fetchTodayData();
    fetchTeamMembers();
  }, []);

  // Refetch when filter changes
  useEffect(() => {
    fetchTodayData(assigneeFilter);
  }, [assigneeFilter]);

  useEffect(() => {
    if (data?.actionsByVision) {
      setExpandedVisions(new Set(data.actionsByVision.map((v) => v.visionId)));
    }
  }, [data?.actionsByVision]);

  const handleToggleComplete = async (actionId: string, currentStatus: string) => {
    setCompletingIds((prev) => new Set(prev).add(actionId));
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    try {
      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        const wasCompleted = currentStatus === 'completed';
        return {
          ...prev,
          completedActions: wasCompleted
            ? prev.completedActions - 1
            : prev.completedActions + 1,
          completionPercentage: Math.round(
            ((wasCompleted
              ? prev.completedActions - 1
              : prev.completedActions + 1) / prev.totalActions) * 100
          ),
          actionsByVision: prev.actionsByVision.map((group) => ({
            ...group,
            actions: group.actions.map((action) =>
              action.id === actionId ? { ...action, status: newStatus } : action
            ),
            completedCount:
              group.actions.find((a) => a.id === actionId)
                ? wasCompleted
                  ? group.completedCount - 1
                  : group.completedCount + 1
                : group.completedCount,
          })),
        };
      });

      // Update action status via API
      const response = await fetch(`/api/targets/daily/${actionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update action');
      }

      if (newStatus === 'completed') {
        toast.success('Action completed!');
      } else {
        toast.success('Action marked as pending');
      }
    } catch (err) {
      console.error('Error updating action:', err);
      toast.error('Failed to update action');
      fetchTodayData(); // Revert on error by refetching
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
    }
  };

  const toggleVisionExpanded = (visionId: string) => {
    setExpandedVisions((prev) => {
      const next = new Set(prev);
      if (next.has(visionId)) {
        next.delete(visionId);
      } else {
        next.add(visionId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Today"
          description={format(new Date(), 'EEEE, MMMM d, yyyy')}
          icon={<CalendarCheck className="h-6 w-6" />}
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Today"
          description={format(new Date(), 'EEEE, MMMM d, yyyy')}
          icon={<CalendarCheck className="h-6 w-6" />}
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchTodayData()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || data.totalActions === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Today"
          description={format(new Date(), 'EEEE, MMMM d, yyyy')}
          icon={<CalendarCheck className="h-6 w-6" />}
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Actions Scheduled</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              You don&apos;t have any actions scheduled for today. Create a backtrack plan to
              generate daily actions aligned with your vision.
            </p>
            <Link href="/backtrack">
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                Create Backtrack Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today"
        description={format(new Date(), 'EEEE, MMMM d, yyyy')}
        icon={<CalendarCheck className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            {/* Team Filter */}
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    All Tasks
                  </div>
                </SelectItem>
                <SelectItem value="me">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    My Tasks
                  </div>
                </SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      {member.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleSyncToCalendar}
              size="sm"
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              {isConnected ? 'Sync to Calendar' : 'Connect Calendar'}
            </Button>
            <Button variant="outline" onClick={() => fetchTodayData()} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Progress Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{data.completedActions}</div>
              <div className="text-sm text-muted-foreground">of {data.totalActions} completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{data.completionPercentage}%</div>
              <div className="text-sm text-muted-foreground">Daily Progress</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {Math.floor(data.totalEstimatedMinutes / 60)}h {data.totalEstimatedMinutes % 60}m
              </div>
              <div className="text-sm text-muted-foreground">Total Estimated</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{data.actionsByVision.length}</div>
              <div className="text-sm text-muted-foreground">Active Visions</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Actions List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Today&apos;s Actions</CardTitle>
                <div className="space-y-1">
                  <Progress value={data.completionPercentage} className="w-32 h-2" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.actionsByVision.map((group) => (
                <div key={group.visionId} className="space-y-3">
                  <button
                    onClick={() => toggleVisionExpanded(group.visionId)}
                    className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: group.visionColor }}
                      />
                      <span className="font-medium">{group.visionTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={group.completedCount === group.totalCount ? 'default' : 'secondary'}>
                        {group.completedCount}/{group.totalCount}
                      </Badge>
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 transition-transform',
                          expandedVisions.has(group.visionId) && 'rotate-90'
                        )}
                      />
                    </div>
                  </button>

                  {expandedVisions.has(group.visionId) && (
                    <div className="space-y-2 pl-4">
                      {group.actions.map((action) => (
                        <div
                          key={action.id}
                          className={cn(
                            'flex items-start gap-3 p-4 rounded-lg border transition-all',
                            action.status === 'completed'
                              ? 'bg-muted/20 border-muted'
                              : 'bg-background hover:border-primary/30'
                          )}
                        >
                          <Checkbox
                            checked={action.status === 'completed'}
                            onCheckedChange={() =>
                              handleToggleComplete(action.id, action.status)
                            }
                            disabled={completingIds.has(action.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={cn(
                                  'font-medium',
                                  action.status === 'completed' &&
                                    'line-through text-muted-foreground'
                                )}
                              >
                                {action.title}
                              </p>
                              <Badge variant="outline" className="shrink-0">
                                <Clock className="h-3 w-3 mr-1" />
                                {action.estimated_minutes}m
                              </Badge>
                            </div>
                            {action.description && (
                              <p
                                className={cn(
                                  'text-sm text-muted-foreground mt-1',
                                  action.status === 'completed' && 'line-through'
                                )}
                              >
                                {action.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                              {action.weekly_targets && (
                                <>
                                  <Target className="h-3 w-3" />
                                  <span className="truncate">
                                    {action.weekly_targets.title}
                                  </span>
                                  {action.weekly_targets.monthly_targets?.power_goals?.category && (
                                    <Badge
                                      className={cn(
                                        'text-xs',
                                        CATEGORY_COLORS[
                                          action.weekly_targets.monthly_targets.power_goals.category
                                        ]
                                      )}
                                    >
                                      {action.weekly_targets.monthly_targets.power_goals.category}
                                    </Badge>
                                  )}
                                </>
                              )}
                              {action.assignee_name && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <User className="h-3 w-3" />
                                  {action.assignee_name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* 300% Daily Check-in */}
          <Daily300Checkin />

          {/* Upcoming Deadlines */}
          {data.upcomingDeadlines.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.upcomingDeadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className={cn(
                      'p-3 rounded-lg',
                      deadline.daysRemaining <= 2
                        ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'
                        : 'bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: deadline.visionColor }}
                        />
                        <span className="text-sm font-medium truncate">{deadline.title}</span>
                      </div>
                      <Badge
                        variant={deadline.daysRemaining <= 2 ? 'destructive' : 'outline'}
                        className="shrink-0"
                      >
                        {deadline.daysRemaining === 0
                          ? 'Today'
                          : deadline.daysRemaining === 1
                          ? 'Tomorrow'
                          : `${deadline.daysRemaining}d`}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {deadline.type}
                      </Badge>
                      <span className="truncate">{deadline.visionTitle}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Links */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/backtrack">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Target className="h-4 w-4" />
                  View Backtrack Plans
                </Button>
              </Link>
              <Link href="/vision">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Sparkles className="h-4 w-4" />
                  Edit Vision
                </Button>
              </Link>
              <Link href="/goals">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  View Power Goals
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
