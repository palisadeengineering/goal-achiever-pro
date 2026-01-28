'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Target,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2,
  GitBranch,
  Save,
  AlertCircle,
  CalendarCheck,
  CalendarPlus,
  ExternalLink,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface Vision {
  id: string;
  title: string;
  description?: string;
  specific?: string;
  measurable?: string;
  attainable?: string;
  realistic?: string;
  time_bound?: string;
  color?: string;
}

interface GeneratedPlan {
  summary: string;
  criticalPath: string[];
  quarterlyTargets: Array<{
    quarter: number;
    title: string;
    description: string;
    keyMetric: string;
    targetValue: number;
    estimatedHours: number;
  }>;
  impactProjects: Array<{
    title: string;
    description: string;
    quarter: number;
    category: string;
    estimatedHours: number;
    milestones: string[];
  }>;
  monthlyTargets: Array<{
    month: number;
    title: string;
    description: string;
    keyMetric: string;
    targetValue: number;
    impactProjectIndex: number;
  }>;
  weeklyTargets: Array<{
    weekNumber: number;
    month: number;
    title: string;
    description: string;
    keyMetric: string;
    targetValue: number;
    monthlyTargetIndex: number;
  }>;
  dailyActions: Array<{
    dayOfWeek: number;
    weekNumber: number;
    month: number;
    title: string;
    description: string;
    estimatedMinutes: number;
    keyMetric: string;
    targetValue: number;
    weeklyTargetIndex: number;
  }>;
  totalWeeks: number;
  totalHours: number;
}

interface BacktrackPlanningWizardProps {
  onComplete: (planId: string) => void;
  onCancel: () => void;
  preselectedVisionId?: string;
}

type WizardStep = 'vision' | 'time' | 'generate' | 'review' | 'confirm';

const STEPS: { id: WizardStep; title: string; description: string }[] = [
  { id: 'vision', title: 'Vision', description: 'Select or create your vision' },
  { id: 'time', title: 'Time', description: 'Set your availability' },
  { id: 'generate', title: 'Generate', description: 'AI creates your plan' },
  { id: 'review', title: 'Review', description: 'Customize your plan' },
  { id: 'confirm', title: 'Confirm', description: 'Save and activate' },
];

const CATEGORY_COLORS: Record<string, string> = {
  business: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
  career: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  health: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200',
  wealth: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  relationships: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200',
  personal: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
};

