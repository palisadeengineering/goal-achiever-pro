'use client';

/**
 * Zombie Goals Widget Component
 *
 * Displays KPIs that have had no activity in 14+ days,
 * allowing users to revive or archive them.
 */

import { useState } from 'react';
import { Ghost, Skull, AlertTriangle, CheckCircle, Archive, ExternalLink, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

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

interface ZombieGoalsWidgetProps {
  zombieGoals: ZombieGoal[];
  onRefresh?: () => void;
  className?: string;
}

const LEVEL_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
};

function formatLastActivity(lastActivity: string | null, daysSinceActivity: number | null): string {
  if (!lastActivity || daysSinceActivity === null) {
    return 'Never logged';
  }
  if (daysSinceActivity === 1) {
    return '1 day ago';
  }
  return `${daysSinceActivity} days ago`;
}

export function ZombieGoalsWidget({ zombieGoals, onRefresh, className }: ZombieGoalsWidgetProps) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const visibleGoals = zombieGoals.filter(g => !hiddenIds.has(g.id));

  const handleRevive = (goal: ZombieGoal) => {
    toast.success(`Navigating to log ${goal.title}...`);
    // Navigation will be handled by the Link component
  };

  const handleArchive = async (goal: ZombieGoal) => {
    // For now, just hide from view
    setHiddenIds(prev => new Set([...prev, goal.id]));
    toast.info(`${goal.title} hidden from view`);
    // TODO: Actually archive the KPI via API
  };

  if (visibleGoals.length === 0) {
    return (
      <Card className={cn('border-green-200 dark:border-green-900', className)}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <PartyPopper className="h-12 w-12 text-green-500 mb-3" />
          <p className="font-medium text-green-700 dark:text-green-300">No zombie goals!</p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            All your KPIs are active. Great job staying consistent!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-amber-200 dark:border-amber-900/50', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Ghost className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg">Zombie Goals</CardTitle>
        </div>
        <CardDescription>
          KPIs with no activity in 14+ days
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleGoals.slice(0, 5).map(goal => (
          <div
            key={goal.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10"
          >
            <Skull className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate">{goal.title}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {LEVEL_LABELS[goal.level] || goal.level}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: goal.visionColor }}
                />
                <span className="text-xs text-muted-foreground truncate">
                  {goal.visionTitle}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  {formatLastActivity(goal.lastActivity, goal.daysSinceActivity)}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <Link href={`/today?kpi=${goal.id}`}>
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs gap-1"
                  onClick={() => handleRevive(goal)}
                >
                  <CheckCircle className="h-3 w-3" />
                  Revive
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1 text-muted-foreground"
                onClick={() => handleArchive(goal)}
              >
                <Archive className="h-3 w-3" />
                Hide
              </Button>
            </div>
          </div>
        ))}

        {visibleGoals.length > 5 && (
          <div className="text-center pt-1">
            <span className="text-xs text-muted-foreground">
              +{visibleGoals.length - 5} more zombie goals
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
