'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useEventPatterns, type IgnoredEvent } from '@/lib/hooks/use-event-patterns';
import { useTags } from '@/lib/hooks/use-tags';
import type { Tag } from '@/lib/hooks/use-tags';
import { TagInput } from '@/components/shared/tag-input';
import { GoogleEventCategorizer } from './google-event-categorizer';
import { VALUE_QUADRANTS, ENERGY_RATINGS } from '@/constants/drip';
import type { ValueQuadrant, EnergyRating, LeverageType } from '@/types/database';
import type { EnhancedCategorizationFields } from '@/lib/hooks/use-event-patterns';
import type { GoogleCalendarEvent } from '@/lib/hooks/use-google-calendar';
import { Input } from '@/components/ui/input';
import { CheckCircle2, ListTodo, Sparkles, EyeOff, Eye, Undo2, Trash2, Briefcase, Code, FileText, DollarSign, Users, Plus } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

// Activity Type options (broad task classification)
const ACTIVITY_TYPE_OPTIONS = [
  { value: 'project', label: 'Project Work' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'deep_work', label: 'Deep Work' },
  { value: 'commute', label: 'Commute' },
  { value: 'admin', label: 'Admin' },
  { value: 'break', label: 'Break' },
  { value: 'other', label: 'Other' },
];

// Work Type options (specific work category)
const WORK_TYPE_OPTIONS = [
  { value: 'design_engineering', label: 'Design/Engineering' },
  { value: 'calculations', label: 'Calculations' },
  { value: 'drafting_revit', label: 'Drafting/Revit' },
  { value: 'qaqc_review', label: 'QAQC/Review' },
  { value: 'project_management', label: 'Project Management' },
  { value: 'client_communication', label: 'Client Communication' },
  { value: 'business_development', label: 'Business Development/Sales' },
  { value: 'marketing_content', label: 'Marketing/Content' },
  { value: 'admin_operations', label: 'Admin/Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'hiring_recruiting', label: 'Hiring/Recruiting' },
  { value: 'training', label: 'Training/Team Development' },
  { value: 'site_visit', label: 'Site Visit/Field Work' },
  { value: 'personal', label: 'Personal' },
];

const LEVERAGE_TYPE_OPTIONS: { value: LeverageType | 'none'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'none', label: 'Not leverage work', icon: Briefcase },
  { value: 'code', label: 'Code', icon: Code },
  { value: 'content', label: 'Content', icon: FileText },
  { value: 'capital', label: 'Capital', icon: DollarSign },
  { value: 'collaboration', label: 'Collaboration', icon: Users },
];

