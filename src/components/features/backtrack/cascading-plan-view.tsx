'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
} from 'lucide-react';

interface QuarterlyTarget {
  id: string;
  quarter: number;
  year: number;
  title: string;
  description?: string;
  key_metric?: string;
  target_value?: string;
  current_value?: string;
  status: string;
  progress_percentage: number;
  estimated_hours_total?: number;
}

interface ImpactProject {
  id: string;
  quarterly_target_id?: string;
  title: string;
  description?: string;
  quarter?: number;
  category?: string;
  estimated_hours?: number;
  progress_percentage: number;
  status: string;
}

interface MonthlyTarget {
  id: string;
  power_goal_id: string;
  title: string;
  description?: string;
  target_month: number;
  target_year: number;
  key_metric?: string;
  target_value?: string;
  status: string;
}

interface WeeklyTarget {
  id: string;
  monthly_target_id: string;
  title: string;
  description?: string;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  status: string;
}

interface DailyAction {
  id: string;
  weekly_target_id: string;
  title: string;
  description?: string;
  action_date: string;
  estimated_minutes?: number;
  status: string;
}

interface CascadingPlanViewProps {
  visionTitle: string;
  visionColor?: string;
  quarterlyTargets: QuarterlyTarget[];
  impactProjects: ImpactProject[];
  monthlyTargets: MonthlyTarget[];
  weeklyTargets: WeeklyTarget[];
  dailyActions: DailyAction[];
}

const CATEGORY_COLORS: Record<string, string> = {
  business: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
  career: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  health: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200',
  wealth: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  relationships: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200',
  personal: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-cyan-500" />,
  in_progress: <Circle className="h-4 w-4 text-blue-500 fill-blue-500/20" />,
  pending: <Circle className="h-4 w-4 text-muted-foreground" />,
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function CascadingPlanView({
  visionTitle,
  visionColor = '#6366f1',
  quarterlyTargets,
  impactProjects,
  monthlyTargets,
  weeklyTargets,
  dailyActions,
}: CascadingPlanViewProps) {
  const [expandedQuarters, setExpandedQuarters] = useState<Set<string>>(
    new Set(quarterlyTargets.map((q) => q.id))
  );
  const [expandedImpactProjects, setExpandedImpactProjects] = useState<Set<string>>(new Set());
  const [expandedMonthly, setExpandedMonthly] = useState<Set<string>>(new Set());
  const [expandedWeekly, setExpandedWeekly] = useState<Set<string>>(new Set());

  const toggleExpanded = (
    set: Set<string>,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getImpactProjectsForQuarter = (quarterlyTargetId: string) => {
    return impactProjects.filter((ip) => ip.quarterly_target_id === quarterlyTargetId);
  };

  const getMonthlyTargetsForImpactProject = (impactProjectId: string) => {
    return monthlyTargets.filter((mt) => mt.power_goal_id === impactProjectId);
  };

  const getWeeklyTargetsForMonthly = (monthlyTargetId: string) => {
    return weeklyTargets.filter((wt) => wt.monthly_target_id === monthlyTargetId);
  };

  const getDailyActionsForWeekly = (weeklyTargetId: string) => {
    return dailyActions.filter((da) => da.weekly_target_id === weeklyTargetId);
  };

  return (
    <div className="space-y-4">
      {/* Vision Header */}
      <div
        className="p-4 rounded-lg border-2"
        style={{ borderColor: visionColor, backgroundColor: `${visionColor}10` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: visionColor }}
          />
          <h2 className="text-xl font-bold">{visionTitle}</h2>
        </div>
      </div>

      {/* Quarterly Targets */}
      {quarterlyTargets.map((qt) => (
        <Card key={qt.id} className="border-l-4" style={{ borderLeftColor: visionColor }}>
          <CardHeader className="pb-2">
            <button
              onClick={() => toggleExpanded(expandedQuarters, setExpandedQuarters, qt.id)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {expandedQuarters.has(qt.id) ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Q{qt.quarter}</Badge>
                    <CardTitle className="text-base">{qt.title}</CardTitle>
                  </div>
                  {qt.description && (
                    <p className="text-sm text-muted-foreground mt-1">{qt.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {qt.key_metric && (
                  <div className="text-right text-sm">
                    <span className="text-muted-foreground">{qt.key_metric}:</span>
                    <span className="ml-1 font-medium">
                      {qt.current_value || 0}/{qt.target_value}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Progress value={qt.progress_percentage} className="w-20 h-2" />
                  <span className="text-sm font-medium w-10">{qt.progress_percentage}%</span>
                </div>
              </div>
            </button>
          </CardHeader>

          {expandedQuarters.has(qt.id) && (
            <CardContent className="pt-0 space-y-3">
              {getImpactProjectsForQuarter(qt.id).map((ip) => (
                <div
                  key={ip.id}
                  className="ml-6 border rounded-lg"
                >
                  <button
                    onClick={() => toggleExpanded(expandedImpactProjects, setExpandedImpactProjects, ip.id)}
                    className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedImpactProjects.has(ip.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Target className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{ip.title}</span>
                      {ip.category && (
                        <Badge className={cn('text-xs', CATEGORY_COLORS[ip.category])}>
                          {ip.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {STATUS_ICONS[ip.status]}
                      <Progress value={ip.progress_percentage} className="w-16 h-1.5" />
                    </div>
                  </button>

                  {expandedImpactProjects.has(ip.id) && (
                    <div className="px-3 pb-3 space-y-2">
                      {getMonthlyTargetsForImpactProject(ip.id).map((mt) => (
                        <div key={mt.id} className="ml-6 border rounded-lg">
                          <button
                            onClick={() => toggleExpanded(expandedMonthly, setExpandedMonthly, mt.id)}
                            className="w-full p-2 flex items-center justify-between hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {expandedMonthly.has(mt.id) ? (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              )}
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{MONTH_NAMES[mt.target_month - 1]}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                - {mt.title}
                              </span>
                            </div>
                            {STATUS_ICONS[mt.status]}
                          </button>

                          {expandedMonthly.has(mt.id) && (
                            <div className="px-2 pb-2 space-y-1">
                              {getWeeklyTargetsForMonthly(mt.id).map((wt) => (
                                <div key={wt.id} className="ml-5">
                                  <button
                                    onClick={() => toggleExpanded(expandedWeekly, setExpandedWeekly, wt.id)}
                                    className="w-full p-1.5 flex items-center justify-between hover:bg-muted/10 rounded transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      {expandedWeekly.has(wt.id) ? (
                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        Week {wt.week_number}
                                      </span>
                                      <span className="text-xs truncate max-w-[150px]">
                                        {wt.title}
                                      </span>
                                    </div>
                                    {STATUS_ICONS[wt.status]}
                                  </button>

                                  {expandedWeekly.has(wt.id) && (
                                    <div className="ml-6 space-y-1 py-1">
                                      {getDailyActionsForWeekly(wt.id).map((da) => (
                                        <div
                                          key={da.id}
                                          className={cn(
                                            'flex items-center justify-between p-1.5 rounded text-xs',
                                            da.status === 'completed'
                                              ? 'bg-cyan-50 dark:bg-cyan-900/10'
                                              : 'bg-muted/30'
                                          )}
                                        >
                                          <div className="flex items-center gap-2">
                                            {STATUS_ICONS[da.status]}
                                            <span className={da.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                                              {da.title}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 text-muted-foreground">
                                            <span>{format(parseISO(da.action_date), 'EEE')}</span>
                                            {da.estimated_minutes && (
                                              <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {da.estimated_minutes}m
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      ))}

      {quarterlyTargets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No plan data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
