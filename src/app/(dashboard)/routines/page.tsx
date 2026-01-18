'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Sun,
  Moon,
  Clock,
  Play,
  CheckCircle2,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { ShareButton } from '@/components/features/sharing';

interface RoutineStep {
  id: string;
  title: string;
  durationMinutes: number;
  completed: boolean;
}

interface Routine {
  id: string;
  name: string;
  type: 'morning' | 'evening' | 'custom';
  description: string;
  steps: RoutineStep[];
  isActive: boolean;
}

interface Completion {
  id: string;
  routineId: string;
  date: string;
  stepsCompleted: string[];
  completionPercentage: number;
}

const today = new Date().toISOString().split('T')[0];

// Fetch routines
async function fetchRoutines(): Promise<Routine[]> {
  const response = await fetch('/api/routines');
  if (!response.ok) {
    throw new Error('Failed to fetch routines');
  }
  return response.json();
}

// Fetch today's completions
async function fetchCompletions(): Promise<Completion[]> {
  const response = await fetch(`/api/routines/completions?date=${today}`);
  if (!response.ok) {
    throw new Error('Failed to fetch completions');
  }
  return response.json();
}

// Toggle step completion
async function toggleStepCompletion(data: {
  routineId: string;
  stepId: string;
  completed: boolean;
  totalSteps: number;
}): Promise<Completion> {
  const response = await fetch('/api/routines/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routineId: data.routineId,
      date: today,
      stepId: data.stepId,
      completed: data.completed,
      totalSteps: data.totalSteps,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to toggle step');
  }
  return response.json();
}

// Reset routine completions
async function resetRoutineCompletions(data: {
  routineId: string;
  totalSteps: number;
}): Promise<Completion> {
  const response = await fetch('/api/routines/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routineId: data.routineId,
      date: today,
      stepsCompleted: [],
      totalSteps: data.totalSteps,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to reset routine');
  }
  return response.json();
}

export default function RoutinesPage() {
  const queryClient = useQueryClient();
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);

  // Fetch routines
  const { data: routines = [], isLoading: routinesLoading } = useQuery({
    queryKey: ['routines'],
    queryFn: fetchRoutines,
  });

  // Fetch today's completions
  const { data: completions = [], isLoading: completionsLoading } = useQuery({
    queryKey: ['routineCompletions', today],
    queryFn: fetchCompletions,
  });

  // Toggle step mutation
  const toggleMutation = useMutation({
    mutationFn: toggleStepCompletion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routineCompletions', today] });
    },
  });

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: resetRoutineCompletions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routineCompletions', today] });
    },
  });

  // Get completion for a routine
  const getCompletion = (routineId: string) => {
    return completions.find(c => c.routineId === routineId);
  };

  // Check if a step is completed
  const isStepCompleted = (routineId: string, stepId: string) => {
    const completion = getCompletion(routineId);
    return completion?.stepsCompleted?.includes(stepId) || false;
  };

  // Merge routines with completion state
  const routinesWithCompletions = routines.map(routine => ({
    ...routine,
    steps: routine.steps.map(step => ({
      ...step,
      completed: isStepCompleted(routine.id, step.id),
    })),
  }));

  const toggleStep = (routineId: string, stepId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    const isCompleted = isStepCompleted(routineId, stepId);
    toggleMutation.mutate({
      routineId,
      stepId,
      completed: !isCompleted,
      totalSteps: routine.steps.length,
    });
  };

  const resetRoutine = (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    resetMutation.mutate({
      routineId,
      totalSteps: routine.steps.length,
    });
  };

  const getRoutineProgress = (routine: Routine) => {
    const completion = getCompletion(routine.id);
    if (completion) {
      return completion.completionPercentage;
    }
    const completed = routine.steps.filter(s => s.completed).length;
    return Math.round((completed / routine.steps.length) * 100);
  };

  const getTotalDuration = (routine: Routine) => {
    return routine.steps.reduce((sum, step) => sum + step.durationMinutes, 0);
  };

  const getRoutineIcon = (type: string) => {
    switch (type) {
      case 'morning':
        return Sun;
      case 'evening':
        return Moon;
      default:
        return Clock;
    }
  };

  const isLoading = routinesLoading || completionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Routines"
        description="Build consistent habits with morning and evening routines"
        actions={
          <div className="flex items-center gap-2">
            <ShareButton tabName="routines" />
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Routine
            </Button>
          </div>
        }
      />

      {/* Today's Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Today&apos;s Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {routinesWithCompletions.filter(r => r.isActive).map(routine => {
              const progress = getRoutineProgress(routine);
              const Icon = getRoutineIcon(routine.type);
              return (
                <div key={routine.id} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{routine.name}</span>
                  </div>
                  <div className="text-2xl font-bold">{progress}%</div>
                  <Progress value={progress} className="h-2 mt-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Routines Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {routinesWithCompletions.map(routine => {
          const Icon = getRoutineIcon(routine.type);
          const progress = getRoutineProgress(routine);
          const isActive = activeRoutineId === routine.id;

          return (
            <Card key={routine.id} className={isActive ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      routine.type === 'morning' ? 'bg-amber-100 text-amber-700' :
                      routine.type === 'evening' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{routine.name}</CardTitle>
                      <CardDescription>{routine.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={progress === 100 ? 'default' : 'secondary'}>
                    {progress === 100 ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Complete</>
                    ) : (
                      <><Clock className="h-3 w-3 mr-1" /> {getTotalDuration(routine)} min</>
                    )}
                  </Badge>
                </div>
                <Progress value={progress} className="mt-3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {routine.steps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        step.completed ? 'bg-cyan-50' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={step.completed}
                        onCheckedChange={() => toggleStep(routine.id, step.id)}
                        className="h-5 w-5"
                        disabled={toggleMutation.isPending}
                      />
                      <div className="flex-1">
                        <span className={step.completed ? 'line-through text-muted-foreground' : ''}>
                          {step.title}
                        </span>
                      </div>
                      {step.durationMinutes > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {step.durationMinutes} min
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  {!isActive ? (
                    <Button
                      className="flex-1"
                      onClick={() => setActiveRoutineId(routine.id)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Routine
                    </Button>
                  ) : (
                    <Button
                      className="flex-1"
                      variant="secondary"
                      onClick={() => setActiveRoutineId(null)}
                    >
                      Pause
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => resetRoutine(routine.id)}
                    title="Reset routine"
                    disabled={resetMutation.isPending}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Routine Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Morning:</strong> Don&apos;t check your phone for the first hour. Start with your most important task.</p>
          <p><strong>Evening:</strong> Review your day, celebrate wins, and set up tomorrow for success.</p>
          <p><strong>Consistency:</strong> The power is in doing it daily, not perfectly. Progress over perfection.</p>
          <div className="pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={ROUTES.pomodoro}>
                <Clock className="h-4 w-4 mr-2" />
                Start a Pomodoro
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
