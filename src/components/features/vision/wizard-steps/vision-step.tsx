'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sparkles, Loader2, ChevronDown, ChevronUp, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { addMonths, addYears, format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { VisionWizardData } from '../vision-wizard';

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
  const [aiContext, setAiContext] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

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
      {/* AI Generation Section */}
      <div className="rounded-lg border bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <span className="font-medium">AI Vision Generator</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAIOptions(!showAIOptions)}
          >
            {showAIOptions ? (
              <>Hide Options <ChevronUp className="ml-1 h-4 w-4" /></>
            ) : (
              <>Generate with AI <ChevronDown className="ml-1 h-4 w-4" /></>
            )}
          </Button>
        </div>

        {showAIOptions && (
          <div className="mt-4 space-y-3">
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
        )}
      </div>

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

      <div className="space-y-2">
        <Label>Target Date</Label>
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
                  onClick={() => handleDatePreset(preset.getValue)}
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
                  onSelect={handleCalendarSelect}
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
        </div>
        <p className="text-sm text-muted-foreground">
          When do you want to achieve this vision? Use presets, calendar, or type directly.
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
