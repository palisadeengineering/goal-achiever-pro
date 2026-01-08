'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { GoogleEventCategorizer } from './google-event-categorizer';
import { DRIP_QUADRANTS, ENERGY_RATINGS } from '@/constants/drip';
import type { DripQuadrant, EnergyRating } from '@/types/database';
import type { GoogleCalendarEvent } from '@/lib/hooks/use-google-calendar';
import { CheckCircle2, ListTodo, Sparkles, ArrowLeft, X } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

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

interface PatternSuggestion {
  dripQuadrant: DripQuadrant;
  energyRating: EnergyRating;
  confidence: number;
  pattern: string;
}

interface BulkCategorizationViewProps {
  events: GoogleCalendarEvent[];
  onComplete?: () => void;
  // Pass these from parent to ensure shared state
  saveCategorization: (eventId: string, eventName: string, dripQuadrant: DripQuadrant, energyRating: EnergyRating) => void;
  isCategorized: (eventId: string) => boolean;
  getSuggestion: (eventName: string) => PatternSuggestion | null;
  applySuggestionToSimilar: (events: Array<{ id: string; summary: string }>, dripQuadrant: DripQuadrant, energyRating: EnergyRating) => void;
}

interface GroupedEvents {
  pattern: string;
  events: GoogleCalendarEvent[];
  suggestion: {
    dripQuadrant: DripQuadrant;
    energyRating: EnergyRating;
    confidence: number;
  } | null;
}

export function BulkCategorizationView({
  events,
  onComplete,
  saveCategorization,
  isCategorized,
  getSuggestion,
  applySuggestionToSimilar,
}: BulkCategorizationViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter to only uncategorized events
  const uncategorizedEvents = useMemo(
    () => events.filter((event) => !isCategorized(event.id)),
    [events, isCategorized]
  );

  // Group similar events for bulk categorization
  const groupedEvents = useMemo(() => {
    const groups: Map<string, GroupedEvents> = new Map();

    uncategorizedEvents.forEach((event) => {
      // Create a normalized key for grouping
      const normalizedName = event.summary
        .toLowerCase()
        .trim()
        .replace(/\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?/g, '') // Remove dates
        .replace(/\s+/g, ' ')
        .trim();

      const existing = groups.get(normalizedName);
      const suggestion = getSuggestion(event.summary);

      if (existing) {
        existing.events.push(event);
      } else {
        groups.set(normalizedName, {
          pattern: normalizedName,
          events: [event],
          suggestion: suggestion,
        });
      }
    });

    // Convert to array and sort by count (largest groups first)
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

  const handleCategorize = (
    eventId: string,
    dripQuadrant: DripQuadrant,
    energyRating: EnergyRating
  ) => {
    const event = uncategorizedEvents.find((e) => e.id === eventId);
    if (event) {
      saveCategorization(eventId, event.summary, dripQuadrant, energyRating);
    }
    // Move to next event
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

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleApplyAllSuggestions = () => {
    eventsWithSuggestions.forEach((event) => {
      const suggestion = getSuggestion(event.summary);
      if (suggestion) {
        saveCategorization(event.id, event.summary, suggestion.dripQuadrant, suggestion.energyRating);
      }
    });
  };

  const handleApplyToGroup = (
    group: GroupedEvents,
    dripQuadrant: DripQuadrant,
    energyRating: EnergyRating
  ) => {
    applySuggestionToSimilar(
      group.events.map((e) => ({ id: e.id, summary: e.summary })),
      dripQuadrant,
      energyRating
    );
  };

  if (uncategorizedEvents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
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
            {uncategorizedEvents.length} event{uncategorizedEvents.length !== 1 ? 's' : ''} need
            categorization
          </p>
        </div>
        <div className="flex items-center gap-2">
          {eventsWithSuggestions.length > 0 && (
            <Button variant="outline" onClick={handleApplyAllSuggestions}>
              <Sparkles className="h-4 w-4 mr-2" />
              Apply {eventsWithSuggestions.length} Suggestion
              {eventsWithSuggestions.length !== 1 ? 's' : ''}
            </Button>
          )}
          {onComplete && (
            <Button variant="outline" onClick={onComplete}>
              <X className="h-4 w-4 mr-2" />
              Done
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single" className="gap-2">
            <ListTodo className="h-4 w-4" />
            One by One
          </TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2">
            <Sparkles className="h-4 w-4" />
            By Group ({groupedEvents.length})
          </TabsTrigger>
        </TabsList>

        {/* Single Event Mode */}
        <TabsContent value="single" className="mt-4">
          <div className="space-y-4">
            {/* Progress indicator with back button */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={currentIndex === 0}
                className="h-7 px-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
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
                onBack={handleBack}
                canGoBack={currentIndex > 0}
                suggestion={getSuggestion(uncategorizedEvents[currentIndex].summary)}
              />
            )}
          </div>
        </TabsContent>

        {/* Bulk Mode */}
        <TabsContent value="bulk" className="mt-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {groupedEvents.map((group) => (
                <GroupCard
                  key={group.pattern}
                  group={group}
                  onApply={handleApplyToGroup}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Group Card Component
interface GroupCardProps {
  group: GroupedEvents;
  onApply: (group: GroupedEvents, dripQuadrant: DripQuadrant, energyRating: EnergyRating) => void;
}

function GroupCard({ group, onApply }: GroupCardProps) {
  const [selectedDrip, setSelectedDrip] = useState<DripQuadrant | null>(
    group.suggestion?.dripQuadrant || null
  );
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyRating | null>(
    group.suggestion?.energyRating || null
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApply = () => {
    if (selectedDrip && selectedEnergy) {
      onApply(group, selectedDrip, selectedEnergy);
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
                  • {Math.round(group.suggestion.confidence * 100)}% confidence suggestion
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

                // Calculate duration
                let durationText = '';
                if (startTime && endTime) {
                  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
                  const hours = Math.floor(durationMinutes / 60);
                  const mins = durationMinutes % 60;
                  if (hours > 0 && mins > 0) {
                    durationText = `${hours}h ${mins}m`;
                  } else if (hours > 0) {
                    durationText = `${hours}h`;
                  } else if (mins > 0) {
                    durationText = `${mins}m`;
                  }
                }

                return (
                  <div
                    key={event.id}
                    className="text-sm py-1.5 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{event.summary}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      {startTime && (
                        <span>{format(startTime, 'MMM d, yyyy')}</span>
                      )}
                      {startTime && endTime && (
                        <span>{format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</span>
                      )}
                      {durationText && (
                        <span className="text-primary">({durationText})</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick category selection */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(DRIP_QUADRANTS) as [DripQuadrant, typeof DRIP_QUADRANTS[DripQuadrant]][]).map(
            ([key, quadrant]) => (
              <Badge
                key={key}
                variant="outline"
                className={cn(
                  'cursor-pointer transition-colors',
                  selectedDrip === key && 'ring-2 ring-offset-1'
                )}
                style={{
                  borderColor: selectedDrip === key ? quadrant.color : undefined,
                  backgroundColor: selectedDrip === key ? `${quadrant.color}15` : undefined,
                  ['--tw-ring-color' as string]: quadrant.color,
                }}
                onClick={() => setSelectedDrip(key)}
              >
                <span
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: quadrant.color }}
                />
                {quadrant.name}
              </Badge>
            )
          )}
        </div>

        <div className="flex flex-wrap gap-2">
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
                <span
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: rating.color }}
                />
                {rating.name}
              </Badge>
            )
          )}
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!selectedDrip || !selectedEnergy}
          >
            Apply to {group.events.length} event{group.events.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
