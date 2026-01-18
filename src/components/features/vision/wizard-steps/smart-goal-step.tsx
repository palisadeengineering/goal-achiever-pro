'use client';

import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { VisionWizardData } from '../vision-wizard';

interface SmartPreview {
  specific: string;
  measurable: string;
  attainable: string;
  realistic: string;
  timeBound: string;
}

interface SmartGoalStepProps {
  data: VisionWizardData;
  updateData: (updates: Partial<VisionWizardData>) => void;
}

export function SmartGoalStep({ data, updateData }: SmartGoalStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [wasAutoFilled, setWasAutoFilled] = useState(false);
  const [preview, setPreview] = useState<SmartPreview | null>(null);
  const previousTargetDate = useRef(data.targetDate);

  // Auto-populate Time-Bound from target date in Step 1
  useEffect(() => {
    if (data.targetDate && data.targetDate !== previousTargetDate.current) {
      previousTargetDate.current = data.targetDate;

      // Only auto-fill if timeBound is empty or was previously auto-filled
      if (!data.timeBound || wasAutoFilled) {
        const formattedDate = format(parseISO(data.targetDate), 'MMMM d, yyyy');
        updateData({ timeBound: `Achieve by ${formattedDate}` });
        setWasAutoFilled(true);
      }
    }
  }, [data.targetDate, data.timeBound, wasAutoFilled, updateData]);

  const handleGenerateSmart = async () => {
    if (!data.title && !data.description) {
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision: data.title,
          context: data.description,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Store in preview instead of directly applying
        setPreview({
          specific: result.specific || '',
          measurable: result.measurable || '',
          attainable: result.attainable || '',
          realistic: result.realistic || '',
          timeBound: result.timeBound || '',
        });
      }
    } catch (error) {
      console.error('Failed to generate SMART goals:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptPreview = () => {
    if (preview) {
      updateData({
        specific: preview.specific || data.specific,
        measurable: preview.measurable || data.measurable,
        attainable: preview.attainable || data.attainable,
        realistic: preview.realistic || data.realistic,
        timeBound: preview.timeBound || data.timeBound,
      });
      setPreview(null);
    }
  };

  const handleDiscardPreview = () => {
    setPreview(null);
  };

  const smartFields = [
    {
      key: 'specific' as const,
      label: 'Specific',
      description: 'What exactly do you want to accomplish? Be precise and detailed.',
      placeholder: 'I want to build a SaaS product that helps small businesses automate their invoicing...',
    },
    {
      key: 'measurable' as const,
      label: 'Measurable',
      description: 'How will you measure progress and know when you\'ve achieved it?',
      placeholder: '$10M ARR, 10,000 paying customers, 95% customer satisfaction...',
    },
    {
      key: 'attainable' as const,
      label: 'Attainable',
      description: 'What skills, resources, and capabilities do you need?',
      placeholder: 'I have 10 years of software experience, access to seed funding, and a network of potential customers...',
    },
    {
      key: 'realistic' as const,
      label: 'Realistic',
      description: 'Why is this goal realistic given your current situation?',
      placeholder: 'The market is growing at 20% annually, similar companies have achieved this scale...',
    },
    {
      key: 'timeBound' as const,
      label: 'Time-Bound',
      description: wasAutoFilled && data.timeBound?.startsWith('Achieve by')
        ? 'Pre-filled from your target date. Add milestones and details!'
        : 'What is your deadline and key milestones?',
      placeholder: 'MVP in 3 months, first 100 customers in 6 months, $10M ARR in 3 years...',
    },
  ];

  const completedFields = smartFields.filter(f => data[f.key]?.trim()).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Break down your vision using the SMART framework
          </p>
          <p className="text-sm font-medium mt-1">
            {completedFields} of {smartFields.length} fields completed
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateSmart}
          disabled={isGenerating || preview !== null || (!data.title && !data.description)}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          AI Generate
        </Button>
      </div>

      {/* AI Generated Preview Panel */}
      {preview && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Generated SMART Goals
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDiscardPreview}
                >
                  <X className="h-4 w-4 mr-1" />
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptPreview}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {smartFields.map((field) => (
              <div key={`preview-${field.key}`} className="space-y-1">
                <Label className="text-xs font-semibold text-primary">{field.label}</Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {preview[field.key] || <span className="italic">Not generated</span>}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {smartFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              {data[field.key]?.trim() && (
                <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">
                  Complete
                </span>
              )}
            </div>
            <Textarea
              id={field.key}
              placeholder={field.placeholder}
              value={data[field.key]}
              onChange={(e) => updateData({ [field.key]: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{field.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
