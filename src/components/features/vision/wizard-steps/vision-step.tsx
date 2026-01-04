'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface VisionStepProps {
  data: VisionWizardData;
  updateData: (updates: Partial<VisionWizardData>) => void;
}

export function VisionStep({ data, updateData }: VisionStepProps) {
  return (
    <div className="space-y-6">
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
        <Label htmlFor="targetDate">Target Date</Label>
        <Input
          id="targetDate"
          type="date"
          value={data.targetDate}
          onChange={(e) => updateData({ targetDate: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          When do you want to achieve this vision?
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

      {/* 300% Rule Scores */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-medium">300% Rule Scores</h3>
        <p className="text-sm text-muted-foreground">
          Rate your current clarity, belief, and consistency for this vision
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Clarity ({data.clarityScore}%)</Label>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={data.clarityScore}
              onChange={(e) => updateData({ clarityScore: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How clear is your vision? Can you describe it in detail?
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Belief ({data.beliefScore}%)</Label>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={data.beliefScore}
              onChange={(e) => updateData({ beliefScore: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How strongly do you believe this is achievable?
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Consistency ({data.consistencyScore}%)</Label>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={data.consistencyScore}
              onChange={(e) => updateData({ consistencyScore: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How consistently do you focus on this vision?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
