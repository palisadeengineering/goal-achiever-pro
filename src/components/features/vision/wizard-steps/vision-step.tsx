'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sparkles, Loader2, ChevronDown, ChevronUp, CalendarIcon, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';
import { addMonths, addYears, format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { VisionWizardData } from '../vision-wizard';
import { SmartQuestions } from '../smart-questions';
import { VisionTemplates, VisionTemplate } from '../vision-templates';

const COLOR_OPTIONS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#f43f5e', label: 'Rose' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#6b7280', label: 'Gray' },
];

const DATE_PRESETS = [
  { label: '3 months', getValue: () => addMonths(new Date(), 3) },
  { label: '6 months', getValue: () => addMonths(new Date(), 6) },
  { label: '1 year', getValue: () => addYears(new Date(), 1) },
  { label: '2 years', getValue: () => addYears(new Date(), 2) },
];

interface VisionStepProps {
  data: VisionWizardData;
  updateData: (updates: Partial<VisionWizardData>) => void;
}

export function VisionStep({ data, updateData }: VisionStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isGeneratingDate, setIsGeneratingDate] = useState(false);
  const [dateSuggestion, setDateSuggestion] = useState<{
    reasoning: string;
    timeframe: string;
    keyMilestones: string[];
  } | null>(null);
  const [smartAnswers, setSmartAnswers] = useState<Record<string, string>>({});
  const [selectedMethodology, setSelectedMethodology] = useState<string | null>(null);

  const handleSelectTemplate = (template: VisionTemplate, use10X?: boolean) => {
    // Use 10X version if selected and available
    const useVersion = use10X && template.tenXVersion ? template.tenXVersion : template;

    updateData({
      title: useVersion.title,
      description: template.dreamOutcome || useVersion.description,
      color: template.color,
      // Set target date based on suggested months
      targetDate: format(addMonths(new Date(), template.suggestedMonths), 'yyyy-MM-dd'),
    });

    // Also pre-fill SMART goals if we're on that step later
    // Store template data for use in SMART step
    updateData({
      // @ts-expect-error - template data extension
      templateData: {
        specific: use10X && template.tenXVersion?.specific ? template.tenXVersion.specific : template.specific,
        measurable: use10X && template.tenXVersion?.measurable ? template.tenXVersion.measurable : template.measurable,
        attainable: template.attainable,
        realistic: template.realistic,
        suggestedNonNegotiables: template.suggestedNonNegotiables,
        methodology: use10X ? 'cardone' : template.methodology,
      },
    });

    setSelectedMethodology(use10X ? 'cardone' : template.methodology);
    setShowTemplates(false);
    toast.success(`Template applied: ${useVersion.title}`, {
      description: use10X ? '10X version selected!' : 'Feel free to customize it.',
    });
  };

  const handleDatePreset = (getValue: () => Date) => {
    const date = getValue();
    updateData({ targetDate: format(date, 'yyyy-MM-dd') });
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      updateData({ targetDate: format(date, 'yyyy-MM-dd') });
      setCalendarOpen(false);
    }
  };

  const selectedDate = data.targetDate ? parseISO(data.targetDate) : undefined;

  const generateDateWithAI = async () => {
    if (!data.title && !data.description) {
      toast.error('Please enter a vision title or description first');
      return;
    }

    setIsGeneratingDate(true);
    setDateSuggestion(null);
    try {
      const response = await fetch('/api/ai/suggest-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision: data.title,
          description: data.description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to suggest date');
      }

      const result = await response.json();

      if (result.suggestedDate) {
        updateData({ targetDate: result.suggestedDate });
        setDateSuggestion({
          reasoning: result.reasoning,
          timeframe: result.timeframe,
          keyMilestones: result.keyMilestones || [],
        });
        toast.success(`Suggested timeline: ${result.timeframe}`);
      }
    } catch (error) {
      console.error('AI date suggestion error:', error);
      toast.error('Failed to suggest date. Please try again.');
    } finally {
      setIsGeneratingDate(false);
    }
  };

  const generateVisionWithAI = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/suggest-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: aiContext || undefined }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate vision');
      }

      const result = await response.json();

      if (result.vision && result.description) {
        updateData({
          title: result.vision,
          description: result.description,
        });
        toast.success('Vision generated! Feel free to customize it.');
        setShowAIOptions(false);
        setAiContext('');
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate vision. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Templates Section */}
      {showTemplates ? (
        <div className="rounded-lg border p-4">
          <VisionTemplates
            onSelectTemplate={handleSelectTemplate}
            onClose={() => setShowTemplates(false)}
          />
        </div>
      ) : (
        <>
          {/* Quick Start Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Templates Button */}
            <Button
              type="button"
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-2 hover:border-primary/50 hover:bg-primary/5"
              onClick={() => setShowTemplates(true)}
            >
              <LayoutTemplate className="h-6 w-6 text-cyan-500" />
              <div className="text-center">
                <div className="font-semibold">Choose Template</div>
                <div className="text-xs text-muted-foreground">
                  10X Goals · Dream Outcomes · Proven Frameworks
                </div>
              </div>
            </Button>

            {/* AI Generator Button */}
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-auto py-4 flex flex-col items-center gap-2 border-2",
                showAIOptions ? "border-violet-500 bg-violet-500/5" : "hover:border-violet-500/50 hover:bg-violet-500/5"
              )}
              onClick={() => setShowAIOptions(!showAIOptions)}
            >
              <Sparkles className="h-6 w-6 text-violet-500" />
              <div className="text-center">
                <div className="font-semibold">Generate with AI</div>
                <div className="text-xs text-muted-foreground">
                  Custom vision from your context
                </div>
              </div>
            </Button>
          </div>

          {/* Methodology badge if template was used */}
          {selectedMethodology && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Using:</span>
              {selectedMethodology === 'cardone' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  Grant Cardone 10X Rule
                </span>
              )}
              {selectedMethodology === 'hormozi' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  Alex Hormozi Value Equation
                </span>
              )}
              {selectedMethodology === 'martell' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Dan Martell Buy Back Your Time
                </span>
              )}
            </div>
          )}

          {/* AI Generation Panel */}
          {showAIOptions && (
            <div className="rounded-lg border bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="aiContext" className="text-sm">
                    Context (optional)
                  </Label>
                  <Textarea
                    id="aiContext"
                    placeholder="Tell AI about your situation: your industry, goals, current stage, what excites you... (e.g., 'I run a small marketing agency and want to scale while having more freedom')"
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    More context = more personalized vision
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={generateVisionWithAI}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Vision
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Vision Title *</Label>
        <Input
          id="title"
          placeholder="e.g., Build a $10M SaaS Business"
          value={data.title}
          onChange={(e) => updateData({ title: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          A clear, inspiring title for your vision
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your vision in detail. What does success look like? Why is this important to you?"
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
          rows={4}
        />
        <p className="text-sm text-muted-foreground">
          Paint a vivid picture of what achieving this vision means
        </p>
      </div>

      {/* Smart Clarifying Questions - appears when metrics are detected */}
      <SmartQuestions
        vision={data.title}
        description={data.description}
        onAnswersChange={(answers) => {
          setSmartAnswers(answers);
          // Store answers in vision data for later use in KPI generation
          updateData({
            // @ts-expect-error - smartAnswers is an extension to the data model
            smartAnswers: answers
          });
        }}
        className="my-4"
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Target Date</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateDateWithAI}
            disabled={isGeneratingDate || (!data.title && !data.description)}
            className="gap-2"
          >
            {isGeneratingDate ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-violet-500" />
                AI Suggest
              </>
            )}
          </Button>
        </div>
        <div className="space-y-3">
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((preset) => {
              const presetDate = format(preset.getValue(), 'yyyy-MM-dd');
              const isSelected = data.targetDate === presetDate;
              return (
                <Button
                  key={preset.label}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    handleDatePreset(preset.getValue);
                    setDateSuggestion(null);
                  }}
                >
                  {preset.label}
                </Button>
              );
            })}
            {/* Custom date picker */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant={selectedDate && !DATE_PRESETS.some(p => format(p.getValue(), 'yyyy-MM-dd') === data.targetDate) ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Custom
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    handleCalendarSelect(date);
                    setDateSuggestion(null);
                  }}
                  disabled={(date) => date < new Date()}
                  defaultMonth={selectedDate || new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* Manual date input */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={data.targetDate}
              onChange={(e) => {
                const value = e.target.value;
                setDateSuggestion(null);
                if (value) {
                  const selectedDate = new Date(value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (selectedDate >= today) {
                    updateData({ targetDate: value });
                  } else {
                    toast.error('Please select a future date');
                  }
                } else {
                  updateData({ targetDate: '' });
                }
              }}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-[180px]"
            />
            {selectedDate && (
              <span className="text-sm text-muted-foreground">
                ({format(selectedDate, 'MMMM d, yyyy')})
              </span>
            )}
          </div>
          {/* AI Date Suggestion reasoning */}
          {dateSuggestion && (
            <div className="rounded-lg border bg-violet-50 dark:bg-violet-950/20 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-violet-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Suggested: {dateSuggestion.timeframe}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dateSuggestion.reasoning}
                  </p>
                </div>
              </div>
              {dateSuggestion.keyMilestones.length > 0 && (
                <div className="pl-6">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Key milestones:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {dateSuggestion.keyMilestones.map((milestone, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span className="text-violet-500">•</span> {milestone}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          When do you want to achieve this vision? Use AI for smart suggestions, presets, or pick a custom date.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Vision Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => updateData({ color: color.value })}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                data.color === color.value
                  ? 'border-foreground scale-110'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Choose a color to identify this vision
        </p>
      </div>
    </div>
  );
}
