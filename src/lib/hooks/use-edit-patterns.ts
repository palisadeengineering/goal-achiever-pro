'use client';

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './use-local-storage';
import type { DripQuadrant, EnergyRating } from '@/types/database';

interface EditRecord {
  activityName: string;
  normalizedName: string;
  oldDripQuadrant: DripQuadrant;
  newDripQuadrant: DripQuadrant;
  oldEnergyRating: EnergyRating;
  newEnergyRating: EnergyRating;
  timestamp: number;
}

export interface EditPattern {
  activityName: string;
  normalizedName: string;
  suggestedDrip?: DripQuadrant;
  suggestedEnergy?: EnergyRating;
  editCount: number;
  matchingBlockIds: string[];
}

interface TimeBlockInfo {
  id: string;
  activityName: string;
  dripQuadrant: DripQuadrant;
  energyRating: EnergyRating;
}

interface UseEditPatternsReturn {
  trackEdit: (
    blockId: string,
    activityName: string,
    oldDrip: DripQuadrant,
    newDrip: DripQuadrant,
    oldEnergy: EnergyRating,
    newEnergy: EnergyRating
  ) => void;
  getPatternSuggestion: (allBlocks: TimeBlockInfo[]) => EditPattern | null;
  dismissPattern: (normalizedName: string) => void;
  clearPatterns: () => void;
}

// Normalize activity name for pattern matching
function normalizeActivityName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove common prefixes like "Meeting:", "Call:", etc.
    .replace(/^(meeting|call|email|work|task|project):\s*/i, '')
    // Remove dates/times
    .replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4}/g, '')
    .replace(/\d{1,2}:\d{2}/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if two activity names match (case-insensitive, normalized)
function activityNamesMatch(name1: string, name2: string): boolean {
  const normalized1 = normalizeActivityName(name1);
  const normalized2 = normalizeActivityName(name2);

  // Exact match after normalization
  if (normalized1 === normalized2) return true;

  // Check if one contains the other (for variations like "Commute" vs "Morning Commute")
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    // Only match if the shorter one is at least 4 characters (avoid false positives)
    const shorter = normalized1.length < normalized2.length ? normalized1 : normalized2;
    return shorter.length >= 4;
  }

  return false;
}

