'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  ListTodo,
  Calendar,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

interface DashboardStats {
  visionCount: number;
  powerGoals: {
    total: number;
    active: number;
    completed: number;
    avgProgress: number;
  };
  mins: {
    todayTotal: number;
    todayCompleted: number;
    weekTotal: number;
    weekCompleted: number;
    completionRate: number;
  };
  drip: {
    distribution: {
      delegation: number;
      replacement: number;
      investment: number;
      production: number;
    };
    totalMinutes: number;
    totalHours: number;
  };
  threeHundredRule: {
    clarity: number;
    belief: number;
    consistency: number;
    total: number;
  };
  routines: {
    todayCompletion: number;
  };
  reviews: {
    todayCount: number;
    morningDone: boolean;
  };
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/dashboard/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  return response.json();
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Use real data or defaults
  const visionProgress = stats?.powerGoals.avgProgress || 0;
  const powerGoalsCompleted = stats?.powerGoals.completed || 0;
  const powerGoalsTotal = stats?.powerGoals.total || 0;
  const minsToday = stats?.mins.todayTotal || 0;
  const minsCompletedToday = stats?.mins.todayCompleted || 0;
  const productionTimePercent = stats?.drip.distribution.production || 0;

  const clarity = stats?.threeHundredRule.clarity || 0;
  const belief = stats?.threeHundredRule.belief || 0;
  const consistency = stats?.threeHundredRule.consistency || 0;
  const threeHundredTotal = stats?.threeHundredRule.total || 0;

  const dripDistribution = stats?.drip.distribution || {
    delegation: 0,
    replacement: 0,
    investment: 0,
    production: 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's your progress overview."
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vision Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visionProgress}%</div>
            <Progress value={visionProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {powerGoalsCompleted}/{powerGoalsTotal}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.powerGoals.active || 0} active milestones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s MINS</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {minsCompletedToday}/{minsToday}
            </div>
            <p className="text-xs text-muted-foreground">
              {minsToday - minsCompletedToday} tasks remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionTimePercent}%</div>
            <p className="text-xs text-muted-foreground">
              Time in high-value activities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Today's Focus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today&apos;s Focus
            </CardTitle>
            <CardDescription>
              Your most important next steps for today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {minsToday === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <ListTodo className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No MINS scheduled for today</p>
                <p className="text-sm">Add your most important tasks</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {minsCompletedToday} of {minsToday} MINS completed
                    </p>
                    <Progress value={stats?.mins.completionRate || 0} className="h-2 mt-2" />
                  </div>
                  <Badge variant={minsCompletedToday === minsToday ? "default" : "secondary"}>
                    {stats?.mins.completionRate || 0}%
                  </Badge>
                </div>
              </>
            )}

            <Button asChild className="w-full">
              <Link href={ROUTES.mins}>
                View All MINS
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* DRIP Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              This Week&apos;s DRIP Distribution
            </CardTitle>
            <CardDescription>
              How you&apos;re spending your time across quadrants ({stats?.drip.totalHours || 0}h tracked)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* DRIP Distribution Bars */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-cyan-500" />
                    Production
                  </span>
                  <span className="font-medium">{dripDistribution.production}%</span>
                </div>
                <Progress value={dripDistribution.production} className="h-2 bg-cyan-100" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-blue-500" />
                    Investment
                  </span>
                  <span className="font-medium">{dripDistribution.investment}%</span>
                </div>
                <Progress value={dripDistribution.investment} className="h-2 bg-blue-100" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-orange-500" />
                    Replacement
                  </span>
                  <span className="font-medium">{dripDistribution.replacement}%</span>
                </div>
                <Progress value={dripDistribution.replacement} className="h-2 bg-orange-100" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-purple-500" />
                    Delegation
                  </span>
                  <span className="font-medium">{dripDistribution.delegation}%</span>
                </div>
                <Progress value={dripDistribution.delegation} className="h-2 bg-purple-100" />
              </div>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.timeAudit}>
                View Time Audit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 300% Rule Tracker */}
        <Card>
          <CardHeader>
            <CardTitle>300% Rule</CardTitle>
            <CardDescription>
              Clarity + Belief + Consistency = Achievement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Clarity</span>
                  <span className="font-medium">{clarity}%</span>
                </div>
                <Progress value={clarity} className="h-2" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Belief</span>
                  <span className="font-medium">{belief}%</span>
                </div>
                <Progress value={belief} className="h-2" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Consistency</span>
                  <span className="font-medium">{consistency}%</span>
                </div>
                <Progress value={consistency} className="h-2" />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-center">
                Combined Score: <span className="font-bold text-lg">{threeHundredTotal}%</span>
              </p>
              <p className="text-xs text-center text-muted-foreground mt-1">
                {threeHundredTotal === 0
                  ? "Complete a daily review to track your 300% score"
                  : threeHundredTotal >= 270
                    ? "Excellent! You're on fire!"
                    : threeHundredTotal >= 200
                      ? "Great progress! Keep pushing!"
                      : "Time to recalibrate - check your reviews"}
              </p>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.reviews}>
                Daily Reviews
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump into your daily activities</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link href={ROUTES.pomodoro}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Start Pomodoro</p>
                    <p className="text-xs text-muted-foreground">
                      25-minute focused work session
                    </p>
                  </div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link href={ROUTES.reviews}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Daily Review</p>
                    <p className="text-xs text-muted-foreground">
                      {stats?.reviews.todayCount || 0} reviews today
                    </p>
                  </div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="justify-start h-auto py-3">
              <Link href={ROUTES.timeAudit}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Log Time Block</p>
                    <p className="text-xs text-muted-foreground">
                      Track your time and energy
                    </p>
                  </div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
