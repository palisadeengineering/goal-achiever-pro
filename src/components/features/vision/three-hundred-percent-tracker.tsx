'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Target, Brain, Flame, Sparkles } from 'lucide-react';

interface ThreeHundredPercentTrackerProps {
  clarity: number;
  belief: number;
  consistency: number;
  onUpdate?: (values: { clarity: number; belief: number; consistency: number }) => void;
  readonly?: boolean;
}

export function ThreeHundredPercentTracker({
  clarity: initialClarity,
  belief: initialBelief,
  consistency: initialConsistency,
  onUpdate,
  readonly = false,
}: ThreeHundredPercentTrackerProps) {
  const [clarity, setClarity] = useState(initialClarity);
  const [belief, setBelief] = useState(initialBelief);
  const [consistency, setConsistency] = useState(initialConsistency);
  const [isEditing, setIsEditing] = useState(false);

  // Sync with prop changes (e.g., when data loads from DB)
  // This pattern is intentional for semi-controlled components
  useEffect(() => {
    setClarity(initialClarity); // eslint-disable-line react-hooks/set-state-in-effect
    setBelief(initialBelief); // eslint-disable-line react-hooks/set-state-in-effect
    setConsistency(initialConsistency); // eslint-disable-line react-hooks/set-state-in-effect
  }, [initialClarity, initialBelief, initialConsistency]);

  const totalScore = clarity + belief + consistency;
  const percentage = Math.round((totalScore / 300) * 100);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-cyan-600 dark:text-cyan-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getTotalColor = () => {
    if (totalScore >= 240) return 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20';
    if (totalScore >= 180) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    if (totalScore >= 120) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  };

  const handleSave = () => {
    onUpdate?.({ clarity, belief, consistency });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setClarity(initialClarity);
    setBelief(initialBelief);
    setConsistency(initialConsistency);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              300% Rule
            </CardTitle>
            <CardDescription>
              Clarity + Belief + Consistency = Achievement
            </CardDescription>
          </div>
          {!readonly && !isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Update
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Score Display */}
        <div className={cn('p-6 rounded-xl text-center', getTotalColor())}>
          <p className="text-sm font-medium mb-1">Combined Score</p>
          <p className="text-5xl font-bold">{totalScore}%</p>
          <p className="text-sm mt-2">
            {totalScore >= 270
              ? '🔥 You\'re on fire! Keep it up!'
              : totalScore >= 240
              ? '✨ Excellent! Stay focused!'
              : totalScore >= 180
              ? '💪 Good progress. Push harder!'
              : totalScore >= 120
              ? '⚡ Building momentum...'
              : '🎯 Time to level up!'}
          </p>
        </div>

        {/* Individual Metrics */}
        <div className="space-y-6">
          {/* Clarity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium">Clarity</span>
              </div>
              <span className={cn('font-bold', getScoreColor(clarity))}>
                {clarity}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              How clear is your vision? Can you see your goal vividly?
            </p>
            {isEditing ? (
              <Slider
                value={[clarity]}
                onValueChange={([value]) => setClarity(value)}
                max={100}
                step={5}
                className="py-2"
              />
            ) : (
              <Progress value={clarity} className="h-3" />
            )}
          </div>

          {/* Belief */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="font-medium">Belief</span>
              </div>
              <span className={cn('font-bold', getScoreColor(belief))}>
                {belief}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              How much do you believe you can achieve this goal?
            </p>
            {isEditing ? (
              <Slider
                value={[belief]}
                onValueChange={([value]) => setBelief(value)}
                max={100}
                step={5}
                className="py-2"
              />
            ) : (
              <Progress value={belief} className="h-3" />
            )}
          </div>

          {/* Consistency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="font-medium">Consistency</span>
              </div>
              <span className={cn('font-bold', getScoreColor(consistency))}>
                {consistency}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              How consistently are you taking action towards your goal?
            </p>
            {isEditing ? (
              <Slider
                value={[consistency]}
                onValueChange={([value]) => setConsistency(value)}
                max={100}
                step={5}
                className="py-2"
              />
            ) : (
              <Progress value={consistency} className="h-3" />
            )}
          </div>
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        )}

        {/* Tips */}
        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
          <p className="text-sm font-medium">How to increase your score:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>Clarity:</strong> Visualize your goal daily. Set it as your phone wallpaper.</li>
            <li>• <strong>Belief:</strong> Review past wins. Surround yourself with supporters.</li>
            <li>• <strong>Consistency:</strong> Take at least one action daily. Stack habits.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
