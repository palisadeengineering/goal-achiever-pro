'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useEventPatterns } from '@/lib/hooks/use-event-patterns';
import { DRIP_QUADRANTS, ENERGY_RATINGS } from '@/constants/drip';
import type { DripQuadrant, EnergyRating } from '@/types/database';
import type { GoogleCalendarEvent } from '@/lib/hooks/use-google-calendar';
import { Calendar, Clock, Sparkles, SkipForward, EyeOff } from 'lucide-react';
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

interface GoogleEventCategorizerProps {
  event: GoogleCalendarEvent;
  onCategorize: (eventId: string, dripQuadrant: DripQuadrant, energyRating: EnergyRating) => void;
  onSkip: () => void;
  onIgnore?: (eventId: string, eventName: string) => void;
}

export function GoogleEventCategorizer({
  event,
  onCategorize,
  onSkip,
  onIgnore,
}: GoogleEventCategorizerProps) {
  const { getSuggestion } = useEventPatterns();
  const suggestion = getSuggestion(event.summary);

  const [selectedDrip, setSelectedDrip] = useState<DripQuadrant | null>(
    suggestion?.dripQuadrant || null
  );
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyRating | null>(
    suggestion?.energyRating || null
  );

  // Update selections when suggestion changes
  useEffect(() => {
    if (suggestion) {
      setSelectedDrip(suggestion.dripQuadrant);
      setSelectedEnergy(suggestion.energyRating);
    }
  }, [suggestion]);

  const handleCategorize = () => {
    if (!selectedDrip || !selectedEnergy) return;
    onCategorize(event.id, selectedDrip, selectedEnergy);
  };

  const handleApplySuggestion = () => {
    if (!suggestion) return;
    onCategorize(event.id, suggestion.dripQuadrant, suggestion.energyRating);
  };

  // Get event time info - use safe parsing to handle invalid/empty dates
  const startTime = safeParseDate(event.start?.dateTime) || safeParseDate(event.start?.date) || safeParseDate(event.startTime);
  const endTime = safeParseDate(event.end?.dateTime) || safeParseDate(event.end?.date) || safeParseDate(event.endTime);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{event.summary}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {startTime && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(startTime, 'MMM d, yyyy')}
                </span>
              )}
              {startTime && endTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                </span>
              )}
            </div>
          </div>
          {suggestion && suggestion.confidence >= 0.5 && (
            <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
              <Sparkles className="h-3 w-3" />
              {Math.round(suggestion.confidence * 100)}% match
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suggestion Banner */}
        {suggestion && (
          <div className="p-3 rounded-lg bg-muted/50 border border-dashed">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Suggested categorization</span>
              </div>
              <Button size="sm" variant="outline" onClick={handleApplySuggestion}>
                Apply
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge
                variant="outline"
                style={{
                  borderColor: DRIP_QUADRANTS[suggestion.dripQuadrant].color,
                  backgroundColor: `${DRIP_QUADRANTS[suggestion.dripQuadrant].color}15`,
                }}
              >
                {DRIP_QUADRANTS[suggestion.dripQuadrant].name}
              </Badge>
              <Badge
                variant="outline"
                style={{
                  borderColor: ENERGY_RATINGS[suggestion.energyRating].color,
                  backgroundColor: `${ENERGY_RATINGS[suggestion.energyRating].color}15`,
                }}
              >
                {ENERGY_RATINGS[suggestion.energyRating].name}
              </Badge>
            </div>
          </div>
        )}

        {/* DRIP Category Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">DRIP Category</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(DRIP_QUADRANTS) as [DripQuadrant, typeof DRIP_QUADRANTS[DripQuadrant]][]).map(
              ([key, quadrant]) => (
                <Button
                  key={key}
                  variant="outline"
                  className={cn(
                    'h-auto py-2 px-3 justify-start',
                    selectedDrip === key && 'ring-2 ring-offset-1'
                  )}
                  style={{
                    borderColor: selectedDrip === key ? quadrant.color : undefined,
                    backgroundColor: selectedDrip === key ? `${quadrant.color}10` : undefined,
                    ['--tw-ring-color' as string]: quadrant.color,
                  }}
                  onClick={() => setSelectedDrip(key)}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2 shrink-0"
                    style={{ backgroundColor: quadrant.color }}
                  />
                  <div className="text-left">
                    <div className="font-medium text-sm">{quadrant.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {quadrant.action}
                    </div>
                  </div>
                </Button>
              )
            )}
          </div>
        </div>

        {/* Energy Level Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Energy Level</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(ENERGY_RATINGS) as [EnergyRating, typeof ENERGY_RATINGS[EnergyRating]][]).map(
              ([key, rating]) => (
                <Button
                  key={key}
                  variant="outline"
                  className={cn(
                    'h-auto py-2 px-3 flex-col',
                    selectedEnergy === key && 'ring-2 ring-offset-1'
                  )}
                  style={{
                    borderColor: selectedEnergy === key ? rating.color : undefined,
                    backgroundColor: selectedEnergy === key ? `${rating.color}15` : undefined,
                    ['--tw-ring-color' as string]: rating.color,
                  }}
                  onClick={() => setSelectedEnergy(key)}
                >
                  <div
                    className="w-4 h-4 rounded-full mb-1"
                    style={{ backgroundColor: rating.color }}
                  />
                  <span className="text-sm font-medium">{rating.name}</span>
                </Button>
              )
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          {onIgnore && (
            <Button variant="ghost" onClick={() => onIgnore(event.id, event.summary)} className="text-muted-foreground hover:text-foreground">
              <EyeOff className="h-4 w-4 mr-2" />
              Ignore
            </Button>
          )}
          <Button variant="ghost" onClick={onSkip}>
            <SkipForward className="h-4 w-4 mr-2" />
            Skip
          </Button>
          <Button onClick={handleCategorize} disabled={!selectedDrip || !selectedEnergy}>
            Categorize
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
