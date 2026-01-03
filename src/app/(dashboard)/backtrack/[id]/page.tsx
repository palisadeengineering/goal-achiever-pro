'use client';

import { useState, useEffect, use } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CascadingPlanView } from '@/components/features/backtrack/cascading-plan-view';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  GitBranch,
  Calendar,
  Clock,
  Target,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Play,
  Pause,
  CheckCircle2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  powerGoals: Array<{
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
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
};

export default function BacktrackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<PlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPlanData();
  }, [id]);

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

  const handleStatusChange = async (newStatus: string) => {
    if (!data) return;
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/backtrack/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setData((prev) =>
        prev ? { ...prev, plan: { ...prev.plan, status: newStatus } } : prev
      );
      toast.success(`Plan ${newStatus === 'active' ? 'activated' : newStatus === 'paused' ? 'paused' : 'updated'}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update plan status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this backtrack plan? This action cannot be undone.')) {
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

  const calculateProgress = () => {
    if (!data) return 0;
    const start = new Date(data.plan.start_date);
    const end = new Date(data.plan.end_date);
    const now = new Date();

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / total) * 100);
  };

  const calculateWeeksRemaining = () => {
    if (!data) return 0;
    const end = new Date(data.plan.end_date);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)));
  };

  const calculateCompletionStats = () => {
    if (!data) return { completed: 0, total: 0, percentage: 0 };

    const totalActions = data.dailyActions.length;
    const completedActions = data.dailyActions.filter((a) => a.status === 'completed').length;
    const percentage = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

    return { completed: completedActions, total: totalActions, percentage };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Loading..."
          icon={<GitBranch className="h-6 w-6" />}
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Error"
          icon={<GitBranch className="h-6 w-6" />}
        />
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

  const timeProgress = calculateProgress();
  const weeksRemaining = calculateWeeksRemaining();
  const completionStats = calculateCompletionStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.plan.visions.title}
        description="Backtrack Plan Details"
        icon={<GitBranch className="h-6 w-6" />}
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
                onClick={() => handleStatusChange('paused')}
                disabled={isUpdating}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Pause className="h-4 w-4" />
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

      {/* Status and Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={cn('text-lg px-3 py-1', STATUS_COLORS[data.plan.status])}>
              {data.plan.status.charAt(0).toUpperCase() + data.plan.status.slice(1)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Time Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={timeProgress} className="h-2" />
            <div className="flex justify-between text-sm">
              <span>{timeProgress}% elapsed</span>
              <span
                className={cn(
                  'font-medium',
                  weeksRemaining <= 4 ? 'text-orange-600' : 'text-muted-foreground'
                )}
              >
                {weeksRemaining} weeks left
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actions Completed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={completionStats.percentage} className="h-2" />
            <div className="flex justify-between text-sm">
              <span>{completionStats.completed}/{completionStats.total}</span>
              <span className="font-medium">{completionStats.percentage}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Time Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{data.plan.available_hours_per_week}</span>
              <span className="text-muted-foreground">hours/week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Start Date</div>
              <div className="font-medium">
                {format(parseISO(data.plan.start_date), 'MMMM d, yyyy')}
              </div>
            </div>
            <div className="h-px flex-1 mx-6 bg-gradient-to-r from-primary/50 to-primary" />
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Target Date</div>
              <div className="font-medium">
                {format(parseISO(data.plan.end_date), 'MMMM d, yyyy')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{data.quarterlyTargets.length}</div>
            <div className="text-sm text-muted-foreground">Quarterly Targets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{data.powerGoals.length}</div>
            <div className="text-sm text-muted-foreground">Power Goals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{data.monthlyTargets.length}</div>
            <div className="text-sm text-muted-foreground">Monthly Targets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{data.dailyActions.length}</div>
            <div className="text-sm text-muted-foreground">Daily Actions</div>
          </CardContent>
        </Card>
      </div>

      {/* Cascading Plan View */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Full Plan Breakdown
        </h3>
        <CascadingPlanView
          visionTitle={data.plan.visions.title}
          visionColor={data.plan.visions.color}
          quarterlyTargets={data.quarterlyTargets}
          powerGoals={data.powerGoals}
          monthlyTargets={data.monthlyTargets}
          weeklyTargets={data.weeklyTargets}
          dailyActions={data.dailyActions}
        />
      </div>
    </div>
  );
}