// Safe date parsing helper
function safeParseDate(dateString: string | undefined | null): Date | null {
  if (!dateString || typeof dateString !== 'string' || dateString.trim() === '') {
    return null;
  }
  try {
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

interface BulkCategorizationViewProps {
  events: GoogleCalendarEvent[];
  onComplete?: () => void;
  onCategorize?: () => void;
}

export interface GroupedEvents {
  pattern: string;
  events: GoogleCalendarEvent[];
  suggestion: {
    valueQuadrant: ValueQuadrant;
    energyRating: EnergyRating;
    confidence: number;
  } | null;
}

export function BulkCategorizationView({ events, onComplete, onCategorize }: BulkCategorizationViewProps) {
  const {
    getSuggestion,
    saveCategorization,
    isCategorized,
    applySuggestionToSimilar,
    ignoreEvent,
    unignoreEvent,
    isIgnored,
    ignoredEvents,
    clearIgnoredEvents,
  } = useEventPatterns();

  const { tags, createTag } = useTags();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'ignored'>('single');

  // Detected projects for project selector
  const [detectedProjects, setDetectedProjects] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    fetch('/api/detected-projects')
      .then((res) => res.ok ? res.json() : { projects: [] })
      .then((data) => setDetectedProjects(data.projects || []))
      .catch(() => setDetectedProjects([]));
  }, []);

  // Filter to only uncategorized events (excluding ignored)
  const uncategorizedEvents = useMemo(
    () => events.filter((event) => !isCategorized(event.id) && !isIgnored(event.id)),
    [events, isCategorized, isIgnored]
  );

  // Reset currentIndex when uncategorizedEvents changes
  const prevUncategorizedLength = useRef(uncategorizedEvents.length);
  useEffect(() => {
    if (
      prevUncategorizedLength.current !== uncategorizedEvents.length ||
      currentIndex >= uncategorizedEvents.length
    ) {
      setCurrentIndex(0); // eslint-disable-line react-hooks/set-state-in-effect
    }
    prevUncategorizedLength.current = uncategorizedEvents.length;
  }, [uncategorizedEvents.length, currentIndex]);

  // Group ignored events by pattern
  const groupedIgnoredEvents = useMemo(() => {
    const groups: Map<string, { pattern: string; events: IgnoredEvent[] }> = new Map();
    ignoredEvents.forEach((ignoredEvent) => {
      const normalizedName = ignoredEvent.eventName
        .toLowerCase().trim()
        .replace(/\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?/g, '')
        .replace(/\s+/g, ' ').trim();
      const existing = groups.get(normalizedName);
      if (existing) {
        existing.events.push(ignoredEvent);
      } else {
        groups.set(normalizedName, { pattern: normalizedName, events: [ignoredEvent] });
      }
    });
    return Array.from(groups.values()).sort((a, b) => b.events.length - a.events.length);
  }, [ignoredEvents]);

  // Auto-switch to ignored tab when all events are categorized but there are ignored events
  useEffect(() => {
    if (uncategorizedEvents.length === 0 && ignoredEvents.length > 0) {
      setActiveTab('ignored'); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [uncategorizedEvents.length, ignoredEvents.length]);

  // Group similar events for bulk categorization
  const groupedEvents = useMemo(() => {
    const groups: Map<string, GroupedEvents> = new Map();
    uncategorizedEvents.forEach((event) => {
      const normalizedName = event.summary
        .toLowerCase().trim()
        .replace(/\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?/g, '')
        .replace(/\s+/g, ' ').trim();
      const existing = groups.get(normalizedName);
      const suggestion = getSuggestion(event.summary);
      if (existing) {
        existing.events.push(event);
      } else {
        groups.set(normalizedName, { pattern: normalizedName, events: [event], suggestion });
      }
    });
    return Array.from(groups.values()).sort((a, b) => b.events.length - a.events.length);
  }, [uncategorizedEvents, getSuggestion]);

  // Count events with suggestions
  const eventsWithSuggestions = useMemo(
    () => uncategorizedEvents.filter((e) => {
      const suggestion = getSuggestion(e.summary);
      return suggestion !== null && suggestion.confidence >= 0.5;
    }),
    [uncategorizedEvents, getSuggestion]
  );

  const handleCategorize = (eventId: string, valueQuadrant: ValueQuadrant, energyRating: EnergyRating) => {
    const event = uncategorizedEvents.find((e) => e.id === eventId);
    if (event) {
      saveCategorization(eventId, event.summary, valueQuadrant, energyRating);
      onCategorize?.();
    }
    if (currentIndex < uncategorizedEvents.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (currentIndex < uncategorizedEvents.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handleIgnore = (eventId: string, eventName: string) => {
    ignoreEvent(eventId, eventName);
    onCategorize?.();
    if (currentIndex >= uncategorizedEvents.length - 1) {
      if (onComplete) onComplete();
    }
  };

  const handleUnignore = (eventId: string) => {
    unignoreEvent(eventId);
    onCategorize?.();
  };

  const handleApplyAllSuggestions = () => {
    eventsWithSuggestions.forEach((event) => {
      const suggestion = getSuggestion(event.summary);
      if (suggestion) {
        saveCategorization(event.id, event.summary, suggestion.valueQuadrant, suggestion.energyRating);
      }
    });
    onCategorize?.();
  };

  const handleApplyToGroup = (
    group: GroupedEvents,
    valueQuadrant: ValueQuadrant,
    energyRating: EnergyRating,
    enhanced?: EnhancedCategorizationFields
  ) => {
    applySuggestionToSimilar(
      group.events.map((e) => ({ id: e.id, summary: e.summary })),
      valueQuadrant,
      energyRating,
      enhanced
    );
    onCategorize?.();
  };

  const handleIgnoreGroup = (group: GroupedEvents) => {
    group.events.forEach((event) => {
      ignoreEvent(event.id, event.summary);
    });
    onCategorize?.();
  };

  // Tag search function (shared across all group cards)
  const searchTags = useCallback(async (query: string): Promise<Tag[]> => {
    try {
      const res = await fetch(`/api/tags?query=${encodeURIComponent(query)}&limit=15`);
      if (!res.ok) return tags.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
      const data = await res.json();
      return data.tags || [];
    } catch {
      return tags.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
    }
  }, [tags]);

  const handleCreateTag = useCallback(async (name: string): Promise<Tag | null> => {
    return await createTag(name);
  }, [createTag]);

  // Show "All categorized" only when there are no uncategorized AND no ignored events
  if (uncategorizedEvents.length === 0 && ignoredEvents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-cyan-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">All events categorized!</h3>
          <p className="text-muted-foreground">
            All your Google Calendar events have been categorized.
          </p>
          {onComplete && (
            <Button onClick={onComplete} className="mt-4">
              Done
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Categorize Events</h2>
          <p className="text-sm text-muted-foreground">
            {uncategorizedEvents.length > 0 ? (
              <>
                {uncategorizedEvents.length} event{uncategorizedEvents.length !== 1 ? 's' : ''} need
                categorization
              </>
            ) : (
              <>All events categorized &bull; {ignoredEvents.length} ignored</>
            )}
          </p>
        </div>
        {eventsWithSuggestions.length > 0 && (
          <Button variant="outline" onClick={handleApplyAllSuggestions}>
            <Sparkles className="h-4 w-4 mr-2" />
            Apply {eventsWithSuggestions.length} Suggestion
            {eventsWithSuggestions.length !== 1 ? 's' : ''}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'single' | 'bulk' | 'ignored')}>
        <TabsList>
          <TabsTrigger value="single" className="gap-2">
            <ListTodo className="h-4 w-4" />
            One by One
          </TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2">
            <Sparkles className="h-4 w-4" />
            By Group ({groupedEvents.length})
          </TabsTrigger>
          <TabsTrigger value="ignored" className="gap-2">
            <EyeOff className="h-4 w-4" />
            Ignored ({ignoredEvents.length})
          </TabsTrigger>
        </TabsList>

        {/* Single Event Mode */}
        <TabsContent value="single" className="mt-4">
          {uncategorizedEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-cyan-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">All events categorized!</h3>
                <p className="text-muted-foreground">
                  Check the Ignored tab to view or unignore events.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Progress indicator */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Event {Math.min(currentIndex + 1, uncategorizedEvents.length)} of{' '}
                  {uncategorizedEvents.length}
                </span>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${((currentIndex + 1) / uncategorizedEvents.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {uncategorizedEvents[currentIndex] && (
                <GoogleEventCategorizer
                  event={uncategorizedEvents[currentIndex]}
                  onCategorize={handleCategorize}
                  onSkip={handleSkip}
                  onIgnore={handleIgnore}
                />
              )}
            </div>
          )}
        </TabsContent>

        {/* Bulk Mode */}
        <TabsContent value="bulk" className="mt-4">
          {groupedEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-cyan-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No groups to categorize</h3>
                <p className="text-muted-foreground">
                  Check the Ignored tab to view or unignore events.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {groupedEvents.map((group) => (
                  <GroupCard
                    key={group.pattern}
                    group={group}
                    onApply={handleApplyToGroup}
                    onIgnore={handleIgnoreGroup}
                    tags={tags}
                    onCreateTag={handleCreateTag}
                    onSearchTags={searchTags}
                    detectedProjects={detectedProjects}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Ignored Events */}
        <TabsContent value="ignored" className="mt-4 space-y-4">
          {ignoredEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No ignored events</h3>
                <p className="text-muted-foreground">
                  Events you choose to ignore will appear here. You can unignore them to categorize later.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {ignoredEvents.length} event{ignoredEvents.length !== 1 ? 's' : ''} ignored
                  {groupedIgnoredEvents.length > 1 && ` \u2022 ${groupedIgnoredEvents.length} groups`}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearIgnoredEvents();
                    onCategorize?.();
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {groupedIgnoredEvents.map((group) => (
                    <IgnoredGroupCard
                      key={group.pattern}
                      group={group}
                      events={events}
                      onUnignore={handleUnignore}
                      onUnignoreGroup={(groupEvents) => {
                        groupEvents.forEach((e) => handleUnignore(e.eventId));
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========================================================
// Enhanced Group Card Component - Bulk Categorization Cockpit
// ========================================================
interface GroupCardProps {
  group: GroupedEvents;
  onApply: (group: GroupedEvents, valueQuadrant: ValueQuadrant, energyRating: EnergyRating, enhanced?: EnhancedCategorizationFields) => void;
  onIgnore: (group: GroupedEvents) => void;
  tags: Tag[];
  onCreateTag: (name: string) => Promise<Tag | null>;
  onSearchTags: (query: string) => Promise<Tag[]>;
  detectedProjects: { id: string; name: string }[];
}

export function GroupCard({ group, onApply, onIgnore, tags, onCreateTag, onSearchTags, detectedProjects }: GroupCardProps) {
  const [selectedValue, setSelectedValue] = useState<ValueQuadrant | null>(
    group.suggestion?.valueQuadrant || null
  );
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyRating | null>(
    group.suggestion?.energyRating || null
  );
  const [isExpanded, setIsExpanded] = useState(false);

  // Enhanced categorization fields - always visible
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [customProjectName, setCustomProjectName] = useState<string>('');
  const [selectedActivityType, setSelectedActivityType] = useState<string>('');
  const [selectedWorkType, setSelectedWorkType] = useState<string>('');
  const [selectedLeverage, setSelectedLeverage] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!selectedValue || !selectedEnergy) return;

    setIsApplying(true);
    try {
      // Build enhanced fields for categorization persistence
      const isExistingProject = selectedProject && selectedProject !== 'none';
      const isNewProject = showNewProjectInput && customProjectName.trim();
      const hasLeverage = selectedLeverage && selectedLeverage !== 'none';

      const enhanced: EnhancedCategorizationFields = {};
      let resolvedProjectId: string | undefined;
      let resolvedProjectName: string | undefined;

      if (hasLeverage) {
        enhanced.leverageType = selectedLeverage;
      }
      if (selectedActivityType) {
        enhanced.activityType = selectedActivityType;
      }
      if (selectedWorkType) {
        enhanced.activityCategory = selectedWorkType;
      }

      // Create new project if needed, or use existing
      if (isNewProject) {
        try {
          const createRes = await fetch('/api/detected-projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: customProjectName.trim() }),
          });
          if (createRes.ok) {
            const { project } = await createRes.json();
            resolvedProjectId = project.id;
            resolvedProjectName = project.name || customProjectName.trim();
          } else if (createRes.status === 409) {
            const { existingId } = await createRes.json();
            if (existingId) {
              resolvedProjectId = existingId;
              resolvedProjectName = customProjectName.trim();
            }
          }
        } catch (err) {
          console.error('Failed to create project:', err);
        }
      } else if (isExistingProject) {
        resolvedProjectId = selectedProject;
        resolvedProjectName = detectedProjects.find(p => p.id === selectedProject)?.name || selectedProject;
      }

      if (resolvedProjectId) {
        enhanced.detectedProjectId = resolvedProjectId;
        enhanced.detectedProjectName = resolvedProjectName;
      }

      // Apply categorization with enhanced fields (saves to localStorage + event_categorizations DB)
      onApply(group, selectedValue, selectedEnergy, Object.keys(enhanced).length > 0 ? enhanced : undefined);

      // Also try to update time_blocks directly if they exist (for already-imported events)
      const hasEnhancedFields = resolvedProjectId || selectedWorkType || selectedActivityType ||
        hasLeverage || selectedTags.length > 0;

      if (hasEnhancedFields) {
        const updates: Record<string, unknown> = {};

        if (hasLeverage) {
          updates.leverageType = selectedLeverage;
        }
        if (selectedActivityType) {
          updates.activityType = selectedActivityType;
        }
        if (selectedWorkType) {
          updates.activityCategory = selectedWorkType;
        }
        if (resolvedProjectId) {
          updates.detectedProjectId = resolvedProjectId;
        }
        if (selectedTags.length > 0) {
          updates.tagIds = selectedTags.map(t => t.id);
          updates.tagMode = 'merge';
        }

        // Try to update time_blocks (may find 0 if events not imported yet — that's fine,
        // the enhanced fields are already saved in event_categorizations for later use)
        if (Object.keys(updates).length > 0) {
          const eventIds = group.events.map(e => e.id);
          try {
            await fetch('/api/time-blocks/bulk-update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                blockIds: eventIds,
                idType: 'external',
                updates,
              }),
            });
          } catch (err) {
            console.error('Enhanced bulk update failed:', err);
          }
        }
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base line-clamp-1 capitalize">
              {group.pattern || 'Unnamed Events'}
            </CardTitle>
            <CardDescription>
              {group.events.length} event{group.events.length !== 1 ? 's' : ''}
              {group.suggestion && (
                <span className="ml-2 text-primary">
                  &bull; {Math.round(group.suggestion.confidence * 100)}% confidence suggestion
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide' : 'Show'} events
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Expanded event list */}
        {isExpanded && (
          <div className="p-2 rounded bg-muted/50 mb-3">
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {group.events.map((event) => {
                const startTime = safeParseDate(event.start?.dateTime || event.startTime);
                const endTime = safeParseDate(event.end?.dateTime || event.endTime);
                let durationText = '';
                if (startTime && endTime) {
                  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
                  const hours = Math.floor(durationMinutes / 60);
                  const mins = durationMinutes % 60;
                  if (hours > 0 && mins > 0) durationText = `${hours}h ${mins}m`;
                  else if (hours > 0) durationText = `${hours}h`;
                  else if (mins > 0) durationText = `${mins}m`;
                }
                return (
                  <div key={event.id} className="text-sm py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{event.summary}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      {startTime && <span>{format(startTime, 'MMM d, yyyy')}</span>}
                      {startTime && endTime && (
                        <span>{format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</span>
                      )}
                      {durationText && <span className="text-primary">({durationText})</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Value Quadrant chips */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Value Quadrant</Label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(VALUE_QUADRANTS) as [ValueQuadrant, typeof VALUE_QUADRANTS[ValueQuadrant]][]).map(
              ([key, quadrant]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className={cn(
                    'cursor-pointer transition-colors',
                    selectedValue === key && 'ring-2 ring-offset-1'
                  )}
                  style={{
                    borderColor: selectedValue === key ? quadrant.color : undefined,
                    backgroundColor: selectedValue === key ? `${quadrant.color}15` : undefined,
                    ['--tw-ring-color' as string]: quadrant.color,
                  }}
                  onClick={() => setSelectedValue(key)}
                >
                  <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: quadrant.color }} />
                  {quadrant.name}
                </Badge>
              )
            )}
          </div>
        </div>

        {/* Energy Level chips */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Energy</Label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(ENERGY_RATINGS) as [EnergyRating, typeof ENERGY_RATINGS[EnergyRating]][]).map(
              ([key, rating]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className={cn(
                    'cursor-pointer transition-colors',
                    selectedEnergy === key && 'ring-2 ring-offset-1'
                  )}
                  style={{
                    borderColor: selectedEnergy === key ? rating.color : undefined,
                    backgroundColor: selectedEnergy === key ? `${rating.color}15` : undefined,
                    ['--tw-ring-color' as string]: rating.color,
                  }}
                  onClick={() => setSelectedEnergy(key)}
                >
                  <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: rating.color }} />
                  {rating.name}
                </Badge>
              )
            )}
          </div>
        </div>

        {/* Project chips */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Project</Label>
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                'cursor-pointer transition-colors',
                (!selectedProject || selectedProject === 'none') && !showNewProjectInput && 'ring-2 ring-offset-1 ring-muted-foreground/30'
              )}
              onClick={() => { setSelectedProject('none'); setShowNewProjectInput(false); setCustomProjectName(''); }}
            >
              Personal
            </Badge>
            {detectedProjects.map((project) => (
              <Badge
                key={project.id}
                variant="outline"
                className={cn(
                  'cursor-pointer transition-colors',
                  selectedProject === project.id && 'ring-2 ring-offset-1 ring-primary'
                )}
                onClick={() => { setSelectedProject(project.id); setShowNewProjectInput(false); setCustomProjectName(''); }}
              >
                {project.name}
              </Badge>
            ))}
            <Badge
              variant="outline"
              className={cn(
                'cursor-pointer transition-colors',
                showNewProjectInput && 'ring-2 ring-offset-1 ring-primary'
              )}
              onClick={() => { setShowNewProjectInput(true); setSelectedProject(''); }}
            >
              <Plus className="h-3 w-3 mr-1" />
              New
            </Badge>
          </div>
          {showNewProjectInput && (
            <Input
              className="h-8 text-xs mt-1.5 max-w-xs"
              placeholder="Type project name..."
              value={customProjectName}
              onChange={(e) => setCustomProjectName(e.target.value)}
              autoFocus
            />
          )}
        </div>

        {/* Activity Type (Task Type) chips */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Task Type</Label>
          <div className="flex flex-wrap gap-1.5">
            {ACTIVITY_TYPE_OPTIONS.map((option) => (
              <Badge
                key={option.value}
                variant="outline"
                className={cn(
                  'cursor-pointer transition-colors text-xs',
                  selectedActivityType === option.value && 'ring-2 ring-offset-1 ring-primary bg-primary/10'
                )}
                onClick={() => setSelectedActivityType(selectedActivityType === option.value ? '' : option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Work Type chips */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Work Type</Label>
          <div className="flex flex-wrap gap-1.5">
            {WORK_TYPE_OPTIONS.map((option) => (
              <Badge
                key={option.value}
                variant="outline"
                className={cn(
                  'cursor-pointer transition-colors text-xs',
                  selectedWorkType === option.value && 'ring-2 ring-offset-1 ring-primary bg-primary/10'
                )}
                onClick={() => setSelectedWorkType(selectedWorkType === option.value ? '' : option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Leverage Type chips */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Leverage Type</Label>
          <div className="flex flex-wrap gap-1.5">
            {LEVERAGE_TYPE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedLeverage === option.value;
              return (
                <Badge
                  key={option.value}
                  variant="outline"
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected && 'ring-2 ring-offset-1 ring-primary bg-primary/10'
                  )}
                  onClick={() => setSelectedLeverage(isSelected ? '' : option.value)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {option.label}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Tags</Label>
          <TagInput
            value={selectedTags}
            onChange={setSelectedTags}
            onCreateTag={onCreateTag}
            onSearch={onSearchTags}
            availableTags={tags}
            placeholder="Type to add tags..."
            compact
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center gap-2 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onIgnore(group)}
            className="text-muted-foreground hover:text-foreground"
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Ignore {group.events.length} event{group.events.length !== 1 ? 's' : ''}
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!selectedValue || !selectedEnergy || isApplying}
          >
            {isApplying ? 'Applying...' : `Apply to ${group.events.length} event${group.events.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ========================================================
// Ignored Group Card Component
// ========================================================
interface IgnoredGroupCardProps {
  group: { pattern: string; events: IgnoredEvent[] };
  events: GoogleCalendarEvent[];
  onUnignore: (eventId: string) => void;
  onUnignoreGroup: (events: IgnoredEvent[]) => void;
}

function IgnoredGroupCard({ group, events, onUnignore, onUnignoreGroup }: IgnoredGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base line-clamp-1 capitalize">
              {group.pattern || 'Unnamed Events'}
            </CardTitle>
            <CardDescription>
              {group.events.length} ignored event{group.events.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isExpanded && (
          <div className="p-2 rounded bg-muted/50 mb-3">
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {group.events.map((ignoredEvent) => {
                const fullEvent = events.find(e => e.id === ignoredEvent.eventId);
                const startTime = fullEvent ? safeParseDate(fullEvent.start?.dateTime || fullEvent.startTime) : null;
                const endTime = fullEvent ? safeParseDate(fullEvent.end?.dateTime || fullEvent.endTime) : null;
                return (
                  <div key={ignoredEvent.eventId} className="text-sm py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{ignoredEvent.eventName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUnignore(ignoredEvent.eventId)}
                        className="shrink-0 h-7 px-2"
                      >
                        <Undo2 className="h-3 w-3 mr-1" />
                        Unignore
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      {startTime ? (
                        <>
                          <span>{format(startTime, 'MMM d, yyyy')}</span>
                          {endTime && (
                            <span>{format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</span>
                          )}
                        </>
                      ) : (
                        <span>Ignored {format(new Date(ignoredEvent.ignoredAt), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => onUnignoreGroup(group.events)}>
            <Undo2 className="h-4 w-4 mr-2" />
            Unignore {group.events.length} event{group.events.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
