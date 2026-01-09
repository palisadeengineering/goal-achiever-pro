'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './use-local-storage';
import type { DripQuadrant, EnergyRating } from '@/types/database';

export interface EventPattern {
  pattern: string; // Normalized event name (lowercase, trimmed)
  dripQuadrant: DripQuadrant;
  energyRating: EnergyRating;
  confidence: number; // 0-1, increases with each use
  usageCount: number;
  lastUsed: string; // ISO date string
}

export interface EventCategorization {
  eventId: string;
  eventName: string;
  dripQuadrant: DripQuadrant;
  energyRating: EnergyRating;
  categorizedAt: string;
}

interface PatternSuggestion {
  dripQuadrant: DripQuadrant;
  energyRating: EnergyRating;
  confidence: number;
  pattern: string;
}

const PATTERN_STORAGE_KEY = 'google-calendar-patterns';
const CATEGORIZATION_STORAGE_KEY = 'event-categorizations';

export function useEventPatterns() {
  const [patterns, setPatterns] = useLocalStorage<EventPattern[]>(PATTERN_STORAGE_KEY, []);
  const [categorizations, setCategorizations] = useLocalStorage<EventCategorization[]>(
    CATEGORIZATION_STORAGE_KEY,
    []
  );

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
    (eventName: string, dripQuadrant: DripQuadrant, energyRating: EnergyRating) => {
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
                  dripQuadrant,
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
            dripQuadrant,
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
          dripQuadrant: match.dripQuadrant,
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
   * Save an event categorization
   */
  const saveCategorization = useCallback(
    (
      eventId: string,
      eventName: string,
      dripQuadrant: DripQuadrant,
      energyRating: EnergyRating
    ) => {
      // Learn the pattern
      learnPattern(eventName, dripQuadrant, energyRating);

      // Save the categorization
      setCategorizations((prev) => {
        // Remove existing categorization for this event if present
        const filtered = prev.filter((c) => c.eventId !== eventId);

        return [
          ...filtered,
          {
            eventId,
            eventName,
            dripQuadrant,
            energyRating,
            categorizedAt: new Date().toISOString(),
          },
        ];
      });
    },
    [learnPattern, setCategorizations]
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
   * Remove a categorization
   */
  const removeCategorization = useCallback(
    (eventId: string) => {
      setCategorizations((prev) => prev.filter((c) => c.eventId !== eventId));
    },
    [setCategorizations]
  );

  /**
   * Get all uncategorized event IDs from a list
   */
  const getUncategorizedEventIds = useCallback(
    (eventIds: string[]): string[] => {
      const categorizedIds = new Set(categorizations.map((c) => c.eventId));
      return eventIds.filter((id) => !categorizedIds.has(id));
    },
    [categorizations]
  );

  /**
   * Apply suggestion to multiple similar events (bulk categorization)
   */
  const applySuggestionToSimilar = useCallback(
    (
      events: Array<{ id: string; summary: string }>,
      dripQuadrant: DripQuadrant,
      energyRating: EnergyRating
    ) => {
      events.forEach((event) => {
        saveCategorization(event.id, event.summary, dripQuadrant, energyRating);
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
   * Clear categorizations for specific event IDs
   */
  const clearCategorizationsForEvents = useCallback(
    (eventIds: string[]) => {
      const idsToRemove = new Set(eventIds);
      setCategorizations((prev) => prev.filter((c) => !idsToRemove.has(c.eventId)));
    },
    [setCategorizations]
  );

  return {
    patterns,
    categorizations,
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
    clearCategorizationsForEvents,
  };
}
