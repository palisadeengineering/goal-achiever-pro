'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  Flame,
  TrendingUp,
  Sparkles,
  CalendarPlus,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisionKpi {
  id: string;
  title: string;
  description?: string;
  level: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  targetValue?: string;
  unit?: string;
  trackingMethod?: 'checkbox' | 'numeric';
  bestTime?: string;
  timeRequired?: string;
  whyItMatters?: string;
  currentStreak?: number;
  isCompleted?: boolean;
  todayValue?: number;
}

interface MilestoneKpi {
  id: string;
  milestoneId: string;
  kpiId?: string;
  customKpiName?: string;
  customKpiTarget?: string;
  isAutoLinked: boolean;
  kpi?: VisionKpi;
}

interface MilestoneKpiPanelProps {
  milestoneId: string;
  visionId?: string;
  visionKpis: VisionKpi[];
  linkedKpis: MilestoneKpi[];
  onLinkKpi: (kpiId: string) => Promise<void>;
  onUnlinkKpi: (milestoneKpiId: string) => Promise<void>;
  onAddCustomKpi: (name: string, target: string) => Promise<void>;
  onLogKpi: (kpiId: string, value: number | boolean, date: string) => Promise<void>;
  onScheduleToCalendar: (kpi: VisionKpi) => Promise<void>;
}

