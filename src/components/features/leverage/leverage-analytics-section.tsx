'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { subDays, subMonths, format } from 'date-fns';
import { useLeverageAnalytics, getLeverageTypeInfo } from '@/lib/hooks/use-leverage-analytics';
import { LeverageTypePieChart } from './leverage-type-pie-chart';
import { LeverageTrendsChart } from './leverage-trends-chart';
import { LeverageSummaryStats } from './leverage-summary-stats';

type DateRange = '7d' | '30d' | '90d' | '1y';

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
];

function getDateRange(range: DateRange): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  let startDate: Date;

  switch (range) {
    case '7d':
      startDate = subDays(endDate, 7);
      break;
    case '30d':
      startDate = subDays(endDate, 30);
      break;
    case '90d':
      startDate = subDays(endDate, 90);
      break;
    case '1y':
      startDate = subMonths(endDate, 12);
      break;
    default:
      startDate = subDays(endDate, 30);
  }

  return { startDate, endDate };
}

export function LeverageAnalyticsSection() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const { startDate, endDate } = getDateRange(dateRange);

  const { data, isLoading, error } = useLeverageAnalytics({
    startDate,
    endDate,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load leverage analytics</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing data from {format(startDate, 'MMM d, yyyy')} to {format(endDate, 'MMM d, yyyy')}
        </p>
        <div className="flex gap-2">
          {DATE_RANGE_OPTIONS.map(option => (
            <Button
              key={option.value}
              variant={dateRange === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <LeverageSummaryStats summary={data.summary} />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Time by Leverage Type</CardTitle>
            <CardDescription>Distribution across the 4 C&apos;s</CardDescription>
          </CardHeader>
          <CardContent>
            <LeverageTypePieChart data={data.byType} size="lg" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Trends</CardTitle>
            <CardDescription>Leverage time over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <LeverageTrendsChart data={data.weeklyTrends} chartType="area" />
          </CardContent>
        </Card>
      </div>

      {/* ROI Table */}
      {data.itemROI.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Leverage Item Effectiveness</CardTitle>
            <CardDescription>ROI based on time invested vs hours saved</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Hours Invested</TableHead>
                  <TableHead className="text-right">Est. Hours Saved/wk</TableHead>
                  <TableHead className="text-right">Actual Hours Saved/wk</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.itemROI
                  .sort((a, b) => b.roi - a.roi)
                  .map(item => {
                    const typeInfo = getLeverageTypeInfo(item.leverageType);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={typeInfo.color.replace('bg-', 'border-')}>
                            {typeInfo.icon} {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{item.hoursInvested.toFixed(1)}h</TableCell>
                        <TableCell className="text-right">{item.estimatedHoursSaved.toFixed(1)}h</TableCell>
                        <TableCell className="text-right">
                          {item.actualHoursSaved > 0 ? `${item.actualHoursSaved.toFixed(1)}h` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.roi > 0 ? (
                            <span className={item.roi >= 1 ? 'text-green-500' : 'text-amber-500'}>
                              {item.roi.toFixed(1)}x
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State for ROI */}
      {data.itemROI.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <p>No leverage items yet.</p>
              <p className="text-sm mt-1">Create leverage items and link them to time blocks to track ROI.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
