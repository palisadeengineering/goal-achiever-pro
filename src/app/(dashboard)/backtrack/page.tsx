'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BacktrackPlanningWizard } from '@/components/features/backtrack/backtrack-planning-wizard';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  GitBranch,
  Plus,
  ChevronRight,
  Calendar,
  Clock,
  Target,
  Loader2,
  AlertCircle,
  Eye,
  Edit,
  Flame,
  CheckCircle2,
  ListChecks,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShareButton } from '@/components/features/sharing';

interface Vision {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  clarity_score: number;
  belief_score: number;
  consistency_score: number;
  is_active: boolean;
  time_bound: string | null;
  specific: string | null;
  affirmation_text: string | null;
}

interface BacktrackPlan {
  id: string;
  vision_id: string;
  available_hours_per_week: string;
  start_date: string;
  end_date: string;
  status: string;
  ai_generated_at?: string;
  created_at: string;
}

interface StreakData {
  nonNegotiableId: string;
  title: string;
  currentStreak: number;
  longestStreak: number;
  thisWeekCompletions: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  active: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
};

export default function BacktrackPage() {
  const router = useRouter();
  const [visions, setVisions] = useState<Vision[]>([]);
  const [plans, setPlans] = useState<BacktrackPlan[]>([]);
  const [streaks, setStreaks] = useState<Record<string, StreakData[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedVisionId, setSelectedVisionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch all data in parallel
      const [visionsRes, plansRes] = await Promise.all([
        fetch('/api/visions'),
        fetch('/api/backtrack'),
      ]);

      if (!visionsRes.ok) throw new Error('Failed to fetch visions');
      if (!plansRes.ok) throw new Error('Failed to fetch backtrack plans');

      const visionsData = await visionsRes.json();
      const plansData = await plansRes.json();

      setVisions(visionsData.visions || []);
      setPlans(plansData.plans || []);

      // Fetch streaks for each vision
      const visionIds = visionsData.visions?.map((v: Vision) => v.id) || [];
      const streakPromises = visionIds.map(async (visionId: string) => {
        try {
          const res = await fetch(`/api/non-negotiables/streaks?visionId=${visionId}`);
          if (res.ok) {
            const data = await res.json();
            return { visionId, streaks: data };
          }
        } catch (e) {
          console.error(`Error fetching streaks for vision ${visionId}:`, e);
        }
        return { visionId, streaks: [] };
      });

      const streakResults = await Promise.all(streakPromises);
      const streakMap: Record<string, StreakData[]> = {};
      streakResults.forEach(({ visionId, streaks }) => {
        streakMap[visionId] = streaks;
      });
      setStreaks(streakMap);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWizardComplete = (planId: string) => {
    setIsWizardOpen(false);
    setSelectedVisionId(null);
    router.push(`/backtrack/${planId}`);
  };

  const openWizardForVision = (visionId: string) => {
    setSelectedVisionId(visionId);
    setIsWizardOpen(true);
  };

  const getVisionPlan = (visionId: string) => {
    return plans.find(p => p.vision_id === visionId && p.status === 'active');
  };

  const getVisionStreaks = (visionId: string) => {
    return streaks[visionId] || [];
  };

  const getTotalStreak = (visionId: string) => {
    const visionStreaks = getVisionStreaks(visionId);
    if (visionStreaks.length === 0) return 0;
    return Math.max(...visionStreaks.map(s => s.currentStreak));
  };

  const calculatePlanProgress = (plan: BacktrackPlan) => {
    const start = new Date(plan.start_date);
    const end = new Date(plan.end_date);
    const now = new Date();

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / total) * 100);
  };

  const filteredVisions = visions.filter(vision => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return vision.is_active;
    if (activeTab === 'completed') return !vision.is_active;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Visions"
        description="Track progress across all your visions with backtrack plans, rules, and daily actions"
        icon={<Eye className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <ShareButton tabName="backtrack" />
            <Button variant="outline" asChild>
              <Link href="/vision">
                <Plus className="h-4 w-4 mr-2" />
                New Vision
              </Link>
            </Button>
            <Button onClick={() => setIsWizardOpen(true)} className="gap-2">
              <GitBranch className="h-4 w-4" />
              New Plan
            </Button>
          </div>
        }
      />

      {/* Summary Stats */}
      {!isLoading && visions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{visions.length}</p>
                  <p className="text-xs text-muted-foreground">Total Visions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                  <GitBranch className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{plans.filter(p => p.status === 'active').length}</p>
                  <p className="text-xs text-muted-foreground">Active Plans</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Flame className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Math.max(...visions.map(v => getTotalStreak(v.id)), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Best Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round(visions.reduce((sum, v) => sum + v.clarity_score + v.belief_score + v.consistency_score, 0) / Math.max(visions.length, 1))}%
                  </p>
                  <p className="text-xs text-muted-foreground">Avg 300% Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="all">All ({visions.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({visions.filter(v => v.is_active).length})</TabsTrigger>
          <TabsTrigger value="completed">Archived ({visions.filter(v => !v.is_active).length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{error}</p>
                <Button variant="outline" onClick={fetchData} className="mt-4">
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : filteredVisions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Visions Yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Start by creating a vision, then build a backtrack plan to break it down
                  into actionable daily steps.
                </p>
                <Button asChild>
                  <Link href="/vision">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Vision
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredVisions.map((vision) => {
                const plan = getVisionPlan(vision.id);
                const visionStreaks = getVisionStreaks(vision.id);
                const maxStreak = getTotalStreak(vision.id);
                const threeHundredPercent = vision.clarity_score + vision.belief_score + vision.consistency_score;
                const planProgress = plan ? calculatePlanProgress(plan) : 0;

                return (
                  <Card key={vision.id} className="hover:shadow-md transition-shadow group">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-3 h-8 rounded-full shrink-0"
                            style={{ backgroundColor: vision.color || '#6366f1' }}
                          />
                          <div className="min-w-0">
                            <CardTitle className="text-base line-clamp-1">
                              {vision.title}
                            </CardTitle>
                            {vision.description && (
                              <CardDescription className="line-clamp-1 text-xs">
                                {vision.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {maxStreak > 0 && (
                            <Badge variant="secondary" className="gap-1">
                              <Flame className="h-3 w-3 text-orange-500" />
                              {maxStreak}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* 300% Score */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">300% Score</span>
                          <span className={cn(
                            'font-semibold',
                            threeHundredPercent >= 240 ? 'text-cyan-600' :
                            threeHundredPercent >= 180 ? 'text-yellow-600' :
                            'text-red-600'
                          )}>
                            {threeHundredPercent}%
                          </span>
                        </div>
                        <Progress value={threeHundredPercent / 3} className="h-2" />
                      </div>

                      {/* Plan Progress */}
                      {plan && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Plan Progress</span>
                            <Badge className={cn('text-xs', STATUS_COLORS[plan.status])}>
                              {plan.status}
                            </Badge>
                          </div>
                          <Progress value={planProgress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{format(parseISO(plan.start_date), 'MMM d')}</span>
                            <span>{format(parseISO(plan.end_date), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      )}

                      {/* Non-Negotiables Summary */}
                      {visionStreaks.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <ListChecks className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {visionStreaks.length} rule{visionStreaks.length !== 1 ? 's' : ''}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-cyan-600">
                            {visionStreaks.filter(s => s.currentStreak > 0).length} on streak
                          </span>
                        </div>
                      )}

                      {/* Quick Stats */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {vision.specific && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-cyan-600" />
                            SMART
                          </div>
                        )}
                        {vision.affirmation_text && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-cyan-600" />
                            Affirmation
                          </div>
                        )}
                        {vision.time_bound && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(vision.time_bound), 'MMM yyyy')}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t flex gap-2">
                        {plan ? (
                          <>
                            <Button variant="default" size="sm" className="flex-1" asChild>
                              <Link href={`/backtrack/${plan.id}`}>
                                <Eye className="h-3 w-3 mr-1" />
                                View Plan
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href="/vision" onClick={() => {/* Could pass vision id */}}>
                                <Edit className="h-3 w-3" />
                              </Link>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1"
                              onClick={() => openWizardForVision(vision.id)}
                            >
                              <GitBranch className="h-3 w-3 mr-1" />
                              Create Plan
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href="/vision">
                                <Edit className="h-3 w-3" />
                              </Link>
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Wizard Dialog */}
      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <BacktrackPlanningWizard
            onComplete={handleWizardComplete}
            onCancel={() => {
              setIsWizardOpen(false);
              setSelectedVisionId(null);
            }}
            preselectedVisionId={selectedVisionId ?? undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
