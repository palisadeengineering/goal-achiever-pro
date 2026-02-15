'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { subWeeks, startOfWeek, endOfWeek, format } from 'date-fns';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAnalyticsData } from '@/lib/hooks/use-analytics-data';
import { useEnhancedAnalytics, type TimeGranularity } from '@/lib/hooks/use-enhanced-analytics';
import { WeeklyTrendsChart } from '@/components/features/analytics/weekly-trends-chart';
import { ProductivityHeatmap } from '@/components/features/analytics/productivity-heatmap';
import { ValuePieChart } from '@/components/features/time-audit/drip-pie-chart';
import { EnergyPieChart } from '@/components/features/time-audit/energy-pie-chart';
import { CategoryBreakdownChart } from '@/components/features/analytics/category-breakdown-chart';
import { TimeByProjectChart } from '@/components/features/analytics/time-by-project-chart';
import { MeetingLoadWidget } from '@/components/features/analytics/meeting-load-widget';
import { PeriodComparisonView } from '@/components/features/analytics/period-comparison-view';
import { LeverageBreakdownChart } from '@/components/features/analytics/leverage-breakdown-chart';
import {
  Clock,
  Target,
  BarChart3,
  Users,
  FolderKanban,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShareButton } from '@/components/features/sharing';
import Link from 'next/link';

type DateRangeOption = '1week' | '2weeks' | '1month' | '3months';
type ViewTab = 'overview' | 'projects' | 'meetings';

interface PowerGoal {
  id: string;
  title: string;
  quarter: number;
}

const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
];

