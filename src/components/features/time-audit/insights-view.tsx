'use client';

import { useState, useMemo } from 'react';
import { CalendarIcon, Clock, Activity, TrendingUp } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import {
  useInsightsData,
  type TimeBlockData,
  type GroupByOption,
  type GranularityOption,
  type MeasureOption,
} from '@/lib/hooks/use-insights-data';
import type { Tag } from '@/lib/hooks/use-tags';
import type { DripQuadrant, EnergyRating } from '@/types/database';
import {
  HorizontalBarChart,
  DonutChart,
  StackedBarChart,
  TrendLineChart,
} from './insights-charts';

interface InsightsViewProps {
  timeBlocks: TimeBlockData[];
  tags: Tag[];
}

type DateRangePreset = 'week' | 'month' | '30days' | '90days' | 'custom';
type ChartType = 'bar' | 'pie' | 'stacked' | 'line';

const DRIP_COLORS: Record<string, string> = {
  production: '#22c55e',
  investment: '#9333ea',
  replacement: '#eab308',
  delegation: '#ef4444',
  na: '#94a3b8',
};

const ENERGY_COLORS: Record<string, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

export function InsightsView({ timeBlocks, tags }: InsightsViewProps) {
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('30days');
  const [customStartDate, setCustomStartDate] = useState<Date>(subDays(new Date(), 30));
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [groupBy, setGroupBy] = useState<GroupByOption>('drip');
  const [granularity, setGranularity] = useState<GranularityOption>('day');
  const [measure, setMeasure] = useState<MeasureOption>('hours');
  const [chartType, setChartType] = useState<ChartType>('bar');

  // Filter states
  const [selectedDrip, setSelectedDrip] = useState<DripQuadrant[]>([]);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyRating[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    switch (dateRangePreset) {
      case 'week':
        return { startDate: startOfWeek(now), endDate: endOfWeek(now) };
      case 'month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case '30days':
        return { startDate: subDays(now, 30), endDate: now };
      case '90days':
        return { startDate: subDays(now, 90), endDate: now };
      case 'custom':
        return { startDate: customStartDate, endDate: customEndDate };
      default:
        return { startDate: subDays(now, 30), endDate: now };
    }
  }, [dateRangePreset, customStartDate, customEndDate]);

  const insightsData = useInsightsData({
    timeBlocks,
    tags,
    startDate,
    endDate,
    groupBy,
    granularity,
    measure,
    filters: {
      dripQuadrants: selectedDrip.length > 0 ? selectedDrip : undefined,
      energyRatings: selectedEnergy.length > 0 ? selectedEnergy : undefined,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    },
  });

  // Get colors and keys for time series charts
  const { chartKeys, chartColors } = useMemo(() => {
    let keys: string[] = [];
    let colors: Record<string, string> = {};

    switch (groupBy) {
      case 'drip':
        keys = ['production', 'investment', 'replacement', 'delegation', 'na'];
        colors = DRIP_COLORS;
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

  const toggleDripFilter = (quadrant: DripQuadrant) => {
    setSelectedDrip(prev =>
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
    setSelectedDrip([]);
    setSelectedEnergy([]);
    setSelectedTags([]);
  };

  const hasFilters = selectedDrip.length > 0 || selectedEnergy.length > 0 || selectedTags.length > 0;

  return (
    <div className="space-y-6">
      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Date Range:</Label>
          <Select value={dateRangePreset} onValueChange={(v) => setDateRangePreset(v as DateRangePreset)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {dateRangePreset === 'custom' && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(customStartDate, 'MMM d')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={(date) => date && setCustomStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(customEndDate, 'MMM d')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={(date) => date && setCustomEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Group By */}
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Group By:</Label>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="drip">DRIP</SelectItem>
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
          {/* DRIP Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground w-16">DRIP:</span>
            {(['production', 'investment', 'replacement', 'delegation', 'na'] as DripQuadrant[]).map(quadrant => (
              <Badge
                key={quadrant}
                variant={selectedDrip.includes(quadrant) ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                style={selectedDrip.includes(quadrant) ? { backgroundColor: DRIP_COLORS[quadrant] } : {}}
                onClick={() => toggleDripFilter(quadrant)}
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insightsData.totals.totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              {insightsData.totals.totalEvents} events tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Hours/Day</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insightsData.totals.avgHoursPerDay.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Daily average for period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {insightsData.barChartData.length > 0 ? (
              <>
                <div className="text-2xl font-bold">{insightsData.barChartData[0]?.label}</div>
                <p className="text-xs text-muted-foreground">
                  {insightsData.barChartData[0]?.percentage}% of total
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Breakdown Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Breakdown by {groupBy === 'drip' ? 'DRIP' : groupBy === 'energy' ? 'Energy' : 'Tag'}</CardTitle>
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

      {/* Detailed Breakdown Tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* DRIP Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">DRIP Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insightsData.breakdown.drip.map(item => (
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
    </div>
  );
}
