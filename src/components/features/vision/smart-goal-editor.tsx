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
import { format, parseISO, parse, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, CheckCircle2, Target, Eye, Pencil, Sparkles, Loader2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface SmartGoalData {
  title: string;
  description: string;
  specific: string;
  measurable: string;
  attainable: string;
  realistic: string;
  timeBound: Date | null;
}

interface SmartGoalEditorProps {
  initialData?: Partial<SmartGoalData>;
  onSave?: (data: SmartGoalData) => void;
  readonly?: boolean;
  isSaving?: boolean;
}

const SMART_FIELDS = [
  {
    key: 'specific' as const,
    label: 'Specific',
    letter: 'S',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    placeholder: 'What exactly do you want to achieve? Be precise.',
    hint: 'Define exactly what you want to accomplish. The more specific, the clearer your path.',
  },
  {
    key: 'measurable' as const,
    label: 'Measurable',
    letter: 'M',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
    placeholder: 'How will you measure progress and success?',
    hint: 'What metrics will you track? How will you know when you\'ve achieved it?',
  },
  {
    key: 'attainable' as const,
    label: 'Attainable',
    letter: 'A',
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
    placeholder: 'What skills or resources do you need?',
    hint: 'Is this goal achievable? What do you need to make it happen?',
  },
  {
    key: 'realistic' as const,
    label: 'Realistic',
    letter: 'R',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700',
    placeholder: 'Why is this goal important to you right now?',
    hint: 'Does this align with your other goals and priorities?',
  },
];

export function SmartGoalEditor({
  initialData,
  onSave,
  readonly = false,
  isSaving = false,
}: SmartGoalEditorProps) {
  const [isEditing, setIsEditing] = useState(!initialData?.title);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingVision, setIsGeneratingVision] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [dateInputValue, setDateInputValue] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [data, setData] = useState<SmartGoalData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    specific: initialData?.specific || '',
    measurable: initialData?.measurable || '',
    attainable: initialData?.attainable || '',
    realistic: initialData?.realistic || '',
    timeBound: initialData?.timeBound || null,
  });

  // Sync with prop changes
  useEffect(() => {
    if (initialData) {
      setData({
        title: initialData.title || '',
        description: initialData.description || '',
        specific: initialData.specific || '',
        measurable: initialData.measurable || '',
        attainable: initialData.attainable || '',
        realistic: initialData.realistic || '',
        timeBound: initialData.timeBound || null,
      });
      if (initialData.timeBound) {
        setDateInputValue(format(initialData.timeBound, 'MM/dd/yyyy'));
      }
    }
  }, [initialData]);

  // Update date input when timeBound changes
  useEffect(() => {
    if (data.timeBound) {
      setDateInputValue(format(data.timeBound, 'MM/dd/yyyy'));
    }
  }, [data.timeBound]);

  const handleChange = (field: keyof SmartGoalData, value: string | Date | null) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateInputChange = (value: string) => {
    setDateInputValue(value);

    // Try to parse the date
    const formats = ['MM/dd/yyyy', 'M/d/yyyy', 'yyyy-MM-dd', 'MM-dd-yyyy'];
    for (const fmt of formats) {
      const parsed = parse(value, fmt, new Date());
      if (isValid(parsed) && parsed.getFullYear() > 2000) {
        handleChange('timeBound', parsed);
        return;
      }
    }
  };

  const handleSave = () => {
    onSave?.(data);
    setIsEditing(false);
  };

  const generateVisionWithAI = async () => {
    setIsGeneratingVision(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/suggest-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: data.description || 'Help me create an inspiring vision for my life and business goals.',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate vision suggestion');
      }

      const result = await response.json();

      setData((prev) => ({
        ...prev,
        title: result.vision || prev.title,
        description: result.description || prev.description,
      }));

      toast.success('Vision suggestion generated! Feel free to customize it.');
    } catch (error) {
      console.error('AI Vision Generation Error:', error);
      setAiError(error instanceof Error ? error.message : 'Failed to generate vision suggestion');
    } finally {
      setIsGeneratingVision(false);
    }
  };

  const generateWithAI = async () => {
    if (!data.title) {
      setAiError('Please enter your vision statement first');
      return;
    }

    setIsGenerating(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/generate-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision: data.title,
          context: data.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate SMART goals');
      }

      const result = await response.json();

      setData((prev) => ({
        ...prev,
        specific: result.specific || prev.specific,
        measurable: result.measurable || prev.measurable,
        attainable: result.attainable || prev.attainable,
        realistic: result.realistic || prev.realistic,
        timeBound: result.suggestedDeadline ? parseISO(result.suggestedDeadline) : prev.timeBound,
      }));

      toast.success('SMART goals generated!');
    } catch (error) {
      console.error('AI Generation Error:', error);
      setAiError(error instanceof Error ? error.message : 'Failed to generate SMART goals');
    } finally {
      setIsGenerating(false);
    }
  };

  const isComplete = () => {
    return (
      data.title &&
      data.specific &&
      data.measurable &&
      data.attainable &&
      data.realistic &&
      data.timeBound
    );
  };

  const getCompletionCount = () => {
    let count = 0;
    if (data.title) count++;
    if (data.specific) count++;
    if (data.measurable) count++;
    if (data.attainable) count++;
    if (data.realistic) count++;
    if (data.timeBound) count++;
    return count;
  };

  if (!isEditing && data.title) {
    // View Mode
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <CardTitle>Your Vision</CardTitle>
              </div>
              <CardDescription>Your big picture SMART goal</CardDescription>
            </div>
            {!readonly && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Vision */}
          <div className="p-6 bg-primary/5 rounded-xl border-2 border-primary/20">
            <h2 className="text-2xl font-bold">{data.title}</h2>
            {data.description && (
              <p className="text-muted-foreground mt-2">{data.description}</p>
            )}
            {data.timeBound && (
              <Badge variant="outline" className="mt-4">
                <CalendarIcon className="h-3 w-3 mr-1" />
                Target: {format(data.timeBound, 'MMMM d, yyyy')}
              </Badge>
            )}
          </div>

          {/* SMART Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            {SMART_FIELDS.map((field) => (
              <div
                key={field.key}
                className={cn('p-4 rounded-lg border-2', field.color)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={field.color}>
                    {field.letter}
                  </Badge>
                  <span className="font-medium">{field.label}</span>
                </div>
                <p className="text-sm">
                  {data[field.key] || (
                    <span className="italic text-muted-foreground">Not defined</span>
                  )}
                </p>
              </div>
            ))}

            {/* Time-bound */}
            <div className="p-4 rounded-lg border-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700">
                  T
                </Badge>
                <span className="font-medium">Time-bound</span>
              </div>
              <p className="text-sm">
                {data.timeBound ? (
                  format(data.timeBound, 'MMMM d, yyyy')
                ) : (
                  <span className="italic text-muted-foreground">No deadline set</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Edit Mode
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {data.title ? 'Edit Your Vision' : 'Create Your Vision'}
            </CardTitle>
            <CardDescription>
              Define your big picture goal using the SMART framework
            </CardDescription>
          </div>
          <Badge variant={isComplete() ? 'default' : 'secondary'}>
            {getCompletionCount()}/6 Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vision Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="title" className="text-base font-medium">
              Vision Statement
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={generateVisionWithAI}
              disabled={isGeneratingVision}
              className="gap-2 text-muted-foreground hover:text-primary"
            >
              {isGeneratingVision ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Suggesting...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4" />
                  Suggest Vision
                </>
              )}
            </Button>
          </div>
          <Input
            id="title"
            placeholder="e.g., Build a $1M business while working 4 days a week"
            value={data.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="text-lg"
          />
          <p className="text-xs text-muted-foreground">
            One sentence that captures your ultimate goal for this year
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Add more context about your vision... What industry are you in? What's your current situation?"
            value={data.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
          />
        </div>

        {/* SMART Fields */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              SMART Breakdown
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateWithAI}
              disabled={isGenerating || !data.title}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>

          {aiError && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              {aiError}
            </div>
          )}

          {SMART_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key} className="flex items-center gap-2">
                <Badge variant="outline" className={field.color}>
                  {field.letter}
                </Badge>
                {field.label}
              </Label>
              <Textarea
                id={field.key}
                placeholder={field.placeholder}
                value={data[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">{field.hint}</p>
            </div>
          ))}

          {/* Time-bound with both input and calendar */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700">
                T
              </Badge>
              Time-bound
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="MM/DD/YYYY"
                value={dateInputValue}
                onChange={(e) => handleDateInputChange(e.target.value)}
                className="flex-1"
              />
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end" side="bottom" sideOffset={4}>
                  <Calendar
                    mode="single"
                    selected={data.timeBound || undefined}
                    onSelect={(date) => {
                      handleChange('timeBound', date || null);
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-xs text-muted-foreground">
              When do you want to achieve this goal by? Type a date or use the calendar.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1" disabled={!data.title || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              data.title ? 'Save Vision' : 'Create Vision'
            )}
          </Button>
          {initialData?.title && (
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