export default function AnalyticsPage() {
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('1month');
  const [viewTab, setViewTab] = useState<ViewTab>('overview');

  // Project edit dialog state
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editPowerGoalId, setEditPowerGoalId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [powerGoals, setPowerGoals] = useState<PowerGoal[]>([]);

  const dateRange = useMemo(() => {
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    let start: Date;

    switch (dateRangeOption) {
      case '1week':
        start = startOfWeek(new Date(), { weekStartsOn: 1 });
        break;
      case '2weeks':
        start = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1);
        break;
      case '1month':
        start = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 3);
        break;
      case '3months':
        start = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 11);
        break;
      default:
        start = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 3);
    }

    return { start, end };
  }, [dateRangeOption]);

  const granularity: TimeGranularity = useMemo(() => {
    switch (dateRangeOption) {
      case '1week': return 'week';
      case '2weeks': return 'week';
      case '1month': return 'month';
      case '3months': return 'quarter';
      default: return 'week';
    }
  }, [dateRangeOption]);

  const periodLabel = useMemo(() => {
    switch (dateRangeOption) {
      case '1week': return 'This Week vs Last Week';
      case '2weeks': return 'These 2 Weeks vs Previous 2 Weeks';
      case '1month': return 'This Month vs Last Month';
      case '3months': return 'This Quarter vs Last Quarter';
      default: return 'This Period vs Previous';
    }
  }, [dateRangeOption]);

  const analytics = useAnalyticsData(dateRange);
  const enhancedAnalytics = useEnhancedAnalytics(dateRange, granularity);

  // Fetch power goals when edit dialog opens
  useEffect(() => {
    if (editProjectId) {
      fetch('/api/power-goals')
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.powerGoals) setPowerGoals(data.powerGoals);
        })
        .catch(() => {});
    }
  }, [editProjectId]);

  // Handle project click - fetch project details and open edit dialog
  const handleProjectClick = useCallback(async (projectId: string) => {
    setEditProjectId(projectId);
    setIsLoadingProject(true);
    setLoadError(null);

    try {
      const res = await fetch('/api/detected-projects');
      if (!res.ok) {
        setLoadError('Failed to load project details');
        return;
      }
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const project = (data.projects || []).find((p: any) => p.id === projectId);
      if (project) {
        setEditName(project.name);
        setEditColor(project.color || '#6b7280');
        setEditPowerGoalId(project.powerGoalId || null);
      } else {
        setLoadError('Project not found');
      }
    } catch {
      setLoadError('Failed to load project details');
    } finally {
      setIsLoadingProject(false);
    }
  }, []);

  // Save project edits
  const saveProjectEdits = async () => {
    if (!editProjectId || !editName.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/detected-projects/${editProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          color: editColor,
          powerGoalId: editPowerGoalId,
        }),
      });

      if (response.ok) {
        setEditProjectId(null);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Insights into your time usage and productivity patterns"
        actions={
          <div className="flex items-center gap-2">
            <ShareButton tabName="analytics" />
            <Select
              value={dateRangeOption}
              onValueChange={(v) => setDateRangeOption(v as DateRangeOption)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1week">This Week</SelectItem>
                <SelectItem value="2weeks">2 Weeks</SelectItem>
                <SelectItem value="1month">1 Month</SelectItem>
                <SelectItem value="3months">3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Time</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.productionPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.valueBreakdown.production > 0
                ? `${(analytics.valueBreakdown.production / 60).toFixed(1)}h in production`
                : 'Start tracking to see data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours Tracked</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalHours.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meeting Load</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              enhancedAnalytics.meetingMetrics.meetingPercentage > 50 ? 'text-amber-600' : ''
            )}>
              {enhancedAnalytics.meetingMetrics.meetingPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              {(enhancedAnalytics.meetingMetrics.totalMeetingMinutes / 60).toFixed(1)}h in meetings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Time</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(enhancedAnalytics.totalProjectMinutes / 60).toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {enhancedAnalytics.projectBreakdown.length} projects tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Views */}
      <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as ViewTab)}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Activity Type Breakdown */}
          <CategoryBreakdownChart
            data={enhancedAnalytics.activityTypeBreakdown}
            totalMinutes={enhancedAnalytics.totalMinutes}
          />

          {/* Period Comparison */}
          <PeriodComparisonView
            comparison={enhancedAnalytics.periodComparison}
            periodLabel={periodLabel}
          />

          {/* Weekly Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Weekly Trends
              </CardTitle>
              <CardDescription>
                Hours spent in each Value category over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyTrendsChart data={analytics.weeklyTrends} />
            </CardContent>
          </Card>

          {/* Two-column layout for pie charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Value Distribution</CardTitle>
                <CardDescription>
                  How your time breaks down across quadrants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.totalHours > 0 ? (
                  <ValuePieChart data={analytics.valueBreakdown} size="lg" />
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No data available
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Production (Sweet Spot)</span>
                    <span className="font-medium text-cyan-600">
                      {analytics.productionPercentage}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Investment (Growth)</span>
                    <span className="font-medium text-blue-600">
                      {analytics.totalHours > 0
                        ? Math.round((analytics.valueBreakdown.investment / (analytics.totalHours * 60)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Replacement (Automate)</span>
                    <span className="font-medium text-orange-600">
                      {analytics.totalHours > 0
                        ? Math.round((analytics.valueBreakdown.replacement / (analytics.totalHours * 60)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delegation (Delegate)</span>
                    <span className="font-medium text-purple-600">
                      {analytics.totalHours > 0
                        ? Math.round((analytics.valueBreakdown.delegation / (analytics.totalHours * 60)) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Energy Distribution</CardTitle>
                <CardDescription>
                  Balance between energizing and draining activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.totalHours > 0 ? (
                  <EnergyPieChart data={analytics.energyBreakdown} size="lg" />
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No data available
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-500" />
                      Energizing
                    </span>
                    <span className="font-medium text-cyan-600">
                      {analytics.totalHours > 0
                        ? Math.round((analytics.energyBreakdown.green / (analytics.totalHours * 60)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500" />
                      Neutral
                    </span>
                    <span className="font-medium text-yellow-600">
                      {analytics.totalHours > 0
                        ? Math.round((analytics.energyBreakdown.yellow / (analytics.totalHours * 60)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Draining
                    </span>
                    <span className="font-medium text-red-600">
                      {analytics.totalHours > 0
                        ? Math.round((analytics.energyBreakdown.red / (analytics.totalHours * 60)) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leverage Distribution (4 C's) */}
          <LeverageBreakdownChart data={enhancedAnalytics.leverageBreakdown} />

          {/* Productivity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Patterns</CardTitle>
              <CardDescription>
                Discover when you&apos;re most productive throughout the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductivityHeatmap data={analytics.heatmapData} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6 mt-6">
          <TimeByProjectChart
            data={enhancedAnalytics.projectBreakdown}
            onProjectClick={handleProjectClick}
          />

          <div className="flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <Link href="/time-audit/projects">
                <FolderKanban className="h-4 w-4 mr-2" />
                Manage All Projects
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Period comparison for projects */}
          <PeriodComparisonView
            comparison={enhancedAnalytics.periodComparison}
            periodLabel={periodLabel}
          />
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="space-y-6 mt-6">
          <MeetingLoadWidget metrics={enhancedAnalytics.meetingMetrics} />

          {/* Period comparison for meetings focus */}
          <PeriodComparisonView
            comparison={enhancedAnalytics.periodComparison}
            periodLabel={periodLabel}
          />
        </TabsContent>
      </Tabs>

      {/* Project Edit Dialog */}
      <Dialog open={!!editProjectId} onOpenChange={(open) => !open && setEditProjectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details and link to a Power Goal
            </DialogDescription>
          </DialogHeader>

          {isLoadingProject ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <p className="text-sm text-destructive">{loadError}</p>
              <Button variant="outline" size="sm" onClick={() => editProjectId && handleProjectClick(editProjectId)}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-project-name">Name</Label>
                <Input
                  id="edit-project-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Project name"
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-lg transition-all ${
                        editColor === color
                          ? 'ring-2 ring-offset-2 ring-primary scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Link to Power Goal</Label>
                <Select
                  value={editPowerGoalId || 'none'}
                  onValueChange={(v) => setEditPowerGoalId(v === 'none' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Power Goal..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">No link</span>
                    </SelectItem>
                    {powerGoals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        Q{goal.quarter}: {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProjectId(null)}>
              Cancel
            </Button>
            <Button
              onClick={saveProjectEdits}
              disabled={isSaving || isLoadingProject || !editName.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
