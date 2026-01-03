'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Loader2,
  Target,
  Calendar as CalendarIcon,
  ListChecks,
  Clock,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CalendarPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QuarterlyGoal {
  quarter: number;
  title: string;
  outcomes: Array<{
    metric: string;
    target: string;
    description: string;
  }>;
}

interface MonthlyTarget {
  month: number;
  monthName: string;
  targets: Array<{
    title: string;
    metric: string;
    description: string;
  }>;
}

interface WeeklyKPI {
  category: string;
  kpi: string;
  target: string;
  trackingMethod: string;
  leadingTo: string;
}

interface DailyHabit {
  habit: string;
  timeRequired: string;
  bestTime: string;
  whyItMatters: string;
}

interface KPIData {
  quarterlyGoals: QuarterlyGoal[];
  monthlyTargets: MonthlyTarget[];
  weeklyKPIs: WeeklyKPI[];
  dailyHabits: DailyHabit[];
  successFormula: string;
}

interface KPIAccountabilitySystemProps {
  vision: string;
  smartGoals?: {
    specific?: string;
    measurable?: string;
    attainable?: string;
    realistic?: string;
  };
  targetDate?: Date | null;
  onKPIsGenerated?: (kpis: KPIData) => void;
  onAddToCalendar?: (kpis: KPIData) => void;
}

const QUARTER_COLORS = [
  'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
  'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700',
];

const TIME_COLORS: Record<string, string> = {
  morning: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
  afternoon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  evening: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
};

export function KPIAccountabilitySystem({
  vision,
  smartGoals,
  targetDate,
  onKPIsGenerated,
  onAddToCalendar,
}: KPIAccountabilitySystemProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<number[]>([1, 2, 3]);

  const toggleMonth = (month: number) => {
    setExpandedMonths((prev) =>
      prev.includes(month)
        ? prev.filter((m) => m !== month)
        : [...prev, month]
    );
  };

  const generateKPIs = async () => {
    if (!vision) {
      setError('Please create your vision first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision,
          smartGoals,
          targetDate: targetDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate KPIs');
      }

      const result: KPIData = await response.json();
      setKpis(result);
      onKPIsGenerated?.(result);
      toast.success('Accountability system generated!');
    } catch (err) {
      console.error('KPI Generation Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate KPIs');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToCalendar = () => {
    if (kpis) {
      onAddToCalendar?.(kpis);
      toast.success('KPIs added to your calendar!');
    }
  };

  if (!kpis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Accountability System
          </CardTitle>
          <CardDescription>
            Generate daily, weekly, monthly, and quarterly KPIs that make it unreasonable to fail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 border-2 border-dashed rounded-xl text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ListChecks className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Ready to create your accountability system?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                AI will generate a complete system with daily habits, weekly KPIs, monthly targets, and quarterly goals
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                {error}
              </div>
            )}

            <Button
              onClick={generateKPIs}
              disabled={isGenerating || !vision}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating System...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Accountability System
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Accountability System
            </CardTitle>
            <CardDescription className="mt-1">
              {kpis.successFormula}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToCalendar}
              className="gap-2"
            >
              <CalendarPlus className="h-4 w-4" />
              Add to Calendar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={generateKPIs}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Regenerate
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Daily</span>
            </TabsTrigger>
            <TabsTrigger value="weekly" className="gap-2">
              <ListChecks className="h-4 w-4" />
              <span className="hidden sm:inline">Weekly</span>
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Monthly</span>
            </TabsTrigger>
            <TabsTrigger value="quarterly" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Quarterly</span>
            </TabsTrigger>
          </TabsList>

          {/* Daily Habits */}
          <TabsContent value="daily" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Daily Non-Negotiables</h3>
              <Badge variant="secondary">
                {kpis.dailyHabits.length} habits
              </Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {kpis.dailyHabits.map((habit, idx) => (
                <div
                  key={idx}
                  className="p-4 border rounded-lg bg-muted/20 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium">{habit.habit}</h4>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs capitalize shrink-0',
                        TIME_COLORS[habit.bestTime.toLowerCase()] || 'bg-gray-100'
                      )}
                    >
                      {habit.bestTime}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {habit.timeRequired}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {habit.whyItMatters}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Weekly KPIs */}
          <TabsContent value="weekly" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Weekly KPIs to Track</h3>
              <Badge variant="secondary">
                {kpis.weeklyKPIs.length} metrics
              </Badge>
            </div>
            <div className="space-y-3">
              {kpis.weeklyKPIs.map((kpi, idx) => (
                <div
                  key={idx}
                  className="p-4 border rounded-lg bg-muted/20 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium">{kpi.kpi}</h4>
                    <Badge variant="outline" className="text-xs">
                      {kpi.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold text-primary">
                      Target: {kpi.target}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>How to track:</strong> {kpi.trackingMethod}</p>
                    <p><strong>Leads to:</strong> {kpi.leadingTo}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Monthly Targets */}
          <TabsContent value="monthly" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Monthly Targets</h3>
              <Badge variant="secondary">
                {kpis.monthlyTargets.length} months
              </Badge>
            </div>
            <div className="space-y-2">
              {kpis.monthlyTargets.map((month) => {
                const isExpanded = expandedMonths.includes(month.month);
                return (
                  <div key={month.month} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleMonth(month.month)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {month.monthName}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {month.targets.length} targets
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="border-t p-4 space-y-3">
                        {month.targets.map((target, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg"
                          >
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{target.title}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {target.metric}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {target.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Quarterly Goals */}
          <TabsContent value="quarterly" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Quarterly Goals</h3>
              <Badge variant="secondary">
                {kpis.quarterlyGoals.length} quarters
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {kpis.quarterlyGoals.map((quarter, idx) => (
                <div
                  key={quarter.quarter}
                  className={cn(
                    'p-4 border-2 rounded-lg space-y-3',
                    QUARTER_COLORS[idx % QUARTER_COLORS.length]
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      Q{quarter.quarter}
                    </Badge>
                    <h4 className="font-semibold">{quarter.title}</h4>
                  </div>
                  <div className="space-y-2">
                    {quarter.outcomes.map((outcome, oIdx) => (
                      <div
                        key={oIdx}
                        className="p-3 bg-white/50 dark:bg-black/20 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{outcome.metric}</span>
                          <span className="font-bold text-primary">{outcome.target}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {outcome.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
