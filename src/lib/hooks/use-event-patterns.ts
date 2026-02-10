'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from './use-local-storage';
import type { ValueQuadrant, EnergyRating } from '@/types/database';

export interface EventPattern {
  pattern: string; // Normalized event name (lowercase, trimmed)
  valueQuadrant: ValueQuadrant;
  energyRating: EnergyRating;
  confidence: number; // 0-1, increases with each use
  usageCount: number;
  lastUsed: string; // ISO date string
}

export interface EventCategorization {
  eventId: string;
  eventName: string;
  valueQuadrant: ValueQuadrant;
  energyRating: EnergyRating;
  activityType?: string | null;
  activityCategory?: string | null;
  leverageType?: string | null;
  detectedProjectId?: string | null;
  detectedProjectName?: string | null;
  categorizedAt: string;
}

export interface IgnoredEvent {
  eventId: string;
  eventName: string;
  ignoredAt: string;
}

interface PatternSuggestion {
  valueQuadrant: ValueQuadrant;
  energyRating: EnergyRating;
  confidence: number;
  pattern: string;
}

const PATTERN_STORAGE_KEY = 'google-calendar-patterns';
const CATEGORIZATION_STORAGE_KEY = 'event-categorizations';
const IGNORED_EVENTS_STORAGE_KEY = 'ignored-events';

/**
 * Enhanced fields that can be stored alongside basic categorization.
 */
export interface EnhancedCategorizationFields {
  activityType?: string | null;
  activityCategory?: string | null;
  leverageType?: string | null;
  detectedProjectId?: string | null;
  detectedProjectName?: string | null;
}

/**
 * Fire-and-forget POST to persist categorization to database.
 * Errors are logged but don't block the UI.
 */
function persistCategorizationToDb(
  externalEventId: string,
  eventName: string,
  valueQuadrant: ValueQuadrant,
  energyRating: EnergyRating,
  enhanced?: EnhancedCategorizationFields
) {
  fetch('/api/event-categorizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      externalEventId,
      eventName,
      valueQuadrant,
      energyRating,
      isIgnored: false,
      ...(enhanced?.activityType && { activityType: enhanced.activityType }),
      ...(enhanced?.activityCategory && { activityCategory: enhanced.activityCategory }),
      ...(enhanced?.leverageType && { leverageType: enhanced.leverageType }),
      ...(enhanced?.detectedProjectId && { detectedProjectId: enhanced.detectedProjectId }),
      ...(enhanced?.detectedProjectName && { detectedProjectName: enhanced.detectedProjectName }),
    }),
  }).catch((err) => console.warn('Failed to persist categorization to DB:', err));
}

/**
 * Fire-and-forget POST to persist ignored event to database.
 */
function persistIgnoreToDb(externalEventId: string, eventName: string) {
  fetch('/api/event-categorizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      externalEventId,
      eventName,
      isIgnored: true,
    }),
  }).catch((err) => console.warn('Failed to persist ignore to DB:', err));
}

/**
 * Fire-and-forget DELETE to remove categorization from database.
 */
function removeCategorizationFromDb(externalEventId: string) {
  fetch(`/api/event-categorizations?externalEventId=${encodeURIComponent(externalEventId)}`, {
    method: 'DELETE',
  }).catch((err) => console.warn('Failed to remove categorization from DB:', err));
}

