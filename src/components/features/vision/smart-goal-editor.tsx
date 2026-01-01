'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, CheckCircle2, Target, Eye, Pencil } from 'lucide-react';

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
}

const SMART_FIELDS = [
  {
    key: 'specific' as const,
    label: 'Specific',
    letter: 'S',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    placeholder: 'What exactly do you want to achieve? Be precise.',
    hint: 'Define exactly what you want to accomplish. The more specific, the clearer your path.',
  },
  {
    key: 'measurable' as const,
    label: 'Measurable',
    letter: 'M',
    color: 'bg-green-100 text-green-800 border-green-300',
    placeholder: 'How will you measure progress and success?',
    hint: 'What metrics will you track? How will you know when you\'ve achieved it?',
  },
  {
    key: 'attainable' as const,
    label: 'Attainable',
    letter: 'A',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    placeholder: 'What skills or resources do you need?',
    hint: 'Is this goal achievable? What do you need to make it happen?',
  },
  {
    key: 'realistic' as const,
    label: 'Realistic',
    letter: 'R',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    placeholder: 'Why is this goal important to you right now?',
    hint: 'Does this align with your other goals and priorities?',
  },
];

export function SmartGoalEditor({
  initialData,
  onSave,
  readonly = false,
}: SmartGoalEditorProps) {
  const [isEditing, setIsEditing] = useState(!initialData?.title);
  const [data, setData] = useState<SmartGoalData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    specific: initialData?.specific || '',
    measurable: initialData?.measurable || '',
    attainable: initialData?.attainable || '',
    realistic: initialData?.realistic || '',
    timeBound: initialData?.timeBound || null,
  });

  const handleChange = (field: keyof SmartGoalData, value: string | Date | null) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave?.(data);
    setIsEditing(false);
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
            <div className="p-4 rounded-lg border-2 bg-purple-100 text-purple-800 border-purple-300">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
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
          <Label htmlFor="title" className="text-base font-medium">
            Vision Statement
          </Label>
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
            placeholder="Add more context about your vision..."
            value={data.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
          />
        </div>

        {/* SMART Fields */}
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            SMART Breakdown
          </h3>

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

          {/* Time-bound */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                T
              </Badge>
              Time-bound
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !data.timeBound && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.timeBound ? (
                    format(data.timeBound, 'PPP')
                  ) : (
                    <span>Pick a target date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.timeBound || undefined}
                  onSelect={(date) => handleChange('timeBound', date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              When do you want to achieve this goal by?
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1" disabled={!data.title}>
            {data.title ? 'Save Vision' : 'Create Vision'}
          </Button>
          {initialData?.title && (
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
