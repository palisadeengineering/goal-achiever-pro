'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { SmartGoalEditor } from '@/components/features/vision/smart-goal-editor';
import { ThreeHundredPercentTracker } from '@/components/features/vision/three-hundred-percent-tracker';
import { AIProjectPlanner } from '@/components/features/vision/ai-project-planner';
import { KPIAccountabilitySystem } from '@/components/features/vision/kpi-accountability-system';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Target, Trophy, Clock, Loader2, Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { toast } from 'sonner';

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
}

// Mock power goals - will be replaced with actual data
const mockPowerGoals = [
  { id: '1', title: 'Launch flagship course', progress: 65, quarter: 'Q1' },
  { id: '2', title: 'Build email list to 10K', progress: 45, quarter: 'Q1' },
  { id: '3', title: 'Hire virtual assistant', progress: 100, quarter: 'Q1' },
  { id: '4', title: 'Create content system', progress: 30, quarter: 'Q2' },
];

export default function VisionPage() {
  const [visions, setVisions] = useState<Vision[]>([]);
  const [activeVision, setActiveVision] = useState<Vision | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const completedGoals = mockPowerGoals.filter(g => g.progress === 100).length;

  // Fetch visions on mount
  const fetchVisions = useCallback(async () => {
    try {
      const response = await fetch('/api/visions');
      if (!response.ok) {
        throw new Error('Failed to fetch visions');
      }
      const data = await response.json();
      setVisions(data.visions || []);

      // Set active vision (first one is active due to sort order)
      const active = data.visions?.find((v: Vision) => v.is_active) || data.visions?.[0] || null;
      setActiveVision(active);
    } catch (error) {
      console.error('Error fetching visions:', error);
      toast.error('Failed to load your vision. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisions();
  }, [fetchVisions]);

  const handleVisionSave = async (data: {
    title: string;
    description: string;
    specific: string;
    measurable: string;
    attainable: string;
    realistic: string;
    timeBound: Date | null;
  }, powerGoals?: Array<{
    title: string;
    description: string;
    quarter: number;
    category: string;
    metrics: string[];
  }>) => {
    setIsSaving(true);

    try {
      const isUpdate = activeVision?.id;
      const endpoint = '/api/visions';
      const method = isUpdate ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeVision?.id,
          title: data.title,
          description: data.description,
          specific: data.specific,
          measurable: data.measurable,
          attainable: data.attainable,
          realistic: data.realistic,
          timeBound: data.timeBound?.toISOString().split('T')[0],
          clarityScore: activeVision?.clarity_score || 0,
          beliefScore: activeVision?.belief_score || 0,
          consistencyScore: activeVision?.consistency_score || 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save vision');
      }

      const result = await response.json();
      const savedVisionId = result.vision.id;

      // Save power goals if they were generated
      if (powerGoals && powerGoals.length > 0 && savedVisionId) {
        try {
          const powerGoalsResponse = await fetch('/api/power-goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              visionId: savedVisionId,
              powerGoals: powerGoals.map((goal) => ({
                title: goal.title,
                description: goal.description,
                quarter: goal.quarter,
                category: goal.category,
              })),
            }),
          });

          if (powerGoalsResponse.ok) {
            const pgResult = await powerGoalsResponse.json();
            toast.success(`Vision saved with ${pgResult.saved} Power Goals!`);
          } else {
            toast.success('Vision saved! (Power Goals failed to save)');
          }
        } catch (pgError) {
          console.error('Error saving power goals:', pgError);
          toast.success('Vision saved! (Power Goals failed to save)');
        }
      } else {
        toast.success('Your vision has been saved successfully.');
      }

      // Update local state
      setActiveVision(result.vision);

      // Refresh visions list
      await fetchVisions();
    } catch (error) {
      console.error('Error saving vision:', error);
      toast.error('Failed to save your vision. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handle300PercentUpdate = async (scores: { clarity: number; belief: number; consistency: number }) => {
    if (!activeVision?.id) return;

    try {
      const response = await fetch('/api/visions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeVision.id,
          title: activeVision.title,
          clarityScore: scores.clarity,
          beliefScore: scores.belief,
          consistencyScore: scores.consistency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update scores');
      }

      const result = await response.json();
      setActiveVision(result.vision);
    } catch (error) {
      console.error('Error updating 300% scores:', error);
    }
  };

  // Convert DB vision to editor format
  const visionForEditor = activeVision ? {
    title: activeVision.title,
    description: activeVision.description || '',
    specific: activeVision.specific || '',
    measurable: activeVision.measurable || '',
    attainable: activeVision.attainable || '',
    realistic: activeVision.realistic || '',
    timeBound: activeVision.time_bound ? new Date(activeVision.time_bound) : null,
  } : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleCreateNewVision = () => {
    setActiveVision(null);
  };

  const handleSelectVision = (visionId: string) => {
    if (visionId === 'new') {
      handleCreateNewVision();
    } else {
      const selected = visions.find((v) => v.id === visionId);
      if (selected) {
        setActiveVision(selected);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Vision"
          description="Your north star - the big picture goal that guides everything"
        />
        {visions.length > 0 && (
          <div className="flex items-center gap-2">
            <Select
              value={activeVision?.id || 'new'}
              onValueChange={handleSelectVision}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a vision">
                  {activeVision ? (
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="truncate">{activeVision.title}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>New Vision</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Vision
                  </div>
                </SelectItem>
                {visions.map((vision) => (
                  <SelectItem key={vision.id} value={vision.id}>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="truncate max-w-[200px]">{vision.title}</span>
                      {vision.is_active && (
                        <Badge variant="secondary" className="text-xs ml-1">Active</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Vision Editor */}
        <div className="lg:col-span-2 space-y-6">
          <SmartGoalEditor
            initialData={visionForEditor}
            onSave={handleVisionSave}
            isSaving={isSaving}
            visionId={activeVision?.id}
          />

          {/* KPI Accountability System - only show if vision exists */}
          {activeVision && (
            <KPIAccountabilitySystem
              vision={activeVision.title}
              smartGoals={{
                specific: activeVision.specific || '',
                measurable: activeVision.measurable || '',
                attainable: activeVision.attainable || '',
                realistic: activeVision.realistic || '',
              }}
              targetDate={activeVision.time_bound ? new Date(activeVision.time_bound) : null}
              onAddToCalendar={(kpis) => {
                // TODO: Implement calendar integration
                console.log('Add to calendar:', kpis);
                toast.success('KPIs will be synced to your calendar soon!');
              }}
            />
          )}

          {/* AI Project Planner - only show if vision exists */}
          {activeVision && (
            <AIProjectPlanner
              vision={activeVision.title}
              visionId={activeVision.id}
              smartGoals={{
                specific: activeVision.specific || '',
                measurable: activeVision.measurable || '',
                attainable: activeVision.attainable || '',
                realistic: activeVision.realistic || '',
              }}
              targetDate={activeVision.time_bound ? new Date(activeVision.time_bound) : null}
            />
          )}

          {/* Power Goals Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Power Goals
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href={ROUTES.goals}>
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  12 annual projects aligned with your vision
                </p>
                <Badge variant="secondary">
                  {completedGoals}/12 Complete
                </Badge>
              </div>

              <div className="space-y-3">
                {mockPowerGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{goal.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {goal.quarter}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10">
                          {goal.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full mt-4" asChild>
                <Link href={ROUTES.goalNew}>
                  Add Power Goal
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 300% Tracker & Tips */}
        <div className="space-y-6">
          <ThreeHundredPercentTracker
            clarity={activeVision?.clarity_score || 0}
            belief={activeVision?.belief_score || 0}
            consistency={activeVision?.consistency_score || 0}
            onUpdate={handle300PercentUpdate}
          />

          {/* Daily Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Daily Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Review your vision 3 times daily to maintain clarity and focus:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">Morning</span>
                  <Badge variant="outline">6:00 AM</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">Midday</span>
                  <Badge variant="outline">12:00 PM</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">Evening</span>
                  <Badge variant="outline">8:00 PM</Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href={ROUTES.reviews}>
                  Start Review
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pro Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Set your vision as your phone and laptop wallpaper
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Print it out and put it where you&apos;ll see it daily
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Visualize the outcome in detail - your mind thinks in pictures
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Ask daily: &quot;Does this move me toward my vision?&quot;
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
