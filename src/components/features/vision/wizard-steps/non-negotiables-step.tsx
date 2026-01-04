'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { VisionWizardData } from '../vision-wizard';

interface NonNegotiablesStepProps {
  data: VisionWizardData;
  updateData: (updates: Partial<VisionWizardData>) => void;
}

export function NonNegotiablesStep({ data, updateData }: NonNegotiablesStepProps) {
  const [newRule, setNewRule] = useState<{
    title: string;
    description: string;
    frequency: 'daily' | 'weekdays' | 'weekends';
    targetCount: number;
  }>({
    title: '',
    description: '',
    frequency: 'daily',
    targetCount: 1,
  });

  const addNonNegotiable = () => {
    if (!newRule.title.trim()) return;

    updateData({
      nonNegotiables: [
        ...data.nonNegotiables,
        { ...newRule, title: newRule.title.trim() },
      ],
    });
    setNewRule({
      title: '',
      description: '',
      frequency: 'daily',
      targetCount: 1,
    });
  };

  const removeNonNegotiable = (index: number) => {
    updateData({
      nonNegotiables: data.nonNegotiables.filter((_, i) => i !== index),
    });
  };

  const updateNonNegotiable = (
    index: number,
    updates: Partial<VisionWizardData['nonNegotiables'][0]>
  ) => {
    updateData({
      nonNegotiables: data.nonNegotiables.map((nn, i) =>
        i === index ? { ...nn, ...updates } : nn
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Define 5-7 daily non-negotiable behaviors that will drive you toward your vision.
          These are the standards you commit to maintaining every day.
        </p>
        <p className="text-sm font-medium mt-2">
          {data.nonNegotiables.length} non-negotiable{data.nonNegotiables.length !== 1 ? 's' : ''} defined
        </p>
      </div>

      {/* Existing Non-Negotiables */}
      <div className="space-y-3">
        {data.nonNegotiables.map((nn, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
                <div className="flex-1 space-y-3">
                  <Input
                    value={nn.title}
                    onChange={(e) => updateNonNegotiable(index, { title: e.target.value })}
                    placeholder="Non-negotiable title"
                  />
                  <div className="flex gap-3">
                    <Select
                      value={nn.frequency}
                      onValueChange={(value: 'daily' | 'weekdays' | 'weekends') =>
                        updateNonNegotiable(index, { frequency: value })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekdays">Weekdays</SelectItem>
                        <SelectItem value="weekends">Weekends</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm whitespace-nowrap">Times/day:</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={nn.targetCount}
                        onChange={(e) =>
                          updateNonNegotiable(index, { targetCount: parseInt(e.target.value) || 1 })
                        }
                        className="w-16"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeNonNegotiable(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Non-Negotiable */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Add a Non-Negotiable</Label>
              <Input
                placeholder="e.g., Exercise for 30 minutes, Read for 20 minutes"
                value={newRule.title}
                onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && addNonNegotiable()}
              />
            </div>
            <div className="flex gap-3">
              <Select
                value={newRule.frequency}
                onValueChange={(value: 'daily' | 'weekdays' | 'weekends') =>
                  setNewRule({ ...newRule, frequency: value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekdays">Weekdays</SelectItem>
                  <SelectItem value="weekends">Weekends</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Times/day:</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={newRule.targetCount}
                  onChange={(e) =>
                    setNewRule({ ...newRule, targetCount: parseInt(e.target.value) || 1 })
                  }
                  className="w-16"
                />
              </div>
              <Button onClick={addNonNegotiable} disabled={!newRule.title.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Suggested Non-Negotiables</h4>
        <div className="flex flex-wrap gap-2">
          {[
            'Exercise 30 min',
            'Read 20 min',
            'Meditate 10 min',
            'Review goals 3x',
            'No phone first hour',
            'Journal',
            'Learn something new',
          ].map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              onClick={() => setNewRule({ ...newRule, title: suggestion })}
              className="text-xs"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
