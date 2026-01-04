'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { VisionWizard, type VisionWizardData } from '@/components/features/vision/vision-wizard';
import { VisionPageHeader } from '@/components/features/vision/vision-page-header';
import { VisionGridView } from '@/components/features/vision/vision-grid-view';
import { VisionKanbanView } from '@/components/features/vision/vision-kanban-view';
import { VisionActivityHeatmap } from '@/components/features/vision/vision-activity-heatmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useUIStore } from '@/lib/stores/ui-store';
import {
  saveAllWithErrorHandling,
  formatSaveFailures,
  type SaveResult,
} from '@/lib/utils/save-with-retry';

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
  const router = useRouter();
  const { visionViewMode, setVisionViewMode } = useUIStore();
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
        middayReminder: false,
        middayTime: '12:00',
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

      // Track all secondary save operations
      const saveFailures: SaveResult[] = [];

      // Save non-negotiables if any (with error tracking)
      if (data.nonNegotiables.length > 0) {
        const newNonNegotiables = data.nonNegotiables.filter(nn => !nn.id);

        if (newNonNegotiables.length > 0) {
          const { failures } = await saveAllWithErrorHandling(
            newNonNegotiables.map(nn => ({
              operation: () => fetch('/api/non-negotiables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  visionId: savedVisionId,
                  title: nn.title,
                  description: nn.description,
                  frequency: nn.frequency,
                  targetCount: nn.targetCount,
                }),
              }),
              resourceName: `Non-negotiable: ${nn.title}`,
            }))
          );
          saveFailures.push(...failures);
        }
      }

      // Save vision board images to Supabase Storage (with error tracking)
      if (data.boardImages.length > 0) {
        const newImages = data.boardImages.filter(img => img.file);

        if (newImages.length > 0) {
          const { failures } = await saveAllWithErrorHandling(
            newImages.map((image, index) => ({
              operation: () => {
                const formData = new FormData();
                formData.append('file', image.file!);
                if (image.caption) formData.append('caption', image.caption);
                formData.append('isCover', (image.isCover || false).toString());

                return fetch(`/api/visions/${savedVisionId}/board`, {
                  method: 'POST',
                  body: formData,
                });
              },
              resourceName: `Image ${index + 1}`,
              options: { maxRetries: 1 }, // Retry once for image uploads
            }))
          );
          saveFailures.push(...failures);
        }
      }

      // TODO: Save review reminders

      // Show appropriate success/warning message
      if (saveFailures.length === 0) {
        toast.success(isUpdate ? 'Vision updated!' : 'Vision created!');
      } else {
        // Vision saved but some items failed
        toast.warning(
          isUpdate ? 'Vision updated with some issues' : 'Vision created with some issues',
          {
            description: formatSaveFailures(saveFailures),
            duration: 6000,
          }
        );
      }

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

  const handleViewDetails = (visionId: string) => {
    router.push(`/vision/${visionId}`);
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
          onDelete={fetchVisions}
        />
      </div>
    );
  }

  // List Mode
  return (
    <div className="space-y-6">
      <VisionPageHeader
        viewMode={visionViewMode}
        onViewModeChange={setVisionViewMode}
        onCreateNew={handleCreateNew}
      />

      {/* Activity Heat Map */}
      {visions.length > 0 && (
        <VisionActivityHeatmap />
      )}

      {visionViewMode === 'grid' ? (
        <VisionGridView
          visions={visions}
          backtrackPlans={backtrackPlans}
          onEditVision={handleEditVision}
          onCreateNew={handleCreateNew}
        />
      ) : (
        <VisionKanbanView
          visions={visions}
          backtrackPlans={backtrackPlans}
          onEditVision={handleEditVision}
          onViewDetails={handleViewDetails}
          onCreateNew={handleCreateNew}
        />
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
