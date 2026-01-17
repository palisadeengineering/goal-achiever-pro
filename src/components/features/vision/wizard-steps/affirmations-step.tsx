'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2, Quote } from 'lucide-react';
import type { VisionWizardData } from '../vision-wizard';

interface AffirmationsStepProps {
  data: VisionWizardData;
  updateData: (updates: Partial<VisionWizardData>) => void;
}

const AFFIRMATION_TEMPLATES = [
  "I am confidently building [vision] and achieving [goal] by [date].",
  "Every day I take powerful action toward [vision]. Success is inevitable.",
  "I am worthy of [vision]. I have the skills, resources, and determination to achieve it.",
  "I believe 100% in my ability to [goal]. I focus on it 100% of the time with 100% clarity.",
  "I am becoming the person who [vision]. My standards support my success.",
];

export function AffirmationsStep({ data, updateData }: AffirmationsStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAffirmation = async () => {
    if (!data.title) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-affirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visionTitle: data.title,
          visionDescription: data.description,
          smartGoals: {
            specific: data.specific,
            measurable: data.measurable,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        updateData({ affirmationText: result.affirmation });
      }
    } catch (error) {
      console.error('Failed to generate affirmation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyTemplate = (template: string) => {
    let affirmation = template;
    affirmation = affirmation.replace('[vision]', data.title || 'my vision');
    affirmation = affirmation.replace('[goal]', data.measurable || 'my goals');
    affirmation = affirmation.replace('[date]', data.targetDate || 'my target date');
    updateData({ affirmationText: affirmation });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Write a powerful affirmation that you&apos;ll read aloud during your vision reviews.
          Speaking your vision reinforces belief and commitment.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="affirmation">Your Affirmation</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateAffirmation}
            disabled={isGenerating || !data.title}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            AI Generate
          </Button>
        </div>
        <Textarea
          id="affirmation"
          placeholder="I am confidently building a $10M SaaS business that helps thousands of entrepreneurs automate their invoicing..."
          value={data.affirmationText}
          onChange={(e) => updateData({ affirmationText: e.target.value })}
          rows={5}
          className="text-lg"
        />
        <p className="text-xs text-muted-foreground">
          Write in present tense as if you&apos;ve already achieved it
        </p>
      </div>

      {/* Templates */}
      <div className="space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <Quote className="h-4 w-4" />
          Templates to Get Started
        </h4>
        <div className="space-y-2">
          {AFFIRMATION_TEMPLATES.map((template, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => applyTemplate(template)}
            >
              <CardContent className="p-3">
                <p className="text-sm italic text-muted-foreground">{template}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Affirmation Tips</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Write in <strong>present tense</strong> (&ldquo;I am&rdquo; not &ldquo;I will be&rdquo;)</li>
          <li>• Be <strong>specific</strong> about what you&apos;re achieving</li>
          <li>• Include <strong>emotions</strong> - how does success feel?</li>
          <li>• Read it <strong>aloud</strong> during your daily reviews</li>
          <li>• <strong>Believe</strong> it as you say it - act as if it&apos;s already true</li>
        </ul>
      </div>
    </div>
  );
}
