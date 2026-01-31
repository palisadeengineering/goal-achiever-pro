'use client';

import { useState, useMemo, useCallback } from 'react';
import { CalendarIcon, Clock, Target, Zap, ArrowUpRight, ArrowDownRight, BarChart2, Sparkles, Lightbulb, TrendingUp, Goal, Battery, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format, subWeeks } from 'date-fns';

// Helper to format Date to yyyy-MM-dd string for reliable comparison
function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Helper to parse date string as local date (avoids UTC timezone issues)
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
import { Progress } from '@/components/ui/progress';
import {
  useInsightsData,
  type TimeBlockData,
  type GroupByOption,
  type GranularityOption,
  type MeasureOption,
} from '@/lib/hooks/use-insights-data';
import { useEnhancedAnalytics } from '@/lib/hooks/use-enhanced-analytics';
import type { Tag } from '@/lib/hooks/use-tags';
import type { ValueQuadrant, EnergyRating } from '@/types/database';
import {
  HorizontalBarChart,
  DonutChart,
  StackedBarChart,
  TrendLineChart,
  EnergyFlowChart,
} from './insights-charts';
import { CategoryBreakdownChart } from '@/components/features/analytics/category-breakdown-chart';
import { TimeByProjectChart } from '@/components/features/analytics/time-by-project-chart';
import { MeetingLoadWidget } from '@/components/features/analytics/meeting-load-widget';
import { InsightsDateRangePicker } from './insights-date-range-picker';

interface InsightsViewProps {
  timeBlocks: TimeBlockData[];
  tags: Tag[];
  dateRange: { start: Date; end: Date };
  onDateRangeChange?: (start: Date, end: Date) => void;
}

// AI Insights types
interface AIInsight {
  type: 'optimization' | 'pattern' | 'goal_alignment' | 'energy';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  metric?: string;
}

interface AIInsightsState {
  insights: AIInsight[];
  summary: string;
  isLoading: boolean;
  error: string | null;
  lastGenerated: Date | null;
}

type ChartType = 'bar' | 'pie' | 'stacked' | 'line';

const VALUE_COLORS: Record<string, string> = {
  production: '#06b6d4', // Cyan
  investment: '#6366f1', // Indigo
  replacement: '#f97316', // Orange
  delegation: '#ec4899', // Pink
  na: '#94a3b8',
};

const ENERGY_COLORS: Record<string, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

