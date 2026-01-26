'use client';

/**
 * Impact Indicators Component
 *
 * Shows which daily KPIs have the highest impact on vision progress,
 * based on weight hierarchy from daily -> weekly -> monthly -> quarterly -> vision.
 */

import { useMemo } from 'react';
import { Zap, Target, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoalTree } from '@/lib/hooks/use-goal-tree';
import type { KpiTreeNode } from '@/lib/progress';
import { cn } from '@/lib/utils';

interface ImpactIndicatorsProps {
  visionId: string;
  visionTitle: string;
  visionColor: string;
  className?: string;
}

interface DailyKpiWithImpact {
  id: string;
  title: string;
  progress: number;
  status: string;
  impactScore: number;
  pathToVision: string[];
}

/**
 * Calculate impact score for a node based on weight path to root
 * Higher scores mean higher impact on vision progress
 */
function calculateImpactScores(tree: KpiTreeNode[]): DailyKpiWithImpact[] {
  const dailyKpis: DailyKpiWithImpact[] = [];

  function traverse(node: KpiTreeNode, weightPath: number[], titlePath: string[]) {
    const currentWeight = node.weight || 1;
    const newWeightPath = [...weightPath, currentWeight];
    const newTitlePath = [...titlePath, node.title];

    if (node.level === 'daily') {
      // Calculate impact score as product of weights in path
      const impactScore = newWeightPath.reduce((acc, w) => acc * w, 1);

      dailyKpis.push({
        id: node.id,
        title: node.title,
        progress: node.progress || 0,
        status: node.status || 'pending',
        impactScore,
        pathToVision: newTitlePath,
      });
    }

    // Traverse children
    node.children?.forEach(child => traverse(child, newWeightPath, newTitlePath));
  }

  tree.forEach(rootNode => traverse(rootNode, [], []));

  // Sort by impact score descending
  return dailyKpis.sort((a, b) => b.impactScore - a.impactScore);
}

function getImpactLevel(score: number, maxScore: number): { label: string; color: string } {
  const ratio = score / maxScore;
  if (ratio >= 0.7) {
    return { label: 'High', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30' };
  }
  if (ratio >= 0.4) {
    return { label: 'Medium', color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30' };
  }
  return { label: 'Low', color: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30' };
}

export function ImpactIndicators({ visionId, visionTitle, visionColor, className }: ImpactIndicatorsProps) {
  const { data, isLoading, error } = useGoalTree(visionId);

  const topImpactKpis = useMemo(() => {
    if (!data?.tree) return [];
    const kpis = calculateImpactScores(data.tree);
    return kpis.slice(0, 5);
  }, [data?.tree]);

  const maxImpact = topImpactKpis[0]?.impactScore || 1;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Top Impact Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
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
            <Zap className="h-5 w-5" />
            Top Impact Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Failed to load impact data
          </p>
        </CardContent>
      </Card>
    );
  }

  if (topImpactKpis.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Top Impact Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Target className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No daily KPIs found for this vision
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: visionColor }}
          />
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Top Impact Actions
          </CardTitle>
        </div>
        <CardDescription>
          Daily KPIs that drive {visionTitle} progress most
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {topImpactKpis.map((kpi, index) => {
          const impactLevel = getImpactLevel(kpi.impactScore, maxImpact);

          return (
            <div
              key={kpi.id}
              className="flex items-start gap-3 p-2 rounded-lg border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{kpi.title}</span>
                  <Badge className={cn('text-[10px] px-1.5 py-0', impactLevel.color)}>
                    {impactLevel.label} Impact
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Progress value={kpi.progress} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {Math.round(kpi.progress)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/**
 * Combined Impact Indicators for all visions
 */
interface AllVisionsImpactProps {
  visions: Array<{
    id: string;
    title: string;
    color: string;
  }>;
  className?: string;
}

export function AllVisionsImpact({ visions, className }: AllVisionsImpactProps) {
  if (visions.length === 0) {
    return null;
  }

  // Just show the first vision's impact for now
  // Could be expanded to aggregate across all visions
  const firstVision = visions[0];

  return (
    <ImpactIndicators
      visionId={firstVision.id}
      visionTitle={firstVision.title}
      visionColor={firstVision.color}
      className={className}
    />
  );
}
