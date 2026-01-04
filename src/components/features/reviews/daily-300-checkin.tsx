'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Check, TrendingUp, Eye, Heart, Target } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ThreeHundredData {
  today: {
    clarity: number;
    belief: number;
    consistency: number;
    total: number;
  } | null;
  weeklyAverage: number | null;
  history: Array<{ date: string; total: number }>;
}

export function Daily300Checkin() {
  const [data, setData] = useState<ThreeHundredData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Local state for editing
  const [clarity, setClarity] = useState(50);
  const [belief, setBelief] = useState(50);
  const [consistency, setConsistency] = useState(50);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/reviews/three-hundred');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);

      // Initialize sliders with today's data if available
      if (result.today) {
        setClarity(result.today.clarity);
        setBelief(result.today.belief);
        setConsistency(result.today.consistency);
      }
    } catch (error) {
      console.error('Error fetching 300% data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSliderChange = (
    setter: (val: number) => void,
    value: number[]
  ) => {
    setter(value[0]);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/reviews/three-hundred', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clarity, belief, consistency }),
      });

      if (!response.ok) throw new Error('Failed to save');

      const result = await response.json();

      setData((prev) => ({
        ...prev!,
        today: {
          clarity,
          belief,
          consistency,
          total: result.total,
        },
      }));

      setHasChanges(false);
      toast.success('300% score saved!');
    } catch (error) {
      console.error('Error saving 300% score:', error);
      toast.error('Failed to save score');
    } finally {
      setIsSaving(false);
    }
  };

  const total = clarity + belief + consistency;

  const getScoreColor = (score: number) => {
    if (score >= 250) return 'text-green-500';
    if (score >= 200) return 'text-emerald-500';
    if (score >= 150) return 'text-yellow-500';
    if (score >= 100) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 270) return 'Outstanding';
    if (score >= 240) return 'Excellent';
    if (score >= 200) return 'Good';
    if (score >= 150) return 'Moderate';
    if (score >= 100) return 'Needs Work';
    return 'Low';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            300% Check-in
          </CardTitle>
          {data?.weeklyAverage && (
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {data.weeklyAverage}% avg
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Score Display */}
        <div className="text-center py-3 bg-muted/30 rounded-lg">
          <div className={cn('text-4xl font-bold', getScoreColor(total))}>
            {total}%
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {getScoreLabel(total)}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          {/* Clarity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-blue-500" />
                Clarity
              </Label>
              <span className="text-sm font-medium">{clarity}%</span>
            </div>
            <Slider
              value={[clarity]}
              onValueChange={(v) => handleSliderChange(setClarity, v)}
              max={100}
              step={5}
              className="[&_[role=slider]]:bg-blue-500"
            />
            <p className="text-xs text-muted-foreground">
              How clear is your vision today?
            </p>
          </div>

          {/* Belief */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <Heart className="h-4 w-4 text-pink-500" />
                Belief
              </Label>
              <span className="text-sm font-medium">{belief}%</span>
            </div>
            <Slider
              value={[belief]}
              onValueChange={(v) => handleSliderChange(setBelief, v)}
              max={100}
              step={5}
              className="[&_[role=slider]]:bg-pink-500"
            />
            <p className="text-xs text-muted-foreground">
              How strongly do you believe you&apos;ll achieve it?
            </p>
          </div>

          {/* Consistency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-purple-500" />
                Consistency
              </Label>
              <span className="text-sm font-medium">{consistency}%</span>
            </div>
            <Slider
              value={[consistency]}
              onValueChange={(v) => handleSliderChange(setConsistency, v)}
              max={100}
              step={5}
              className="[&_[role=slider]]:bg-purple-500"
            />
            <p className="text-xs text-muted-foreground">
              How consistent were your actions today?
            </p>
          </div>
        </div>

        {/* Sparkline (simple visual of history) */}
        {data?.history && data.history.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Last 7 days</span>
            </div>
            <div className="flex items-end gap-1 h-8">
              {data.history.slice(-7).map((day, i) => (
                <div
                  key={day.date}
                  className="flex-1 bg-primary/20 rounded-t"
                  style={{
                    height: `${(day.total / 300) * 100}%`,
                    minHeight: '4px',
                    opacity: 0.4 + (i / 7) * 0.6,
                  }}
                  title={`${day.date}: ${day.total}%`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="w-full"
          variant={hasChanges ? 'default' : 'secondary'}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : data?.today && !hasChanges ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved Today
            </>
          ) : (
            'Save Check-in'
          )}
        </Button>

        {/* Tip */}
        <p className="text-xs text-muted-foreground text-center">
          Review 3x daily: morning, midday, evening
        </p>
      </CardContent>
    </Card>
  );
}
