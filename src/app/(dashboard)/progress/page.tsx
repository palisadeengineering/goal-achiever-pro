'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  Target,
  Flame,
  CheckCircle2,
  Circle,
  Loader2,
  RefreshCw,
  AlertCircle,
  Trophy,
  Zap,
  Calendar,
  BarChart3,
  Sparkles,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ShareButton } from '@/components/features/sharing';
import { HierarchyRollupView } from '@/components/features/progress/hierarchy-rollup-view';
import { ProgressFilters, type ProgressFiltersState } from '@/components/features/progress/progress-filters';
import { ActivityFeed } from '@/components/features/progress/activity-feed';
import { ProgressTrendChart } from '@/components/features/progress/progress-trend-chart';
import { ZombieGoalsWidget } from '@/components/features/progress/zombie-goals-widget';
import { AllVisionsImpact } from '@/components/features/progress/impact-indicators';

interface KpiSummary {
  id: string;
  title: string;
  level: string;
  targetValue?: string;
  unit?: string;
  isCompletedToday: boolean;
  currentStreak: number;
}

interface VisionKpis {
  visionId: string;
  visionTitle: string;
  visionColor: string;
  totalKpis: number;
  dailyKpis: number;
  weeklyKpis: number;
  monthlyKpis: number;
  quarterlyKpis: number;
  completedToday: number;
  streaks: {
    kpiId: string;
    kpiTitle: string;
    currentStreak: number;
    longestStreak: number;
  }[];
  kpis: KpiSummary[];
}

interface StreakEntry {
  kpiId: string;
  kpiTitle: string;
  currentStreak: number;
  longestStreak: number;
  visionTitle: string;
  visionColor: string;
}

interface ZombieGoal {
  id: string;
  title: string;
  level: string;
  visionId: string;
  visionTitle: string;
  visionColor: string;
  daysSinceActivity: number | null;
  lastActivity: string | null;
}

interface ProgressData {
  summary: {
    totalKpis: number;
    dailyKpisCount: number;
    completedToday: number;
    completionRate: number;
    maxStreak: number;
    averageStreak: number;
    actionsCompleted: number;
    actionsTotal: number;
    actionsCompletionRate: number;
  };
  kpisByVision: VisionKpis[];
  streakLeaderboard: StreakEntry[];
  zombieGoals: ZombieGoal[];
  date: string;
}

function getStreakIcon(streak: number) {
  if (streak >= 30) return <Trophy className="h-4 w-4 text-yellow-500" />;
  if (streak >= 14) return <Flame className="h-4 w-4 text-orange-500" />;
  if (streak >= 7) return <Zap className="h-4 w-4 text-blue-500" />;
  return <Flame className="h-4 w-4 text-muted-foreground" />;
}

