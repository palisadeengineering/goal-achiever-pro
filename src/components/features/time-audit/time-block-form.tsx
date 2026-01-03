'use client';

import { useState, useEffect } from 'react';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { DripQuadrant, EnergyRating } from '@/types/database';

export interface TimeBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  activityName: string;
  description?: string;
  dripQuadrant: DripQuadrant;
  energyRating: EnergyRating;
  source?: string;
  externalEventId?: string;
  createdAt: string;
}

interface TimeBlockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (block: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  initialDate?: string;
  initialTime?: string;
  editBlock?: TimeBlock;
}

const DRIP_OPTIONS = [
  { value: 'production', label: 'Production', description: 'High $ + High Energy (Your sweet spot!)', color: 'bg-green-500' },
  { value: 'investment', label: 'Investment', description: 'Low $ + High Energy (Long-term growth)', color: 'bg-blue-500' },
  { value: 'replacement', label: 'Replacement', description: 'High $ + Low Energy (Automate this)', color: 'bg-orange-500' },
  { value: 'delegation', label: 'Delegation', description: 'Low $ + Low Energy (Delegate this)', color: 'bg-purple-500' },
];

const ENERGY_OPTIONS = [
  { value: 'green', label: 'Energizing', description: 'This activity gives me energy', color: 'bg-green-500' },
  { value: 'yellow', label: 'Neutral', description: 'Neither draining nor energizing', color: 'bg-yellow-500' },
  { value: 'red', label: 'Draining', description: 'This activity drains my energy', color: 'bg-red-500' },
];

export function TimeBlockForm({
  open,
  onOpenChange,
  onSave,
  initialDate,
  initialTime,
  editBlock,
}: TimeBlockFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [activityName, setActivityName] = useState('');
  const [description, setDescription] = useState('');
  const [dripQuadrant, setDripQuadrant] = useState<DripQuadrant>('production');
  const [energyRating, setEnergyRating] = useState<EnergyRating>('yellow');

  // Reset form when dialog opens/closes or edit block changes
  useEffect(() => {
    if (open) {
      if (editBlock) {
        setDate(editBlock.date);
        setStartTime(editBlock.startTime);
        setEndTime(editBlock.endTime);
        setActivityName(editBlock.activityName);
        setDescription(editBlock.description || '');
        setDripQuadrant(editBlock.dripQuadrant);
        setEnergyRating(editBlock.energyRating);
      } else {
        setDate(initialDate || today);
        setStartTime(initialTime || '09:00');
        setEndTime(initialTime ? addMinutes(initialTime, 30) : '09:30');
        setActivityName('');
        setDescription('');
        setDripQuadrant('production');
        setEnergyRating('yellow');
      }
    }
  }, [open, editBlock, initialDate, initialTime, today]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      startTime,
      endTime,
      activityName,
      description: description || undefined,
      dripQuadrant,
      energyRating,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editBlock ? 'Edit Time Block' : 'Log Time Block'}</DialogTitle>
          <DialogDescription>
            Record how you spent your time and categorize it by DRIP quadrant.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date and Time Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Activity Name */}
          <div className="space-y-2">
            <Label htmlFor="activityName">Activity Name</Label>
            <Input
              id="activityName"
              placeholder="e.g., Client meeting, Email, Deep work..."
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              required
            />
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add notes about this activity..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* DRIP Quadrant */}
          <div className="space-y-3">
            <Label>DRIP Quadrant</Label>
            <Select value={dripQuadrant} onValueChange={(v) => setDripQuadrant(v as DripQuadrant)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DRIP_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${option.color}`} />
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">- {option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Energy Rating */}
          <div className="space-y-3">
            <Label>Energy Level</Label>
            <RadioGroup
              value={energyRating}
              onValueChange={(v) => setEnergyRating(v as EnergyRating)}
              className="flex gap-4"
            >
              {ENERGY_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label
                    htmlFor={option.value}
                    className="flex items-center gap-1.5 cursor-pointer font-normal"
                  >
                    <span className={`h-2 w-2 rounded-full ${option.color}`} />
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editBlock ? 'Save Changes' : 'Log Time Block'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper to add minutes to a time string
function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}
