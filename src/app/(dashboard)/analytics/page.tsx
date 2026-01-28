'use client';

import { useState, useMemo } from 'react';
import { subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, format } from 'date-fns';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Target,
  Calendar,
  BarChart3,
  Users,
  FolderKanban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShareButton } from '@/components/features/sharing';

type DateRangeOption = '1week' | '2weeks' | '1month' | '3months';
type ViewTab = 'overview' | 'projects' | 'meetings';

export default function AnalyticsPage() {
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('1month');
  const [viewTab, setViewTab] = useState<ViewTab>('overview');

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

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
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
          <TimeByProjectChart data={enhancedAnalytics.projectBreakdown} />

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
    </div>
  );
}
