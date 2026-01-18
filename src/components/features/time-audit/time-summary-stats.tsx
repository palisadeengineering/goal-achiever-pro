'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Clock, Zap, AlertTriangle, TrendingUp } from 'lucide-react';

interface TimeSummaryStatsProps {
  totalMinutes: number;
  productionPercent: number;
  delegationCandidates: number;
  energyBalance: number; // -100 to +100
}

export function TimeSummaryStats({
  totalMinutes,
  productionPercent,
  delegationCandidates,
  energyBalance,
}: TimeSummaryStatsProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getEnergyLabel = (balance: number) => {
    if (balance >= 30) return { label: 'High Energy', color: 'text-cyan-600' };
    if (balance >= 0) return { label: 'Balanced', color: 'text-yellow-600' };
    if (balance >= -30) return { label: 'Low Energy', color: 'text-orange-600' };
    return { label: 'Draining', color: 'text-red-600' };
  };

  const energyInfo = getEnergyLabel(energyBalance);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Time</span>
          </div>
          <p className="text-2xl font-bold mt-1">{formatTime(totalMinutes)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-600" />
            <span className="text-sm text-muted-foreground">Production</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-cyan-600">{productionPercent}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-muted-foreground">To Delegate</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-purple-600">{delegationCandidates}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Energy</span>
          </div>
          <p className={`text-2xl font-bold mt-1 ${energyInfo.color}`}>
            {energyInfo.label}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
