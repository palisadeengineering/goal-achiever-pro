'use client';

import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calendar, Clock, Loader2, Sparkles } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ValueQuadrant, EnergyRating } from '@/types/database';

export interface EventListItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  activityName: string;
  valueQuadrant?: ValueQuadrant;
  energyRating?: EnergyRating;
  source?: string;
  externalEventId?: string;
}

interface EventListProps {
  events: EventListItem[];
  dateRange: { start: Date; end: Date };
  onDelete: (event: EventListItem) => Promise<void>;
  onAISuggest?: () => void;
  isLoading?: boolean;
  isDeleting?: boolean;
}

// Value quadrant colors
const valueColors: Record<ValueQuadrant, string> = {
  delegation: 'bg-red-100 text-red-700 border-red-200',
  replacement: 'bg-amber-100 text-amber-700 border-amber-200',
  investment: 'bg-purple-100 text-purple-700 border-purple-200',
  production: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  na: 'bg-blue-100 text-blue-700 border-blue-200',
};

// Energy rating colors
const energyColors: Record<EnergyRating, string> = {
  green: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  red: 'bg-red-100 text-red-700 border-red-200',
};

export function EventList({
  events,
  dateRange,
  onDelete,
  onAISuggest,
  isLoading = false,
  isDeleting = false,
}: EventListProps) {
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<EventListItem | null>(null);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, EventListItem[]> = {};

    // Filter events within date range and sort
    const filteredEvents = events
      .filter(event => {
        const eventDate = event.date;
        const startStr = format(dateRange.start, 'yyyy-MM-dd');
        const endStr = format(dateRange.end, 'yyyy-MM-dd');
        return eventDate >= startStr && eventDate <= endStr;
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });

    filteredEvents.forEach(event => {
      if (!groups[event.date]) {
        groups[event.date] = [];
      }
      groups[event.date].push(event);
    });

    return groups;
  }, [events, dateRange]);

  const sortedDates = Object.keys(groupedEvents).sort();

  const handleDeleteClick = (event: EventListItem) => {
    setDeleteConfirmEvent(event);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmEvent) {
      await onDelete(deleteConfirmEvent);
      setDeleteConfirmEvent(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading events...</p>
      </div>
    );
  }

  // Empty state
  if (sortedDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
        <p className="text-muted-foreground max-w-md">
          No events found in the selected date range. Sync your Google Calendar to see events here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with AI Suggestions button */}
      {onAISuggest && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {events.length} event{events.length !== 1 ? 's' : ''} in range
          </p>
          <Button variant="outline" size="sm" onClick={onAISuggest}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Suggestions
          </Button>
        </div>
      )}

      {/* Events grouped by day */}
      {sortedDates.map(date => {
        const dayEvents = groupedEvents[date];
        const dateObj = parseISO(date);
        const dayLabel = format(dateObj, 'EEEE, MMM d');

        return (
          <div key={date} className="space-y-3">
            {/* Day header */}
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{dayLabel}</h3>
              <Badge variant="secondary" className="text-xs">
                {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Event cards */}
            <div className="space-y-2">
              {dayEvents.map(event => (
                <Card key={event.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      {/* Event info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{event.activityName}</h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{event.startTime} - {event.endTime}</span>
                        </div>
                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {event.valueQuadrant && event.valueQuadrant !== 'na' && (
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize ${valueColors[event.valueQuadrant]}`}
                            >
                              {event.valueQuadrant}
                            </Badge>
                          )}
                          {event.energyRating && (
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize ${energyColors[event.energyRating]}`}
                            >
                              {event.energyRating === 'green' ? 'Energizing' :
                               event.energyRating === 'red' ? 'Draining' : 'Neutral'}
                            </Badge>
                          )}
                          {event.source === 'google_calendar' && (
                            <Badge variant="secondary" className="text-xs">
                              Google
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteClick(event)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmEvent} onOpenChange={(open) => !open && setDeleteConfirmEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteConfirmEvent?.activityName}&quot;?
              {deleteConfirmEvent?.externalEventId && (
                <span className="block mt-2 text-amber-600">
                  This will also delete the event from your Google Calendar.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
