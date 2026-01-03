'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BacktrackPlan {
  id: string;
  vision_id: string;
  available_hours_per_week: string;
  start_date: string;
  end_date: string;
  status: string;
  ai_generated_at?: string;
  created_at: string;
  visions: {
    id: string;
    title: string;
    description?: string;
    color?: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
};

export default function BacktrackPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<BacktrackPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/backtrack');
      if (!response.ok) throw new Error('Failed to fetch backtrack plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load backtrack plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWizardComplete = (planId: string) => {
    setIsWizardOpen(false);
    router.push(`/backtrack/${planId}`);
  };

  const calculateProgress = (plan: BacktrackPlan) => {
    const start = new Date(plan.start_date);
    const end = new Date(plan.end_date);
    const now = new Date();

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / total) * 100);
  };

  const calculateWeeksRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backtrack Plans"
        description="Plan backwards from your vision to daily actions using Dan Martell's methodology"
        icon={<GitBranch className="h-6 w-6" />}
        actions={
          <Button onClick={() => setIsWizardOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Plan
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchPlans} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Backtrack Plans Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Create your first backtrack plan to break down your vision into quarterly,
              monthly, weekly, and daily actions.
            </p>
            <Button onClick={() => setIsWizardOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const progress = calculateProgress(plan);
            const weeksRemaining = calculateWeeksRemaining(plan.end_date);

            return (
              <Link key={plan.id} href={`/backtrack/${plan.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {plan.visions.color && (
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: plan.visions.color }}
                          />
                        )}
                        <CardTitle className="text-base line-clamp-1">
                          {plan.visions.title}
                        </CardTitle>
                      </div>
                      <Badge className={cn('shrink-0', STATUS_COLORS[plan.status])}>
                        {plan.status}
                      </Badge>
                    </div>
                    {plan.visions.description && (
                      <CardDescription className="line-clamp-2">
                        {plan.visions.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Time Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {format(parseISO(plan.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {plan.available_hours_per_week}h/week
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          weeksRemaining <= 4 ? 'text-orange-600' : 'text-muted-foreground'
                        )}
                      >
                        {weeksRemaining} weeks remaining
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Wizard Dialog */}
      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <BacktrackPlanningWizard
            onComplete={handleWizardComplete}
            onCancel={() => setIsWizardOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
