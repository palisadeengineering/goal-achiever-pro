'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CascadingPlanView } from '@/components/features/backtrack/cascading-plan-view';
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isSameDay,
  addDays,
  getWeek,
  getMonth,
  getQuarter,
  getYear,
  differenceInDays,
  eachDayOfInterval,
  subDays,
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
  GitBranch,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Clock,
  Target,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Play,
  Pause,
  CheckCircle2,
  Trash2,
  Flame,
  Eye,
  ListTodo,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  LayoutGrid,
  CheckSquare,
  Circle,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGoogleCalendar } from '@/lib/hooks/use-google-calendar';

interface BacktrackPlan {
  id: string;
  vision_id: string;
  available_hours_per_week: string;
  start_date: string;
  end_date: string;
  status: string;
  ai_generated_at?: string;
  created_at: string;
  visions: {
    id: string;
    title: string;
    description?: string;
    specific?: string;
    measurable?: string;
    attainable?: string;
    realistic?: string;
    color?: string;
    clarity_score?: number;
    belief_score?: number;
    consistency_score?: number;
  };
}

interface PlanData {
  plan: BacktrackPlan;
  quarterlyTargets: Array<{
    id: string;
    quarter: number;
    year: number;
    title: string;
    description?: string;
    key_metric?: string;
    target_value?: string;
    current_value?: string;
    status: string;
    progress_percentage: number;
    estimated_hours_total?: number;
  }>;
  impactProjects: Array<{
    id: string;
    quarterly_target_id?: string;
    title: string;
    description?: string;
    quarter?: number;
    category?: string;
    estimated_hours?: number;
    progress_percentage: number;
    status: string;
  }>;
  // Backwards compatibility alias
  powerGoals?: Array<{
    id: string;
    quarterly_target_id?: string;
    title: string;
    description?: string;
    quarter?: number;
    category?: string;
    estimated_hours?: number;
    progress_percentage: number;
    status: string;
  }>;
  monthlyTargets: Array<{
    id: string;
    power_goal_id: string;
    title: string;
    description?: string;
    target_month: number;
    target_year: number;
    key_metric?: string;
    target_value?: string;
    status: string;
  }>;
  weeklyTargets: Array<{
    id: string;
    monthly_target_id: string;
    title: string;
    description?: string;
    week_number: number;
    week_start_date: string;
    week_end_date: string;
    status: string;
  }>;
  dailyActions: Array<{
    id: string;
    weekly_target_id: string;
    title: string;
    description?: string;
    action_date: string;
    estimated_minutes?: number;
    status: string;
    calendar_event_id?: string;
    calendar_sync_status?: 'not_synced' | 'synced' | 'pending' | 'error';
    calendar_synced_at?: string;
  }>;
}

interface NonNegotiable {
  id: string;
  title: string;
  description?: string;
  frequency: string;
  targetCount: number;
  isActive: boolean;
}

interface StreakData {
  nonNegotiableId: string;
  title: string;
  currentStreak: number;
  longestStreak: number;
  thisWeekCompletions: number;
  thisMonthCompletions: number;
  totalCompletions: number;
  lastCompletedDate: string | null;
}

interface CompletionStatus {
  [nonNegotiableId: string]: {
    [date: string]: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  active: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
};

export default function BacktrackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<PlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Non-negotiables state
  const [nonNegotiables, setNonNegotiables] = useState<NonNegotiable[]>([]);
  const [streakData, setStreakData] = useState<StreakData[]>([]);
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({});
  const [loadingCompletions, setLoadingCompletions] = useState<Set<string>>(new Set());

