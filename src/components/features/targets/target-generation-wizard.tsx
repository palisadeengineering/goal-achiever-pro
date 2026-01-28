'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, ChevronDown, ChevronUp, CheckCircle2, Calendar, Target, Clock, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyAction {
  dayOfWeek: string;
  title: string;
  description?: string;
  estimatedMinutes: number;
  keyMetric?: string;
  targetValue?: number;
}

interface WeeklyTarget {
  weekNumber: number;
  title: string;
  description?: string;
  keyMetric?: string;
  targetValue?: number;
  dailyActions: DailyAction[];
}

interface MonthlyTarget {
  month: number;
  monthName: string;
  title: string;
  description?: string;
  keyMetric?: string;
  targetValue?: number;
  weeklyTargets: WeeklyTarget[];
}

interface TargetPlan {
  monthlyTargets: MonthlyTarget[];
  summary: string;
  totalEstimatedHours: number;
  criticalMilestones: string[];
  impactProjectId: string;
  impactProjectTitle: string;
  quarter: number;
}

interface ImpactProjectInput {
  id: string;
  title: string;
  description?: string;
  quarter: number;
  category?: string;
  keyMilestones?: string[];
}

interface TargetGenerationWizardProps {
  impactProject: ImpactProjectInput;
  vision?: string;
  smartGoals?: {
    specific?: string;
    measurable?: string;
    attainable?: string;
    realistic?: string;
  };
  targetDate?: Date | null;
  onSave?: (plan: TargetPlan) => void;
  onCancel?: () => void;
}

export function TargetGenerationWizard({
  impactProject,
  vision,
  smartGoals,
  targetDate,
  onSave,
  onCancel,
}: TargetGenerationWizardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TargetPlan | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<number[]>([1, 2, 3]);
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>([]);

  const toggleMonth = (month: number) => {
    setExpandedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  const toggleWeek = (monthWeekKey: string) => {
    setExpandedWeeks((prev) =>
      prev.includes(monthWeekKey)
        ? prev.filter((k) => k !== monthWeekKey)
        : [...prev, monthWeekKey]
    );
  };

  const generateTargets = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          impactProject,
          vision,
          smartGoals,
          targetDate: targetDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate targets');
      }

      const result: TargetPlan = await response.json();
      setPlan(result);

      // Auto-expand first week of each month
      const weekKeys = result.monthlyTargets.flatMap((m) =>
        m.weeklyTargets.slice(0, 1).map((w) => `${m.month}-${w.weekNumber}`)
      );
      setExpandedWeeks(weekKeys);
    } catch (err) {
      console.error('Target Generation Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate targets');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!plan) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          impactProjectId: impactProject.id,
          year: new Date().getFullYear(),
          monthlyTargets: plan.monthlyTargets,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save targets');
      }

      onSave?.(plan);
    } catch (err) {
      console.error('Save Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save targets');
    } finally {
      setIsSaving(false);
    }
  };

  // Initial state - show generate button
  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Detailed Plan
          </CardTitle>
          <CardDescription>
            Create monthly, weekly, and daily targets for: <strong>{impactProject.title}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 border-2 border-dashed rounded-xl text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Ready to break down this goal?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                AI will create a detailed plan with monthly targets, weekly milestones, and daily actions
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">Q{impactProject.quarter}</Badge>
              {impactProject.category && (
                <Badge variant="secondary">{impactProject.category}</Badge>
              )}
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <Button
                onClick={generateTargets}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Detailed Plan
                  </>
                )}
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show generated plan for review
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Detailed Plan for Q{impactProject.quarter}
            </CardTitle>
            <CardDescription className="mt-1">
              {plan.summary}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {plan.totalEstimatedHours}h total
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Critical Milestones */}
        {plan.criticalMilestones?.length > 0 && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Critical Milestones
            </h4>
            <ul className="space-y-1">
              {plan.criticalMilestones.map((milestone, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  {milestone}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Monthly Targets */}
        {plan.monthlyTargets.map((monthly) => {
          const isMonthExpanded = expandedMonths.includes(monthly.month);

          return (
            <div key={monthly.month} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleMonth(monthly.month)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono bg-primary/10">
                    {monthly.monthName}
                  </Badge>
                  <span className="font-medium">{monthly.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {monthly.weeklyTargets.length} weeks
                  </span>
                  {isMonthExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {isMonthExpanded && (
                <div className="border-t p-4 space-y-3">
                  {monthly.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {monthly.description}
                    </p>
                  )}

                  {monthly.keyMetric && (
                    <div className="flex items-center gap-2 text-sm mb-3">
                      <Badge variant="secondary" className="gap-1">
                        <Target className="h-3 w-3" />
                        {monthly.keyMetric}: {monthly.targetValue}
                      </Badge>
                    </div>
                  )}

                  {/* Weekly Targets */}
                  {monthly.weeklyTargets.map((weekly) => {
                    const weekKey = `${monthly.month}-${weekly.weekNumber}`;
                    const isWeekExpanded = expandedWeeks.includes(weekKey);

                    return (
                      <div
                        key={weekly.weekNumber}
                        className="border rounded-lg bg-muted/20"
                      >
                        <button
                          onClick={() => toggleWeek(weekKey)}
                          className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Week {weekly.weekNumber}
                            </Badge>
                            <span className="text-sm font-medium">{weekly.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {weekly.dailyActions.length} actions
                            </span>
                            {isWeekExpanded ? (
                              <ChevronUp className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {isWeekExpanded && (
                          <div className="border-t p-3 space-y-2">
                            {weekly.description && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {weekly.description}
                              </p>
                            )}

                            {/* Daily Actions */}
                            {weekly.dailyActions.map((daily, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 p-2 rounded bg-background border"
                              >
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs shrink-0',
                                    daily.dayOfWeek === 'Monday' && 'bg-blue-50 dark:bg-blue-900/20',
                                    daily.dayOfWeek === 'Friday' && 'bg-cyan-50 dark:bg-cyan-900/20'
                                  )}
                                >
                                  {daily.dayOfWeek.slice(0, 3)}
                                </Badge>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{daily.title}</p>
                                  {daily.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {daily.description}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {daily.estimatedMinutes}m
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {error && (
          <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Targets
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={generateTargets}
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
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
