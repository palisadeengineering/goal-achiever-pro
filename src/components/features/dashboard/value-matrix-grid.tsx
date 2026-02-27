'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { Zap, TrendingUp, Cog, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DashboardEvent } from './types';

interface ValueMatrixGridProps {
  events: DashboardEvent[];
}

interface QuadrantConfig {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  borderClass: string;
  bgClass: string;
  badgeClass: string;
  textClass: string;
}

const QUADRANTS: QuadrantConfig[] = [
  {
    key: 'replacement',
    title: 'Replacement',
    subtitle: 'Automate or systematize',
    icon: <Cog className="h-4 w-4" />,
    borderClass: 'border-amber-500/50',
    bgClass: 'bg-amber-950/20',
    badgeClass: 'bg-amber-900/40 text-amber-400 border-amber-700/50',
    textClass: 'text-amber-400',
  },
  {
    key: 'production',
    title: 'Production',
    subtitle: 'Your sweet spot',
    icon: <Zap className="h-4 w-4" />,
    borderClass: 'border-emerald-500/50',
    bgClass: 'bg-emerald-950/20',
    badgeClass: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    textClass: 'text-emerald-400',
  },
  {
    key: 'delegation',
    title: 'Delegation',
    subtitle: 'Delegate to others',
    icon: <Users className="h-4 w-4" />,
    borderClass: 'border-rose-500/50',
    bgClass: 'bg-rose-950/20',
    badgeClass: 'bg-rose-900/40 text-rose-400 border-rose-700/50',
    textClass: 'text-rose-400',
  },
  {
    key: 'investment',
    title: 'Investment',
    subtitle: 'Long-term growth',
    icon: <TrendingUp className="h-4 w-4" />,
    borderClass: 'border-cyan-500/50',
    bgClass: 'bg-cyan-950/20',
    badgeClass: 'bg-cyan-900/40 text-cyan-400 border-cyan-700/50',
    textClass: 'text-cyan-400',
  },
];

export function ValueMatrixGrid({ events }: ValueMatrixGridProps) {
  const grouped = useMemo(() => {
    const groups: Record<string, DashboardEvent[]> = {
      production: [],
      investment: [],
      replacement: [],
      delegation: [],
    };
    for (const event of events) {
      const q = (event.quadrant ?? '').toLowerCase();
      if (q in groups) {
        groups[q].push(event);
      }
    }
    return groups;
  }, [events]);

  return (
    <div className="space-y-3">
      {/* Axis labels */}
      <div className="relative">
        {/* Y-axis label */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground whitespace-nowrap hidden md:block">
          Makes You Money &rarr;
        </div>

        {/* 2x2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:ml-4">
          {QUADRANTS.map((q) => {
            const quadrantEvents = grouped[q.key] || [];
            const totalHours = quadrantEvents.reduce((sum, e) => sum + e.hours, 0);

            return (
              <div
                key={q.key}
                className={`rounded-lg border-2 ${q.borderClass} ${q.bgClass} p-4 min-h-[180px] flex flex-col`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={q.textClass}>{q.icon}</span>
                    <div>
                      <h3 className={`font-semibold text-sm ${q.textClass}`}>{q.title}</h3>
                      <p className="text-xs text-muted-foreground">{q.subtitle}</p>
                    </div>
                  </div>
                  <Badge className={`${q.badgeClass} border text-xs`}>
                    {totalHours.toFixed(1)}h
                  </Badge>
                </div>

                {/* Event cards */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[200px]">
                  {quadrantEvents.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">
                      No events in this quadrant
                    </p>
                  ) : (
                    quadrantEvents.slice(0, 8).map((event) => (
                      <Link
                        key={event.id}
                        href={ROUTES.timeAudit}
                        className="block p-2 rounded-md bg-background/50 hover:bg-background/80 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{event.title}</p>
                            {event.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {event.hours.toFixed(1)}h
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                  {quadrantEvents.length > 8 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{quadrantEvents.length - 8} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis label */}
        <div className="text-center mt-2 text-xs text-muted-foreground hidden md:block">
          &larr; Lights You Up &rarr;
        </div>
      </div>
    </div>
  );
}