export function InsightsView({ timeBlocks, tags, dateRange, onDateRangeChange }: InsightsViewProps) {
  const [groupBy, setGroupBy] = useState<GroupByOption>('value');
  const [granularity, setGranularity] = useState<GranularityOption>('day');
  const [measure, setMeasure] = useState<MeasureOption>('hours');
  const [chartType, setChartType] = useState<ChartType>('bar');

  // Filter states
  const [selectedValue, setSelectedValue] = useState<ValueQuadrant[]>([]);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyRating[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // AI Insights state
  const [aiInsights, setAiInsights] = useState<AIInsightsState>({
    insights: [],
    summary: '',
    isLoading: false,
    error: null,
    lastGenerated: null,
  });

  // Use date range from parent (synced with calendar view)
  const startDate = dateRange.start;
  const endDate = dateRange.end;

  // Generate AI insights
  const generateInsights = useCallback(async () => {
    if (timeBlocks.length === 0) {
      setAiInsights(prev => ({
        ...prev,
        error: 'No time blocks to analyze. Track some activities first.',
      }));
      return;
    }

    setAiInsights(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/ai/generate-time-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeBlocks: timeBlocks.map(b => ({
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            activityName: b.activityName,
            valueQuadrant: b.valueQuadrant,
            energyRating: b.energyRating,
            durationMinutes: b.durationMinutes || 0,
          })),
          dateRange: {
            start: format(startDate, 'yyyy-MM-dd'),
            end: format(endDate, 'yyyy-MM-dd'),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate insights');
      }

      const data = await response.json();
      setAiInsights({
        insights: data.insights || [],
        summary: data.summary || '',
        isLoading: false,
        error: null,
        lastGenerated: new Date(),
      });
    } catch (error) {
      setAiInsights(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate insights',
      }));
    }
  }, [timeBlocks, startDate, endDate]);

  const insightsData = useInsightsData({
    timeBlocks,
    tags,
    startDate,
    endDate,
    groupBy,
    granularity,
    measure,
    filters: {
      valueQuadrants: selectedValue.length > 0 ? selectedValue : undefined,
      energyRatings: selectedEnergy.length > 0 ? selectedEnergy : undefined,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    },
  });

  // Enhanced analytics data (fetches from API for activity classification)
  const enhancedAnalytics = useEnhancedAnalytics(
    { start: startDate, end: endDate },
    granularity === 'day' ? 'day' : granularity === 'week' ? 'week' : 'month'
  );

  // Get colors and keys for time series charts
  const { chartKeys, chartColors } = useMemo(() => {
    let keys: string[] = [];
    let colors: Record<string, string> = {};

    switch (groupBy) {
      case 'value':
        keys = ['production', 'investment', 'replacement', 'delegation', 'na'];
        colors = VALUE_COLORS;
        break;
      case 'energy':
        keys = ['green', 'yellow', 'red'];
        colors = ENERGY_COLORS;
        break;
      case 'tag':
        const tagNames = new Set<string>();
        insightsData.timeSeriesData.forEach(point => {
          Object.keys(point).forEach(key => {
            if (key !== 'period') tagNames.add(key);
          });
        });
        keys = Array.from(tagNames);
        colors = keys.reduce((acc, name) => {
          const tag = tags.find(t => t.name === name);
          acc[name] = tag?.color || '#94a3b8';
          return acc;
        }, {} as Record<string, string>);
        break;
      default:
        keys = ['total'];
        colors = { total: '#3b82f6' };
    }

    return { chartKeys: keys, chartColors: colors };
  }, [groupBy, tags, insightsData.timeSeriesData]);

  const toggleValueFilter = (quadrant: ValueQuadrant) => {
    setSelectedValue(prev =>
      prev.includes(quadrant)
        ? prev.filter(q => q !== quadrant)
        : [...prev, quadrant]
    );
  };

  const toggleEnergyFilter = (rating: EnergyRating) => {
    setSelectedEnergy(prev =>
      prev.includes(rating)
        ? prev.filter(r => r !== rating)
        : [...prev, rating]
    );
  };

  const toggleTagFilter = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setSelectedValue([]);
    setSelectedEnergy([]);
    setSelectedTags([]);
  };

  const hasFilters = selectedValue.length > 0 || selectedEnergy.length > 0 || selectedTags.length > 0;

  // Calculate productivity score (weighted by Value + Energy)
  const productivityMetrics = useMemo(() => {
    // Use string comparison for reliable date filtering
    const rangeStartStr = formatDateStr(startDate);
    const rangeEndStr = formatDateStr(endDate);

    const blocks = timeBlocks.filter(b => {
      if (!b.date || typeof b.date !== 'string') return false;
      return b.date >= rangeStartStr && b.date <= rangeEndStr;
    });

    if (blocks.length === 0) {
      return { score: 0, productionRatio: 0, energyBalance: 0, weeklyChange: 0 };
    }

    // Calculate production ratio (production + investment hours / total hours)
    const totalMinutes = blocks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
    const productiveMinutes = blocks
      .filter(b => b.valueQuadrant === 'production' || b.valueQuadrant === 'investment')
      .reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
    const productionRatio = totalMinutes > 0 ? (productiveMinutes / totalMinutes) * 100 : 0;

    // Calculate energy balance (energizing - draining hours)
    const energizingMinutes = blocks.filter(b => b.energyRating === 'green').reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
    const drainingMinutes = blocks.filter(b => b.energyRating === 'red').reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
    const energyBalance = totalMinutes > 0 ? ((energizingMinutes - drainingMinutes) / totalMinutes) * 100 : 0;

    // Calculate overall productivity score (0-100)
    // Formula: 60% weight on production ratio + 40% weight on energy balance (normalized to 0-100)
    const normalizedEnergyBalance = (energyBalance + 100) / 2; // Convert -100 to 100 range to 0 to 100
    const score = Math.round(productionRatio * 0.6 + normalizedEnergyBalance * 0.4);

    // Calculate week-over-week change
    const prevWeekStartStr = formatDateStr(subWeeks(startDate, 1));
    const prevWeekEndStr = formatDateStr(subWeeks(endDate, 1));
    const prevBlocks = timeBlocks.filter(b => {
      if (!b.date || typeof b.date !== 'string') return false;
      return b.date >= prevWeekStartStr && b.date <= prevWeekEndStr;
    });

    let weeklyChange = 0;
    if (prevBlocks.length > 0) {
      const prevTotalMinutes = prevBlocks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
      const prevProductiveMinutes = prevBlocks
        .filter(b => b.valueQuadrant === 'production' || b.valueQuadrant === 'investment')
        .reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
      const prevProductionRatio = prevTotalMinutes > 0 ? (prevProductiveMinutes / prevTotalMinutes) * 100 : 0;
      weeklyChange = productionRatio - prevProductionRatio;
    }

    return { score, productionRatio, energyBalance, weeklyChange };
  }, [timeBlocks, startDate, endDate]);

  // Calculate top activities
  const topActivities = useMemo(() => {
    // Use string comparison for reliable date filtering
    const rangeStartStr = formatDateStr(startDate);
    const rangeEndStr = formatDateStr(endDate);

    const blocks = timeBlocks.filter(b => {
      if (!b.date || typeof b.date !== 'string') return false;
      return b.date >= rangeStartStr && b.date <= rangeEndStr;
    });

    // Group by activity name
    const activityMap = new Map<string, { name: string; minutes: number; events: number; value: string; energy: string }>();
    blocks.forEach(block => {
      const name = block.activityName.toLowerCase().trim();
      const existing = activityMap.get(name) || { name: block.activityName, minutes: 0, events: 0, value: block.valueQuadrant, energy: block.energyRating };
      existing.minutes += block.durationMinutes || 0;
      existing.events += 1;
      activityMap.set(name, existing);
    });

    // Sort by minutes and take top 10
    const sorted = Array.from(activityMap.values())
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 10);

    const totalMinutes = blocks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
    return sorted.map(a => ({
      ...a,
      hours: Number((a.minutes / 60).toFixed(1)),
      percentage: totalMinutes > 0 ? Math.round((a.minutes / totalMinutes) * 100) : 0,
    }));
  }, [timeBlocks, startDate, endDate]);

  // Calculate day of week distribution
  const dayOfWeekData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Use string comparison for reliable date filtering
    const rangeStartStr = formatDateStr(startDate);
    const rangeEndStr = formatDateStr(endDate);

    const blocks = timeBlocks.filter(b => {
      if (!b.date || typeof b.date !== 'string') return false;
      return b.date >= rangeStartStr && b.date <= rangeEndStr;
    });

    const dayMinutes: number[] = [0, 0, 0, 0, 0, 0, 0];
    blocks.forEach(block => {
      // Parse date string as local date to get correct day of week
      const blockDate = parseLocalDate(block.date);
      const dayIndex = blockDate.getDay();
      dayMinutes[dayIndex] += block.durationMinutes || 0;
    });

    const maxMinutes = Math.max(...dayMinutes, 1);
    return days.map((day, i) => ({
      day,
      hours: Number((dayMinutes[i] / 60).toFixed(1)),
      percentage: Math.round((dayMinutes[i] / maxMinutes) * 100),
    }));
  }, [timeBlocks, startDate, endDate]);

  // Helper to get icon for insight type
  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'optimization': return <Lightbulb className="h-4 w-4" />;
      case 'pattern': return <TrendingUp className="h-4 w-4" />;
      case 'goal_alignment': return <Goal className="h-4 w-4" />;
      case 'energy': return <Battery className="h-4 w-4" />;
    }
  };

  // Helper to get priority badge color
  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Insights Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">AI Insights</CardTitle>
            </div>
            <Button
              onClick={generateInsights}
              disabled={aiInsights.isLoading || timeBlocks.length === 0}
              size="sm"
              variant={aiInsights.insights.length > 0 ? 'outline' : 'default'}
            >
              {aiInsights.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : aiInsights.insights.length > 0 ? (
                'Regenerate'
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
          {aiInsights.lastGenerated && (
            <CardDescription>
              Last generated {format(aiInsights.lastGenerated, 'MMM d, h:mm a')}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {/* Error State */}
          {aiInsights.error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{aiInsights.error}</span>
            </div>
          )}

          {/* Empty State */}
          {!aiInsights.isLoading && !aiInsights.error && aiInsights.insights.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Click &quot;Generate Insights&quot; to get AI-powered productivity recommendations</p>
              <p className="text-xs mt-1">Based on your time tracking data from the selected date range</p>
            </div>
          )}

          {/* Loading State */}
          {aiInsights.isLoading && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse rounded-lg border p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-full mb-1" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          )}

          {/* Insights Display */}
          {!aiInsights.isLoading && aiInsights.insights.length > 0 && (
            <div className="space-y-4">
              {/* Summary */}
              {aiInsights.summary && (
                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    {aiInsights.summary}
                  </p>
                </div>
              )}

              {/* Insight Cards */}
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {aiInsights.insights.map((insight, index) => (
                  <div
                    key={index}
                    className="rounded-lg border p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {getInsightIcon(insight.type)}
                        <span className="text-xs uppercase tracking-wide">
                          {insight.type.replace('_', ' ')}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getPriorityColor(insight.priority)}`}
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                    {insight.metric && (
                      <div className="mt-2 text-xs font-medium text-purple-600 dark:text-purple-400">
                        {insight.metric}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Date Range Picker */}
        {onDateRangeChange ? (
          <InsightsDateRangePicker
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
          />
        ) : (
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
            </span>
          </div>
        )}

        {/* Group By */}
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Group By:</Label>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value">Value</SelectItem>
              <SelectItem value="energy">Energy</SelectItem>
              <SelectItem value="tag">Tag</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Granularity */}
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Granularity:</Label>
          <Select value={granularity} onValueChange={(v) => setGranularity(v as GranularityOption)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Measure */}
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Measure:</Label>
          <Select value={measure} onValueChange={(v) => setMeasure(v as MeasureOption)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="events">Events</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Filters</CardTitle>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Value Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground w-16">Value:</span>
            {(['production', 'investment', 'replacement', 'delegation', 'na'] as ValueQuadrant[]).map(quadrant => (
              <Badge
                key={quadrant}
                variant={selectedValue.includes(quadrant) ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                style={selectedValue.includes(quadrant) ? { backgroundColor: VALUE_COLORS[quadrant] } : {}}
                onClick={() => toggleValueFilter(quadrant)}
              >
                {quadrant === 'na' ? 'N/A' : quadrant}
              </Badge>
            ))}
          </div>

          {/* Energy Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground w-16">Energy:</span>
            {(['green', 'yellow', 'red'] as EnergyRating[]).map(rating => (
              <Badge
                key={rating}
                variant={selectedEnergy.includes(rating) ? 'default' : 'outline'}
                className="cursor-pointer"
                style={selectedEnergy.includes(rating) ? { backgroundColor: ENERGY_COLORS[rating] } : {}}
                onClick={() => toggleEnergyFilter(rating)}
              >
                {rating === 'green' ? 'Energizing' : rating === 'yellow' ? 'Neutral' : 'Draining'}
              </Badge>
            ))}
          </div>

          {/* Tag Filters */}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground w-16">Tags:</span>
              {tags.map(tag => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                  onClick={() => toggleTagFilter(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Quality Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-2">
        <span>
          Analyzing {insightsData.dataQuality.totalBlocks} time blocks from {insightsData.dataQuality.dateRange.start} - {insightsData.dataQuality.dateRange.end}
          {insightsData.dataQuality.daysWithData > 0 && (
            <span className="ml-2">({insightsData.dataQuality.daysWithData} days with data)</span>
          )}
        </span>
        {insightsData.dataQuality.uncategorizedPercentage > 30 && (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            {insightsData.dataQuality.uncategorizedPercentage}% uncategorized
          </Badge>
        )}
      </div>

      {/* Summary Cards - Enhanced */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Productivity Score */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">{productivityMetrics.score}</div>
              <span className="text-lg text-muted-foreground">/100</span>
              {productivityMetrics.weeklyChange !== 0 && (
                <div className={`flex items-center text-xs ${productivityMetrics.weeklyChange > 0 ? 'text-cyan-600' : 'text-red-600'}`}>
                  {productivityMetrics.weeklyChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(productivityMetrics.weeklyChange).toFixed(1)}%
                </div>
              )}
            </div>
            <Progress value={productivityMetrics.score} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Based on Value quadrant + energy balance
            </p>
          </CardContent>
        </Card>

        {/* Total Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insightsData.totals.totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              {insightsData.totals.totalEvents} events tracked
            </p>
            <div className="mt-2 text-xs">
              <span className="text-muted-foreground">Avg: </span>
              <span className="font-medium">{insightsData.totals.avgHoursPerDay.toFixed(1)}h/day</span>
            </div>
          </CardContent>
        </Card>

        {/* Production Ratio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Ratio</CardTitle>
            <Zap className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{productivityMetrics.productionRatio.toFixed(0)}%</div>
            <Progress value={productivityMetrics.productionRatio} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Production + Investment time
            </p>
          </CardContent>
        </Card>

        {/* Energy Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Balance</CardTitle>
            {productivityMetrics.energyBalance >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-cyan-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${productivityMetrics.energyBalance >= 0 ? 'text-cyan-600' : 'text-red-600'}`}>
              {productivityMetrics.energyBalance >= 0 ? '+' : ''}{productivityMetrics.energyBalance.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {productivityMetrics.energyBalance >= 0 ? 'Net positive energy' : 'Net energy drain'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
              <span className="text-xs text-muted-foreground">Energizing - Draining</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Day of Week Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Time by Day of Week</CardTitle>
          <CardDescription>See which days you track the most time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-32">
            {dayOfWeekData.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                  style={{ height: `${day.percentage}%`, minHeight: day.hours > 0 ? '8px' : '2px' }}
                />
                <span className="text-xs font-medium">{day.day}</span>
                <span className="text-xs text-muted-foreground">{day.hours}h</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Breakdown Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Breakdown by {groupBy === 'value' ? 'Value' : groupBy === 'energy' ? 'Energy' : 'Tag'}</CardTitle>
                <CardDescription>
                  {measure === 'hours' ? 'Hours' : 'Events'} distribution
                </CardDescription>
              </div>
              <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                <TabsList className="h-8">
                  <TabsTrigger value="bar" className="text-xs px-2">Bar</TabsTrigger>
                  <TabsTrigger value="pie" className="text-xs px-2">Pie</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {chartType === 'bar' ? (
              <HorizontalBarChart data={insightsData.barChartData} measure={measure} />
            ) : (
              <DonutChart data={insightsData.barChartData} measure={measure} />
            )}
          </CardContent>
        </Card>

        {/* Time Series Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Trends Over Time</CardTitle>
                <CardDescription>
                  {measure === 'hours' ? 'Hours' : 'Events'} by {granularity}
                </CardDescription>
              </div>
              <Tabs value={chartType === 'stacked' || chartType === 'line' ? chartType : 'stacked'} onValueChange={(v) => setChartType(v as ChartType)}>
                <TabsList className="h-8">
                  <TabsTrigger value="stacked" className="text-xs px-2">Stacked</TabsTrigger>
                  <TabsTrigger value="line" className="text-xs px-2">Line</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {chartType === 'line' ? (
              <TrendLineChart
                data={insightsData.timeSeriesData}
                keys={chartKeys}
                colors={chartColors}
                measure={measure}
              />
            ) : (
              <StackedBarChart
                data={insightsData.timeSeriesData}
                keys={chartKeys}
                colors={chartColors}
                measure={measure}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Energy Flow Chart */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Daily Energy Flow</CardTitle>
            <CardDescription>
              Your average energy levels throughout the day based on tracked activities
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <EnergyFlowChart data={insightsData.energyFlowData} />
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-cyan-500" />
              <span>High Energy (Energizing)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-yellow-500" />
              <span>Medium Energy (Neutral)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span>Low Energy (Draining)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Analytics - Activity Classification */}
      {!enhancedAnalytics.isLoading && (
        <>
          {/* Activity Type Breakdown */}
          <CategoryBreakdownChart
            data={enhancedAnalytics.activityTypeBreakdown}
            totalMinutes={enhancedAnalytics.totalMinutes}
          />

          {/* Project & Meeting Analytics */}
          <div className="grid gap-6 lg:grid-cols-2">
            <TimeByProjectChart data={enhancedAnalytics.projectBreakdown} />
            <MeetingLoadWidget metrics={enhancedAnalytics.meetingMetrics} />
          </div>
        </>
      )}

      {/* Detailed Breakdown Tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Value Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Value Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insightsData.breakdown.value.map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">
                      {measure === 'hours' ? `${item.value}h` : item.value}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Energy Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Energy Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insightsData.breakdown.energy.map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">
                      {measure === 'hours' ? `${item.value}h` : item.value}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tags Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tags Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {insightsData.breakdown.tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags assigned</p>
              ) : (
                insightsData.breakdown.tags.slice(0, 10).map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm truncate max-w-[100px]">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">
                        {measure === 'hours' ? `${item.value}h` : item.value}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Activities Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top Activities</CardTitle>
              <CardDescription>Your most tracked activities by time spent</CardDescription>
            </div>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {topActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No activities tracked yet</p>
          ) : (
            <div className="space-y-3">
              {topActivities.map((activity, index) => (
                <div key={activity.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-4">{index + 1}</span>
                      <span className="font-medium text-sm truncate max-w-[200px]">{activity.name}</span>
                      <Badge
                        variant="outline"
                        className="text-xs capitalize"
                        style={{ borderColor: VALUE_COLORS[activity.value], color: VALUE_COLORS[activity.value] }}
                      >
                        {activity.value === 'na' ? 'N/A' : activity.value}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">{activity.events} events</span>
                      <span className="font-bold text-sm">{activity.hours}h</span>
                      <span className="text-xs text-muted-foreground w-12 text-right">{activity.percentage}%</span>
                    </div>
                  </div>
                  <Progress value={activity.percentage} className="h-1.5" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
