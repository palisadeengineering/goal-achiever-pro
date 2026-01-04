'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { VisionWizard, type VisionWizardData } from '@/components/features/vision/vision-wizard';
import { ThreeHundredPercentTracker } from '@/components/features/vision/three-hundred-percent-tracker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Plus, Eye, GitBranch, Edit, ArrowRight, Target,
  ListChecks, Image, Quote, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

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

export default function VisionPage() {
  const [visions, setVisions] = useState<Vision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'wizard'>('list');
  const [editingVisionId, setEditingVisionId] = useState<string | null>(null);
  const [backtrackPlans, setBacktrackPlans] = useState<BacktrackPlan[]>([]);

  // Fetch visions
  const fetchVisions = useCallback(async () => {
    try {
      const response = await fetch('/api/visions');
      if (!response.ok) throw new Error('Failed to fetch visions');
      const data = await response.json();
      setVisions(data.visions || []);
    } catch (error) {
      console.error('Error fetching visions:', error);
      toast.error('Failed to load visions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch backtrack plans
  const fetchBacktrackPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/backtrack');
      if (response.ok) {
        const data = await response.json();
        setBacktrackPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching backtrack plans:', error);
    }
  }, []);

  useEffect(() => {
    fetchVisions();
    fetchBacktrackPlans();
  }, [fetchVisions, fetchBacktrackPlans]);

  const getEditingVision = () => {
    if (!editingVisionId) return null;
    return visions.find(v => v.id === editingVisionId) || null;
  };

  const getInitialWizardData = (): Partial<VisionWizardData> | undefined => {
    const vision = getEditingVision();
    if (!vision) return undefined;

    return {
      title: vision.title,
      description: vision.description || '',
      targetDate: vision.time_bound || '',
      color: vision.color || '#6366f1',
      specific: vision.specific || '',
      measurable: vision.measurable || '',
      attainable: vision.attainable || '',
      realistic: vision.realistic || '',
      timeBound: vision.time_bound || '',
      clarityScore: vision.clarity_score || 50,
      beliefScore: vision.belief_score || 50,
      consistencyScore: vision.consistency_score || 50,
      affirmationText: vision.affirmation_text || '',
      nonNegotiables: [], // Will be fetched separately
      reminders: {
        showOnLogin: true,
        morningReminder: true,
        morningTime: '06:00',
        eveningReminder: false,
        eveningTime: '20:00',
      },
      boardImages: [],
    };
  };

  const handleWizardComplete = async (data: VisionWizardData, visionId?: string) => {
    try {
      const isUpdate = !!visionId;
      const endpoint = '/api/visions';
      const method = isUpdate ? 'PUT' : 'POST';

      // Save vision
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: visionId,
          title: data.title,
          description: data.description,
          specific: data.specific,
          measurable: data.measurable,
          attainable: data.attainable,
          realistic: data.realistic,
          timeBound: data.targetDate,
          clarityScore: data.clarityScore,
          beliefScore: data.beliefScore,
          consistencyScore: data.consistencyScore,
          color: data.color,
          affirmationText: data.affirmationText,
        }),
      });

      if (!response.ok) throw new Error('Failed to save vision');

      const result = await response.json();
      const savedVisionId = result.vision.id;

      // Save non-negotiables if any
      if (data.nonNegotiables.length > 0) {
        for (const nn of data.nonNegotiables) {
          if (!nn.id) {
            await fetch('/api/non-negotiables', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                visionId: savedVisionId,
                title: nn.title,
                description: nn.description,
                frequency: nn.frequency,
                targetCount: nn.targetCount,
              }),
            });
          }
        }
      }

      // Save vision board images to Supabase Storage
      if (data.boardImages.length > 0) {
        for (const image of data.boardImages) {
          // Only upload if it's a new file (has a File object)
          if (image.file) {
            const formData = new FormData();
            formData.append('file', image.file);
            if (image.caption) formData.append('caption', image.caption);
            formData.append('isCover', (image.isCover || false).toString());

            await fetch(`/api/visions/${savedVisionId}/board`, {
              method: 'POST',
              body: formData,
            });
          }
        }
      }

      // TODO: Save review reminders

      toast.success(isUpdate ? 'Vision updated!' : 'Vision created!');

      // Reset and refresh
      setMode('list');
      setEditingVisionId(null);
      await fetchVisions();
    } catch (error) {
      console.error('Error saving vision:', error);
      toast.error('Failed to save vision');
      throw error;
    }
  };

  const handleEditVision = (visionId: string) => {
    setEditingVisionId(visionId);
    setMode('wizard');
  };

  const handleCreateNew = () => {
    setEditingVisionId(null);
    setMode('wizard');
  };

  const handleCancelWizard = () => {
    setMode('list');
    setEditingVisionId(null);
  };

  const getVisionBacktrackPlan = (visionId: string) => {
    return backtrackPlans.find(p => p.vision_id === visionId && p.status === 'active');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Wizard Mode
  if (mode === 'wizard') {
    return (
      <div className="max-w-4xl mx-auto">
        <VisionWizard
          visionId={editingVisionId}
          initialData={getInitialWizardData()}
          onComplete={handleWizardComplete}
          onCancel={handleCancelWizard}
        />
      </div>
    );
  }

  // List Mode
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Vision"
          description="Define your north star - the big picture goals that guide everything"
        />
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Vision
        </Button>
      </div>

      {visions.length === 0 ? (
        // Empty State
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Your First Vision</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Define a clear, inspiring vision for your future. Our wizard will guide you
              through setting SMART goals, daily non-negotiables, and more.
            </p>
            <Button onClick={handleCreateNew} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Start Vision Wizard
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Vision Cards Grid
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visions.map((vision) => {
            const threeHundredPercent = vision.clarity_score + vision.belief_score + vision.consistency_score;
            const backtrackPlan = getVisionBacktrackPlan(vision.id);

            return (
              <Card
                key={vision.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleEditVision(vision.id)}
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
                        handleEditVision(vision.id);
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
                      <span className={`text-sm font-semibold ${
                        threeHundredPercent >= 240 ? 'text-green-600' :
                        threeHundredPercent >= 180 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {threeHundredPercent}%
                      </span>
                    </div>
                    <Progress
                      value={threeHundredPercent / 3}
                      className="h-2"
                    />
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {vision.specific && (
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
          })}

          {/* Add New Card */}
          <Card
            className="border-dashed hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center min-h-[280px]"
            onClick={handleCreateNew}
          >
            <CardContent className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="p-3 bg-muted rounded-full">
                <Plus className="h-6 w-6" />
              </div>
              <span className="font-medium">Add Another Vision</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Tips Section */}
      {visions.length > 0 && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Pro Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid md:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Review your visions 3x daily: morning, midday, and evening
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Set your vision as your phone and laptop wallpaper
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Create a backtrack plan to break down into actionable steps
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Daily non-negotiables keep you on track toward your vision
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