function getStreakBadgeColor(streak: number) {
  if (streak >= 30) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
  if (streak >= 14) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
  if (streak >= 7) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
  return 'bg-muted text-muted-foreground';
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'hierarchy'>('overview');
  const [filters, setFilters] = useState<ProgressFiltersState>({
    visionId: null,
    status: 'all',
    dateRange: 'all',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/progress/summary');
      if (!response.ok) throw new Error('Failed to fetch progress data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError('Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get visions for filter dropdown
  const visions = useMemo(() => {
    if (!data?.kpisByVision) return [];
    return data.kpisByVision.map(v => ({
      id: v.visionId,
      title: v.visionTitle,
      color: v.visionColor,
    }));
  }, [data?.kpisByVision]);

  // Filter kpisByVision based on selected filters
  const filteredKpisByVision = useMemo(() => {
    if (!data?.kpisByVision) return [];
    let filtered = data.kpisByVision;

    // Filter by vision
    if (filters.visionId) {
      filtered = filtered.filter(v => v.visionId === filters.visionId);
    }

    return filtered;
  }, [data?.kpisByVision, filters.visionId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Progress Dashboard"
          description="Track your KPIs and daily progress"
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Progress Dashboard"
          description="Track your KPIs and daily progress"
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || data.summary.totalKpis === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Progress Dashboard"
          description="Track your KPIs and daily progress"
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No KPIs to Track</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Set up KPIs for your visions to start tracking your progress. Generate AI-powered KPIs
              aligned with your goals.
            </p>
            <Link href="/vision">
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                Set Up Vision KPIs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress Dashboard"
        description={format(new Date(), 'EEEE, MMMM d, yyyy')}
        icon={<TrendingUp className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <ProgressFilters
              filters={filters}
              onFiltersChange={setFilters}
              visions={visions}
            />
            <ShareButton tabName="progress" />
            <Button variant="outline" onClick={fetchData} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* View Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'hierarchy')}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="hierarchy" className="gap-2">
            <Layers className="h-4 w-4" />
            Hierarchy Roll-up
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        <>
          {/* Trend Chart */}
          <ProgressTrendChart visionId={filters.visionId} />

          {/* Overview Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {data.summary.completedToday}/{data.summary.dailyKpisCount}
                </div>
                <div className="text-sm text-muted-foreground">Daily KPIs Complete</div>
              </div>
            </div>
            <Progress value={data.summary.completionRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {data.summary.actionsCompleted}/{data.summary.actionsTotal}
                </div>
                <div className="text-sm text-muted-foreground">Actions Complete</div>
              </div>
            </div>
            <Progress value={data.summary.actionsCompletionRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{data.summary.maxStreak}</div>
                <div className="text-sm text-muted-foreground">Best Streak (days)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{data.summary.totalKpis}</div>
                <div className="text-sm text-muted-foreground">Total KPIs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* KPIs by Vision */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                KPIs by Vision
              </CardTitle>
              <CardDescription>
                Track your key performance indicators across all visions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {filteredKpisByVision.map((vision) => (
                <div key={vision.visionId} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: vision.visionColor }}
                      />
                      <span className="font-medium">{vision.visionTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {vision.dailyKpis > 0 && (
                        <Badge variant={vision.completedToday === vision.dailyKpis ? 'default' : 'secondary'}>
                          {vision.completedToday}/{vision.dailyKpis} today
                        </Badge>
                      )}
                      <Badge variant="outline">{vision.totalKpis} KPIs</Badge>
                    </div>
                  </div>

                  {/* KPI Progress Grid */}
                  <div className="grid gap-2 md:grid-cols-2 pl-7">
                    {vision.kpis.slice(0, 6).map((kpi) => (
                      <div
                        key={kpi.id}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg border text-sm',
                          kpi.isCompletedToday
                            ? 'bg-cyan-50 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800'
                            : 'bg-background'
                        )}
                      >
                        {kpi.isCompletedToday ? (
                          <CheckCircle2 className="h-4 w-4 text-cyan-600 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate flex-1">{kpi.title}</span>
                        {kpi.currentStreak > 0 && (
                          <Badge className={cn('text-xs shrink-0', getStreakBadgeColor(kpi.currentStreak))}>
                            {kpi.currentStreak}d
                          </Badge>
                        )}
                      </div>
                    ))}
                    {vision.kpis.length > 6 && (
                      <Link href={`/vision?id=${vision.visionId}`}>
                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
                          +{vision.kpis.length - 6} more KPIs
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Vision Progress Bar */}
                  {vision.dailyKpis > 0 && (
                    <div className="pl-7">
                      <Progress
                        value={(vision.completedToday / vision.dailyKpis) * 100}
                        className="h-1.5"
                      />
                    </div>
                  )}
                </div>
              ))}

              {filteredKpisByVision.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {filters.visionId
                    ? 'No KPIs found for the selected vision.'
                    : 'No visions with KPIs found. Set up KPIs for your visions to track progress.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Streak Leaderboard */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Streak Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.streakLeaderboard.length > 0 ? (
                <div className="space-y-3">
                  {data.streakLeaderboard.slice(0, 5).map((entry, index) => (
                    <div
                      key={entry.kpiId}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{entry.kpiTitle}</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.visionColor }}
                          />
                          <span className="truncate">{entry.visionTitle}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getStreakIcon(entry.currentStreak)}
                        <span className="font-bold text-sm">{entry.currentStreak}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Flame className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No streaks yet. Complete daily KPIs to build streaks!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Streak Milestones */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Streak Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span>7-Day Streak</span>
                  </div>
                  <Badge variant="outline">
                    {data.streakLeaderboard.filter(s => s.currentStreak >= 7).length} achieved
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span>14-Day Streak</span>
                  </div>
                  <Badge variant="outline">
                    {data.streakLeaderboard.filter(s => s.currentStreak >= 14).length} achieved
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span>30-Day Streak</span>
                  </div>
                  <Badge variant="outline">
                    {data.streakLeaderboard.filter(s => s.currentStreak >= 30).length} achieved
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <ActivityFeed visionId={filters.visionId} limit={20} />

          {/* Zombie Goals */}
          {data.zombieGoals && data.zombieGoals.length > 0 && (
            <ZombieGoalsWidget zombieGoals={data.zombieGoals} onRefresh={fetchData} />
          )}

          {/* Impact Indicators */}
          <AllVisionsImpact visions={visions} />
        </div>
      </div>
        </>
      ) : (
        /* Hierarchy Roll-up View */
        <div className="space-y-6">
          {filteredKpisByVision.length > 0 ? (
            filteredKpisByVision.map((vision) => (
              <HierarchyRollupView
                key={vision.visionId}
                visionId={vision.visionId}
                visionTitle={vision.visionTitle}
                visionColor={vision.visionColor}
              />
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layers className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Visions to Display</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {filters.visionId
                    ? 'No KPIs found for the selected vision.'
                    : 'Create visions with KPIs to see the hierarchy roll-up.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
