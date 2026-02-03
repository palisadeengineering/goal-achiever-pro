'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Code, FileText, DollarSign, Users, Clock, TrendingUp, Target } from 'lucide-react';
import type { LeverageAnalyticsSummary, LeverageType } from '@/lib/hooks/use-leverage-analytics';

const LEVERAGE_ICONS: Record<LeverageType, typeof Code> = {
  code: Code,
  content: FileText,
  capital: DollarSign,
  collaboration: Users,
};

const LEVERAGE_COLORS: Record<LeverageType, string> = {
  code: 'text-blue-500',
  content: 'text-purple-500',
  capital: 'text-green-500',
  collaboration: 'text-orange-500',
};

const LEVERAGE_BG: Record<LeverageType, string> = {
  code: 'bg-blue-500/10',
  content: 'bg-purple-500/10',
  capital: 'bg-green-500/10',
  collaboration: 'bg-orange-500/10',
};

const LEVERAGE_LABELS: Record<LeverageType, string> = {
  code: 'Code',
  content: 'Content',
  capital: 'Capital',
  collaboration: 'Collaboration',
};

interface LeverageSummaryStatsProps {
  summary: LeverageAnalyticsSummary;
}

export function LeverageSummaryStats({ summary }: LeverageSummaryStatsProps) {
  const leverageHours = (summary.totalLeverageMinutes / 60).toFixed(1);
  const totalHours = (summary.totalMinutesTracked / 60).toFixed(1);
  const TopIcon = summary.topType ? LEVERAGE_ICONS[summary.topType] : Target;

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Leverage Time</p>
              <p className="text-2xl font-semibold">{leverageHours}h</p>
              <p className="text-xs text-muted-foreground">of {totalHours}h tracked</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Leverage %</p>
              <p className="text-2xl font-semibold">{summary.leveragePercentage.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">of tracked time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${summary.topType ? LEVERAGE_BG[summary.topType] : 'bg-muted'}`}>
              <TopIcon className={`h-5 w-5 ${summary.topType ? LEVERAGE_COLORS[summary.topType] : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Top Type</p>
              <p className="text-2xl font-semibold">
                {summary.topType ? LEVERAGE_LABELS[summary.topType] : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">most time spent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Target className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Hours Saved</p>
              <p className="text-2xl font-semibold">{summary.estimatedWeeklyHoursSaved.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">per week</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
