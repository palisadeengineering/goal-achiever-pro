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
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export default function DashboardPage() {
  // Mock data - will be replaced with actual data fetching
  const stats = {
    visionProgress: 65,
    powerGoalsCompleted: 3,
    powerGoalsTotal: 12,
    minsToday: 5,
    minsCompletedToday: 2,
    productionTimePercent: 42,
    currentStreak: 7,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's your progress overview."
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vision Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visionProgress}%</div>
            <Progress value={stats.visionProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.powerGoalsCompleted}/{stats.powerGoalsTotal}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.powerGoalsTotal - stats.powerGoalsCompleted} active milestones
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
              {stats.minsCompletedToday}/{stats.minsToday}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.minsToday - stats.minsCompletedToday} tasks remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productionTimePercent}%</div>
            <p className="text-xs text-muted-foreground">
              Time in high-value activities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
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
            {/* Mock MINS items */}
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="font-medium line-through text-muted-foreground">
                  Review quarterly goals
                </p>
                <p className="text-xs text-muted-foreground">Milestone: Career Growth</p>
              </div>
              <Badge variant="secondary">Completed</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border bg-primary/5">
              <div className="h-5 w-5 rounded-full border-2 border-primary" />
              <div className="flex-1">
                <p className="font-medium">Complete project proposal</p>
                <p className="text-xs text-muted-foreground">Milestone: Career Growth</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Production</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="h-5 w-5 rounded-full border-2" />
              <div className="flex-1">
                <p className="font-medium">30-minute workout</p>
                <p className="text-xs text-muted-foreground">Milestone: Health</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Investment</Badge>
            </div>

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
              How you&apos;re spending your time across quadrants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* DRIP Distribution Bars */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-green-500" />
                    Production
                  </span>
                  <span className="font-medium">42%</span>
                </div>
                <Progress value={42} className="h-2 bg-green-100" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-blue-500" />
                    Investment
                  </span>
                  <span className="font-medium">25%</span>
                </div>
                <Progress value={25} className="h-2 bg-blue-100" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-orange-500" />
                    Replacement
                  </span>
                  <span className="font-medium">18%</span>
                </div>
                <Progress value={18} className="h-2 bg-orange-100" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-purple-500" />
                    Delegation
                  </span>
                  <span className="font-medium">15%</span>
                </div>
                <Progress value={15} className="h-2 bg-purple-100" />
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
                  <span className="font-medium">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Belief</span>
                  <span className="font-medium">72%</span>
                </div>
                <Progress value={72} className="h-2" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Consistency</span>
                  <span className="font-medium">68%</span>
                </div>
                <Progress value={68} className="h-2" />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-center">
                Combined Score: <span className="font-bold text-lg">225%</span>
              </p>
              <p className="text-xs text-center text-muted-foreground mt-1">
                Target: 300% for maximum achievement
              </p>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.vision}>
                Update Vision
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
              <Link href={ROUTES.reviewEvening}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Daily Review</p>
                    <p className="text-xs text-muted-foreground">
                      Reflect on today&apos;s progress
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