export function useEventPatterns() {
  const [patterns, setPatterns] = useLocalStorage<EventPattern[]>(PATTERN_STORAGE_KEY, []);
  const [categorizations, setCategorizations] = useLocalStorage<EventCategorization[]>(
    CATEGORIZATION_STORAGE_KEY,
    []
  );
  const [ignoredEvents, setIgnoredEvents] = useLocalStorage<IgnoredEvent[]>(
    IGNORED_EVENTS_STORAGE_KEY,
    []
  );

  // Track whether we've synced from the database this session
  const hasSyncedRef = useRef(false);

  /**
   * On mount, perform bidirectional sync between localStorage and database:
   * 1. Upload local-only categorizations to the DB (so other devices can see them)
   * 2. Download DB-only categorizations to localStorage (so this device can see them)
   */
  useEffect(() => {
    if (hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/event-categorizations', {
          signal: controller.signal,
        });
        if (!res.ok) return;

        const { categorizations: dbCategorizations = [] } = await res.json();
        const dbMap = new Map<string, boolean>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of dbCategorizations as any[]) {
          if (row.externalEventId) dbMap.set(row.externalEventId, true);
        }

        // Upload local categorizations that aren't in the DB yet
        const localCats: EventCategorization[] = (() => {
          try {
            const raw = window.localStorage.getItem(CATEGORIZATION_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
          } catch { return []; }
        })();

        const localIgnored: IgnoredEvent[] = (() => {
          try {
            const raw = window.localStorage.getItem(IGNORED_EVENTS_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
          } catch { return []; }
        })();

        const toUpload: Array<{
          externalEventId: string;
          eventName: string;
          valueQuadrant?: ValueQuadrant;
          energyRating?: EnergyRating;
          isIgnored?: boolean;
        }> = [];

        for (const cat of localCats) {
          if (cat.eventId && cat.valueQuadrant && cat.energyRating && !dbMap.has(cat.eventId)) {
            toUpload.push({
              externalEventId: cat.eventId,
              eventName: cat.eventName || '',
              valueQuadrant: cat.valueQuadrant,
              energyRating: cat.energyRating,
              isIgnored: false,
            });
          }
        }

        for (const ign of localIgnored) {
          if (ign.eventId && !dbMap.has(ign.eventId)) {
            toUpload.push({
              externalEventId: ign.eventId,
              eventName: ign.eventName || '',
              isIgnored: true,
            });
          }
        }

        // Batch upload local-only items (API supports up to 500 per request)
        if (toUpload.length > 0) {
          for (let i = 0; i < toUpload.length; i += 500) {
            const batch = toUpload.slice(i, i + 500);
            fetch('/api/event-categorizations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ categorizations: batch }),
            }).catch((err) => console.warn('Failed to upload local categorizations to DB:', err));
          }
        }

        // Download DB-only categorizations into localStorage
        if (dbCategorizations.length > 0) {
          setCategorizations((prev) => {
            const localCatMap = new Map(prev.map((c) => [c.eventId, c]));
            let changed = false;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const dbRow of dbCategorizations as any[]) {
              const eventId = dbRow.externalEventId;
              if (!eventId || dbRow.isIgnored) continue;

              if (dbRow.valueQuadrant && dbRow.energyRating && !localCatMap.has(eventId)) {
                localCatMap.set(eventId, {
                  eventId,
                  eventName: dbRow.eventName || '',
                  valueQuadrant: dbRow.valueQuadrant as ValueQuadrant,
                  energyRating: dbRow.energyRating as EnergyRating,
                  categorizedAt: dbRow.categorizedAt || new Date().toISOString(),
                });
                changed = true;
              }
            }

            return changed ? Array.from(localCatMap.values()) : prev;
          });

          setIgnoredEvents((prev) => {
            const localIgnoredMap = new Map(prev.map((e) => [e.eventId, e]));
            let changed = false;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const dbRow of dbCategorizations as any[]) {
              const eventId = dbRow.externalEventId;
              if (!eventId || !dbRow.isIgnored) continue;

              if (!localIgnoredMap.has(eventId)) {
                localIgnoredMap.set(eventId, {
                  eventId,
                  eventName: dbRow.eventName || '',
                  ignoredAt: dbRow.categorizedAt || new Date().toISOString(),
                });
                changed = true;
              }
            }

            return changed ? Array.from(localIgnoredMap.values()) : prev;
          });

          // Rebuild patterns from DB categorizations for suggestion engine
          setPatterns((prev) => {
            const patternMap = new Map(prev.map((p) => [p.pattern, p]));
            let changed = false;

            for (const dbRow of dbCategorizations as any[]) {
              if (!dbRow.externalEventId || dbRow.isIgnored) continue;
              if (!dbRow.valueQuadrant || !dbRow.energyRating) continue;

              const eventName = (dbRow.eventName || '').toLowerCase().trim()
                .replace(/^(meeting|call|sync|review|standup|1:1|1-on-1)[\s:-]*/i, '')
                .replace(/\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?/g, '')
                .replace(/\s+/g, ' ')
                .trim();

              if (!eventName) continue;

              if (!patternMap.has(eventName)) {
                patternMap.set(eventName, {
                  pattern: eventName,
                  valueQuadrant: dbRow.valueQuadrant,
                  energyRating: dbRow.energyRating,
                  confidence: 0.5,
                  usageCount: 1,
                  lastUsed: dbRow.categorizedAt || new Date().toISOString(),
                });
                changed = true;
              }
            }

            return changed ? Array.from(patternMap.values()) : prev;
          });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.warn('Failed to sync categorizations from database:', err);
      }
    })();

    return () => controller.abort();
  }, [setCategorizations, setIgnoredEvents, setPatterns]);

  /**
   * Refresh categorizations from localStorage (for cross-component sync)
   */
  const refreshFromStorage = useCallback(() => {
    try {
      const stored = window.localStorage.getItem(CATEGORIZATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as EventCategorization[];
        setCategorizations(parsed);
      }
    } catch (error) {
      console.warn('Failed to refresh categorizations from storage:', error);
    }
  }, [setCategorizations]);

  /**
   * Normalize event name for pattern matching
   */
  const normalizeEventName = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .trim()
      // Remove common prefixes like "Meeting:", "Call:", etc.
      .replace(/^(meeting|call|sync|review|standup|1:1|1-on-1)[\s:-]*/i, '')
      // Remove dates/times that might be in the title
      .replace(/\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?/g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  /**
   * Find a matching pattern for an event name
   */
  const findMatchingPattern = useCallback(
    (eventName: string): EventPattern | null => {
      const normalized = normalizeEventName(eventName);

      if (!normalized) return null;

      // Exact match first (highest confidence)
      const exactMatch = patterns.find((p) => p.pattern === normalized);
      if (exactMatch) return exactMatch;

      // Partial match - normalized name contains pattern or vice versa
      const partialMatches = patterns.filter(
        (p) =>
          (normalized.includes(p.pattern) && p.pattern.length > 3) ||
          (p.pattern.includes(normalized) && normalized.length > 3)
      );

      // Return highest confidence match
      if (partialMatches.length > 0) {
        return partialMatches.sort((a, b) => b.confidence - a.confidence)[0];
      }

      // Word-level matching for multi-word patterns
      const normalizedWords = normalized.split(' ').filter((w) => w.length > 2);
      const wordMatches = patterns.filter((p) => {
        const patternWords = p.pattern.split(' ').filter((w) => w.length > 2);
        const matchingWords = normalizedWords.filter((w) => patternWords.includes(w));
        return matchingWords.length >= Math.min(2, patternWords.length);
      });

      if (wordMatches.length > 0) {
        return wordMatches.sort((a, b) => b.confidence - a.confidence)[0];
      }

      return null;
    },
    [patterns, normalizeEventName]
  );

  /**
   * Learn a new pattern or update existing one
   */
  const learnPattern = useCallback(
    (eventName: string, valueQuadrant: ValueQuadrant, energyRating: EnergyRating) => {
      const normalized = normalizeEventName(eventName);

      if (!normalized) return;

      setPatterns((prev) => {
        const existing = prev.find((p) => p.pattern === normalized);

        if (existing) {
          // Update existing pattern - increase confidence
          return prev.map((p) =>
            p.pattern === normalized
              ? {
                  ...p,
                  valueQuadrant,
                  energyRating,
                  usageCount: p.usageCount + 1,
                  confidence: Math.min(1, p.confidence + 0.15),
                  lastUsed: new Date().toISOString(),
                }
              : p
          );
        }

        // Create new pattern
        return [
          ...prev,
          {
            pattern: normalized,
            valueQuadrant,
            energyRating,
            confidence: 0.5,
            usageCount: 1,
            lastUsed: new Date().toISOString(),
          },
        ];
      });
    },
    [normalizeEventName, setPatterns]
  );

  /**
   * Get a suggestion for an event name
   */
  const getSuggestion = useCallback(
    (eventName: string): PatternSuggestion | null => {
      const match = findMatchingPattern(eventName);

      // Only suggest if confidence is above threshold
      if (match && match.confidence >= 0.3) {
        return {
          valueQuadrant: match.valueQuadrant,
          energyRating: match.energyRating,
          confidence: match.confidence,
          pattern: match.pattern,
        };
      }

      return null;
    },
    [findMatchingPattern]
  );

  /**
   * Save an event categorization (localStorage + database)
   */
  const saveCategorization = useCallback(
    (
      eventId: string,
      eventName: string,
      valueQuadrant: ValueQuadrant,
      energyRating: EnergyRating,
      enhanced?: EnhancedCategorizationFields
    ) => {
      // Learn the pattern
      learnPattern(eventName, valueQuadrant, energyRating);

      // Save to localStorage (immediate) - include enhanced fields
      setCategorizations((prev) => {
        const filtered = prev.filter((c) => c.eventId !== eventId);
        return [
          ...filtered,
          {
            eventId,
            eventName,
            valueQuadrant,
            energyRating,
            activityType: enhanced?.activityType || null,
            activityCategory: enhanced?.activityCategory || null,
            leverageType: enhanced?.leverageType || null,
            detectedProjectId: enhanced?.detectedProjectId || null,
            detectedProjectName: enhanced?.detectedProjectName || null,
            categorizedAt: new Date().toISOString(),
          },
        ];
      });

      // Also remove from ignored if it was previously ignored
      setIgnoredEvents((prev) => prev.filter((e) => e.eventId !== eventId));

      // Persist to database (fire-and-forget) - include enhanced fields
      persistCategorizationToDb(eventId, eventName, valueQuadrant, energyRating, enhanced);
    },
    [learnPattern, setCategorizations, setIgnoredEvents]
  );

  /**
   * Get categorization for an event
   */
  const getCategorization = useCallback(
    (eventId: string): EventCategorization | null => {
      return categorizations.find((c) => c.eventId === eventId) || null;
    },
    [categorizations]
  );

  /**
   * Check if an event is categorized
   */
  const isCategorized = useCallback(
    (eventId: string): boolean => {
      return categorizations.some((c) => c.eventId === eventId);
    },
    [categorizations]
  );

  /**
   * Remove a categorization (localStorage + database)
   */
  const removeCategorization = useCallback(
    (eventId: string) => {
      setCategorizations((prev) => prev.filter((c) => c.eventId !== eventId));
      removeCategorizationFromDb(eventId);
    },
    [setCategorizations]
  );

  /**
   * Get all uncategorized event IDs from a list (excludes ignored events)
   */
  const getUncategorizedEventIds = useCallback(
    (eventIds: string[]): string[] => {
      const categorizedIds = new Set(categorizations.map((c) => c.eventId));
      const ignoredIds = new Set(ignoredEvents.map((e) => e.eventId));
      return eventIds.filter((id) => !categorizedIds.has(id) && !ignoredIds.has(id));
    },
    [categorizations, ignoredEvents]
  );

  /**
   * Apply suggestion to multiple similar events (bulk categorization)
   */
  const applySuggestionToSimilar = useCallback(
    (
      events: Array<{ id: string; summary: string }>,
      valueQuadrant: ValueQuadrant,
      energyRating: EnergyRating,
      enhanced?: EnhancedCategorizationFields
    ) => {
      // saveCategorization handles both localStorage and DB persistence per event
      events.forEach((event) => {
        saveCategorization(event.id, event.summary, valueQuadrant, energyRating, enhanced);
      });
    },
    [saveCategorization]
  );

  /**
   * Clear all patterns (reset learning)
   */
  const clearPatterns = useCallback(() => {
    setPatterns([]);
  }, [setPatterns]);

  /**
   * Clear all categorizations
   */
  const clearCategorizations = useCallback(() => {
    setCategorizations([]);
  }, [setCategorizations]);

  /**
   * Ignore an event (localStorage + database)
   */
  const ignoreEvent = useCallback(
    (eventId: string, eventName: string) => {
      setIgnoredEvents((prev) => {
        const filtered = prev.filter((e) => e.eventId !== eventId);
        return [
          ...filtered,
          {
            eventId,
            eventName,
            ignoredAt: new Date().toISOString(),
          },
        ];
      });

      // Also remove from categorizations if present
      setCategorizations((prev) => prev.filter((c) => c.eventId !== eventId));

      // Persist to database
      persistIgnoreToDb(eventId, eventName);
    },
    [setIgnoredEvents, setCategorizations]
  );

  /**
   * Unignore an event (localStorage + database)
   */
  const unignoreEvent = useCallback(
    (eventId: string) => {
      setIgnoredEvents((prev) => prev.filter((e) => e.eventId !== eventId));
      removeCategorizationFromDb(eventId);
    },
    [setIgnoredEvents]
  );

  /**
   * Check if an event is ignored
   */
  const isIgnored = useCallback(
    (eventId: string): boolean => {
      return ignoredEvents.some((e) => e.eventId === eventId);
    },
    [ignoredEvents]
  );

  /**
   * Get all ignored events
   */
  const getIgnoredEvents = useCallback((): IgnoredEvent[] => {
    return ignoredEvents;
  }, [ignoredEvents]);

  /**
   * Clear all ignored events
   */
  const clearIgnoredEvents = useCallback(() => {
    setIgnoredEvents([]);
  }, [setIgnoredEvents]);

  return {
    patterns,
    categorizations,
    ignoredEvents,
    findMatchingPattern,
    learnPattern,
    getSuggestion,
    saveCategorization,
    getCategorization,
    isCategorized,
    removeCategorization,
    getUncategorizedEventIds,
    applySuggestionToSimilar,
    clearPatterns,
    clearCategorizations,
    refreshFromStorage,
    ignoreEvent,
    unignoreEvent,
    isIgnored,
    getIgnoredEvents,
    clearIgnoredEvents,
  };
}
