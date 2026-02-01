'use client';

import { useState, useCallback } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Wand2,
  PenLine,
  Target,
  DollarSign,
  Heart,
  Briefcase,
  TrendingUp,
  Users,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Calculator,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type GoalType = 'revenue' | 'health' | 'career' | 'personal' | 'relationships' | 'custom';
type CreationMode = 'ai-generated' | 'ai-assisted' | 'manual';

interface GoalTypeOption {
  value: GoalType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const GOAL_TYPES: GoalTypeOption[] = [
  {
    value: 'revenue',
    label: 'Revenue / Business',
    icon: <DollarSign className="h-5 w-5" />,
    description: 'Grow revenue, sales, or business metrics',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  },
  {
    value: 'career',
    label: 'Career / Professional',
    icon: <Briefcase className="h-5 w-5" />,
    description: 'Advance your career or professional skills',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  },
  {
    value: 'health',
    label: 'Health / Fitness',
    icon: <Heart className="h-5 w-5" />,
    description: 'Improve physical or mental health',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  },
  {
    value: 'personal',
    label: 'Personal Growth',
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'Learn, grow, or develop new habits',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
  },
  {
    value: 'relationships',
    label: 'Relationships',
    icon: <Users className="h-5 w-5" />,
    description: 'Build or improve relationships',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200',
  },
  {
    value: 'custom',
    label: 'Other',
    icon: <Target className="h-5 w-5" />,
    description: 'Define your own goal type',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
  },
];

interface RevenueData {
  currentRevenue: string;
  targetRevenue: string;
  avgDealValue: string;
  dealsPerYear: string;
  closeRate: string;
  leadSource: string;
}

interface SmartGoal {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
}

export default function VisionPlannerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Goal Input
  const [goalInput, setGoalInput] = useState('');

  // Step 2: Goal Type
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [detectedType, setDetectedType] = useState<GoalType | null>(null);

  // Step 3: Creation Mode
  const [creationMode, setCreationMode] = useState<CreationMode>('ai-assisted');

  // Revenue Math (for revenue goals)
  const [revenueData, setRevenueData] = useState<RevenueData>({
    currentRevenue: '',
    targetRevenue: '',
    avgDealValue: '',
    dealsPerYear: '',
    closeRate: '',
    leadSource: '',
  });
  const [revenueMathResult, setRevenueMathResult] = useState<{
    dealsNeeded: number;
    proposalsNeeded: number;
    leadsNeeded: number;
  } | null>(null);

  // SMART Goal
  const [smartGoal, setSmartGoal] = useState<SmartGoal>({
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
  });

  // Generated content
  const [suggestedKeyResults, setSuggestedKeyResults] = useState<string[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectColor, setProjectColor] = useState('#3B82F6');

  // Detect goal type from input
  const detectGoalType = useCallback((input: string): GoalType => {
    const lowered = input.toLowerCase();
    if (
      lowered.includes('revenue') ||
      lowered.includes('sales') ||
      lowered.includes('$') ||
      lowered.includes('money') ||
      lowered.includes('profit') ||
      lowered.includes('income') ||
      lowered.includes('grow') && (lowered.includes('business') || lowered.includes('company'))
    ) {
      return 'revenue';
    }
    if (
      lowered.includes('health') ||
      lowered.includes('weight') ||
      lowered.includes('fitness') ||
      lowered.includes('exercise') ||
      lowered.includes('gym') ||
      lowered.includes('run') ||
      lowered.includes('diet')
    ) {
      return 'health';
    }
    if (
      lowered.includes('career') ||
      lowered.includes('job') ||
      lowered.includes('promotion') ||
      lowered.includes('skill') ||
      lowered.includes('learn') ||
      lowered.includes('certificate')
    ) {
      return 'career';
    }
    if (
      lowered.includes('relationship') ||
      lowered.includes('family') ||
      lowered.includes('friend') ||
      lowered.includes('social') ||
      lowered.includes('network')
    ) {
      return 'relationships';
    }
    if (
      lowered.includes('habit') ||
      lowered.includes('read') ||
      lowered.includes('meditat') ||
      lowered.includes('journal') ||
      lowered.includes('personal')
    ) {
      return 'personal';
    }
    return 'custom';
  }, []);

