'use client';

import { useState, useMemo } from 'react';
import { subWeeks, startOfWeek, endOfWeek, format } from 'date-fns';
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
import { useAnalyticsData } from '@/lib/hooks/use-analytics-data';
import { WeeklyTrendsChart } from '@/components/features/analytics/weekly-trends-chart';
import { ProductivityHeatmap } from '@/components/features/analytics/productivity-heatmap';
import { DripPieChart } from '@/components/features/time-audit/drip-pie-chart';
import { EnergyPieChart } from '@/components/features/time-audit/energy-pie-chart';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Target,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShareButton } from '@/components/features/sharing';

type DateRangeOption = '1week' | '2weeks' | '1month' | '3months';

export default function AnalyticsPage() {
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('1month');

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

  const analytics = useAnalyticsData(dateRange);

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
              {analytics.dripBreakdown.production > 0
                ? `${(analytics.dripBreakdown.production / 60).toFixed(1)}h in production`
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
            <CardTitle className="text-sm font-medium">Energy Balance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold flex items-center gap-1",
              analytics.energyBalance > 0 ? 'text-cyan-600' : analytics.energyBalance < 0 ? 'text-red-600' : ''
            )}>
              {analytics.energyBalance > 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : analytics.energyBalance < 0 ? (
                <TrendingDown className="h-5 w-5" />
              ) : null}
              {analytics.energyBalance}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.energyBalance > 20
                ? 'Great energy management!'
                : analytics.energyBalance < -20
                ? 'Consider more energizing tasks'
                : 'Balanced energy levels'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Productivity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHour(analytics.peakProductivityHour)}
            </div>
            <p className="text-xs text-muted-foreground">
              Best day: {analytics.mostProductiveDay}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Weekly Trends
          </CardTitle>
          <CardDescription>
            Hours spent in each DRIP category over time
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
            <CardTitle>DRIP Distribution</CardTitle>
            <CardDescription>
              How your time breaks down across quadrants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.totalHours > 0 ? (
              <DripPieChart data={analytics.dripBreakdown} size="lg" />
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
                    ? Math.round((analytics.dripBreakdown.investment / (analytics.totalHours * 60)) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Replacement (Automate)</span>
                <span className="font-medium text-orange-600">
                  {analytics.totalHours > 0
                    ? Math.round((analytics.dripBreakdown.replacement / (analytics.totalHours * 60)) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delegation (Delegate)</span>
                <span className="font-medium text-purple-600">
                  {analytics.totalHours > 0
                    ? Math.round((analytics.dripBreakdown.delegation / (analytics.totalHours * 60)) * 100)
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
    </div>
  );
}
