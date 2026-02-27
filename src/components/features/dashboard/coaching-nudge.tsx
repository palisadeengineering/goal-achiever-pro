'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Users, Eye, Zap, Loader2, AlertCircle } from 'lucide-react';
import type { DripBreakdown, DashboardEvent } from './types';

interface CoachingNudgeProps {
  drip: DripBreakdown;
  previousDrip: DripBreakdown;
  totalHours: number;
  events: DashboardEvent[];
}

type NudgeType = 'production_change' | 'delegation_opportunity' | 'pattern_insight' | 'positive_trend';

interface Nudge {
  message: string;
  type: NudgeType;
}

const NUDGE_CONFIG: Record<NudgeType, { icon: React.ReactNode; badgeClass: string; label: string }> = {
  production_change: {
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    badgeClass: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    label: 'Production',
  },
  delegation_opportunity: {
    icon: <Users className="h-3.5 w-3.5" />,
    badgeClass: 'bg-rose-900/40 text-rose-400 border-rose-700/50',
    label: 'Delegation',
  },
  pattern_insight: {
    icon: <Eye className="h-3.5 w-3.5" />,
    badgeClass: 'bg-violet-900/40 text-violet-400 border-violet-700/50',
    label: 'Insight',
  },
  positive_trend: {
    icon: <Zap className="h-3.5 w-3.5" />,
    badgeClass: 'bg-amber-900/40 text-amber-400 border-amber-700/50',
    label: 'Trend',
  },
};

async function fetchCoachingNudge(body: {
  drip: DripBreakdown;
  previousDrip: DripBreakdown;
  totalHours: number;
  topActivities: Array<{ title: string; hours: number; quadrant: string }>;
}): Promise<{ nudges: Nudge[] }> {
  const response = await fetch('/api/ai/generate-coaching-nudge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch coaching nudge');
  }
  return response.json();
}

export function CoachingNudge({ drip, previousDrip, totalHours, events }: CoachingNudgeProps) {
  // Build top activities from events
  const topActivities = events
    .filter((e) => e.quadrant && e.quadrant !== 'na')
    .reduce<Array<{ title: string; hours: number; quadrant: string }>>((acc, e) => {
      const existing = acc.find((a) => a.title === e.title && a.quadrant === e.quadrant);
      if (existing) {
        existing.hours += e.hours;
      } else {
        acc.push({ title: e.title, hours: e.hours, quadrant: e.quadrant ?? '' });
      }
      return acc;
    }, [])
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10);

  const hasData = totalHours > 0;

  const { data, isLoading, error } = useQuery({
    queryKey: ['coachingNudge', drip, previousDrip, totalHours],
    queryFn: () =>
      fetchCoachingNudge({
        drip,
        previousDrip,
        totalHours,
        topActivities,
      }),
    enabled: hasData,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          AI Coaching
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground italic">
            Track some time to get personalized coaching nudges.
          </p>
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Analyzing your patterns...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Unable to load coaching nudges right now.</span>
          </div>
        ) : data?.nudges && data.nudges.length > 0 ? (
          <div className="space-y-3">
            {data.nudges.map((nudge, i) => {
              const config = NUDGE_CONFIG[nudge.type] || NUDGE_CONFIG.pattern_insight;
              return (
                <div key={i} className="flex gap-3">
                  <div className="mt-0.5 shrink-0">{config.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{nudge.message}</p>
                    <Badge className={`${config.badgeClass} border text-[10px] mt-1`}>
                      {config.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No nudges available right now.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
