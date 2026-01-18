'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Flame, Loader2, Clock, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Kpi {
  id: string;
  title: string;
  description?: string;
  target_value?: string;
  unit?: string;
  numeric_target?: number;
  tracking_method: string;
  best_time?: string;
  time_required?: string;
}

interface KpiLog {
  id: string;
  kpi_id: string;
  log_date: string;
  value?: number;
  is_completed: boolean;
  completion_count?: number;
  notes?: string;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_completed_date?: string;
}

interface DailyKpiCheckoffProps {
  kpi: Kpi;
  log?: KpiLog;
  streak?: StreakData;
  date: string;
  onLogChange: (kpiId: string, log: KpiLog) => void;
}

export function DailyKpiCheckoff({
  kpi,
  log,
  streak,
  date,
  onLogChange,
}: DailyKpiCheckoffProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState<string>(log?.value?.toString() || '');

  const isCompleted = log?.is_completed || false;

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/vision-kpis/${kpi.id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          isCompleted: !isCompleted,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      const data = await response.json();
      onLogChange(kpi.id, data.log);
    } catch (error) {
      console.error('Error toggling KPI:', error);
      toast.error('Failed to update KPI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueSubmit = async () => {
    if (!inputValue) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/vision-kpis/${kpi.id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          value: parseFloat(inputValue),
          isCompleted: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      const data = await response.json();
      onLogChange(kpi.id, data.log);
      toast.success('Value logged!');
    } catch (error) {
      console.error('Error logging value:', error);
      toast.error('Failed to log value');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border transition-colors',
        isCompleted
          ? 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800'
          : 'bg-background'
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        {kpi.tracking_method === 'checkbox' ? (
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleToggle}
            disabled={isLoading}
            className="h-5 w-5"
          />
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder={kpi.target_value || '0'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-20 h-8"
              disabled={isLoading}
            />
            {kpi.unit && <span className="text-sm text-muted-foreground">{kpi.unit}</span>}
            <Button
              size="sm"
              variant={isCompleted ? 'secondary' : 'default'}
              onClick={handleValueSubmit}
              disabled={isLoading || !inputValue}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : 'Log'}
            </Button>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'font-medium',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {kpi.title}
          </div>
          {kpi.description && (
            <p className="text-xs text-muted-foreground truncate">{kpi.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {kpi.best_time && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {kpi.best_time}
              </Badge>
            )}
            {kpi.time_required && (
              <span className="text-xs text-muted-foreground">{kpi.time_required}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {streak && streak.current_streak > 0 && (
          <Badge variant="outline" className="gap-1">
            <Flame className="h-3 w-3 text-orange-500" />
            {streak.current_streak}
          </Badge>
        )}
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
    </div>
  );
}
