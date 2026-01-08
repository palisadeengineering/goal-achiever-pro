'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { TagSelector } from './tag-selector';
import { TagManager } from './tag-manager';
import { useTags, type Tag } from '@/lib/hooks/use-tags';
import { useTagPatterns } from '@/lib/hooks/use-tag-patterns';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
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
  tagIds?: string[];
  createdAt: string;
}

interface TimeBlockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (block: Omit<TimeBlock, 'id' | 'createdAt'>) => void;
  initialDate?: string;
  initialTime?: string;
  initialEndTime?: string;
  editBlock?: TimeBlock;
}

const DRIP_OPTIONS = [
  { value: 'production', label: 'Production', description: 'High $ + High Energy (Your sweet spot!)', color: 'bg-cyan-500' },
  { value: 'investment', label: 'Investment', description: 'Low $ + High Energy (Long-term growth)', color: 'bg-indigo-500' },
  { value: 'replacement', label: 'Replacement', description: 'High $ + Low Energy (Automate this)', color: 'bg-orange-500' },
  { value: 'delegation', label: 'Delegation', description: 'Low $ + Low Energy (Delegate this)', color: 'bg-pink-500' },
  { value: 'na', label: 'N/A', description: 'Not applicable or uncategorized', color: 'bg-slate-400' },
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
  initialEndTime,
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
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showTagManager, setShowTagManager] = useState(false);

  // Smart tag suggestion states
  const [suggestedTagIds, setSuggestedTagIds] = useState<string[]>([]);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [isLoadingAISuggestion, setIsLoadingAISuggestion] = useState(false);
  const [suggestionSource, setSuggestionSource] = useState<'pattern' | 'ai' | null>(null);

  const { tags, createTag, updateTag, deleteTag } = useTags();
  const { getSuggestion, shouldAutoApply, learnPattern } = useTagPatterns();

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
        setSelectedTagIds(editBlock.tagIds || []);
      } else {
        setDate(initialDate || today);
        setStartTime(initialTime || '09:00');
        // Use initialEndTime if provided (from drag selection), otherwise default
        setEndTime(initialEndTime || (initialTime ? addMinutes(initialTime, 30) : '09:30'));
        setActivityName('');
        setDescription('');
        setDripQuadrant('production');
        setEnergyRating('yellow');
        setSelectedTagIds([]);
      }
      // Reset suggestion state
      setSuggestedTagIds([]);
      setShowSuggestion(false);
      setSuggestionSource(null);
    }
  }, [open, editBlock, initialDate, initialTime, initialEndTime, today]);

  // Check for pattern-based tag suggestions when activity name changes
  useEffect(() => {
    if (!activityName || activityName.length < 3 || !open) {
      setSuggestedTagIds([]);
      setShowSuggestion(false);
      return;
    }

    // Check for high-confidence auto-apply (>=80%)
    const autoApply = shouldAutoApply(activityName);
    if (autoApply && selectedTagIds.length === 0) {
      // Filter to only include tags that still exist
      const validTagIds = autoApply.tagIds.filter(id => tags.some(t => t.id === id));
      if (validTagIds.length > 0) {
        setSelectedTagIds(validTagIds);
        return;
      }
    }

    // Check for suggestions to show (>=30% confidence)
    const suggestion = getSuggestion(activityName);
    if (suggestion && suggestion.confidence >= 0.3) {
      const validTagIds = suggestion.tagIds.filter(id => tags.some(t => t.id === id));
      if (validTagIds.length > 0 && selectedTagIds.length === 0) {
        setSuggestedTagIds(validTagIds);
        setShowSuggestion(true);
        setSuggestionSource('pattern');
      }
    }
  }, [activityName, tags, getSuggestion, shouldAutoApply, selectedTagIds.length, open]);

  // Handle AI tag suggestion
  const handleAISuggest = useCallback(async () => {
    if (!activityName || isLoadingAISuggestion) return;

    setIsLoadingAISuggestion(true);
    try {
      const response = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityName,
          description,
          existingTags: tags.map(t => ({ id: t.id, name: t.name, color: t.color })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.suggestedTagIds && result.suggestedTagIds.length > 0) {
          setSuggestedTagIds(result.suggestedTagIds);
          setShowSuggestion(true);
          setSuggestionSource('ai');
        }
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
    } finally {
      setIsLoadingAISuggestion(false);
    }
  }, [activityName, description, tags, isLoadingAISuggestion]);

  // Accept suggested tags
  const acceptSuggestions = useCallback(() => {
    setSelectedTagIds(prev => [...new Set([...prev, ...suggestedTagIds])]);
    setShowSuggestion(false);
    setSuggestedTagIds([]);
  }, [suggestedTagIds]);

  // Dismiss suggestions
  const dismissSuggestions = useCallback(() => {
    setShowSuggestion(false);
    setSuggestedTagIds([]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Learn the pattern for future suggestions
    if (selectedTagIds.length > 0 && activityName.length >= 3) {
      learnPattern(activityName, selectedTagIds);
    }

    onSave({
      date,
      startTime,
      endTime,
      activityName,
      description: description || undefined,
      dripQuadrant,
      energyRating,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    });
    onOpenChange(false);
  };

  return (
    <>
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

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tags</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAISuggest}
                disabled={isLoadingAISuggestion || !activityName || activityName.length < 3}
                className="h-7 text-xs"
              >
                {isLoadingAISuggestion ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                AI Suggest
              </Button>
            </div>
            <TagSelector
              tags={tags}
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
              onManageTags={() => setShowTagManager(true)}
            />

            {/* Tag Suggestions */}
            {showSuggestion && suggestedTagIds.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm animate-in fade-in slide-in-from-top-1">
                <span className="text-xs text-muted-foreground shrink-0">
                  {suggestionSource === 'ai' ? 'AI suggests:' : 'Suggested:'}
                </span>
                <div className="flex flex-wrap gap-1 flex-1">
                  {suggestedTagIds.map(id => {
                    const tag = tags.find(t => t.id === id);
                    return tag ? (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="text-xs"
                        style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={acceptSuggestions}
                    className="h-6 w-6 p-0 hover:bg-green-500/20"
                  >
                    <Check className="h-3 w-3 text-green-600" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={dismissSuggestions}
                    className="h-6 w-6 p-0 hover:bg-red-500/20"
                  >
                    <X className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              </div>
            )}
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

    {/* Tag Manager Dialog */}
    <TagManager
      open={showTagManager}
      onOpenChange={setShowTagManager}
      tags={tags}
      onCreateTag={createTag}
      onUpdateTag={updateTag}
      onDeleteTag={deleteTag}
    />
    </>
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