  // Calendar sync state
  const { isConnected, connect } = useGoogleCalendar();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPlanData();
  }, [id]);

  useEffect(() => {
    if (data?.plan.vision_id) {
      fetchNonNegotiables(data.plan.vision_id);
      fetchStreakData(data.plan.vision_id);
    }
  }, [data?.plan.vision_id]);

  const fetchPlanData = async () => {
    try {
      const response = await fetch(`/api/backtrack/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Backtrack plan not found');
        }
        throw new Error('Failed to fetch plan data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to load plan');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNonNegotiables = async (visionId: string) => {
    try {
      const response = await fetch(`/api/non-negotiables?visionId=${visionId}`);
      if (response.ok) {
        const data = await response.json();
        setNonNegotiables(data);
        // Initialize completion status
        const status: CompletionStatus = {};
        for (const nn of data) {
          status[nn.id] = {};
        }
        setCompletionStatus(status);
      }
    } catch (err) {
      console.error('Error fetching non-negotiables:', err);
    }
  };

  const fetchStreakData = async (visionId: string) => {
    try {
      const response = await fetch(`/api/non-negotiables/streaks?visionId=${visionId}`);
      if (response.ok) {
        const data = await response.json();
        setStreakData(data);
      }
    } catch (err) {
      console.error('Error fetching streak data:', err);
    }
  };

  const handleToggleCompletion = async (nnId: string, date: string) => {
    const key = `${nnId}-${date}`;
    if (loadingCompletions.has(key)) return;

    setLoadingCompletions((prev) => new Set([...prev, key]));

    try {
      const isCompleted = completionStatus[nnId]?.[date] > 0;
      const method = isCompleted ? 'DELETE' : 'POST';

      const response = await fetch(`/api/non-negotiables/${nnId}/complete`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });

      if (response.ok) {
        setCompletionStatus((prev) => ({
          ...prev,
          [nnId]: {
            ...prev[nnId],
            [date]: isCompleted ? 0 : 1,
          },
        }));
        // Refresh streak data
        if (data?.plan.vision_id) {
          fetchStreakData(data.plan.vision_id);
        }
      }
    } catch (err) {
      console.error('Error toggling completion:', err);
      toast.error('Failed to update completion');
    } finally {
      setLoadingCompletions((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleStatusChange = async (newStatus: string, removeFromCalendar = false) => {
    if (!data) return;
    setIsUpdating(true);

    try {
      // If pausing and user chose to remove from calendar, do that first
      if (newStatus === 'paused' && removeFromCalendar) {
        await handleUnsyncAllFromCalendar();
      }

      const response = await fetch(`/api/backtrack/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setData((prev) =>
        prev ? { ...prev, plan: { ...prev.plan, status: newStatus } } : prev
      );
      toast.success(
        `Plan ${newStatus === 'active' ? 'activated' : newStatus === 'paused' ? 'paused' : 'updated'}`
      );
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update plan status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePauseWithPrompt = () => {
    const syncedCount = data?.dailyActions.filter(
      (a) => a.calendar_sync_status === 'synced'
    ).length || 0;

    if (syncedCount > 0) {
      const removeFromCal = confirm(
        `This plan has ${syncedCount} action(s) synced to Google Calendar.\n\nDo you want to remove them from your calendar when pausing?\n\nClick OK to remove, Cancel to keep them.`
      );
      handleStatusChange('paused', removeFromCal);
    } else {
      handleStatusChange('paused', false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this backtrack plan? This action cannot be undone.'
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/backtrack/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete plan');

      toast.success('Backtrack plan deleted');
      router.push('/backtrack');
    } catch (err) {
      console.error('Error deleting plan:', err);
      toast.error('Failed to delete plan');
      setIsDeleting(false);
    }
  };

  // Calendar sync functions
  const handleSyncToCalendar = async (actionIds?: string[]) => {
    if (!isConnected) {
      connect();
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch('/api/calendar/sync-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionIds }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync');
      }

      toast.success(result.message || `Synced ${result.synced} actions to calendar`);

      // Update local state with synced status
      if (result.results) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            dailyActions: prev.dailyActions.map((action) => {
              const syncResult = result.results.find(
                (r: { actionId: string; success: boolean; eventId?: string }) => r.actionId === action.id
              );
              if (syncResult?.success) {
                return {
                  ...action,
                  calendar_sync_status: 'synced' as const,
                  calendar_event_id: syncResult.eventId,
                  calendar_synced_at: new Date().toISOString(),
                };
              }
              return action;
            }),
          };
        });
      }
    } catch (err) {
      console.error('Calendar sync error:', err);
      toast.error('Failed to sync actions to calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncSingleAction = async (actionId: string) => {
    if (!isConnected) {
      connect();
      return;
    }

    setSyncingIds((prev) => new Set(prev).add(actionId));
    try {
      const response = await fetch('/api/calendar/sync-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionIds: [actionId] }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync');
      }

      if (result.synced > 0) {
        toast.success('Action added to calendar!');

        // Update local state
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            dailyActions: prev.dailyActions.map((action) => {
              if (action.id === actionId) {
                const syncResult = result.results?.[0];
                return {
                  ...action,
                  calendar_sync_status: 'synced' as const,
                  calendar_event_id: syncResult?.eventId,
                  calendar_synced_at: new Date().toISOString(),
                };
              }
              return action;
            }),
          };
        });
      } else {
        toast.error('Failed to sync action');
      }
    } catch (err) {
      console.error('Calendar sync error:', err);
      toast.error('Failed to sync action to calendar');
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
    }
  };

  const handleRemoveFromCalendar = async (actionId: string, eventId: string) => {
    setSyncingIds((prev) => new Set(prev).add(actionId));
    try {
      const response = await fetch(`/api/calendar/google/events?eventId=${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to remove from calendar');
      }

      toast.success('Removed from calendar');

      // Update local state
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          dailyActions: prev.dailyActions.map((action) => {
            if (action.id === actionId) {
              return {
                ...action,
                calendar_sync_status: 'not_synced' as const,
                calendar_event_id: undefined,
                calendar_synced_at: undefined,
              };
            }
            return action;
          }),
        };
      });
    } catch (err) {
      console.error('Calendar remove error:', err);
      toast.error('Failed to remove from calendar');
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
    }
  };

  // Unsync all actions from calendar (used when pausing plan)
  const handleUnsyncAllFromCalendar = async () => {
    if (!data) return;

    const syncedActions = data.dailyActions.filter(
      (a) => a.calendar_sync_status === 'synced' && a.calendar_event_id
    );

    if (syncedActions.length === 0) {
      toast.info('No synced actions to remove');
      return;
    }

    setIsSyncing(true);
    let removedCount = 0;
    let failedCount = 0;

    for (const action of syncedActions) {
      try {
        const response = await fetch(
          `/api/calendar/google/events?eventId=${encodeURIComponent(action.calendar_event_id!)}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          removedCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    // Update local state
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        dailyActions: prev.dailyActions.map((action) => {
          if (action.calendar_sync_status === 'synced') {
            return {
              ...action,
              calendar_sync_status: 'not_synced' as const,
              calendar_event_id: undefined,
              calendar_synced_at: undefined,
            };
          }
          return action;
        }),
      };
    });

    if (removedCount > 0) {
      toast.success(`Removed ${removedCount} events from calendar`);
    }
    if (failedCount > 0) {
      toast.error(`Failed to remove ${failedCount} events`);
    }

    setIsSyncing(false);
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!data) return null;

    const now = new Date();
    const start = new Date(data.plan.start_date);
    const end = new Date(data.plan.end_date);

    // Time progress
    let timeProgress = 0;
    if (now < start) timeProgress = 0;
    else if (now > end) timeProgress = 100;
    else {
      const total = end.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      timeProgress = Math.round((elapsed / total) * 100);
    }

    const daysRemaining = Math.max(0, differenceInDays(end, now));
    const weeksRemaining = Math.ceil(daysRemaining / 7);

    // Completion stats
    const totalActions = data.dailyActions.length;
    const completedActions = data.dailyActions.filter((a) => a.status === 'completed').length;
    const completionPercentage = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

    // 300% score
    const vision = data.plan.visions;
    const clarityScore = vision.clarity_score || 0;
    const beliefScore = vision.belief_score || 0;
    const consistencyScore = vision.consistency_score || 0;
    const totalScore = clarityScore + beliefScore + consistencyScore;

    // Current quarter/month/week data
    const currentQuarter = getQuarter(now);
    const currentYear = getYear(now);
    const currentMonth = getMonth(now) + 1;
    const currentWeek = getWeek(now);

    const quarterlyTargetsThisQ = data.quarterlyTargets.filter(
      (q) => q.quarter === currentQuarter && q.year === currentYear
    );
    const monthlyTargetsThisM = data.monthlyTargets.filter(
      (m) => m.target_month === currentMonth && m.target_year === currentYear
    );

    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const weeklyTargetsThisW = data.weeklyTargets.filter((w) => {
      const wStart = parseISO(w.week_start_date);
      return isWithinInterval(wStart, { start: weekStart, end: weekEnd });
    });

    const todaysActions = data.dailyActions.filter((a) =>
      isSameDay(parseISO(a.action_date), now)
    );

    // Best streak from non-negotiables
    const bestStreak = streakData.length > 0
      ? Math.max(...streakData.map((s) => s.currentStreak))
      : 0;

    return {
      timeProgress,
      daysRemaining,
      weeksRemaining,
      completedActions,
      totalActions,
      completionPercentage,
      clarityScore,
      beliefScore,
      consistencyScore,
      totalScore,
      quarterlyTargetsThisQ,
      monthlyTargetsThisM,
      weeklyTargetsThisW,
      todaysActions,
      bestStreak,
      currentQuarter,
      currentYear,
      currentMonth,
      currentWeek,
    };
  }, [data, streakData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." icon={<GitBranch className="h-6 w-6" />} />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !data || !metrics) {
    return (
      <div className="space-y-6">
        <PageHeader title="Error" icon={<GitBranch className="h-6 w-6" />} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{error || 'Plan not found'}</p>
            <Link href="/backtrack">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const visionColor = data.plan.visions.color || '#6366f1';
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.plan.visions.title}
        description="Vision Progress & Plan Details"
        icon={
          <div
            className="h-6 w-6 rounded-full"
            style={{ backgroundColor: visionColor }}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/backtrack">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            {data.plan.status === 'draft' && (
              <Button
                onClick={() => handleStatusChange('active')}
                disabled={isUpdating}
                size="sm"
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Activate
              </Button>
            )}
            {data.plan.status === 'active' && (
              <Button
                onClick={handlePauseWithPrompt}
                disabled={isUpdating || isSyncing}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
                Pause
              </Button>
            )}
            {data.plan.status === 'paused' && (
              <Button
                onClick={() => handleStatusChange('active')}
                disabled={isUpdating}
                size="sm"
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Resume
              </Button>
            )}
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant="destructive"
              size="sm"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <ListTodo className="h-4 w-4" />
            <span className="hidden sm:inline">Rules</span>
          </TabsTrigger>
          <TabsTrigger value="daily" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Daily</span>
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-2">
            <CalendarRange className="h-4 w-4" />
            <span className="hidden sm:inline">Weekly</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            <span className="hidden sm:inline">Monthly</span>
          </TabsTrigger>
          <TabsTrigger value="quarterly" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Quarterly</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Plan Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={cn('text-lg px-3 py-1', STATUS_COLORS[data.plan.status])}>
                  {data.plan.status.charAt(0).toUpperCase() + data.plan.status.slice(1)}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  300% Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="text-2xl font-bold">{metrics.totalScore}%</span>
                </div>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                  <span>C: {metrics.clarityScore}</span>
                  <span>B: {metrics.beliefScore}</span>
                  <span>S: {metrics.consistencyScore}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Time Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={metrics.timeProgress} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>{metrics.timeProgress}% elapsed</span>
                  <span
                    className={cn(
                      'font-medium',
                      metrics.weeksRemaining <= 4 ? 'text-orange-600' : 'text-muted-foreground'
                    )}
                  >
                    {metrics.weeksRemaining} weeks left
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Best Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-2xl font-bold">{metrics.bestStreak}</span>
                  <span className="text-muted-foreground">days</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress & Timeline */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Completion Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Actions Completed</span>
                    <span className="font-medium">
                      {metrics.completedActions}/{metrics.totalActions}
                    </span>
                  </div>
                  <Progress value={metrics.completionPercentage} className="h-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    {metrics.completionPercentage}% complete
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{data.quarterlyTargets.length}</div>
                    <div className="text-xs text-muted-foreground">Quarterly Targets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{data.impactProjects.length}</div>
                    <div className="text-xs text-muted-foreground">Impact Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{data.monthlyTargets.length}</div>
                    <div className="text-xs text-muted-foreground">Monthly Targets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{data.weeklyTargets.length}</div>
                    <div className="text-xs text-muted-foreground">Weekly Targets</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Start Date</div>
                    <div className="font-medium">
                      {format(parseISO(data.plan.start_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="h-px flex-1 mx-4 bg-gradient-to-r from-primary/50 to-primary" />
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Target Date</div>
                    <div className="font-medium">
                      {format(parseISO(data.plan.end_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{data.plan.available_hours_per_week} hours/week</div>
                    <div className="text-xs text-muted-foreground">Time allocation</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{metrics.daysRemaining} days remaining</div>
                    <div className="text-xs text-muted-foreground">Until target date</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vision Description */}
          {data.plan.visions.description && (
            <Card>
              <CardHeader>
                <CardTitle>Vision Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{data.plan.visions.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Rules Tab (Non-Negotiables) */}
        <TabsContent value="rules" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nonNegotiables.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Best Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-2xl font-bold">
                    {streakData.length > 0
                      ? Math.max(...streakData.map((s) => s.currentStreak))
                      : 0}
                  </span>
                  <span className="text-muted-foreground">days</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-cyan-500" />
                  <span className="text-2xl font-bold">
                    {streakData.reduce((sum, s) => sum + s.thisWeekCompletions, 0)}
                  </span>
                  <span className="text-muted-foreground">completions</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Non-Negotiables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Today&apos;s Non-Negotiables
              </CardTitle>
              <CardDescription>Complete your daily behaviors to build your streak</CardDescription>
            </CardHeader>
            <CardContent>
              {nonNegotiables.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No non-negotiables defined for this vision yet.
                  <br />
                  <Link href={`/vision?edit=${data.plan.vision_id}`} className="text-primary hover:underline">
                    Add some in the Vision Wizard
                  </Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {nonNegotiables.map((nn) => {
                    const streak = streakData.find((s) => s.nonNegotiableId === nn.id);
                    const isCompletedToday = completionStatus[nn.id]?.[today] > 0;
                    const isLoading = loadingCompletions.has(`${nn.id}-${today}`);

                    return (
                      <div
                        key={nn.id}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-lg border transition-colors',
                          isCompletedToday
                            ? 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800'
                            : 'bg-background'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isCompletedToday}
                            onCheckedChange={() => handleToggleCompletion(nn.id, today)}
                            disabled={isLoading}
                            className="h-5 w-5"
                          />
                          <div>
                            <div className={cn('font-medium', isCompletedToday && 'line-through text-muted-foreground')}>
                              {nn.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {nn.frequency} • {nn.targetCount}x per day
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {streak && streak.currentStreak > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <Flame className="h-3 w-3 text-orange-500" />
                              {streak.currentStreak}
                            </Badge>
                          )}
                          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Streak Leaderboard */}
          {streakData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Streak Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...streakData]
                    .sort((a, b) => b.currentStreak - a.currentStreak)
                    .map((streak, index) => (
                      <div key={streak.nonNegotiableId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                              index === 0
                                ? 'bg-yellow-100 text-yellow-800'
                                : index === 1
                                  ? 'bg-gray-100 text-gray-800'
                                  : index === 2
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {index + 1}
                          </span>
                          <span className="font-medium">{streak.title}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Flame className="h-4 w-4 text-orange-500" />
                              <span className="font-bold">{streak.currentStreak}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Best: {streak.longestStreak}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Daily Tab */}
        <TabsContent value="daily" className="space-y-6">
          {/* Calendar Sync Controls */}
          {metrics.todaysActions.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {(() => {
                  const unsyncedCount = metrics.todaysActions.filter(
                    (a) => a.status !== 'completed' && a.calendar_sync_status !== 'synced'
                  ).length;
                  const syncedCount = metrics.todaysActions.filter(
                    (a) => a.calendar_sync_status === 'synced'
                  ).length;
                  if (syncedCount > 0 && unsyncedCount === 0) {
                    return `All ${syncedCount} action(s) synced to calendar`;
                  }
                  if (syncedCount > 0) {
                    return `${syncedCount} synced, ${unsyncedCount} remaining`;
                  }
                  return `${unsyncedCount} action(s) to sync`;
                })()}
              </div>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    {(() => {
                      const unsyncedIds = metrics.todaysActions
                        .filter((a) => a.status !== 'completed' && a.calendar_sync_status !== 'synced')
                        .map((a) => a.id);
                      return unsyncedIds.length > 0 ? (
                        <Button
                          onClick={() => handleSyncToCalendar(unsyncedIds)}
                          disabled={isSyncing}
                          size="sm"
                          className="gap-2"
                        >
                          {isSyncing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CalendarPlus className="h-4 w-4" />
                          )}
                          Sync {unsyncedIds.length} to Calendar
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled className="gap-2">
                          <CalendarCheck className="h-4 w-4" />
                          All Synced
                        </Button>
                      );
                    })()}
                  </>
                ) : (
                  <Button onClick={connect} variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Connect Calendar
                  </Button>
                )}
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Today&apos;s Actions
              </CardTitle>
              <CardDescription>
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.todaysActions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No actions scheduled for today.
                </p>
              ) : (
                <div className="space-y-3">
                  {metrics.todaysActions.map((action) => (
                    <div
                      key={action.id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-lg border',
                        action.status === 'completed'
                          ? 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20'
                          : 'bg-background'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {action.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-cyan-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <div
                            className={cn(
                              'font-medium',
                              action.status === 'completed' && 'line-through text-muted-foreground'
                            )}
                          >
                            {action.title}
                          </div>
                          {action.description && (
                            <div className="text-sm text-muted-foreground">{action.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Calendar Sync Status */}
                        {action.calendar_sync_status === 'synced' && action.calendar_event_id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-cyan-600 hover:text-red-600"
                            onClick={() => handleRemoveFromCalendar(action.id, action.calendar_event_id!)}
                            disabled={syncingIds.has(action.id)}
                          >
                            {syncingIds.has(action.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <CalendarCheck className="h-3 w-3 mr-1" />
                                On Cal
                              </>
                            )}
                          </Button>
                        ) : action.status !== 'completed' && isConnected ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => handleSyncSingleAction(action.id)}
                            disabled={syncingIds.has(action.id)}
                          >
                            {syncingIds.has(action.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <CalendarPlus className="h-3 w-3 mr-1" />
                                +Cal
                              </>
                            )}
                          </Button>
                        ) : null}
                        {action.estimated_minutes && (
                          <Badge variant="outline">{action.estimated_minutes} min</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Actions</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const now = new Date();
                const next7Days = eachDayOfInterval({
                  start: addDays(now, 1),
                  end: addDays(now, 7),
                });

                const upcomingActions = data.dailyActions.filter((a) => {
                  const actionDate = parseISO(a.action_date);
                  return next7Days.some((d) => isSameDay(d, actionDate));
                });

                if (upcomingActions.length === 0) {
                  return (
                    <p className="text-muted-foreground text-center py-4">
                      No upcoming actions in the next 7 days.
                    </p>
                  );
                }

                return (
                  <div className="space-y-4">
                    {next7Days.map((day) => {
                      const dayActions = upcomingActions.filter((a) =>
                        isSameDay(parseISO(a.action_date), day)
                      );
                      if (dayActions.length === 0) return null;

                      return (
                        <div key={day.toISOString()}>
                          <div className="text-sm font-medium text-muted-foreground mb-2">
                            {format(day, 'EEEE, MMM d')}
                          </div>
                          <div className="space-y-2 pl-4 border-l-2 border-muted">
                            {dayActions.map((action) => (
                              <div key={action.id} className="flex items-center gap-2">
                                <Circle className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{action.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly Tab */}
        <TabsContent value="weekly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5" />
                This Week&apos;s Targets
              </CardTitle>
              <CardDescription>
                Week {metrics.currentWeek} • {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} -{' '}
                {format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.weeklyTargetsThisW.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No weekly targets for this week.
                </p>
              ) : (
                <div className="space-y-4">
                  {metrics.weeklyTargetsThisW.map((target) => {
                    const relatedActions = data.dailyActions.filter(
                      (a) => a.weekly_target_id === target.id
                    );
                    const completedCount = relatedActions.filter(
                      (a) => a.status === 'completed'
                    ).length;
                    const progress =
                      relatedActions.length > 0
                        ? Math.round((completedCount / relatedActions.length) * 100)
                        : 0;

                    return (
                      <div key={target.id} className="p-4 rounded-lg border space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{target.title}</div>
                            {target.description && (
                              <div className="text-sm text-muted-foreground">{target.description}</div>
                            )}
                          </div>
                          <Badge className={STATUS_COLORS[target.status]}>{target.status}</Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>
                              {completedCount}/{relatedActions.length} actions completed
                            </span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Weekly Targets */}
          <Card>
            <CardHeader>
              <CardTitle>All Weekly Targets</CardTitle>
              <CardDescription>{data.weeklyTargets.length} total weekly targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.weeklyTargets.map((target) => (
                  <div
                    key={target.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <div className="font-medium text-sm">{target.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(target.week_start_date), 'MMM d')} -{' '}
                        {format(parseISO(target.week_end_date), 'MMM d')}
                      </div>
                    </div>
                    <Badge variant="outline" className={STATUS_COLORS[target.status]}>
                      {target.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Tab */}
        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                This Month&apos;s Targets
              </CardTitle>
              <CardDescription>
                {format(new Date(), 'MMMM yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.monthlyTargetsThisM.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No monthly targets for this month.
                </p>
              ) : (
                <div className="space-y-4">
                  {metrics.monthlyTargetsThisM.map((target) => {
                    const relatedWeekly = data.weeklyTargets.filter(
                      (w) =>
                        data.monthlyTargets.find((m) => m.id === target.id)?.power_goal_id ===
                        data.impactProjects.find((p) =>
                          data.monthlyTargets.some((mt) => mt.power_goal_id === p.id)
                        )?.id
                    );

                    return (
                      <div key={target.id} className="p-4 rounded-lg border space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{target.title}</div>
                            {target.description && (
                              <div className="text-sm text-muted-foreground">{target.description}</div>
                            )}
                          </div>
                          <Badge className={STATUS_COLORS[target.status]}>{target.status}</Badge>
                        </div>
                        {target.key_metric && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Key Metric:</span>{' '}
                            {target.key_metric}
                            {target.target_value && ` → ${target.target_value}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Monthly Targets */}
          <Card>
            <CardHeader>
              <CardTitle>All Monthly Targets</CardTitle>
              <CardDescription>{data.monthlyTargets.length} total monthly targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.monthlyTargets.map((target) => (
                  <div
                    key={target.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <div className="font-medium text-sm">{target.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(target.target_year, target.target_month - 1), 'MMMM yyyy')}
                      </div>
                    </div>
                    <Badge variant="outline" className={STATUS_COLORS[target.status]}>
                      {target.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quarterly Tab */}
        <TabsContent value="quarterly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                Q{metrics.currentQuarter} {metrics.currentYear} Targets
              </CardTitle>
              <CardDescription>Current quarter progress</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.quarterlyTargetsThisQ.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No quarterly targets for this quarter.
                </p>
              ) : (
                <div className="space-y-4">
                  {metrics.quarterlyTargetsThisQ.map((target) => (
                    <div key={target.id} className="p-4 rounded-lg border space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{target.title}</div>
                          {target.description && (
                            <div className="text-sm text-muted-foreground">{target.description}</div>
                          )}
                        </div>
                        <Badge className={STATUS_COLORS[target.status]}>{target.status}</Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{target.progress_percentage}%</span>
                        </div>
                        <Progress value={target.progress_percentage} className="h-2" />
                      </div>
                      {target.key_metric && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Key Metric:</span>{' '}
                          {target.key_metric}
                          {target.current_value && target.target_value && (
                            <span className="ml-2">
                              ({target.current_value} / {target.target_value})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Full Plan Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Full Plan Breakdown
              </CardTitle>
              <CardDescription>Complete cascading view of all targets</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <CascadingPlanView
                visionTitle={data.plan.visions.title}
                visionColor={data.plan.visions.color}
                quarterlyTargets={data.quarterlyTargets}
                impactProjects={data.impactProjects}
                monthlyTargets={data.monthlyTargets}
                weeklyTargets={data.weeklyTargets}
                dailyActions={data.dailyActions}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
