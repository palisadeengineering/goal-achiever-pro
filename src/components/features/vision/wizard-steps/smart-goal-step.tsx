'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import type { VisionWizardData } from '../vision-wizard';

interface SmartGoalStepProps {
  data: VisionWizardData;
  updateData: (updates: Partial<VisionWizardData>) => void;
}

export function SmartGoalStep({ data, updateData }: SmartGoalStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);

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
          visionTitle: data.title,
          visionDescription: data.description,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        updateData({
          specific: result.specific || data.specific,
          measurable: result.measurable || data.measurable,
          attainable: result.attainable || data.attainable,
          realistic: result.realistic || data.realistic,
          timeBound: result.timeBound || data.timeBound,
        });
      }
    } catch (error) {
      console.error('Failed to generate SMART goals:', error);
    } finally {
      setIsGenerating(false);
    }
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
      description: 'What is your deadline and key milestones?',
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
          disabled={isGenerating || (!data.title && !data.description)}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          AI Generate
        </Button>
      </div>

      <div className="space-y-6">
        {smartFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              {data[field.key]?.trim() && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
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
