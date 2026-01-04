'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './use-local-storage';

export interface TagPattern {
  pattern: string;      // Normalized activity name (lowercase, trimmed)
  tagIds: string[];     // Associated tag IDs
  confidence: number;   // 0-1, increases with each use
  usageCount: number;
  lastUsed: string;     // ISO date string
}

interface TagSuggestion {
  tagIds: string[];
  confidence: number;
  pattern: string;
}

const TAG_PATTERN_STORAGE_KEY = 'activity-tag-patterns';
const AUTO_APPLY_THRESHOLD = 0.8;
const SUGGESTION_THRESHOLD = 0.3;

export function useTagPatterns() {
  const [patterns, setPatterns] = useLocalStorage<TagPattern[]>(TAG_PATTERN_STORAGE_KEY, []);

  /**
   * Normalize activity name for pattern matching
   */
  const normalizeActivityName = useCallback((name: string): string => {
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
   * Find a matching pattern for an activity name
   */
  const findMatchingPattern = useCallback(
    (activityName: string): TagPattern | null => {
      const normalized = normalizeActivityName(activityName);

      if (!normalized || normalized.length < 2) return null;

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
    [patterns, normalizeActivityName]
  );

  /**
   * Learn a new pattern or update existing one
   */
  const learnPattern = useCallback(
    (activityName: string, tagIds: string[]) => {
      const normalized = normalizeActivityName(activityName);

      if (!normalized || normalized.length < 2 || tagIds.length === 0) return;

      setPatterns((prev) => {
        const existing = prev.find((p) => p.pattern === normalized);

        if (existing) {
          // Update existing pattern - increase confidence
          return prev.map((p) =>
            p.pattern === normalized
              ? {
                  ...p,
                  tagIds,
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
            tagIds,
            confidence: 0.5,
            usageCount: 1,
            lastUsed: new Date().toISOString(),
          },
        ];
      });
    },
    [normalizeActivityName, setPatterns]
  );

  /**
   * Get a suggestion for an activity name
   */
  const getSuggestion = useCallback(
    (activityName: string): TagSuggestion | null => {
      const match = findMatchingPattern(activityName);

      // Only suggest if confidence is above threshold
      if (match && match.confidence >= SUGGESTION_THRESHOLD) {
        return {
          tagIds: match.tagIds,
          confidence: match.confidence,
          pattern: match.pattern,
        };
      }

      return null;
    },
    [findMatchingPattern]
  );

  /**
   * Check if we should auto-apply tags (high confidence)
   */
  const shouldAutoApply = useCallback(
    (activityName: string): TagSuggestion | null => {
      const suggestion = getSuggestion(activityName);
      if (suggestion && suggestion.confidence >= AUTO_APPLY_THRESHOLD) {
        return suggestion;
      }
      return null;
    },
    [getSuggestion]
  );

  /**
   * Clear all patterns (reset learning)
   */
  const clearPatterns = useCallback(() => {
    setPatterns([]);
  }, [setPatterns]);

  /**
   * Remove patterns for specific tags (when tags are deleted)
   */
  const removeTagFromPatterns = useCallback(
    (tagId: string) => {
      setPatterns((prev) =>
        prev
          .map((p) => ({
            ...p,
            tagIds: p.tagIds.filter((id) => id !== tagId),
          }))
          .filter((p) => p.tagIds.length > 0)
      );
    },
    [setPatterns]
  );

  return {
    patterns,
    findMatchingPattern,
    learnPattern,
    getSuggestion,
    shouldAutoApply,
    clearPatterns,
    removeTagFromPatterns,
  };
}
