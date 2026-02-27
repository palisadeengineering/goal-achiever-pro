'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  LayoutGrid,
  BarChart3,
  Circle,
  Zap,
  TrendingUp,
  Cog,
  Users,
  TrendingDown,
  Minus,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { ValueMatrixGrid } from '@/components/features/dashboard/value-matrix-grid';
import { StackedTimeline } from '@/components/features/dashboard/stacked-timeline';
import { BubbleChart } from '@/components/features/dashboard/bubble-chart';
import { Scorecard } from '@/components/features/dashboard/scorecard';
import { CoachingNudge } from '@/components/features/dashboard/coaching-nudge';
import type { DashboardStats, Period, Visualization } from '@/components/features/dashboard/types';

async function fetchDashboardStats(period: Period): Promise<DashboardStats> {
  const response = await fetch(`/api/dashboard/stats?period=${period}`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  return response.json();
}

const PERIOD_LABELS: Record<Period, string> = {
  week: 'This Week',
  '2weeks': 'Last 2 Weeks',
  month: 'This Month',
  '3months': 'Last 3 Months',
};

const VIZ_OPTIONS: Array<{ value: Visualization; label: string; icon: React.ReactNode }> = [
  { value: 'matrix', label: 'Matrix', icon: <LayoutGrid className="h-4 w-4" /> },
  { value: 'timeline', label: 'Timeline', icon: <BarChart3 className="h-4 w-4" /> },
  { value: 'bubble', label: 'Bubble', icon: <Circle className="h-4 w-4" /> },
];

interface DripCardProps {
  label: string;
  hours: number;
  trend: number;
  icon: React.ReactNode;
  colorClass: string;
}

function DripCard({ label, hours, trend, icon, colorClass }: DripCardProps) {
  const trendIcon =
    trend > 0 ? (
      <TrendingUp className="h-3 w-3 text-emerald-400" />
    ) : trend < 0 ? (
      <TrendingDown className="h-3 w-3 text-rose-400" />
    ) : (
      <Minus className="h-3 w-3 text-muted-foreground" />
    );

  const trendLabel =
    trend > 0 ? `+${trend}%` : trend < 0 ? `${trend}%` : '0%';

  return (
    <Card className={`border-l-4 ${colorClass}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
          </div>
        </div>
        <div className="mt-2 flex items-end justify-between">
          <span className="text-2xl font-bold">{hours.toFixed(1)}h</span>
          <div className="flex items-center gap-1 text-xs">
            {trendIcon}
            <span className={trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-muted-foreground'}>
              {trendLabel}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('week');
  const [visualization, setVisualization] = useState<Visualization>('matrix');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats', period],
    queryFn: () => fetchDashboardStats(period),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const drip = stats?.drip ?? { production: 0, investment: 0, replacement: 0, delegation: 0 };
  const dripTrend = stats?.dripTrend ?? { production: 0, investment: 0, replacement: 0, delegation: 0 };
  const totalHours = stats?.totalHours ?? 0;
  const uncategorizedCount = stats?.uncategorizedCount ?? 0;
  const events = stats?.events ?? [];
  const leverageItemCount = stats?.leverageItemCount ?? 0;
  const networkTouchCount = stats?.networkTouchCount ?? 0;
  const productionTrend = stats?.productionTrend ?? [];

  // Derive previousDrip from drip and dripTrend for coaching nudge
  const previousDrip = {
    production: dripTrend.production !== 0 ? drip.production / (1 + dripTrend.production / 100) : drip.production,
    investment: dripTrend.investment !== 0 ? drip.investment / (1 + dripTrend.investment / 100) : drip.investment,
    replacement: dripTrend.replacement !== 0 ? drip.replacement / (1 + dripTrend.replacement / 100) : drip.replacement,
    delegation: dripTrend.delegation !== 0 ? drip.delegation / (1 + dripTrend.delegation / 100) : drip.delegation,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your time at a glance — read-only summary of how you spend it."
      />

      {/* Uncategorized banner */}
      {uncategorizedCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/50 bg-amber-950/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-sm">
              You have <strong>{uncategorizedCount}</strong> uncategorized event{uncategorizedCount !== 1 ? 's' : ''}
            </span>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={ROUTES.timeAudit}>
              Review Now
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      )}

      {/* DRIP stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <DripCard
          label="Prod"
          hours={drip.production}
          trend={dripTrend.production}
          icon={<Zap className="h-3.5 w-3.5" />}
          colorClass="border-l-emerald-500"
        />
        <DripCard
          label="Inv"
          hours={drip.investment}
          trend={dripTrend.investment}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          colorClass="border-l-cyan-500"
        />
        <DripCard
          label="Rep"
          hours={drip.replacement}
          trend={dripTrend.replacement}
          icon={<Cog className="h-3.5 w-3.5" />}
          colorClass="border-l-amber-500"
        />
        <DripCard
          label="Del"
          hours={drip.delegation}
          trend={dripTrend.delegation}
          icon={<Users className="h-3.5 w-3.5" />}
          colorClass="border-l-rose-500"
        />
        <Card className="col-span-2 lg:col-span-1 border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">Total</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{totalHours.toFixed(1)}h</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualization area */}
      <Card>
        <CardContent className="p-4">
          {/* Controls row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            {/* Period selector */}
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Visualization toggle */}
            <div className="flex items-center gap-1 rounded-lg border p-1">
              {VIZ_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={visualization === opt.value ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setVisualization(opt.value)}
                >
                  {opt.icon}
                  <span className="hidden sm:inline">{opt.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Active visualization */}
          {visualization === 'matrix' && <ValueMatrixGrid events={events} />}
          {visualization === 'timeline' && <StackedTimeline events={events} />}
          {visualization === 'bubble' && <BubbleChart events={events} />}
        </CardContent>
      </Card>

      {/* Bottom row: Scorecard + Coaching Nudge */}
      <div className="grid gap-4 md:grid-cols-2">
        <Scorecard
          leverageItemCount={leverageItemCount}
          networkTouchCount={networkTouchCount}
          productionTrend={productionTrend}
        />
        <CoachingNudge
          drip={drip}
          previousDrip={previousDrip}
          totalHours={totalHours}
          events={events}
        />
      </div>
    </div>
  );
}
