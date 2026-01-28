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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { VALUE_QUADRANTS } from '@/constants/drip';
import type { ValueQuadrant } from '@/types/database';

export interface MinFormData {
  title: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  priority: number;
  valueQuadrant: ValueQuadrant | '';
  impactProjectId: string | null;
  timeScope: 'daily' | 'weekly';
  weekStartDate: string | null;
  weekEndDate: string | null;
}

interface MinFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<MinFormData>;
  impactProjects?: Array<{ id: string; title: string }>;
  onSubmit: (data: MinFormData) => Promise<void>;
  isEditing?: boolean;
}

const durations = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

const priorities = [
  { value: 1, label: 'P1 - Critical', color: 'text-red-600' },
  { value: 2, label: 'P2 - High', color: 'text-orange-600' },
  { value: 3, label: 'P3 - Medium', color: 'text-yellow-600' },
  { value: 4, label: 'P4 - Low', color: 'text-cyan-600' },
];

export function MinForm({
  open,
  onOpenChange,
  initialData,
  impactProjects = [],
  onSubmit,
  isEditing = false,
}: MinFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<MinFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    scheduledDate: initialData?.scheduledDate || today,
    scheduledTime: initialData?.scheduledTime || '',
    durationMinutes: initialData?.durationMinutes || 30,
    priority: initialData?.priority || 2,
    valueQuadrant: initialData?.valueQuadrant || '',
    impactProjectId: initialData?.impactProjectId || null,
    timeScope: initialData?.timeScope || 'daily',
    weekStartDate: initialData?.weekStartDate || null,
    weekEndDate: initialData?.weekEndDate || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = <K extends keyof MinFormData>(
    field: K,
    value: MinFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit MIN' : 'Add Most Important Next Step'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">What needs to be done? *</Label>
            <Input
              id="title"
              placeholder="e.g., Review marketing proposal"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Any additional context or notes..."
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Time Scope</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.timeScope === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateField('timeScope', 'daily')}
              >
                Daily
              </Button>
              <Button
                type="button"
                variant={formData.timeScope === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateField('timeScope', 'weekly')}
              >
                Weekly
              </Button>
            </div>
          </div>

          {formData.timeScope === 'daily' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => updateField('scheduledDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Time (optional)</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => updateField('scheduledTime', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="weekStartDate">Week Start</Label>
                <Input
                  id="weekStartDate"
                  type="date"
                  value={formData.weekStartDate || ''}
                  onChange={(e) => updateField('weekStartDate', e.target.value || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weekEndDate">Week End</Label>
                <Input
                  id="weekEndDate"
                  type="date"
                  value={formData.weekEndDate || ''}
                  onChange={(e) => updateField('weekEndDate', e.target.value || null)}
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={formData.durationMinutes.toString()}
                onValueChange={(value) =>
                  updateField('durationMinutes', parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d.value} value={d.value.toString()}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority.toString()}
                onValueChange={(value) =>
                  updateField('priority', parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value.toString()}>
                      <span className={p.color}>{p.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Value Quadrant</Label>
              <Select
                value={formData.valueQuadrant}
                onValueChange={(value) =>
                  updateField('valueQuadrant', value as ValueQuadrant | '')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quadrant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not categorized</SelectItem>
                  {Object.entries(VALUE_QUADRANTS).map(([key, quadrant]) => (
                    <SelectItem key={key} value={key}>
                      <span style={{ color: quadrant.color }}>
                        {quadrant.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {impactProjects.length > 0 && (
              <div className="space-y-2">
                <Label>Link to Impact Project</Label>
                <Select
                  value={formData.impactProjectId || ''}
                  onValueChange={(value) =>
                    updateField('impactProjectId', value || null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select impact project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No linked impact project</SelectItem>
                    {impactProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Saving...' : 'Adding...'}
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Add MIN'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