export function BacktrackPlanningWizard({
  onComplete,
  onCancel,
  preselectedVisionId,
}: BacktrackPlanningWizardProps) {
  // Skip to 'time' step if vision is already preselected
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    preselectedVisionId ? 'time' : 'vision'
  );
  const [visions, setVisions] = useState<Vision[]>([]);
  const [selectedVisionId, setSelectedVisionId] = useState<string | null>(preselectedVisionId || null);
  const [isLoadingVisions, setIsLoadingVisions] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time configuration
  const [availableHoursPerWeek, setAvailableHoursPerWeek] = useState<number>(20);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);

  // Generated plan
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);

  // Calendar sync options
  const [syncToCalendar, setSyncToCalendar] = useState(true);
  const [isCalendarConnected, setIsCalendarConnected] = useState<boolean | null>(null);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [calendarSyncResult, setCalendarSyncResult] = useState<{
    synced: number;
    failed: number;
    total: number;
  } | null>(null);

  // New vision form (if creating)
  const [isCreatingVision, setIsCreatingVision] = useState(false);
  const [newVision, setNewVision] = useState({
    title: '',
    description: '',
    specific: '',
    measurable: '',
    attainable: '',
    realistic: '',
  });

  // Fetch visions on mount
  useEffect(() => {
    fetchVisions();
  }, []);

  // Set end date from selected vision
  useEffect(() => {
    if (selectedVisionId) {
      const vision = visions.find((v) => v.id === selectedVisionId);
      if (vision?.time_bound) {
        setEndDate(parseISO(vision.time_bound));
      }
    }
  }, [selectedVisionId, visions]);

  // Check calendar connection status when reaching confirm step
  useEffect(() => {
    if (currentStep === 'confirm') {
      checkCalendarConnection();
    }
  }, [currentStep]);

  const checkCalendarConnection = async () => {
    try {
      const response = await fetch('/api/calendar/google/status');
      const data = await response.json();
      setIsCalendarConnected(data.connected);
    } catch {
      setIsCalendarConnected(false);
    }
  };

  const handleConnectCalendar = () => {
    // Open Google Calendar OAuth in new window
    window.open('/api/calendar/google', '_blank', 'width=600,height=700');
    // Poll for connection status
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/calendar/google/status');
        const data = await response.json();
        if (data.connected) {
          setIsCalendarConnected(true);
          clearInterval(pollInterval);
          toast.success('Google Calendar connected!');
        }
      } catch {
        // Continue polling
      }
    }, 2000);
    // Stop polling after 2 minutes
    setTimeout(() => clearInterval(pollInterval), 120000);
  };

  const fetchVisions = async () => {
    try {
      const response = await fetch('/api/visions');
      if (!response.ok) throw new Error('Failed to fetch visions');
      const data = await response.json();
      setVisions(data.visions || []);
    } catch (err) {
      console.error('Error fetching visions:', err);
      toast.error('Failed to load visions');
    } finally {
      setIsLoadingVisions(false);
    }
  };

  const handleCreateVision = async () => {
    if (!newVision.title) {
      setError('Vision title is required');
      return;
    }

    try {
      const response = await fetch('/api/visions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newVision.title,
          description: newVision.description,
          specific: newVision.specific,
          measurable: newVision.measurable,
          attainable: newVision.attainable,
          realistic: newVision.realistic,
          timeBound: endDate?.toISOString().split('T')[0],
        }),
      });

      if (!response.ok) throw new Error('Failed to create vision');

      const data = await response.json();
      setVisions((prev) => [data.vision, ...prev]);
      setSelectedVisionId(data.vision.id);
      setIsCreatingVision(false);
      setNewVision({
        title: '',
        description: '',
        specific: '',
        measurable: '',
        attainable: '',
        realistic: '',
      });
      toast.success('Vision created!');
    } catch (err) {
      console.error('Error creating vision:', err);
      setError('Failed to create vision');
    }
  };

  const handleGeneratePlan = async () => {
    if (!selectedVisionId) {
      setError('Please select a vision first');
      return;
    }

    if (!endDate) {
      setError('Please set a target date');
      return;
    }

    const selectedVision = visions.find((v) => v.id === selectedVisionId);
    if (!selectedVision) {
      setError('Selected vision not found');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-backtrack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visionId: selectedVisionId,
          vision: selectedVision.title,
          smartGoals: {
            specific: selectedVision.specific,
            measurable: selectedVision.measurable,
            attainable: selectedVision.attainable,
            realistic: selectedVision.realistic,
          },
          startDate: startDate.toISOString().split('T')[0],
          targetDate: endDate.toISOString().split('T')[0],
          availableHoursPerWeek,
          saveToDatabase: false,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate plan');
      }

      const plan = await response.json();
      setGeneratedPlan(plan);
      setCurrentStep('review');
      toast.success('Plan generated! Review and customize below.');
    } catch (err) {
      console.error('Error generating plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    if (!selectedVisionId || !generatedPlan) return;

    const selectedVision = visions.find((v) => v.id === selectedVisionId);
    if (!selectedVision) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-backtrack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visionId: selectedVisionId,
          vision: selectedVision.title,
          smartGoals: {
            specific: selectedVision.specific,
            measurable: selectedVision.measurable,
            attainable: selectedVision.attainable,
            realistic: selectedVision.realistic,
          },
          startDate: startDate.toISOString().split('T')[0],
          targetDate: endDate!.toISOString().split('T')[0],
          availableHoursPerWeek,
          saveToDatabase: true,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save plan');
      }

      const result = await response.json();
      toast.success('Backtrack plan saved successfully!');

      // Sync to Google Calendar if enabled and connected
      if (syncToCalendar && isCalendarConnected && result.backtrackPlanId) {
        setIsSyncingCalendar(true);
        try {
          const syncResponse = await fetch('/api/calendar/sync-backtrack-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              backtrackPlanId: result.backtrackPlanId,
              onlyFuture: true,
            }),
          });

          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            setCalendarSyncResult({
              synced: syncResult.synced,
              failed: syncResult.failed,
              total: syncResult.total,
            });
            if (syncResult.synced > 0) {
              toast.success(`${syncResult.synced} actions synced to Google Calendar!`);
            }
          } else {
            console.error('Failed to sync to calendar');
            toast.error('Plan saved, but calendar sync failed');
          }
        } catch (syncErr) {
          console.error('Calendar sync error:', syncErr);
          toast.error('Plan saved, but calendar sync failed');
        } finally {
          setIsSyncingCalendar(false);
        }
      }

      onComplete(result.backtrackPlanId);
    } catch (err) {
      console.error('Error saving plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter out vision step when preselected
  const displayedSteps = preselectedVisionId
    ? STEPS.filter((s) => s.id !== 'vision')
    : STEPS;

  const getStepIndex = (step: WizardStep) => displayedSteps.findIndex((s) => s.id === step);
  const currentStepIndex = getStepIndex(currentStep);
  const progress = ((currentStepIndex + 1) / displayedSteps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 'vision':
        return selectedVisionId !== null;
      case 'time':
        return availableHoursPerWeek > 0 && endDate !== null;
      case 'generate':
        return generatedPlan !== null;
      case 'review':
        return true;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const stepIndex = getStepIndex(currentStep);
    if (stepIndex < displayedSteps.length - 1) {
      const nextStep = displayedSteps[stepIndex + 1].id;
      if (nextStep === 'generate' && !generatedPlan) {
        // Move to generate step first to show loading UI, then start generation
        setCurrentStep('generate');
        // Use setTimeout to ensure state update happens before API call
        setTimeout(() => {
          handleGeneratePlan();
        }, 100);
      } else {
        setCurrentStep(nextStep);
      }
    }
  };

  const handleBack = () => {
    const stepIndex = getStepIndex(currentStep);
    if (stepIndex > 0) {
      setCurrentStep(displayedSteps[stepIndex - 1].id);
    }
  };

  const selectedVision = visions.find((v) => v.id === selectedVisionId);

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <GitBranch className="h-6 w-6 text-primary" />
              Backtrack Planning Wizard
            </h2>
            <p className="text-muted-foreground">
              Create a complete plan from vision to daily actions
            </p>
          </div>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        {/* Step Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs">
            {displayedSteps.map((step, idx) => (
              <div
                key={step.id}
                className={cn(
                  'flex flex-col items-center',
                  idx <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center mb-1',
                    idx < currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : idx === currentStepIndex
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-muted'
                  )}
                >
                  {idx < currentStepIndex ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className="font-medium">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">Error</p>
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{displayedSteps[currentStepIndex].title}</CardTitle>
          <CardDescription>{displayedSteps[currentStepIndex].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Vision Selection */}
          {currentStep === 'vision' && (
            <div className="space-y-6">
              {isCreatingVision ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Vision Statement</Label>
                    <Input
                      placeholder="e.g., Build a $1M business while working 4 days a week"
                      value={newVision.title}
                      onChange={(e) => setNewVision({ ...newVision, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      placeholder="Add more context about your vision..."
                      value={newVision.description}
                      onChange={(e) => setNewVision({ ...newVision, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Specific</Label>
                      <Textarea
                        placeholder="What exactly do you want to achieve?"
                        value={newVision.specific}
                        onChange={(e) => setNewVision({ ...newVision, specific: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Measurable</Label>
                      <Textarea
                        placeholder="How will you measure success?"
                        value={newVision.measurable}
                        onChange={(e) => setNewVision({ ...newVision, measurable: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateVision}>Create Vision</Button>
                    <Button variant="outline" onClick={() => setIsCreatingVision(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {isLoadingVisions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : visions.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium mb-2">No Visions Yet</h3>
                      <p className="text-muted-foreground mb-4">Create a vision to get started</p>
                      <Button onClick={() => setIsCreatingVision(true)}>
                        Create Your First Vision
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Select a Vision</Label>
                        <Select
                          value={selectedVisionId || ''}
                          onValueChange={setSelectedVisionId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a vision..." />
                          </SelectTrigger>
                          <SelectContent>
                            {visions.map((vision) => (
                              <SelectItem key={vision.id} value={vision.id}>
                                {vision.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedVision && (
                        <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                          <h4 className="font-medium">{selectedVision.title}</h4>
                          {selectedVision.description && (
                            <p className="text-sm text-muted-foreground">
                              {selectedVision.description}
                            </p>
                          )}
                          {(selectedVision.specific ||
                            selectedVision.measurable ||
                            selectedVision.attainable ||
                            selectedVision.realistic) && (
                            <div className="grid gap-2 md:grid-cols-2 text-sm">
                              {selectedVision.specific && (
                                <div>
                                  <Badge variant="outline" className="mb-1">S</Badge>
                                  <p className="text-muted-foreground">{selectedVision.specific}</p>
                                </div>
                              )}
                              {selectedVision.measurable && (
                                <div>
                                  <Badge variant="outline" className="mb-1">M</Badge>
                                  <p className="text-muted-foreground">{selectedVision.measurable}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <Button variant="outline" onClick={() => setIsCreatingVision(true)}>
                        Or Create New Vision
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Time Configuration */}
          {currentStep === 'time' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Available Hours Per Week</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min={1}
                      max={80}
                      value={availableHoursPerWeek}
                      onChange={(e) => setAvailableHoursPerWeek(parseInt(e.target.value) || 0)}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">hours/week</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    How many hours per week can you dedicate to this vision?
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {format(startDate, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            if (date) setStartDate(date);
                            setIsStartCalendarOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Date (Deadline)</Label>
                    <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {endDate ? format(endDate, 'PPP') : 'Select target date...'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate || undefined}
                          onSelect={(date) => {
                            setEndDate(date || null);
                            setIsEndCalendarOpen(false);
                          }}
                          disabled={(date) => date < startDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {endDate && (
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4" />
                      Time Summary
                    </h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Weeks:</span>
                        <span className="font-medium">
                          {Math.ceil(
                            (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Hours Available:</span>
                        <span className="font-medium">
                          {Math.ceil(
                            ((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) *
                              availableHoursPerWeek
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hours per day (avg):</span>
                        <span className="font-medium">
                          {(availableHoursPerWeek / 5).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Generation (Loading State) */}
          {currentStep === 'generate' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              {isGenerating ? (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <h3 className="text-xl font-medium">Generating Your Backtrack Plan</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    AI is creating a comprehensive plan from quarterly targets down to specific
                    daily actions based on your vision and available time...
                  </p>
                </>
              ) : (
                <>
                  <Sparkles className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-medium">Ready to Generate</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Click the button below to generate your complete backtrack plan with AI
                  </p>
                  <Button onClick={handleGeneratePlan} size="lg" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate Backtrack Plan
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Step 4: Review Generated Plan */}
          {currentStep === 'review' && generatedPlan && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-4 bg-primary/5 rounded-lg">
                <h4 className="font-medium mb-2">Plan Summary</h4>
                <p className="text-sm text-muted-foreground mb-4">{generatedPlan.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {generatedPlan.criticalPath.map((milestone, idx) => (
                    <Badge key={idx} variant="outline">
                      {idx + 1}. {milestone}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Quarterly Targets */}
              <div className="space-y-3">
                <h4 className="font-medium">Quarterly Targets ({generatedPlan.quarterlyTargets.length})</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {generatedPlan.quarterlyTargets.map((qt, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-medium text-sm">{qt.title}</span>
                        <Badge variant="secondary">Q{qt.quarter}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{qt.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <Badge variant="outline">{qt.keyMetric}: {qt.targetValue}</Badge>
                        <span className="text-muted-foreground">{qt.estimatedHours}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impact Projects */}
              <div className="space-y-3">
                <h4 className="font-medium">Impact Projects ({generatedPlan.impactProjects.length})</h4>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {generatedPlan.impactProjects.slice(0, 6).map((ip, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-medium text-sm">{ip.title}</span>
                        <div className="flex gap-1">
                          <Badge variant="secondary" className="text-xs">Q{ip.quarter}</Badge>
                          <Badge className={cn('text-xs', CATEGORY_COLORS[ip.category])}>
                            {ip.category}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{ip.description}</p>
                    </div>
                  ))}
                </div>
                {generatedPlan.impactProjects.length > 6 && (
                  <p className="text-sm text-muted-foreground">
                    +{generatedPlan.impactProjects.length - 6} more impact projects
                  </p>
                )}
              </div>

              {/* Daily Actions Preview */}
              <div className="space-y-3">
                <h4 className="font-medium">Daily Actions Preview ({generatedPlan.dailyActions.length} total)</h4>
                <div className="grid gap-2">
                  {generatedPlan.dailyActions.slice(0, 5).map((da, idx) => (
                    <div key={idx} className="p-3 border rounded-lg flex items-center gap-3">
                      <div className="w-12 text-center">
                        <span className="text-xs text-muted-foreground">
                          W{da.weekNumber} D{da.dayOfWeek}
                        </span>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{da.title}</span>
                        {da.description && (
                          <p className="text-xs text-muted-foreground">{da.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {da.estimatedMinutes}m
                      </Badge>
                    </div>
                  ))}
                </div>
                {generatedPlan.dailyActions.length > 5 && (
                  <p className="text-sm text-muted-foreground">
                    +{generatedPlan.dailyActions.length - 5} more daily actions
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  <div className="text-2xl font-bold">{generatedPlan.totalWeeks}</div>
                  <div className="text-xs text-muted-foreground">Total Weeks</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  <div className="text-2xl font-bold">{generatedPlan.totalHours}</div>
                  <div className="text-xs text-muted-foreground">Total Hours</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  <div className="text-2xl font-bold">{generatedPlan.impactProjects.length}</div>
                  <div className="text-xs text-muted-foreground">Impact Projects</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  <div className="text-2xl font-bold">{generatedPlan.dailyActions.length}</div>
                  <div className="text-xs text-muted-foreground">Daily Actions</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Confirm */}
          {currentStep === 'confirm' && (
            <div className="space-y-6">
              <div className="p-6 bg-primary/5 rounded-lg text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Ready to Save Your Plan</h3>
                <p className="text-muted-foreground mb-4">
                  Your backtrack plan will be saved and activated. You can start tracking your
                  progress immediately.
                </p>
                <div className="grid gap-2 max-w-md mx-auto text-sm text-left">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                    <span>{generatedPlan?.quarterlyTargets.length} quarterly targets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                    <span>{generatedPlan?.impactProjects.length} impact projects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                    <span>{generatedPlan?.monthlyTargets.length} monthly targets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                    <span>{generatedPlan?.weeklyTargets.length} weekly targets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                    <span>{generatedPlan?.dailyActions.length} daily actions</span>
                  </div>
                </div>
              </div>

              {/* Google Calendar Sync Option */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center gap-3">
                  <CalendarCheck className="h-6 w-6 text-blue-500" />
                  <div>
                    <h4 className="font-medium">Sync to Google Calendar</h4>
                    <p className="text-sm text-muted-foreground">
                      Add your daily actions to Google Calendar so you never miss them
                    </p>
                  </div>
                </div>

                {isCalendarConnected === null ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking calendar connection...
                  </div>
                ) : isCalendarConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Google Calendar connected
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="syncToCalendar"
                        checked={syncToCalendar}
                        onCheckedChange={(checked) => setSyncToCalendar(checked as boolean)}
                      />
                      <label htmlFor="syncToCalendar" className="text-sm cursor-pointer">
                        Automatically sync {generatedPlan?.dailyActions.length} daily actions to my calendar
                      </label>
                    </div>
                    {syncToCalendar && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                        <p className="text-blue-700 dark:text-blue-300">
                          <CalendarPlus className="h-4 w-4 inline mr-1" />
                          Future daily actions will be added as calendar events, spread throughout your work day (9 AM - 5 PM).
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                      Google Calendar not connected
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConnectCalendar}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Connect Google Calendar
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      You can also sync your actions later from the Today page.
                    </p>
                  </div>
                )}

                {calendarSyncResult && (
                  <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg text-sm">
                    <p className="text-cyan-700 dark:text-cyan-300">
                      <CheckCircle2 className="h-4 w-4 inline mr-1" />
                      Synced {calendarSyncResult.synced} of {calendarSyncResult.total} actions to Google Calendar
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0 || isGenerating || isSaving}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {currentStep === 'confirm' ? (
          <Button onClick={handleSavePlan} disabled={isSaving || isSyncingCalendar} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isSyncingCalendar ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Syncing to Calendar...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {syncToCalendar && isCalendarConnected ? 'Save & Sync to Calendar' : 'Save & Activate Plan'}
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isGenerating}
            className="gap-2"
          >
            {currentStep === 'time' ? (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Plan
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
