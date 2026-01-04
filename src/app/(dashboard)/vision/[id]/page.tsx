'use client';

import { useState, useEffect, use, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CascadingPlanView } from '@/components/features/backtrack/cascading-plan-view';
import { KpiTrackingPanel } from '@/components/features/kpi/kpi-tracking-panel';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Loader2,
  AlertCircle,
  Eye,
  ListTodo,
  Target,
  BarChart3,
  Sparkles,
  Quote,
  Image,
  Calendar,
  Flame,
  Trophy,
  CheckCircle2,
  CheckSquare,
  GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Vision {
  id: string;
  title: string;
  description: string | null;
  specific: string | null;
  measurable: string | null;
  attainable: string | null;
  realistic: string | null;
  time_bound: string | null;
  clarity_score: number;
  belief_score: number;
  consistency_score: number;
  is_active: boolean;
  color: string | null;
  affirmation_text: string | null;
  created_at: string;
  updated_at: string;
}

interface BacktrackPlan {
  id: string;
  vision_id: string;
  available_hours_per_week: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface PlanData {
  quarterlyTargets: Array<{
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
  }>;
  powerGoals: Array<{
    id: string;
    quarterly_target_id?: string;
    title: string;
    description?: string;
    quarter?: number;
    category?: string;
    estimated_hours?: number;
    progress_percentage: number;
    status: string;
  }>;
  monthlyTargets: Array<{
    id: string;
    power_goal_id: string;
    title: string;
    description?: string;
    target_month: number;
    target_year: number;
    key_metric?: string;
    target_value?: string;
    status: string;
  }>;
  weeklyTargets: Array<{
    id: string;
    monthly_target_id: string;
    title: string;
    description?: string;
    week_number: number;
    week_start_date: string;
    week_end_date: string;
    status: string;
  }>;
  dailyActions: Array<{
    id: string;
    weekly_target_id: string;
    title: string;
    description?: string;
    action_date: string;
    estimated_minutes?: number;
    status: string;
  }>;
}

interface NonNegotiable {
  id: string;
  title: string;
  description?: string;
  frequency: string;
  targetCount: number;
  isActive: boolean;
}

interface StreakData {
  nonNegotiableId: string;
  title: string;
  currentStreak: number;
  longestStreak: number;
  thisWeekCompletions: number;
  thisMonthCompletions: number;
  totalCompletions: number;
  lastCompletedDate: string | null;
}

interface CompletionStatus {
  [nonNegotiableId: string]: {
    [date: string]: number;
  };
}

interface BoardImage {
  id: string;
  url: string;
  caption: string | null;
  is_cover: boolean;
}

export default function VisionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [vision, setVision] = useState<Vision | null>(null);
  const [backtrackPlan, setBacktrackPlan] = useState<BacktrackPlan | null>(null);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [boardImages, setBoardImages] = useState<BoardImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  // Non-negotiables state
  const [nonNegotiables, setNonNegotiables] = useState<NonNegotiable[]>([]);
  const [streakData, setStreakData] = useState<StreakData[]>([]);
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({});
  const [loadingCompletions, setLoadingCompletions] = useState<Set<string>>(new Set());

  // Fetch vision data
  const fetchVision = useCallback(async () => {
    try {
      const response = await fetch(`/api/visions/${id}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Vision not found');
        throw new Error('Failed to fetch vision');
      }
      const data = await response.json();
      setVision(data.vision);
      setBoardImages(data.boardImages || []);
    } catch (err) {
      console.error('Error fetching vision:', err);
      setError(err instanceof Error ? err.message : 'Failed to load vision');
    }
  }, [id]);

  // Fetch backtrack plan for this vision
  const fetchBacktrackPlan = useCallback(async () => {
    try {
      const response = await fetch(`/api/backtrack?visionId=${id}`);
      if (response.ok) {
        const data = await response.json();
        const activePlan = data.plans?.find((p: BacktrackPlan) => p.vision_id === id);
        if (activePlan) {
          setBacktrackPlan(activePlan);
          // Fetch full plan data
          const planResponse = await fetch(`/api/backtrack/${activePlan.id}`);
          if (planResponse.ok) {
            const planResult = await planResponse.json();
            setPlanData({
              quarterlyTargets: planResult.quarterlyTargets || [],
              powerGoals: planResult.powerGoals || [],
              monthlyTargets: planResult.monthlyTargets || [],
              weeklyTargets: planResult.weeklyTargets || [],
              dailyActions: planResult.dailyActions || [],
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching backtrack plan:', err);
    }
  }, [id]);

  // Fetch non-negotiables
  const fetchNonNegotiables = useCallback(async () => {
    try {
      const response = await fetch(`/api/non-negotiables?visionId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setNonNegotiables(data);
        const status: CompletionStatus = {};
        for (const nn of data) {
          status[nn.id] = {};
        }
        setCompletionStatus(status);
      }
    } catch (err) {
      console.error('Error fetching non-negotiables:', err);
    }
  }, [id]);

