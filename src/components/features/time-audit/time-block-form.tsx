'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { TagInput } from '@/components/shared/tag-input';
import { TagManager } from './tag-manager';
import { useTags } from '@/lib/hooks/use-tags';
import type { Tag } from '@/lib/hooks/use-tags';
import { useTagPatterns } from '@/lib/hooks/use-tag-patterns';
import { Sparkles, Check, X, Loader2, Trash2, Repeat, SkipForward, Brain, Briefcase, Users, Car, Zap, Coffee, FileText, HelpCircle, Code, DollarSign } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { ValueQuadrant, EnergyRating } from '@/types/database';
import type { ActivityType } from '@/lib/hooks/use-enhanced-analytics';
import { inferLeverageType, type LeverageType } from '@/lib/hooks/use-leverage-analytics';

export interface TimeBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  activityName: string;
  description?: string;
  valueQuadrant: ValueQuadrant;
  energyRating: EnergyRating;
  leverageType?: LeverageType;
  source?: string;
  externalEventId?: string;
  tagIds?: string[];
  // Activity classification fields
  activityType?: ActivityType;
  detectedProjectId?: string;
  detectedProjectName?: string;
  meetingCategoryId?: string;
  meetingCategoryName?: string;
  aiClassificationConfidence?: number;
  // Recurring event fields
  isRecurring?: boolean;
  recurrenceRule?: string;
  recurrenceEndDate?: string;
  parentBlockId?: string;
  isRecurrenceException?: boolean;
  originalDate?: string;
  createdAt: string;
}

// Recurrence rule options
const RECURRENCE_OPTIONS = [
  { value: 'FREQ=DAILY', label: 'Daily', description: 'Repeats every day' },
  { value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', label: 'Weekdays', description: 'Monday through Friday' },
  { value: 'FREQ=WEEKLY', label: 'Weekly', description: 'Repeats every week on this day' },
  { value: 'FREQ=WEEKLY;INTERVAL=2', label: 'Bi-weekly', description: 'Repeats every 2 weeks' },
  { value: 'FREQ=MONTHLY', label: 'Monthly', description: 'Repeats every month on this date' },
];

interface TimeBlockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (block: Omit<TimeBlock, 'id' | 'createdAt' | 'parentBlockId' | 'isRecurrenceException' | 'originalDate'>) => void;
  onDelete?: (block: TimeBlock) => Promise<void>;
  onSkip?: (block: TimeBlock) => Promise<void>;
  initialDate?: string;
  initialTime?: string;
  initialEndTime?: string;
  editBlock?: TimeBlock;
}

const VALUE_OPTIONS = [
  { value: 'production', label: 'Production', description: 'High $ + High Energy (Your sweet spot!)', color: 'bg-cyan-500' },
  { value: 'investment', label: 'Investment', description: 'Low $ + High Energy (Long-term growth)', color: 'bg-indigo-500' },
  { value: 'replacement', label: 'Replacement', description: 'High $ + Low Energy (Automate this)', color: 'bg-orange-500' },
  { value: 'delegation', label: 'Delegation', description: 'Low $ + Low Energy (Delegate this)', color: 'bg-pink-500' },
  { value: 'na', label: 'N/A', description: 'Not applicable or uncategorized', color: 'bg-blue-500' },
];

const ENERGY_OPTIONS = [
  { value: 'green', label: 'Energizing', description: 'This activity gives me energy', color: 'bg-cyan-500' },
  { value: 'yellow', label: 'Neutral', description: 'Neither draining nor energizing', color: 'bg-yellow-500' },
  { value: 'red', label: 'Draining', description: 'This activity drains my energy', color: 'bg-red-500' },
];

const ACTIVITY_TYPE_OPTIONS: { value: ActivityType; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: 'project', label: 'Project Work', icon: Briefcase, color: 'text-indigo-500' },
  { value: 'meeting', label: 'Meeting', icon: Users, color: 'text-amber-500' },
  { value: 'deep_work', label: 'Deep Work', icon: Zap, color: 'text-emerald-500' },
  { value: 'commute', label: 'Commute', icon: Car, color: 'text-violet-500' },
  { value: 'admin', label: 'Admin', icon: FileText, color: 'text-slate-500' },
  { value: 'break', label: 'Break', icon: Coffee, color: 'text-pink-500' },
  { value: 'other', label: 'Other', icon: HelpCircle, color: 'text-gray-400' },
];