const EDIT_HISTORY_KEY = 'time-block-edit-patterns';
const DISMISSED_PATTERNS_KEY = 'dismissed-edit-patterns';
const PATTERN_THRESHOLD = 2; // Number of similar edits needed to trigger suggestion
const PATTERN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useEditPatterns(): UseEditPatternsReturn {
  const [editHistory, setEditHistory] = useLocalStorage<EditRecord[]>(EDIT_HISTORY_KEY, []);
  const [dismissedPatterns, setDismissedPatterns] = useLocalStorage<string[]>(DISMISSED_PATTERNS_KEY, []);

  // Clean up old records - memoized to avoid impure Date.now() call during render
  const cleanedHistory = useMemo(() => {
    const now = Date.now(); // eslint-disable-line react-hooks/purity
    return editHistory.filter(record => now - record.timestamp < PATTERN_EXPIRY_MS);
  }, [editHistory]);

  // Track a new edit
  const trackEdit = useCallback((
    blockId: string,
    activityName: string,
    oldDrip: DripQuadrant,
    newDrip: DripQuadrant,
    oldEnergy: EnergyRating,
    newEnergy: EnergyRating
  ) => {
    // Only track if something actually changed
    if (oldDrip === newDrip && oldEnergy === newEnergy) return;

    const normalizedName = normalizeActivityName(activityName);

    const newRecord: EditRecord = {
      activityName,
      normalizedName,
      oldDripQuadrant: oldDrip,
      newDripQuadrant: newDrip,
      oldEnergyRating: oldEnergy,
      newEnergyRating: newEnergy,
      timestamp: Date.now(),
    };

    setEditHistory(prev => {
      const cleaned = prev.filter(r => Date.now() - r.timestamp < PATTERN_EXPIRY_MS);
      return [...cleaned, newRecord];
    });
  }, [setEditHistory]);

  // Get suggestion if a pattern is detected
  const getPatternSuggestion = useCallback((allBlocks: TimeBlockInfo[]): EditPattern | null => {
    if (cleanedHistory.length < PATTERN_THRESHOLD) return null;

    // Group edits by normalized activity name and change type
    const patternGroups = new Map<string, {
      records: EditRecord[];
      dripChanges: Map<DripQuadrant, number>;
      energyChanges: Map<EnergyRating, number>;
    }>();

    for (const record of cleanedHistory) {
      const key = record.normalizedName;

      if (!patternGroups.has(key)) {
        patternGroups.set(key, {
          records: [],
          dripChanges: new Map(),
          energyChanges: new Map(),
        });
      }

      const group = patternGroups.get(key)!;
      group.records.push(record);

      // Track DRIP changes
      if (record.oldDripQuadrant !== record.newDripQuadrant) {
        const count = group.dripChanges.get(record.newDripQuadrant) || 0;
        group.dripChanges.set(record.newDripQuadrant, count + 1);
      }

      // Track energy changes
      if (record.oldEnergyRating !== record.newEnergyRating) {
        const count = group.energyChanges.get(record.newEnergyRating) || 0;
        group.energyChanges.set(record.newEnergyRating, count + 1);
      }
    }

    // Find the strongest pattern
    let bestPattern: EditPattern | null = null;
    let bestScore = 0;

    for (const [normalizedName, group] of patternGroups) {
      // Skip dismissed patterns
      if (dismissedPatterns.includes(normalizedName)) continue;

      // Check if we have enough edits
      if (group.records.length < PATTERN_THRESHOLD) continue;

      // Find the most common DRIP change
      let suggestedDrip: DripQuadrant | undefined;
      let maxDripCount = 0;
      for (const [drip, count] of group.dripChanges) {
        if (count >= PATTERN_THRESHOLD && count > maxDripCount) {
          suggestedDrip = drip;
          maxDripCount = count;
        }
      }

      // Find the most common energy change
      let suggestedEnergy: EnergyRating | undefined;
      let maxEnergyCount = 0;
      for (const [energy, count] of group.energyChanges) {
        if (count >= PATTERN_THRESHOLD && count > maxEnergyCount) {
          suggestedEnergy = energy;
          maxEnergyCount = count;
        }
      }

      // If no significant pattern, skip
      if (!suggestedDrip && !suggestedEnergy) continue;

      // Find matching blocks that could be updated
      const matchingBlockIds = allBlocks
        .filter(block => {
          // Check if activity name matches
          if (!activityNamesMatch(block.activityName, normalizedName)) return false;

          // Check if block needs the suggested change
          const needsDripChange = suggestedDrip && block.dripQuadrant !== suggestedDrip;
          const needsEnergyChange = suggestedEnergy && block.energyRating !== suggestedEnergy;

          return needsDripChange || needsEnergyChange;
        })
        .map(block => block.id);

      // Skip if no blocks need updating
      if (matchingBlockIds.length === 0) continue;

      // Calculate score (more edits + more matching blocks = higher score)
      const score = group.records.length * 2 + matchingBlockIds.length;

      if (score > bestScore) {
        bestScore = score;
        bestPattern = {
          activityName: group.records[0].activityName, // Use original name for display
          normalizedName,
          suggestedDrip,
          suggestedEnergy,
          editCount: group.records.length,
          matchingBlockIds,
        };
      }
    }

    return bestPattern;
  }, [cleanedHistory, dismissedPatterns]);

  // Dismiss a pattern (won't suggest again)
  const dismissPattern = useCallback((normalizedName: string) => {
    setDismissedPatterns(prev => {
      if (prev.includes(normalizedName)) return prev;
      return [...prev, normalizedName];
    });
  }, [setDismissedPatterns]);

  // Clear all patterns (for testing/reset)
  const clearPatterns = useCallback(() => {
    setEditHistory([]);
    setDismissedPatterns([]);
  }, [setEditHistory, setDismissedPatterns]);

  return {
    trackEdit,
    getPatternSuggestion,
    dismissPattern,
    clearPatterns,
  };
}
