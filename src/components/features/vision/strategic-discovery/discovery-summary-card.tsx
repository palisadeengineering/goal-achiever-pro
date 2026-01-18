'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Target,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import type { AIInsights, StrategicDiscoveryData } from '@/types/strategic-discovery';

interface DiscoverySummaryCardProps {
  insights: AIInsights;
  data: StrategicDiscoveryData;
  onClose: () => void;
}

export function DiscoverySummaryCard({
  insights,
  data,
  onClose,
}: DiscoverySummaryCardProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  // Determine success probability color
  const getSuccessColor = (probability: number) => {
    if (probability >= 70) return 'text-cyan-600 dark:text-cyan-400';
    if (probability >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getSuccessBadge = (probability: number) => {
    if (probability >= 70) return 'bg-cyan-100 text-cyan-700';
    if (probability >= 40) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Strategic Discovery Summary
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Success Probability */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Success Probability</p>
            <p className={`text-3xl font-bold ${getSuccessColor(insights.successProbability)}`}>
              {insights.successProbability}%
            </p>
          </div>
          <div className="text-right">
            <Badge className={getSuccessBadge(insights.successProbability)}>
              {insights.successProbability >= 70
                ? 'High Confidence'
                : insights.successProbability >= 40
                ? 'Moderate Risk'
                : 'Needs Work'}
            </Badge>
            <Progress
              value={insights.successProbability}
              className="w-32 h-2 mt-2"
            />
          </div>
        </div>

        {/* Key Numbers */}
        {data.revenueMath && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(data.revenueMath.revenueTarget)}
              </p>
              <p className="text-xs text-muted-foreground">
                {data.revenueMath.revenueType.toUpperCase()} Target
              </p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {data.revenueMath.targetCustomerCount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Customers Needed</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(data.revenueMath.basePrice)}
              </p>
              <p className="text-xs text-muted-foreground">Price Point</p>
            </div>
          </div>
        )}

        {/* Revenue Analysis */}
        {insights.revenueAnalysis && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Revenue Analysis
            </h4>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              {insights.revenueAnalysis}
            </p>
          </div>
        )}

        {/* Strengths */}
        {insights.strengthAreas?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-cyan-500" />
              Strengths
            </h4>
            <div className="space-y-1">
              {insights.strengthAreas.map((strength, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm bg-cyan-50 dark:bg-cyan-950/30 p-2 rounded"
                >
                  <CheckCircle2 className="h-4 w-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gap Areas */}
        {insights.gapAreas?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <ThumbsDown className="h-4 w-4 text-orange-500" />
              Areas to Improve
            </h4>
            <div className="space-y-1">
              {insights.gapAreas.map((gap, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm bg-orange-50 dark:bg-orange-950/30 p-2 rounded"
                >
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span>{gap}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Factors */}
        {insights.riskFactors?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Risk Factors
            </h4>
            <div className="space-y-1">
              {insights.riskFactors.map((risk, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm bg-red-50 dark:bg-red-950/30 p-2 rounded"
                >
                  <span className="text-red-500 font-medium mr-1">{i + 1}.</span>
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {insights.recommendations?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Recommendations
            </h4>
            <div className="space-y-1">
              {insights.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm bg-blue-50 dark:bg-blue-950/30 p-2 rounded"
                >
                  <span className="text-blue-500 font-bold mr-1">{i + 1}.</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Status */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Discovery Completion: <strong>{data.completionScore}%</strong>
          </div>
          <div className="flex gap-2">
            {data.sectionsCompleted.map((section) => (
              <Badge key={section} variant="secondary" className="bg-cyan-100 text-cyan-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {section}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