  const handleGoalInputNext = () => {
    if (!goalInput.trim()) {
      toast.error('Please describe your goal');
      return;
    }
    const detected = detectGoalType(goalInput);
    setDetectedType(detected);
    setGoalType(detected);
    setProjectTitle(goalInput);
    setStep(2);
  };

  const calculateRevenueMath = () => {
    const current = parseFloat(revenueData.currentRevenue.replace(/[^0-9.]/g, '')) || 0;
    const target = parseFloat(revenueData.targetRevenue.replace(/[^0-9.]/g, '')) || 0;
    const avgDeal = parseFloat(revenueData.avgDealValue.replace(/[^0-9.]/g, '')) || 0;
    const closeRate = parseFloat(revenueData.closeRate) || 0;

    if (target <= current) {
      toast.error('Target must be greater than current revenue');
      return;
    }
    if (avgDeal <= 0) {
      toast.error('Please enter a valid average deal value');
      return;
    }
    if (closeRate <= 0 || closeRate > 100) {
      toast.error('Close rate must be between 1-100%');
      return;
    }

    const revenueGap = target - current;
    const dealsNeeded = Math.ceil(revenueGap / avgDeal);
    const proposalsNeeded = Math.ceil(dealsNeeded / (closeRate / 100));
    const leadsNeeded = Math.ceil(proposalsNeeded * 2); // Assume 50% of leads become proposals

    setRevenueMathResult({
      dealsNeeded,
      proposalsNeeded,
      leadsNeeded,
    });

    // Generate suggested key results
    setSuggestedKeyResults([
      `Close ${dealsNeeded} new deals`,
      `Send ${proposalsNeeded} proposals`,
      `Generate ${leadsNeeded} qualified leads`,
      `Achieve ${target.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} in revenue`,
    ]);
  };

  // Helper to parse date from various formats into YYYY-MM-DD
  const parseTargetDate = (dateStr: string | undefined): string | null => {
    if (!dateStr) return null;

    // Try to parse the date string
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    // Try common patterns like "December 31, 2026"
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                        'july', 'august', 'september', 'october', 'november', 'december'];
    const lower = dateStr.toLowerCase();
    for (let i = 0; i < monthNames.length; i++) {
      if (lower.includes(monthNames[i])) {
        const yearMatch = dateStr.match(/\b(20\d{2})\b/);
        const dayMatch = dateStr.match(/\b(\d{1,2})\b/);
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          const day = dayMatch ? parseInt(dayMatch[1]) : 1;
          const date = new Date(year, i, day);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
      }
    }

