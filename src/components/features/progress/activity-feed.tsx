'use client';

/**
 * Activity Feed Component
 *
 * Displays recent KPI completions in a chronological list,
 * grouped by date (Today, Yesterday, This Week, Earlier).
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, format } from 'date-fns';
import { CheckCircle2, Calendar, Clock, Loader2, AlertCircle, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  kpiId: string;
  kpiTitle: string;
  level: string;
  visionId: string;
  visionTitle: string;
  visionColor: string;
  completedAt: string;
  value?: number | null;
}

interface ActivityFeedProps {
  visionId?: string | null;
  limit?: number;
  className?: string;
}

interface GroupedActivities {
  today: ActivityItem[];
  yesterday: ActivityItem[];
  thisWeek: ActivityItem[];
  earlier: ActivityItem[];
}

const LEVEL_BADGES: Record<string, { label: string; className: string }> = {
  daily: { label: 'Daily', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  weekly: { label: 'Weekly', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  monthly: { label: 'Monthly', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  quarterly: { label: 'Quarterly', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
};

function groupActivitiesByDate(activities: ActivityItem[]): GroupedActivities {
  const groups: GroupedActivities = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  activities.forEach(activity => {
    const date = new Date(activity.completedAt);
    if (isToday(date)) {
      groups.today.push(activity);
    } else if (isYesterday(date)) {
      groups.yesterday.push(activity);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(activity);
    } else {
      groups.earlier.push(activity);
    }
  });

  return groups;
}

function ActivityItemRow({ activity }: { activity: ActivityItem }) {
  const levelBadge = LEVEL_BADGES[activity.level] || LEVEL_BADGES.daily;
  const completedDate = new Date(activity.completedAt);

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="shrink-0 mt-0.5">
        <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{activity.kpiTitle}</span>
          <Badge className={cn('text-[10px] px-1.5 py-0', levelBadge.className)}>
            {levelBadge.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: activity.visionColor }}
          />
          <span className="text-xs text-muted-foreground truncate">
            {activity.visionTitle}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Clock className="h-3 w-3" />
        {formatDistanceToNow(completedDate, { addSuffix: true })}
      </div>
    </div>
  );
}

function DateGroup({ title, activities }: { title: string; activities: ActivityItem[] }) {
  if (activities.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 py-1">
        {title}
      </div>
      {activities.map(activity => (
        <ActivityItemRow key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

export function ActivityFeed({ visionId, limit = 50, className }: ActivityFeedProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['activity-feed', visionId, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (visionId) params.set('visionId', visionId);
      params.set('limit', limit.toString());

      const response = await fetch(`/api/progress/activity-feed?${params}`);
      if (!response.ok) throw new Error('Failed to fetch activity');
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">Failed to load activity</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activities: ActivityItem[] = data?.activities || [];
  const grouped = groupActivitiesByDate(activities);
  const hasActivities = activities.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasActivities ? (
          <div className="space-y-4">
            <DateGroup title="Today" activities={grouped.today} />
            <DateGroup title="Yesterday" activities={grouped.yesterday} />
            <DateGroup title="This Week" activities={grouped.thisWeek} />
            <DateGroup title="Earlier" activities={grouped.earlier} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <Target className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium mb-1">No recent activity</p>
            <p className="text-xs text-muted-foreground text-center mb-4">
              Complete your daily KPIs to see activity here
            </p>
            <Link href="/today">
              <Button size="sm">Go to Today</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
