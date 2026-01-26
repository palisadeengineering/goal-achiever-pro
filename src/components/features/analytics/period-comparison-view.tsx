'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus, Clock, Briefcase, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PeriodSummary {
  totalMinutes: number;
  productionMinutes: number;
  meetingMinutes: number;
  projectMinutes: number;
  deepWorkMinutes: number;
  commuteMinutes: number;
  adminMinutes: number;
  productionPercentage: number;
  meetingPercentage: number;
}

interface PeriodComparison {
  current: PeriodSummary;
  previous: PeriodSummary;
  changes: {
    totalHours: number;
    productionPercentage: number;
    meetingPercentage: number;
  };
}

interface PeriodComparisonViewProps {
  comparison: PeriodComparison;
  periodLabel?: string; // e.g., "This Week vs Last Week"
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(Math.abs(minutes) / 60);
  const mins = Math.round(Math.abs(minutes) % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function formatHours(hours: number): string {
  const absHours = Math.abs(hours);
  if (absHours < 1) {
    return `${Math.round(absHours * 60)}m`;
  }
  return `${Math.round(absHours * 10) / 10}h`;
}

function ChangeIndicator({
  value,
  suffix = '',
  invertColors = false,
}: {
  value: number;
  suffix?: string;
  invertColors?: boolean;
}) {
  if (Math.abs(value) < 0.1) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        <span>No change</span>
      </span>
    );
  }

  const isPositive = value > 0;
  const isGood = invertColors ? !isPositive : isPositive;

  return (
    <span
      className={cn(
        'flex items-center gap-1',
        isGood ? 'text-green-600' : 'text-red-600'
      )}
    >
      {isPositive ? (
        <ArrowUp className="h-4 w-4" />
      ) : (
        <ArrowDown className="h-4 w-4" />
      )}
      <span>
        {isPositive ? '+' : ''}
        {typeof value === 'number' && value % 1 !== 0
          ? Math.round(value * 10) / 10
          : Math.round(value)}
        {suffix}
      </span>
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  currentValue,
  previousValue,
  formatValue,
  changeValue,
  changeSuffix = '',
  invertColors = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  currentValue: number;
  previousValue: number;
  formatValue: (v: number) => string;
  changeValue: number;
  changeSuffix?: string;
  invertColors?: boolean;
}) {
  return (
    <div className="flex flex-col p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xl font-semibold">{formatValue(currentValue)}</div>
          <div className="text-xs text-muted-foreground">
            was {formatValue(previousValue)}
          </div>
        </div>
        <ChangeIndicator
          value={changeValue}
          suffix={changeSuffix}
          invertColors={invertColors}
        />
      </div>
    </div>
  );
}

export function PeriodComparisonView({
  comparison,
  periodLabel = 'This Period vs Previous',
}: PeriodComparisonViewProps) {
  const { current, previous, changes } = comparison;

  // Calculate percentage changes for display
  const totalHoursChange = changes.totalHours;
  const productionChange = changes.productionPercentage;
  const meetingChange = changes.meetingPercentage;

  // Calculate deep work change
  const currentDeepWorkPct = current.totalMinutes > 0
    ? (current.deepWorkMinutes / current.totalMinutes) * 100
    : 0;
  const previousDeepWorkPct = previous.totalMinutes > 0
    ? (previous.deepWorkMinutes / previous.totalMinutes) * 100
    : 0;
  const deepWorkChange = currentDeepWorkPct - previousDeepWorkPct;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{periodLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Time */}
          <MetricCard
            icon={Clock}
            label="Total Time"
            currentValue={current.totalMinutes}
            previousValue={previous.totalMinutes}
            formatValue={formatMinutes}
            changeValue={totalHoursChange}
            changeSuffix="h"
          />

          {/* Production % */}
          <MetricCard
            icon={Briefcase}
            label="Production %"
            currentValue={current.productionPercentage}
            previousValue={previous.productionPercentage}
            formatValue={(v) => `${Math.round(v)}%`}
            changeValue={productionChange}
            changeSuffix="%"
          />

          {/* Meeting % */}
          <MetricCard
            icon={Users}
            label="Meeting %"
            currentValue={current.meetingPercentage}
            previousValue={previous.meetingPercentage}
            formatValue={(v) => `${Math.round(v)}%`}
            changeValue={meetingChange}
            changeSuffix="%"
            invertColors // Less meetings is generally good
          />

          {/* Deep Work % */}
          <MetricCard
            icon={Briefcase}
            label="Deep Work %"
            currentValue={currentDeepWorkPct}
            previousValue={previousDeepWorkPct}
            formatValue={(v) => `${Math.round(v)}%`}
            changeValue={deepWorkChange}
            changeSuffix="%"
          />
        </div>

        {/* Summary insight */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {totalHoursChange > 0 ? (
              <>
                You tracked <span className="font-medium text-foreground">{formatHours(Math.abs(totalHoursChange))} more</span> this period.
              </>
            ) : totalHoursChange < 0 ? (
              <>
                You tracked <span className="font-medium text-foreground">{formatHours(Math.abs(totalHoursChange))} less</span> this period.
              </>
            ) : (
              <>Same amount of time tracked as the previous period.</>
            )}
            {' '}
            {productionChange > 2 && (
              <>Production time improved by {Math.round(productionChange)}%.</>
            )}
            {productionChange < -2 && (
              <>Production time decreased by {Math.abs(Math.round(productionChange))}%.</>
            )}
            {' '}
            {meetingChange > 5 && (
              <>Meetings increased by {Math.round(meetingChange)}%.</>
            )}
            {meetingChange < -5 && (
              <>Meetings decreased by {Math.abs(Math.round(meetingChange))}% - great for focus time!</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