    return null;
  };

  const handleCreateProject = async () => {
    setIsLoading(true);
    try {
      // Parse the time bound into a proper date format
      const targetDate = parseTargetDate(smartGoal.timeBound);

      // Create the project
      const projectResponse = await fetch('/api/projects-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectTitle,
          description: goalInput,
          color: projectColor,
          specific: smartGoal.specific || goalInput,
          measurable: smartGoal.measurable,
          attainable: smartGoal.achievable,
          realistic: smartGoal.relevant,
          timeBound: targetDate, // Use parsed date instead of raw text
          targetDate: targetDate, // Also set target_date
          isFocused: true,
          revenueMath: goalType === 'revenue' ? revenueMath : null,
        }),
      });

      if (!projectResponse.ok) {
        const errorData = await projectResponse.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const { project } = await projectResponse.json();

      // Create key results if we have suggestions
      if (suggestedKeyResults.length > 0) {
        for (const kr of suggestedKeyResults) {
          await fetch('/api/project-key-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: project.id,
              name: kr,
              targetValue: 100,
              startingValue: 0,
              unitType: 'percentage',
            }),
          });
        }
      }

      toast.success('Project created successfully!');
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const generateWithAI = async () => {
    setIsLoading(true);
    try {
      // Call AI to generate SMART components
      const response = await fetch('/api/ai/generate-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalDescription: goalInput,
          goalType,
          revenueData: goalType === 'revenue' ? revenueData : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate SMART goal');
      }

      const data = await response.json();

      if (data.smart) {
        setSmartGoal({
          specific: data.smart.specific || '',
          measurable: data.smart.measurable || '',
          achievable: data.smart.achievable || '',
          relevant: data.smart.relevant || '',
          timeBound: data.smart.timeBound || '',
        });
      }

      if (data.keyResults) {
        setSuggestedKeyResults(data.keyResults);
      }

      toast.success('AI generated your goal components!');
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate with AI');
    } finally {
      setIsLoading(false);
    }
  };

  const totalSteps = goalType === 'revenue' ? 5 : 4;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vision Planner"
        description="Create a structured project from your goal"
        icon={<Wand2 className="h-6 w-6" />}
      />

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Step {step} of {totalSteps}</span>
          <span className="font-medium">{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step 1: Goal Input */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              What do you want to achieve?
            </CardTitle>
            <CardDescription>
              Describe your goal in natural language. Be as specific as you can.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Textarea
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder='e.g., "Grow my revenue from $1M to $2M this year" or "Lose 30 pounds in 6 months"'
              className="min-h-[120px] text-lg"
            />

            <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-500 shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> Include numbers and timeframes for better results.
                The more specific, the better we can help you plan.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleGoalInputNext} size="lg">
                Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Goal Type Selection */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              What type of goal is this?
            </CardTitle>
            <CardDescription>
              We detected this might be a <Badge className={cn(GOAL_TYPES.find(t => t.value === detectedType)?.color)}>{GOAL_TYPES.find(t => t.value === detectedType)?.label}</Badge> goal.
              Confirm or change below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {GOAL_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setGoalType(type.value)}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all',
                    goalType === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/30'
                  )}
                >
                  <div className={cn('inline-flex items-center justify-center h-10 w-10 rounded-lg mb-2', type.color)}>
                    {type.icon}
                  </div>
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!goalType} size="lg">
                Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Creation Mode (or Revenue Math for revenue goals) */}
      {step === 3 && goalType === 'revenue' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-500" />
              Revenue Math
            </CardTitle>
            <CardDescription>
              Let's calculate what you need to hit your target
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Annual Revenue</Label>
                <Input
                  type="text"
                  value={revenueData.currentRevenue}
                  onChange={(e) => setRevenueData({ ...revenueData, currentRevenue: e.target.value })}
                  placeholder="$1,000,000"
                />
              </div>
              <div className="space-y-2">
                <Label>Target Annual Revenue</Label>
                <Input
                  type="text"
                  value={revenueData.targetRevenue}
                  onChange={(e) => setRevenueData({ ...revenueData, targetRevenue: e.target.value })}
                  placeholder="$2,000,000"
                />
              </div>
              <div className="space-y-2">
                <Label>Average Deal Value</Label>
                <Input
                  type="text"
                  value={revenueData.avgDealValue}
                  onChange={(e) => setRevenueData({ ...revenueData, avgDealValue: e.target.value })}
                  placeholder="$50,000"
                />
              </div>
              <div className="space-y-2">
                <Label>Close Rate (%)</Label>
                <Input
                  type="text"
                  value={revenueData.closeRate}
                  onChange={(e) => setRevenueData({ ...revenueData, closeRate: e.target.value })}
                  placeholder="25"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Primary Lead Source</Label>
                <Select
                  value={revenueData.leadSource}
                  onValueChange={(value) => setRevenueData({ ...revenueData, leadSource: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="How do you get most of your leads?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referrals">Referrals</SelectItem>
                    <SelectItem value="inbound">Inbound Marketing</SelectItem>
                    <SelectItem value="outbound">Outbound Sales</SelectItem>
                    <SelectItem value="networking">Networking</SelectItem>
                    <SelectItem value="paid_ads">Paid Advertising</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={calculateRevenueMath} variant="outline" className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Calculate What You Need
            </Button>

            {revenueMathResult && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-3">
                <h4 className="font-semibold text-green-800 dark:text-green-200">To hit your target, you need:</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{revenueMathResult.dealsNeeded}</p>
                    <p className="text-sm text-muted-foreground">New Deals</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{revenueMathResult.proposalsNeeded}</p>
                    <p className="text-sm text-muted-foreground">Proposals</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{revenueMathResult.leadsNeeded}</p>
                    <p className="text-sm text-muted-foreground">Qualified Leads</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep(4)} size="lg">
                Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 (non-revenue) or Step 4 (revenue): Creation Mode */}
      {((step === 3 && goalType !== 'revenue') || (step === 4 && goalType === 'revenue')) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-500" />
              How would you like to create your project?
            </CardTitle>
            <CardDescription>
              Choose your preferred level of AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setCreationMode('ai-generated')}
                className={cn(
                  'p-6 rounded-lg border-2 text-left transition-all',
                  creationMode === 'ai-generated'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/30'
                )}
              >
                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <p className="font-semibold">AI-Generated</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI creates everything, you review and approve
                </p>
                <Badge className="mt-2" variant="secondary">Recommended</Badge>
              </button>

              <button
                onClick={() => setCreationMode('ai-assisted')}
                className={cn(
                  'p-6 rounded-lg border-2 text-left transition-all',
                  creationMode === 'ai-assisted'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/30'
                )}
              >
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                  <Wand2 className="h-6 w-6 text-blue-600" />
                </div>
                <p className="font-semibold">AI-Assisted</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You write, AI suggests improvements
                </p>
              </button>

              <button
                onClick={() => setCreationMode('manual')}
                className={cn(
                  'p-6 rounded-lg border-2 text-left transition-all',
                  creationMode === 'manual'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/30'
                )}
              >
                <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-900/30 flex items-center justify-center mb-3">
                  <PenLine className="h-6 w-6 text-gray-600" />
                </div>
                <p className="font-semibold">Manual</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Full control, no AI involvement
                </p>
              </button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(goalType === 'revenue' ? 3 : 2)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => {
                  if (creationMode === 'ai-generated') {
                    generateWithAI();
                  }
                  setStep(goalType === 'revenue' ? 5 : 4);
                }}
                size="lg"
              >
                {creationMode === 'ai-generated' ? 'Generate with AI' : 'Continue'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Step: Review & Create */}
      {((step === 4 && goalType !== 'revenue') || (step === 5 && goalType === 'revenue')) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Review & Create Project
            </CardTitle>
            <CardDescription>
              Review your project details and create when ready
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">
                  {creationMode === 'ai-generated' ? 'AI is generating your project...' : 'Creating project...'}
                </span>
              </div>
            ) : (
              <>
                {/* Project Title */}
                <div className="space-y-2">
                  <Label>Project Title</Label>
                  <Input
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Your project title"
                  />
                </div>

                {/* Color Picker */}
                <div className="space-y-2">
                  <Label>Project Color</Label>
                  <div className="flex gap-2">
                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setProjectColor(color)}
                        className={cn(
                          'h-8 w-8 rounded-full transition-all',
                          projectColor === color && 'ring-2 ring-offset-2 ring-primary'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* SMART Goal Fields */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    SMART Goal
                  </h4>

                  <div className="space-y-2">
                    <Label>Specific - What exactly will you accomplish?</Label>
                    <Textarea
                      value={smartGoal.specific}
                      onChange={(e) => setSmartGoal({ ...smartGoal, specific: e.target.value })}
                      placeholder="Describe your goal in detail..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Measurable - How will you measure success?</Label>
                    <Textarea
                      value={smartGoal.measurable}
                      onChange={(e) => setSmartGoal({ ...smartGoal, measurable: e.target.value })}
                      placeholder="Define the metrics you'll track..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Achievable - Is this realistic?</Label>
                    <Textarea
                      value={smartGoal.achievable}
                      onChange={(e) => setSmartGoal({ ...smartGoal, achievable: e.target.value })}
                      placeholder="Why is this goal achievable for you?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Relevant - Why does this matter?</Label>
                    <Textarea
                      value={smartGoal.relevant}
                      onChange={(e) => setSmartGoal({ ...smartGoal, relevant: e.target.value })}
                      placeholder="How does this align with your bigger vision?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Time-Bound - When will you achieve this?</Label>
                    <Textarea
                      value={smartGoal.timeBound}
                      onChange={(e) => setSmartGoal({ ...smartGoal, timeBound: e.target.value })}
                      placeholder="Set your deadline..."
                    />
                  </div>
                </div>

                {/* Suggested Key Results */}
                {suggestedKeyResults.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Key Results
                    </h4>
                    <div className="space-y-2">
                      {suggestedKeyResults.map((kr, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                        >
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span className="text-sm">{kr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(goalType === 'revenue' ? 4 : 3)}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    size="lg"
                    disabled={!projectTitle.trim()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