export function MilestoneKpiPanel({
  milestoneId,
  visionId,
  visionKpis,
  linkedKpis,
  onLinkKpi,
  onUnlinkKpi,
  onAddCustomKpi,
  onLogKpi,
  onScheduleToCalendar,
}: MilestoneKpiPanelProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('daily');
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [customKpiName, setCustomKpiName] = useState('');
  const [customKpiTarget, setCustomKpiTarget] = useState('');
  const [loadingKpis, setLoadingKpis] = useState<Set<string>>(new Set());
  const [schedulingKpis, setSchedulingKpis] = useState<Set<string>>(new Set());

  // Get linked KPI IDs for quick lookup
  const linkedKpiIds = new Set(linkedKpis.map((lk) => lk.kpiId).filter(Boolean));

  // Filter vision KPIs by level
  const getKpisByLevel = (level: string) => {
    return visionKpis.filter((kpi) => kpi.level === level);
  };

  // Get linked KPIs for current tab
  const getLinkedKpisForLevel = (level: string) => {
    return linkedKpis.filter((lk) => {
      if (lk.kpi) return lk.kpi.level === level;
      return level === 'daily'; // Custom KPIs default to daily
    });
  };

  const handleToggleKpi = async (kpiId: string, completed: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    setLoadingKpis((prev) => new Set(prev).add(kpiId));
    try {
      await onLogKpi(kpiId, completed, today);
    } finally {
      setLoadingKpis((prev) => {
        const next = new Set(prev);
        next.delete(kpiId);
        return next;
      });
    }
  };

  const handleSchedule = async (kpi: VisionKpi) => {
    setSchedulingKpis((prev) => new Set(prev).add(kpi.id));
    try {
      await onScheduleToCalendar(kpi);
    } finally {
      setSchedulingKpis((prev) => {
        const next = new Set(prev);
        next.delete(kpi.id);
        return next;
      });
    }
  };

  const handleAddCustomKpi = async () => {
    if (customKpiName.trim()) {
      await onAddCustomKpi(customKpiName.trim(), customKpiTarget.trim());
      setCustomKpiName('');
      setCustomKpiTarget('');
      setIsAddCustomOpen(false);
    }
  };

  // Calculate stats
  const dailyKpis = getLinkedKpisForLevel('daily');
  const completedToday = dailyKpis.filter((lk) => lk.kpi?.isCompleted).length;
  const totalDailyKpis = dailyKpis.length;
  const completionRate = totalDailyKpis > 0 ? Math.round((completedToday / totalDailyKpis) * 100) : 0;

  const tabCounts = {
    daily: getLinkedKpisForLevel('daily').length,
    weekly: getLinkedKpisForLevel('weekly').length,
    monthly: getLinkedKpisForLevel('monthly').length,
    quarterly: getLinkedKpisForLevel('quarterly').length,
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Milestone KPIs
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLinkDialogOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Link KPI
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{completedToday}/{totalDailyKpis}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">Rate</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold flex items-center justify-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              {Math.max(...dailyKpis.map((k) => k.kpi?.currentStreak || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
        </div>

        {/* KPI Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily" className="text-xs">
              Daily ({tabCounts.daily})
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">
              Weekly ({tabCounts.weekly})
            </TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">
              Monthly ({tabCounts.monthly})
            </TabsTrigger>
            <TabsTrigger value="quarterly" className="text-xs">
              Quarterly ({tabCounts.quarterly})
            </TabsTrigger>
          </TabsList>

          {(['daily', 'weekly', 'monthly', 'quarterly'] as const).map((level) => (
            <TabsContent key={level} value={level} className="space-y-2 mt-3">
              {getLinkedKpisForLevel(level).length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No {level} KPIs linked</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setIsLinkDialogOpen(true)}
                  >
                    Link from vision KPIs
                  </Button>
                </div>
              ) : (
                getLinkedKpisForLevel(level).map((milestoneKpi) => {
                  const kpi = milestoneKpi.kpi;
                  const isCustom = !milestoneKpi.kpiId;
                  const displayTitle = isCustom ? milestoneKpi.customKpiName : kpi?.title;
                  const isLoading = loadingKpis.has(kpi?.id || '');
                  const isScheduling = schedulingKpis.has(kpi?.id || '');

                  return (
                    <div
                      key={milestoneKpi.id}
                      className={cn(
                        'p-3 rounded-lg border transition-colors',
                        kpi?.isCompleted ? 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/10' : 'bg-card'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {level === 'daily' && kpi && (
                          <div className="pt-0.5">
                            {isLoading ? (
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : (
                              <Checkbox
                                checked={kpi.isCompleted}
                                onCheckedChange={(checked) =>
                                  handleToggleKpi(kpi.id, checked as boolean)
                                }
                              />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn(
                              'font-medium text-sm',
                              kpi?.isCompleted && 'line-through text-muted-foreground'
                            )}>
                              {displayTitle}
                            </p>
                            {kpi?.currentStreak && kpi.currentStreak > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Flame className="h-3 w-3 mr-1 text-orange-500" />
                                {kpi.currentStreak}
                              </Badge>
                            )}
                            {isCustom && (
                              <Badge variant="outline" className="text-xs">Custom</Badge>
                            )}
                          </div>
                          {(kpi?.description || milestoneKpi.customKpiTarget) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {kpi?.description || `Target: ${milestoneKpi.customKpiTarget}`}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {kpi?.bestTime && (
                              <span className="text-xs text-muted-foreground">
                                Best: {kpi.bestTime}
                              </span>
                            )}
                            {kpi?.timeRequired && (
                              <span className="text-xs text-muted-foreground">
                                {kpi.timeRequired}
                              </span>
                            )}
                          </div>
                        </div>
                        {kpi && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSchedule(kpi)}
                            disabled={isScheduling}
                            title="Add to calendar"
                          >
                            {isScheduling ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CalendarPlus className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      {/* Link KPI Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Link KPIs to Milestone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Select KPIs from your vision to track for this milestone:
            </p>

            {/* Vision KPIs grouped by level */}
            {(['daily', 'weekly', 'monthly', 'quarterly'] as const).map((level) => {
              const kpisForLevel = getKpisByLevel(level);
              if (kpisForLevel.length === 0) return null;

              return (
                <div key={level} className="space-y-2">
                  <h4 className="font-medium capitalize text-sm">{level} KPIs</h4>
                  {kpisForLevel.map((kpi) => {
                    const isLinked = linkedKpiIds.has(kpi.id);
                    return (
                      <div
                        key={kpi.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          isLinked ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'
                        )}
                        onClick={() => {
                          if (isLinked) {
                            const milestoneKpi = linkedKpis.find((lk) => lk.kpiId === kpi.id);
                            if (milestoneKpi) onUnlinkKpi(milestoneKpi.id);
                          } else {
                            onLinkKpi(kpi.id);
                          }
                        }}
                      >
                        <Checkbox checked={isLinked} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{kpi.title}</p>
                          {kpi.description && (
                            <p className="text-xs text-muted-foreground">{kpi.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {visionKpis.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No vision KPIs available</p>
                <p className="text-xs">Generate KPIs from your vision first</p>
              </div>
            )}

            {/* Add Custom KPI */}
            <div className="border-t pt-4">
              {!isAddCustomOpen ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsAddCustomOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom KPI
                </Button>
              ) : (
                <div className="space-y-3">
                  <Input
                    placeholder="KPI name (e.g., Complete 10 sales calls)"
                    value={customKpiName}
                    onChange={(e) => setCustomKpiName(e.target.value)}
                    autoFocus
                  />
                  <Input
                    placeholder="Target (e.g., 10 calls per week)"
                    value={customKpiTarget}
                    onChange={(e) => setCustomKpiTarget(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setIsAddCustomOpen(false);
                        setCustomKpiName('');
                        setCustomKpiTarget('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleAddCustomKpi}
                      disabled={!customKpiName.trim()}
                    >
                      Add KPI
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsLinkDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