  // Fetch streak data
  const fetchStreakData = useCallback(async () => {
    try {
      const response = await fetch(`/api/non-negotiables/streaks?visionId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setStreakData(data);
      }
    } catch (err) {
      console.error('Error fetching streak data:', err);
    }
  }, [id]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchVision(),
        fetchBacktrackPlan(),
        fetchNonNegotiables(),
        fetchStreakData(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchVision, fetchBacktrackPlan, fetchNonNegotiables, fetchStreakData]);

  const handleToggleCompletion = async (nnId: string, date: string) => {
    const key = `${nnId}-${date}`;
    if (loadingCompletions.has(key)) return;

    setLoadingCompletions((prev) => new Set([...prev, key]));

    try {
      const isCompleted = completionStatus[nnId]?.[date] > 0;
      const method = isCompleted ? 'DELETE' : 'POST';

      const response = await fetch(`/api/non-negotiables/${nnId}/complete`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });

      if (response.ok) {
        setCompletionStatus((prev) => ({
          ...prev,
          [nnId]: {
            ...prev[nnId],
            [date]: isCompleted ? 0 : 1,
          },
        }));
        fetchStreakData();
      }
    } catch (err) {
      console.error('Error toggling completion:', err);
      toast.error('Failed to update completion');
    } finally {
      setLoadingCompletions((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!vision) return null;

    const totalScore = vision.clarity_score + vision.belief_score + vision.consistency_score;
    const scoreColor =
      totalScore >= 240
        ? 'text-green-600'
        : totalScore >= 180
        ? 'text-yellow-600'
        : 'text-red-600';

    const hasSmart = !!(
      vision.specific ||
      vision.measurable ||
      vision.attainable ||
      vision.realistic
    );

    const bestStreak =
      streakData.length > 0 ? Math.max(...streakData.map((s) => s.currentStreak)) : 0;

    const totalActions = planData?.dailyActions.length || 0;
    const completedActions =
      planData?.dailyActions.filter((a) => a.status === 'completed').length || 0;

    return {
      totalScore,
      scoreColor,
      hasSmart,
      bestStreak,
      totalActions,
      completedActions,
    };
  }, [vision, streakData, planData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !vision || !metrics) {
    return (
      <div className="space-y-6">
        <PageHeader title="Error" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{error || 'Vision not found'}</p>
            <Link href="/vision">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Visions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const visionColor = vision.color || '#6366f1';
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      <PageHeader
        title={vision.title}
        description={vision.description || undefined}
        icon={
          <div
            className="h-6 w-6 rounded-full"
            style={{ backgroundColor: visionColor }}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/vision">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <Link href={`/vision?edit=${vision.id}`}>
              <Button size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        }
      />

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details" className="gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Plan</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <ListTodo className="h-4 w-4" />
            <span className="hidden sm:inline">Rules</span>
          </TabsTrigger>
          <TabsTrigger value="kpis" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">KPIs</span>
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          {/* 300% Score */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  300% Score
                </h3>
                <span className={cn('text-3xl font-bold', metrics.scoreColor)}>
                  {metrics.totalScore}%
                </span>
              </div>
              <Progress value={metrics.totalScore / 3} className="h-3 mb-4" />
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">{vision.clarity_score}%</div>
                  <div className="text-sm text-muted-foreground">Clarity</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">{vision.belief_score}%</div>
                  <div className="text-sm text-muted-foreground">Belief</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">{vision.consistency_score}%</div>
                  <div className="text-sm text-muted-foreground">Consistency</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SMART Goals */}
          {metrics.hasSmart && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-primary" />
                  SMART Goals
                </h3>
                <div className="space-y-4">
                  {vision.specific && (
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">S</Badge>
                        <span className="font-medium text-sm">Specific</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{vision.specific}</p>
                    </div>
                  )}
                  {vision.measurable && (
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">M</Badge>
                        <span className="font-medium text-sm">Measurable</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{vision.measurable}</p>
                    </div>
                  )}
                  {vision.attainable && (
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">A</Badge>
                        <span className="font-medium text-sm">Attainable</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{vision.attainable}</p>
                    </div>
                  )}
                  {vision.realistic && (
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">R</Badge>
                        <span className="font-medium text-sm">Realistic</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{vision.realistic}</p>
                    </div>
                  )}
                  {vision.time_bound && (
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">T</Badge>
                        <span className="font-medium text-sm">Time-Bound</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Target: {format(parseISO(vision.time_bound), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Affirmation */}
          {vision.affirmation_text && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Quote className="h-5 w-5 text-purple-500" />
                  Affirmation
                </h3>
                <blockquote className="text-lg italic text-muted-foreground border-l-4 border-primary pl-4">
                  "{vision.affirmation_text}"
                </blockquote>
              </CardContent>
            </Card>
          )}

          {/* Vision Board */}
          {boardImages.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Image className="h-5 w-5 text-blue-500" />
                  Vision Board
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {boardImages.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={img.url}
                        alt={img.caption || 'Vision board image'}
                        className="w-full h-full object-cover"
                      />
                      {img.is_cover && (
                        <Badge className="absolute top-2 left-2" variant="secondary">
                          Cover
                        </Badge>
                      )}
                      {img.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                          {img.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-green-500" />
                Timeline
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="font-medium">
                    {format(parseISO(vision.created_at), 'MMM d, yyyy')}
                  </div>
                </div>
                {vision.time_bound && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">Target Date</div>
                    <div className="font-medium">
                      {format(parseISO(vision.time_bound), 'MMM d, yyyy')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan Tab */}
        <TabsContent value="plan" className="space-y-6">
          {backtrackPlan && planData ? (
            <>
              {/* Plan Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge
                      className={cn(
                        'mt-1',
                        backtrackPlan.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {backtrackPlan.status}
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Quarterly Targets</div>
                    <div className="text-2xl font-bold">{planData.quarterlyTargets.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Monthly Targets</div>
                    <div className="text-2xl font-bold">{planData.monthlyTargets.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Actions</div>
                    <div className="text-2xl font-bold">
                      {metrics.completedActions}/{metrics.totalActions}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cascading Plan */}
              <Card>
                <CardContent className="pt-6">
                  <CascadingPlanView
                    visionTitle={vision.title}
                    visionColor={vision.color || undefined}
                    quarterlyTargets={planData.quarterlyTargets}
                    powerGoals={planData.powerGoals}
                    monthlyTargets={planData.monthlyTargets}
                    weeklyTargets={planData.weeklyTargets}
                    dailyActions={planData.dailyActions}
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GitBranch className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold mb-2">No Backtrack Plan Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create a backtrack plan to break down your vision into actionable steps.
                </p>
                <Link href="/backtrack">
                  <Button>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Create Backtrack Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Rules Tab (Non-Negotiables) */}
        <TabsContent value="rules" className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Active Rules</div>
                <div className="text-2xl font-bold">{nonNegotiables.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Best Streak</span>
                </div>
                <div className="text-2xl font-bold">{metrics.bestStreak} days</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">This Week</span>
                </div>
                <div className="text-2xl font-bold">
                  {streakData.reduce((sum, s) => sum + s.thisWeekCompletions, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Non-Negotiables */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5" />
                Today's Non-Negotiables
              </h3>
              {nonNegotiables.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No non-negotiables defined for this vision yet.
                  </p>
                  <Link href={`/vision?edit=${id}`}>
                    <Button variant="outline">Add Non-Negotiables</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {nonNegotiables.map((nn) => {
                    const streak = streakData.find((s) => s.nonNegotiableId === nn.id);
                    const isCompletedToday = completionStatus[nn.id]?.[today] > 0;
                    const isLoading = loadingCompletions.has(`${nn.id}-${today}`);

                    return (
                      <div
                        key={nn.id}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-lg border transition-colors',
                          isCompletedToday
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                            : 'bg-background'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isCompletedToday}
                            onCheckedChange={() => handleToggleCompletion(nn.id, today)}
                            disabled={isLoading}
                            className="h-5 w-5"
                          />
                          <div>
                            <div
                              className={cn(
                                'font-medium',
                                isCompletedToday && 'line-through text-muted-foreground'
                              )}
                            >
                              {nn.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {nn.frequency} • {nn.targetCount}x per day
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {streak && streak.currentStreak > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <Flame className="h-3 w-3 text-orange-500" />
                              {streak.currentStreak}
                            </Badge>
                          )}
                          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Streak Leaderboard */}
          {streakData.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Streak Leaderboard
                </h3>
                <div className="space-y-3">
                  {[...streakData]
                    .sort((a, b) => b.currentStreak - a.currentStreak)
                    .map((streak, index) => (
                      <div
                        key={streak.nonNegotiableId}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                              index === 0
                                ? 'bg-yellow-100 text-yellow-800'
                                : index === 1
                                ? 'bg-gray-100 text-gray-800'
                                : index === 2
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {index + 1}
                          </span>
                          <span className="font-medium">{streak.title}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Flame className="h-4 w-4 text-orange-500" />
                              <span className="font-bold">{streak.currentStreak}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Best: {streak.longestStreak}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-6">
          <KpiTrackingPanel visionId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
