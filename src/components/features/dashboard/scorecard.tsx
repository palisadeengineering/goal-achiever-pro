'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, BookOpen, DollarSign, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

interface ScorecardProps {
  leverageItemCount: number;
  networkTouchCount: number;
  productionTrend: number[]; // last 5 weeks of production hours
}

function TrendIcon({ value }: { value: number }) {
  if (value > 0) return <TrendingUp className="h-3 w-3 text-emerald-400" />;
  if (value < 0) return <TrendingDown className="h-3 w-3 text-rose-400" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

function MiniSparkline({ values }: { values: number[] }) {
  if (values.length === 0) {
    return <span className="text-xs text-muted-foreground">No data</span>;
  }

  const max = Math.max(...values, 1);
  const barWidth = 100 / values.length;

  return (
    <div className="flex items-end gap-0.5 h-6">
      {values.map((val, i) => {
        const height = max > 0 ? (val / max) * 100 : 0;
        const isLast = i === values.length - 1;
        return (
          <div
            key={i}
            className={`rounded-sm transition-all ${
              isLast ? 'bg-emerald-500' : 'bg-emerald-500/40'
            }`}
            style={{
              width: `${barWidth}%`,
              height: `${Math.max(height, 8)}%`,
              minWidth: '4px',
            }}
          />
        );
      })}
    </div>
  );
}

export function Scorecard({ leverageItemCount, networkTouchCount, productionTrend }: ScorecardProps) {
  // Calculate production trend direction
  const trendDirection =
    productionTrend.length >= 2
      ? productionTrend[productionTrend.length - 1] - productionTrend[productionTrend.length - 2]
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Scorecard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Leverage items */}
        <Link href={ROUTES.leverage} className="flex items-center justify-between group">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-violet-500/10">
              <Code className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <span className="text-sm group-hover:underline">Leverage items</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {leverageItemCount}
          </Badge>
        </Link>

        {/* Network touches */}
        <Link href={ROUTES.network} className="flex items-center justify-between group">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-500/10">
              <Users className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <span className="text-sm group-hover:underline">Network contacts</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {networkTouchCount}
          </Badge>
        </Link>

        {/* Production trend sparkline */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Production trend</span>
            <div className="flex items-center gap-1">
              <TrendIcon value={trendDirection} />
              <span className="text-xs text-muted-foreground">5 weeks</span>
            </div>
          </div>
          <MiniSparkline values={productionTrend} />
        </div>
      </CardContent>
    </Card>
  );
}
