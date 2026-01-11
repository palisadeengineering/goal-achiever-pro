'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, Check, X, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { VisionStep } from './wizard-steps/vision-step';
import { SmartGoalStep } from './wizard-steps/smart-goal-step';
import { StrategicDiscoveryStep } from './wizard-steps/strategic-discovery-step';
import { MonthlyProjectsStep } from './wizard-steps/monthly-projects-step';
import { RemindersStep } from './wizard-steps/reminders-step';
import { VisionBoardStep } from './wizard-steps/vision-board-step';
import { AffirmationsStep } from './wizard-steps/affirmations-step';
import { ReviewStep } from './wizard-steps/review-step';
import type { StrategicDiscoveryData } from '@/types/strategic-discovery';

export interface MonthlyProject {
  month: number;
  monthName: string;
  year: number;
  title: string;
  description: string;
  keyMilestone: string;
  successMetric: string;
  targetValue?: string;
}

export interface VisionWizardData {
  // Step 1: Vision
  title: string;
  description: string;
  targetDate: string;
  color: string;

  // Step 2: SMART Goals
  specific: string;
  measurable: string;
  attainable: string;
  realistic: string;
  timeBound: string;

  // Step 3: Non-Negotiables
  nonNegotiables: Array<{
    id?: string;
    title: string;
    description?: string;
    frequency: 'daily' | 'weekdays' | 'weekends';
    targetCount: number;
  }>;

  // Step 4: Reminders
  reminders: {
    showOnLogin: boolean;
    morningReminder: boolean;
    morningTime: string;
    middayReminder: boolean;
    middayTime: string;
    eveningReminder: boolean;
    eveningTime: string;
  };

  // Step 5: Vision Board Images
  boardImages: Array<{
    id?: string;
    file?: File;
    preview?: string;
    caption?: string;
    isCover?: boolean;
  }>;

  // Step 6: Affirmations
  affirmationText: string;

  // Monthly Projects (AI-generated)
  monthlyProjects?: MonthlyProject[];
  projectsSummary?: string;
  criticalPath?: string[];

  // Strategic Discovery Data
  strategicDiscovery?: StrategicDiscoveryData;

  // 300% Scores (from existing vision or defaults)
  clarityScore: number;
  beliefScore: number;
  consistencyScore: number;
}

const INITIAL_DATA: VisionWizardData = {
  title: '',
  description: '',
  targetDate: '',
  color: '#6366f1',
  specific: '',
  measurable: '',
  attainable: '',
  realistic: '',
  timeBound: '',
  nonNegotiables: [],
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
  affirmationText: '',
  clarityScore: 50,
  beliefScore: 50,
  consistencyScore: 50,
};

const STEPS = [
  { id: 'vision', title: 'Vision', description: 'Define your vision statement' },
  { id: 'smart', title: 'SMART Goals', description: 'Break down your vision' },
  { id: 'strategic-discovery', title: 'Strategy', description: 'Revenue, positioning & acquisition' },
  { id: 'monthly-projects', title: 'Roadmap', description: 'AI-generated monthly projects' },
  { id: 'reminders', title: 'Reminders', description: 'Review reminder settings' },
  { id: 'vision-board', title: 'Vision Board', description: 'Add inspiring images' },
  { id: 'affirmations', title: 'Affirmations', description: 'Daily affirmation text' },
  { id: 'review', title: 'Review', description: 'Review and save' },
];

interface VisionWizardProps {
  visionId?: string | null;
  initialData?: Partial<VisionWizardData>;
  onComplete: (data: VisionWizardData, visionId?: string) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}

export function VisionWizard({
  visionId,
  initialData,
  onComplete,
  onCancel,
  onDelete,
}: VisionWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<VisionWizardData>({
    ...INITIAL_DATA,
    ...initialData,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!visionId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/visions/${visionId}?hard=true`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete vision');
      }

      toast.success('Vision deleted successfully');
      onDelete?.();
      onCancel();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete vision');
    } finally {
      setIsDeleting(false);
    }
  }, [visionId, onDelete, onCancel]);

  const updateData = useCallback((updates: Partial<VisionWizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const goToNextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(async () => {
    setIsSaving(true);
    try {
      await onComplete(data, visionId || undefined);
      // Success - wizard will be closed by parent
    } catch (error) {
      console.error('Failed to save vision:', error);
      // Error toast is already shown by parent, but ensure button resets
      setIsSaving(false);
    }
  }, [data, visionId, onComplete]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const currentStepInfo = STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  const renderStep = () => {
    switch (currentStepInfo.id) {
      case 'vision':
        return <VisionStep data={data} updateData={updateData} />;
      case 'smart':
        return <SmartGoalStep data={data} updateData={updateData} />;
      case 'strategic-discovery':
        return <StrategicDiscoveryStep data={data} updateData={updateData} />;
      case 'monthly-projects':
        return <MonthlyProjectsStep data={data} updateData={updateData} />;
      case 'reminders':
        return <RemindersStep data={data} updateData={updateData} />;
      case 'vision-board':
        return <VisionBoardStep data={data} updateData={updateData} />;
      case 'affirmations':
        return <AffirmationsStep data={data} updateData={updateData} />;
      case 'review':
        return <ReviewStep data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{visionId ? 'Edit Vision' : 'Create Vision'}</h2>
            <p className="text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}: {currentStepInfo.title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Delete button - only show in edit mode */}
            {visionId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Vision?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>This will permanently delete <strong>&quot;{data.title || 'this vision'}&quot;</strong> and all associated data:</p>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        <li>Backtrack plans and quarterly targets</li>
                        <li>Power goals and monthly/weekly targets</li>
                        <li>Daily actions and calendar events</li>
                        <li>KPIs and tracking history</li>
                        <li>Non-negotiables and streaks</li>
                        <li>Vision board images</li>
                        <li>Affirmations and reminders</li>
                      </ul>
                      <p className="font-medium text-destructive">This action cannot be undone.</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Vision'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        {/* Step Indicators */}
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`flex flex-col items-center min-w-[80px] px-2 ${
                index === currentStep
                  ? 'text-primary'
                  : index < currentStep
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                  index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-xs text-center">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepInfo.title}</CardTitle>
          <CardDescription>{currentStepInfo.description}</CardDescription>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goToPrevStep}
          disabled={isFirstStep}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {isLastStep ? (
          <Button onClick={handleComplete} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Vision'}
            <Check className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={goToNextStep}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
