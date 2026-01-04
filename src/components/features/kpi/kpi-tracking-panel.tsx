'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CalendarDays,
  CalendarRange,
  CalendarClock,
  LayoutGrid,
  Loader2,
  Sparkles,
  Plus,
  Flame,
  Target,
  TrendingUp,
} from 'lucide-react';
import { DailyKpiCheckoff } from './daily-kpi-checkoff';
import { toast } from 'sonner';

interface Kpi {
  id: string;
  level: string;
  title: string;
  description?: string;
  target_value?: string;
  unit?: string;
  numeric_target?: number;
  tracking_method: string;
  best_time?: string;
  time_required?: string;
  why_it_matters?: string;
  quarter?: number;
  month?: number;
}

interface KpiLog {
  id: string;
  kpi_id: string;
  log_date: string;
  value?: number;
  is_completed: boolean;
  completion_count?: number;
  notes?: string;
}

interface StreakData {
  kpi_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date?: string;
}

interface KpiTrackingPanelProps {
  visionId: string;
  onGenerateKpis?: () => void;
}

export function KpiTrackingPanel({ visionId, onGenerateKpis }: KpiTrackingPanelProps) {
  const [activeLevel, setActiveLevel] = useState('daily');
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [logs, setLogs] = useState<Record<string, KpiLog>>({});
  const [streaks, setStreaks] = useState<Record<string, StreakData>>({});
  const [isLoading, setIsLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchKpis = useCallback(async () => {
    try {
      const response = await fetch(`/api/vision-kpis?visionId=${visionId}`);
      if (response.ok) {
        const data = await response.json();
        setKpis(data.kpis || []);
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  }, [visionId]);

  const fetchLogs = useCallback(async () => {
    const dailyKpis = kpis.filter((k) => k.level === 'daily');
    const logPromises = dailyKpis.map(async (kpi) => {
      try {
        const response = await fetch(`/api/vision-kpis/${kpi.id}/log?startDate=${today}&endDate=${today}`);
        if (response.ok) {
          const data = await response.json();
          return { kpiId: kpi.id, log: data.logs[0], streak: data.streak };
        }
      } catch (error) {
        console.error(`Error fetching logs for ${kpi.id}:`, error);
      }
      return null;
    });

    const results = await Promise.all(logPromises);
    const newLogs: Record<string, KpiLog> = {};
    const newStreaks: Record<string, StreakData> = {};

    results.forEach((result) => {
      if (result) {
        if (result.log) {
          newLogs[result.kpiId] = result.log;
        }
        if (result.streak) {
          newStreaks[result.kpiId] = result.streak;
        }
      }
    });

    setLogs(newLogs);
    setStreaks(newStreaks);
  }, [kpis, today]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchKpis();
      setIsLoading(false);
    };
    loadData();
  }, [fetchKpis]);

  useEffect(() => {
    if (kpis.length > 0) {
      fetchLogs();
    }
  }, [kpis, fetchLogs]);

  const handleLogChange = (kpiId: string, log: KpiLog) => {
    setLogs((prev) => ({ ...prev, [kpiId]: log }));
    // Refresh streak data
    fetchLogs();
  };

  const dailyKpis = kpis.filter((k) => k.level === 'daily');
  const weeklyKpis = kpis.filter((k) => k.level === 'weekly');
  const monthlyKpis = kpis.filter((k) => k.level === 'monthly');
  const quarterlyKpis = kpis.filter((k) => k.level === 'quarterly');

  const completedDaily = dailyKpis.filter((k) => logs[k.id]?.is_completed).length;
  const totalDaily = dailyKpis.length;
  const bestStreak = Object.values(streaks).length > 0
    ? Math.max(...Object.values(streaks).map((s) => s.current_streak))
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (kpis.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">No KPIs Yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            Generate AI-powered KPIs aligned with your vision to track your daily, weekly, monthly, and quarterly progress.
          </p>
          {onGenerateKpis && (
            <Button onClick={onGenerateKpis}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate KPIs with AI
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Today's Progress</div>
            <div className="text-2xl font-bold">
              {completedDaily}/{totalDaily}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-muted-foreground">Best Streak</span>
            </div>
            <div className="text-2xl font-bold">{bestStreak} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Weekly KPIs</div>
            <div className="text-2xl font-bold">{weeklyKpis.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Quarterly Goals</div>
            <div className="text-2xl font-bold">{quarterlyKpis.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Tabs */}
      <Tabs value={activeLevel} onValueChange={setActiveLevel}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Daily</span>
            {dailyKpis.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {completedDaily}/{totalDaily}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-2">
            <CalendarRange className="h-4 w-4" />
            <span className="hidden sm:inline">Weekly</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            <span className="hidden sm:inline">Monthly</span>
          </TabsTrigger>
          <TabsTrigger value="quarterly" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Quarterly</span>
          </TabsTrigger>
        </TabsList>

        {/* Daily KPIs */}
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Today's KPIs
              </CardTitle>
              <CardDescription>
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dailyKpis.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No daily KPIs configured.
                </p>
              ) : (
                dailyKpis.map((kpi) => (
                  <DailyKpiCheckoff
                    key={kpi.id}
                    kpi={kpi}
                    log={logs[kpi.id]}
                    streak={streaks[kpi.id]}
                    date={today}
                    onLogChange={handleLogChange}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly KPIs */}
        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5" />
                This Week's KPIs
              </CardTitle>
              <CardDescription>
                {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} -{' '}
                {format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyKpis.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No weekly KPIs configured.
                </p>
              ) : (
                <div className="space-y-4">
                  {weeklyKpis.map((kpi) => (
                    <div key={kpi.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{kpi.title}</h4>
                          {kpi.description && (
                            <p className="text-sm text-muted-foreground mt-1">{kpi.description}</p>
                          )}
                        </div>
                        {kpi.target_value && (
                          <Badge variant="outline">
                            Target: {kpi.target_value} {kpi.unit}
                          </Badge>
                        )}
                      </div>
                      {kpi.why_it_matters && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Why: {kpi.why_it_matters}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly KPIs */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                This Month's KPIs
              </CardTitle>
              <CardDescription>
                {format(new Date(), 'MMMM yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyKpis.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No monthly KPIs configured.
                </p>
              ) : (
                <div className="space-y-4">
                  {monthlyKpis.map((kpi) => (
                    <div key={kpi.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{kpi.title}</h4>
                          {kpi.description && (
                            <p className="text-sm text-muted-foreground mt-1">{kpi.description}</p>
                          )}
                        </div>
                        {kpi.target_value && (
                          <Badge variant="outline">
                            Target: {kpi.target_value} {kpi.unit}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quarterly KPIs */}
        <TabsContent value="quarterly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                Quarterly Goals
              </CardTitle>
              <CardDescription>
                Q{Math.ceil((new Date().getMonth() + 1) / 3)} {new Date().getFullYear()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quarterlyKpis.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No quarterly KPIs configured.
                </p>
              ) : (
                <div className="space-y-4">
                  {quarterlyKpis.map((kpi) => (
                    <div key={kpi.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{kpi.title}</h4>
                          {kpi.description && (
                            <p className="text-sm text-muted-foreground mt-1">{kpi.description}</p>
                          )}
                        </div>
                        {kpi.target_value && (
                          <Badge variant="outline">
                            Target: {kpi.target_value} {kpi.unit}
                          </Badge>
                        )}
                      </div>
                      {kpi.why_it_matters && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Why: {kpi.why_it_matters}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
