'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Edit,
  Eye,
  GitBranch,
  ArrowRight,
  Target,
  Quote,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

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
}

interface BacktrackPlan {
  id: string;
  vision_id: string;
  status: string;
}

interface VisionCardProps {
  vision: Vision;
  backtrackPlan?: BacktrackPlan;
  onEdit: () => void;
  onViewDetails?: () => void;
  variant?: 'grid' | 'kanban';
}

export function VisionCard({
  vision,
  backtrackPlan,
  onEdit,
  onViewDetails,
  variant = 'grid',
}: VisionCardProps) {
  const threeHundredPercent =
    vision.clarity_score + vision.belief_score + vision.consistency_score;

  const scoreColor =
    threeHundredPercent >= 240
      ? 'text-cyan-600'
      : threeHundredPercent >= 180
      ? 'text-yellow-600'
      : 'text-red-600';

  const hasSmart = !!(
    vision.specific ||
    vision.measurable ||
    vision.attainable ||
    vision.realistic
  );

  if (variant === 'kanban') {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-2">
            <div
              className="w-2 h-full min-h-[40px] rounded-full flex-shrink-0"
              style={{ backgroundColor: vision.color || '#6366f1' }}
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base line-clamp-2">{vision.title}</CardTitle>
              {vision.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {vision.description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* 300% Score - Compact */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">300% Score</span>
            <span className={`font-semibold ${scoreColor}`}>{threeHundredPercent}%</span>
          </div>
          <Progress value={threeHundredPercent / 3} className="h-1.5" />

          {/* Quick badges */}
          <div className="flex flex-wrap gap-1">
            {hasSmart && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                <Target className="h-3 w-3 mr-1" />
                SMART
              </Badge>
            )}
            {vision.affirmation_text && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                <Quote className="h-3 w-3 mr-1" />
                Affirmation
              </Badge>
            )}
            {vision.time_bound && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(vision.time_bound).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            {onViewDetails && (
              <Button variant="default" size="sm" className="flex-1" onClick={onViewDetails}>
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid variant (original card style)
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onEdit}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-10 rounded-full"
              style={{ backgroundColor: vision.color || '#6366f1' }}
            />
            <div>
              <CardTitle className="text-lg line-clamp-1">{vision.title}</CardTitle>
              {vision.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {vision.description}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 300% Score */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">300% Score</span>
            <span className={`text-sm font-semibold ${scoreColor}`}>
              {threeHundredPercent}%
            </span>
          </div>
          <Progress value={threeHundredPercent / 3} className="h-2" />
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {hasSmart && (
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              SMART
            </div>
          )}
          {vision.affirmation_text && (
            <div className="flex items-center gap-1">
              <Quote className="h-3 w-3" />
              Affirmation
            </div>
          )}
        </div>

        {/* Backtrack Plan Status */}
        <div className="pt-3 border-t">
          {backtrackPlan ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <GitBranch className="h-4 w-4 text-primary" />
                <span>Backtrack Plan Active</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <Link href={`/backtrack/${backtrackPlan.id}`}>
                  View
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Link href="/backtrack">
                <GitBranch className="h-4 w-4 mr-2" />
                Create Backtrack Plan
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
