'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export interface GoalFormData {
  title: string;
  description: string;
  targetDate: string;
  quarter: number | null;
  category: string;
  visionId: string | null;
}

interface GoalFormProps {
  initialData?: Partial<GoalFormData>;
  visions?: Array<{ id: string; title: string }>;
  onSubmit: (data: GoalFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const categories = [
  { value: 'health', label: 'Health & Fitness' },
  { value: 'wealth', label: 'Wealth & Finance' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'career', label: 'Career' },
  { value: 'business', label: 'Business' },
  { value: 'personal', label: 'Personal Development' },
];

const quarters = [
  { value: 1, label: 'Q1 (Jan-Mar)' },
  { value: 2, label: 'Q2 (Apr-Jun)' },
  { value: 3, label: 'Q3 (Jul-Sep)' },
  { value: 4, label: 'Q4 (Oct-Dec)' },
];

export function GoalForm({
  initialData,
  visions = [],
  onSubmit,
  onCancel,
  isEditing = false,
}: GoalFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    targetDate: initialData?.targetDate || '',
    quarter: initialData?.quarter || null,
    category: initialData?.category || '',
    visionId: initialData?.visionId || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = <K extends keyof GoalFormData>(
    field: K,
    value: GoalFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Power Goal' : 'Create New Power Goal'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Launch my online course"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does achieving this goal look like? What are the key milestones?"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => updateField('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quarter">Quarter</Label>
              <Select
                value={formData.quarter?.toString() || ''}
                onValueChange={(value) => updateField('quarter', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((q) => (
                    <SelectItem key={q.value} value={q.value.toString()}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => updateField('targetDate', e.target.value)}
              />
            </div>

            {visions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="visionId">Link to Vision</Label>
                <Select
                  value={formData.visionId || ''}
                  onValueChange={(value) => updateField('visionId', value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vision (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No linked vision</SelectItem>
                    {visions.map((vision) => (
                      <SelectItem key={vision.id} value={vision.id}>
                        {vision.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Tips for Setting Power Goals</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Focus on goals that align with your vision</li>
              <li>Make goals specific and measurable</li>
              <li>Choose the one goal with the biggest impact to focus on</li>
              <li>Break it down into MINS (Most Important Next Steps)</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Save Changes' : 'Create Goal'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