const LEVERAGE_TYPE_OPTIONS: { value: LeverageType; label: string; icon: React.ComponentType<{ className?: string }>; color: string; description: string }[] = [
  { value: 'code', label: 'Code', icon: Code, color: 'text-blue-500', description: 'Automation & systems' },
  { value: 'content', label: 'Content', icon: FileText, color: 'text-purple-500', description: 'Creating scalable assets' },
  { value: 'capital', label: 'Capital', icon: DollarSign, color: 'text-green-500', description: 'Delegation & hiring' },
  { value: 'collaboration', label: 'Collaboration', icon: Users, color: 'text-orange-500', description: 'Partnerships & networks' },
];

export function TimeBlockForm({
  open,
  onOpenChange,
  onSave,
  onDelete,
  onSkip,
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
  const [valueQuadrant, setValueQuadrant] = useState<ValueQuadrant>('production');
  const [energyRating, setEnergyRating] = useState<EnergyRating>('yellow');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showTagManager, setShowTagManager] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  // Recurring event states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('FREQ=WEEKLY');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  // Activity classification states
  const [activityType, setActivityType] = useState<ActivityType | undefined>(undefined);
  const [detectedProjectId, setDetectedProjectId] = useState<string | undefined>(undefined);
  const [detectedProjectName, setDetectedProjectName] = useState<string | undefined>(undefined);
  const [meetingCategoryId, setMeetingCategoryId] = useState<string | undefined>(undefined);
  const [meetingCategoryName, setMeetingCategoryName] = useState<string | undefined>(undefined);
  const [meetingCategories, setMeetingCategories] = useState<{ id: string; name: string; color: string }[]>([]);
  const [detectedProjects, setDetectedProjects] = useState<{ id: string; name: string }[]>([]);
  const [showCustomProjectInput, setShowCustomProjectInput] = useState(false);
  const [customProjectName, setCustomProjectName] = useState('');

  // Leverage type states
  const [leverageType, setLeverageType] = useState<LeverageType | undefined>(undefined);
  const [suggestedLeverageType, setSuggestedLeverageType] = useState<LeverageType | null>(null);

  // AI classification states
  const [aiClassification, setAiClassification] = useState<{
    activityType: ActivityType;
    projectName?: string;
    meetingCategory?: string;
    confidence: number;
    reasoning: string;
  } | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [showClassificationSuggestion, setShowClassificationSuggestion] = useState(false);
  const classifyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smart tag suggestion states
  const [suggestedTagIds, setSuggestedTagIds] = useState<string[]>([]);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [isLoadingAISuggestion, setIsLoadingAISuggestion] = useState(false);
  const [suggestionSource, setSuggestionSource] = useState<'pattern' | 'ai' | null>(null);
  const [suggestionConfidence, setSuggestionConfidence] = useState<number>(0.5);

  const { tags, createTag, updateTag, deleteTag } = useTags();
  const { getSuggestion, shouldAutoApply, learnPattern } = useTagPatterns();

  // Load meeting categories and detected projects when dialog opens
  useEffect(() => {
    if (open) {
      // Fetch meeting categories
      fetch('/api/meeting-categories')
        .then((res) => res.ok ? res.json() : { categories: [] })
        .then((data) => setMeetingCategories(data.categories || []))
        .catch(() => setMeetingCategories([]));

      // Fetch detected projects
      fetch('/api/detected-projects')
        .then((res) => res.ok ? res.json() : { projects: [] })
        .then((data) => setDetectedProjects(data.projects || []))
        .catch(() => setDetectedProjects([]));
    }
  }, [open]);

  // Reset form when dialog opens/closes or edit block changes
  useEffect(() => {
    if (open) {
      if (editBlock) {
        setDate(editBlock.date);
        setStartTime(editBlock.startTime);
        setEndTime(editBlock.endTime);
        setActivityName(editBlock.activityName);
        setDescription(editBlock.description || '');
        setValueQuadrant(editBlock.valueQuadrant);
        setEnergyRating(editBlock.energyRating);
        setSelectedTagIds(editBlock.tagIds || []);
        // Recurring fields
        setIsRecurring(editBlock.isRecurring || false);
        setRecurrenceRule(editBlock.recurrenceRule || 'FREQ=WEEKLY');
        setRecurrenceEndDate(editBlock.recurrenceEndDate || '');
        // Activity classification fields
        setActivityType(editBlock.activityType);
        setDetectedProjectId(editBlock.detectedProjectId);
        setDetectedProjectName(editBlock.detectedProjectName);
        setMeetingCategoryId(editBlock.meetingCategoryId);
        setMeetingCategoryName(editBlock.meetingCategoryName);
        // Leverage type
        setLeverageType(editBlock.leverageType);
        setSuggestedLeverageType(null);
      } else {
        setDate(initialDate || today);
        setStartTime(initialTime || '09:00');
        // Use initialEndTime if provided (from drag selection), otherwise default
        setEndTime(initialEndTime || (initialTime ? addMinutes(initialTime, 30) : '09:30'));
        setActivityName('');
        setDescription('');
        setValueQuadrant('production');
        setEnergyRating('yellow');
        setSelectedTagIds([]);
        // Reset recurring fields
        setIsRecurring(false);
        setRecurrenceRule('FREQ=WEEKLY');
        setRecurrenceEndDate('');
        // Reset activity classification fields
        setActivityType(undefined);
        setDetectedProjectId(undefined);
        setDetectedProjectName(undefined);
        setMeetingCategoryId(undefined);
        setMeetingCategoryName(undefined);
        // Reset custom project input
        setShowCustomProjectInput(false);
        setCustomProjectName('');
        // Reset leverage type
        setLeverageType(undefined);
        setSuggestedLeverageType(null);
      }
      // Reset suggestion state
      setSuggestedTagIds([]);
      setShowSuggestion(false);
      setSuggestionSource(null);
      // Reset classification suggestion state
      setAiClassification(null);
      setShowClassificationSuggestion(false);
    }
  }, [open, editBlock, initialDate, initialTime, initialEndTime, today]);

  // Infer leverage type when activity name changes
  useEffect(() => {
    if (!activityName || activityName.length < 3 || !open || leverageType) {
      setSuggestedLeverageType(null);
      return;
    }

    const inferred = inferLeverageType(activityName);
    if (inferred) {
      setSuggestedLeverageType(inferred);
    } else {
      setSuggestedLeverageType(null);
    }
  }, [activityName, open, leverageType]);

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
        setSuggestionConfidence(suggestion.confidence);
      }
    }
  }, [activityName, tags, getSuggestion, shouldAutoApply, selectedTagIds.length, open]);

  // Debounced AI classification when activity name changes
  useEffect(() => {
    // Clear any pending timeout
    if (classifyTimeoutRef.current) {
      clearTimeout(classifyTimeoutRef.current);
    }

    // Don't classify if:
    // - Activity name is too short
    // - Dialog is closed
    // - Activity type is already set (user has classified it)
    // - We're editing an existing block that already has a classification
    if (!activityName || activityName.length < 5 || !open || activityType) {
      setAiClassification(null);
      setShowClassificationSuggestion(false);
      return;
    }

    // Debounce the classification call by 800ms
    classifyTimeoutRef.current = setTimeout(async () => {
      setIsClassifying(true);
      try {
        const response = await fetch('/api/ai/classify-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activityName,
            description,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.confidence >= 0.5) {
            setAiClassification(result);
            setShowClassificationSuggestion(true);
          }
        }
      } catch (error) {
        console.error('AI classification error:', error);
      } finally {
        setIsClassifying(false);
      }
    }, 800);

    return () => {
      if (classifyTimeoutRef.current) {
        clearTimeout(classifyTimeoutRef.current);
      }
    };
  }, [activityName, description, open, activityType]);

  // Accept AI classification
  const acceptClassification = useCallback(() => {
    if (!aiClassification) return;

    setActivityType(aiClassification.activityType);

    // If a project was detected, try to match or create it
    if (aiClassification.projectName) {
      const existingProject = detectedProjects.find(
        (p) => p.name.toLowerCase() === aiClassification.projectName?.toLowerCase()
      );
      if (existingProject) {
        setDetectedProjectId(existingProject.id);
        setDetectedProjectName(existingProject.name);
      } else {
        // Just set the name, a new project will be created on save
        setDetectedProjectName(aiClassification.projectName);
      }
    }

    // If a meeting category was detected, try to match it
    if (aiClassification.meetingCategory) {
      const existingCategory = meetingCategories.find(
        (c) => c.name.toLowerCase() === aiClassification.meetingCategory?.toLowerCase()
      );
      if (existingCategory) {
        setMeetingCategoryId(existingCategory.id);
        setMeetingCategoryName(existingCategory.name);
      } else {
        // Just set the name for now
        setMeetingCategoryName(aiClassification.meetingCategory);
      }
    }

    setShowClassificationSuggestion(false);
  }, [aiClassification, detectedProjects, meetingCategories]);

  // Dismiss classification
  const dismissClassification = useCallback(() => {
    setShowClassificationSuggestion(false);
    setAiClassification(null);
  }, []);

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
          setSuggestionConfidence(result.confidence ?? 0.75);
        }
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
    } finally {
      setIsLoadingAISuggestion(false);
    }
  }, [activityName, description, tags, isLoadingAISuggestion]);

  // Accept a single suggested tag
  const acceptSuggestion = useCallback((tag: Tag) => {
    setSelectedTagIds(prev => [...new Set([...prev, tag.id])]);
    setSuggestedTagIds(prev => {
      const remaining = prev.filter(id => id !== tag.id);
      if (remaining.length === 0) setShowSuggestion(false);
      return remaining;
    });
  }, []);

  // Dismiss a single suggestion
  const dismissSuggestion = useCallback((tag: Tag) => {
    setSuggestedTagIds(prev => {
      const remaining = prev.filter(id => id !== tag.id);
      if (remaining.length === 0) setShowSuggestion(false);
      return remaining;
    });
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
      valueQuadrant,
      energyRating,
      leverageType: leverageType || undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      // Activity classification fields
      activityType: activityType || undefined,
      detectedProjectId: detectedProjectId || undefined,
      detectedProjectName: detectedProjectName || undefined,
      meetingCategoryId: meetingCategoryId || undefined,
      meetingCategoryName: meetingCategoryName || undefined,
      aiClassificationConfidence: aiClassification?.confidence,
      // Recurring event fields
      isRecurring: isRecurring || undefined,
      recurrenceRule: isRecurring ? recurrenceRule : undefined,
      recurrenceEndDate: isRecurring && recurrenceEndDate ? recurrenceEndDate : undefined,
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!editBlock || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(editBlock);
      onOpenChange(false);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSkip = async () => {
    if (!editBlock || !onSkip) return;

    setIsSkipping(true);
    try {
      await onSkip(editBlock);
      onOpenChange(false);
    } catch (error) {
      console.error('Skip error:', error);
    } finally {
      setIsSkipping(false);
    }
  };

  // Check if this is a Google Calendar event
  const isGoogleCalendarEvent = editBlock?.source === 'google_calendar' || editBlock?.externalEventId;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent draggable className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader draggable>
          <DialogTitle>{editBlock ? 'Edit Time Block' : 'Log Time Block'}</DialogTitle>
          <DialogDescription>
            Drag to move • Record how you spent your time and categorize it by Value quadrant.
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

          {/* AI Classification Suggestion */}
          {showClassificationSuggestion && aiClassification && (
            <div className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-md text-sm animate-in fade-in slide-in-from-top-1 border border-indigo-100 dark:border-indigo-900">
              <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-700 dark:text-indigo-300">AI suggests:</span>
                  <Badge variant="secondary" className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                    {ACTIVITY_TYPE_OPTIONS.find(o => o.value === aiClassification.activityType)?.label || aiClassification.activityType}
                  </Badge>
                  {aiClassification.projectName && (
                    <Badge variant="outline" className="text-xs">
                      {aiClassification.projectName}
                    </Badge>
                  )}
                  {aiClassification.meetingCategory && (
                    <Badge variant="outline" className="text-xs">
                      {aiClassification.meetingCategory}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{aiClassification.reasoning}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={acceptClassification}
                  className="h-6 w-6 p-0 hover:bg-indigo-200 dark:hover:bg-indigo-800"
                >
                  <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={dismissClassification}
                  className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                >
                  <X className="h-3 w-3 text-red-600" />
                </Button>
              </div>
            </div>
          )}

          {/* Classifying indicator */}
          {isClassifying && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Analyzing activity...</span>
            </div>
          )}

          {/* Activity Type */}
          <div className="space-y-2">
            <Label>Activity Type</Label>
            <Select
              value={activityType || ''}
              onValueChange={(v) => setActivityType(v as ActivityType || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select activity type..." />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Project Selection (only show for project type) */}
          {activityType === 'project' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <Label>Project</Label>
              <Select
                value={detectedProjectId || 'new'}
                onValueChange={(v) => {
                  if (v === 'new') {
                    setDetectedProjectId(undefined);
                    setDetectedProjectName(undefined);
                    setShowCustomProjectInput(true);
                    setCustomProjectName('');
                  } else {
                    const project = detectedProjects.find(p => p.id === v);
                    if (project) {
                      setDetectedProjectId(project.id);
                      setDetectedProjectName(project.name);
                      setShowCustomProjectInput(false);
                      setCustomProjectName('');
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select or create project..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">
                    <span className="text-muted-foreground">+ New project</span>
                  </SelectItem>
                  {detectedProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom project name input - show when no existing project is selected */}
              {!detectedProjectId && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label htmlFor="customProjectName">New Project Name</Label>
                  <Input
                    id="customProjectName"
                    placeholder="Enter project name (or leave empty for activity name)"
                    value={customProjectName}
                    onChange={(e) => {
                      setCustomProjectName(e.target.value);
                      setDetectedProjectName(e.target.value || undefined);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use the activity name as the project name
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Meeting Category (only show for meeting type) */}
          {activityType === 'meeting' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <Label>Meeting Category</Label>
              <Select
                value={meetingCategoryId || ''}
                onValueChange={(v) => {
                  const category = meetingCategories.find(c => c.id === v);
                  if (category) {
                    setMeetingCategoryId(category.id);
                    setMeetingCategoryName(category.name);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meeting type..." />
                </SelectTrigger>
                <SelectContent>
                  {meetingCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Recurring Event */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="recurring">Repeat</Label>
              </div>
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            {isRecurring && (
              <div className="space-y-3 pl-6 border-l-2 border-muted animate-in fade-in slide-in-from-top-1">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={recurrenceRule} onValueChange={setRecurrenceRule}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrenceEndDate">End Date (Optional)</Label>
                  <Input
                    id="recurrenceEndDate"
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    min={date}
                    placeholder="No end date"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for no end date
                  </p>
                </div>

                {/* Show indicator if editing a recurring event instance */}
                {editBlock?.parentBlockId && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md text-xs text-amber-800 dark:text-amber-200">
                    <strong>Note:</strong> This is an instance of a recurring event.
                    Changes will only apply to this occurrence.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Value Quadrant */}
          <div className="space-y-3">
            <Label>Value Quadrant</Label>
            <Select value={valueQuadrant} onValueChange={(v) => setValueQuadrant(v as ValueQuadrant)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VALUE_OPTIONS.map((option) => (
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

          {/* Leverage Type (4 C's) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Leverage Type (Optional)</Label>
              {suggestedLeverageType && !leverageType && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeverageType(suggestedLeverageType)}
                  className="h-6 text-xs gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Use suggested: {LEVERAGE_TYPE_OPTIONS.find(o => o.value === suggestedLeverageType)?.label}
                </Button>
              )}
            </div>
            <Select
              value={leverageType || 'none'}
              onValueChange={(v) => setLeverageType(v === 'none' ? undefined : v as LeverageType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select if this is leverage work..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Not leverage work</span>
                </SelectItem>
                {LEVERAGE_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${option.color}`} />
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">- {option.description}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Tag leverage work (Code, Content, Capital, Collaboration) to track ROI on the Leverage page.
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tags</Label>
              <div className="flex gap-1">
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTagManager(true)}
                  className="h-7 text-xs text-muted-foreground"
                >
                  Manage
                </Button>
              </div>
            </div>
            <TagInput
              value={tags.filter(t => selectedTagIds.includes(t.id))}
              onChange={(selectedTags) => setSelectedTagIds(selectedTags.map(t => t.id))}
              onCreateTag={async (name) => {
                const tag = await createTag(name);
                return tag;
              }}
              onSearch={async (query) => {
                try {
                  const res = await fetch(`/api/tags?query=${encodeURIComponent(query)}&limit=15`);
                  if (!res.ok) return tags.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
                  const data = await res.json();
                  return data.tags || [];
                } catch {
                  return tags.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
                }
              }}
              availableTags={tags}
              suggestedTags={showSuggestion ? suggestedTagIds.map(id => {
                const tag = tags.find(t => t.id === id);
                return tag ? { tag, confidence: suggestionConfidence } : null;
              }).filter((s): s is { tag: Tag; confidence: number } => s !== null) : undefined}
              onAcceptSuggestion={(tag) => {
                acceptSuggestion(tag);
              }}
              onDismissSuggestion={(tag) => {
                dismissSuggestion(tag);
              }}
              placeholder="Type to add tags..."
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto sm:mr-auto">
              {editBlock && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting || isSkipping}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              )}
              {editBlock && onSkip && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isDeleting || isSkipping}
                  className="text-muted-foreground hover:text-foreground"
                  title={isGoogleCalendarEvent ? "Ignore this calendar event" : "Remove this time block"}
                >
                  {isSkipping ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isGoogleCalendarEvent ? 'Ignoring...' : 'Removing...'}
                    </>
                  ) : (
                    <>
                      <SkipForward className="h-4 w-4 mr-2" />
                      {isGoogleCalendarEvent ? 'Ignore' : 'Skip'}
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 sm:flex-none">
                {editBlock ? 'Save Changes' : 'Log Time Block'}
              </Button>
            </div>
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
