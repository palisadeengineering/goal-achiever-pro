import { describe, it, expect, vi } from 'vitest';

// Mock the filtering logic from time-audit page
// This tests the core logic that was fixed

interface GoogleEvent {
  id: string;
  summary: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface TimeBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  activityName: string;
  valueQuadrant: string;
  energyRating: string;
  externalEventId?: string;
  source?: string;
}

interface Categorization {
  valueQuadrant: string;
  energyRating: string;
}

// Helper function that matches the logic in time-audit/page.tsx
function filterTimeData(
  timeBlocks: TimeBlock[],
  googleEvents: GoogleEvent[],
  getCategorization: (id: string) => Categorization | undefined,
  isIgnored: (id: string) => boolean,
  viewStartStr: string,
  viewEndStr: string
) {
  const allBlocks: Array<{
    date: string;
    startTime: string;
    endTime: string;
    valueQuadrant: string;
    energyRating: string;
    source: string;
  }> = [];

  // Add time blocks filtered by date range
  timeBlocks.forEach((block) => {
    if (block.date >= viewStartStr && block.date <= viewEndStr) {
      allBlocks.push({
        date: block.date,
        startTime: block.startTime,
        endTime: block.endTime,
        valueQuadrant: block.valueQuadrant,
        energyRating: block.energyRating,
        source: block.source || 'manual',
      });
    }
  });

  // Get imported external IDs
  const importedExternalIds = new Set(
    timeBlocks.filter(b => b.externalEventId).map(b => b.externalEventId)
  );

  // Add Google Calendar events with filtering
  googleEvents.forEach((event) => {
    // Skip if already imported
    if (importedExternalIds.has(event.id)) {
      return;
    }

    // Skip if ignored (THIS IS THE BUG FIX)
    if (isIgnored(event.id)) {
      return;
    }

    const categorization = getCategorization(event.id);
    const eventDateStr = event.date || '';
    const startTimeStr = event.startTime || '';
    const endTimeStr = event.endTime || startTimeStr;

    if (eventDateStr && startTimeStr) {
      if (eventDateStr >= viewStartStr && eventDateStr <= viewEndStr) {
        allBlocks.push({
          date: eventDateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
          valueQuadrant: categorization?.valueQuadrant || 'na',
          energyRating: categorization?.energyRating || 'yellow',
          source: 'google_calendar',
        });
      }
    }
  });

  return allBlocks;
}

// Helper for insights time blocks (similar logic)
function filterInsightsTimeBlocks(
  timeBlocks: TimeBlock[],
  googleEvents: GoogleEvent[],
  getCategorization: (id: string) => Categorization | undefined,
  isIgnored: (id: string) => boolean
) {
  const allBlocks: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    activityName: string;
    valueQuadrant: string;
    energyRating: string;
    durationMinutes: number;
  }> = [];

  // Add time blocks
  timeBlocks.forEach((block) => {
    const [startHour, startMin] = block.startTime.split(':').map(Number);
    const [endHour, endMin] = block.endTime.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    allBlocks.push({
      id: block.id,
      date: block.date,
      startTime: block.startTime,
      endTime: block.endTime,
      activityName: block.activityName,
      valueQuadrant: block.valueQuadrant,
      energyRating: block.energyRating,
      durationMinutes,
    });
  });

  // Get imported external IDs
  const importedExternalIds = new Set(
    timeBlocks.filter(b => b.externalEventId).map(b => b.externalEventId)
  );

  // Add Google Calendar events
  googleEvents.forEach((event) => {
    if (importedExternalIds.has(event.id)) {
      return;
    }

    // Skip if ignored (THIS IS THE BUG FIX)
    if (isIgnored(event.id)) {
      return;
    }

    const categorization = getCategorization(event.id);
    const eventDateStr = event.date || '';
    const startTimeStr = event.startTime || '';
    const endTimeStr = event.endTime || startTimeStr;

    if (eventDateStr && startTimeStr) {
      const [startHour, startMin] = startTimeStr.split(':').map(Number);
      const [endHour, endMin] = endTimeStr.split(':').map(Number);
      const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

      allBlocks.push({
        id: event.id,
        date: eventDateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        activityName: event.summary || 'Untitled Event',
        valueQuadrant: categorization?.valueQuadrant || 'na',
        energyRating: categorization?.energyRating || 'yellow',
        durationMinutes,
      });
    }
  });

  return allBlocks;
}

describe('Time Audit Filtering - Ignored Events Bug Fix', () => {
  const mockTimeBlocks: TimeBlock[] = [
    {
      id: 'tb-1',
      date: '2024-01-15',
      startTime: '09:00',
      endTime: '10:00',
      activityName: 'Deep Work',
      valueQuadrant: 'production',
      energyRating: 'green',
      source: 'manual',
    },
  ];

  const mockGoogleEvents: GoogleEvent[] = [
    {
      id: 'google-1',
      summary: 'Team Meeting',
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '11:00',
    },
    {
      id: 'google-2',
      summary: 'Lunch Break',
      date: '2024-01-15',
      startTime: '12:00',
      endTime: '13:00',
    },
    {
      id: 'google-3',
      summary: 'Client Call',
      date: '2024-01-15',
      startTime: '14:00',
      endTime: '15:00',
    },
  ];

  const mockCategorizations: Record<string, Categorization> = {
    'google-1': { valueQuadrant: 'production', energyRating: 'green' },
    'google-2': { valueQuadrant: 'delegation', energyRating: 'yellow' },
    'google-3': { valueQuadrant: 'investment', energyRating: 'green' },
  };

  const getCategorization = (id: string) => mockCategorizations[id];

  describe('allTimeData filtering', () => {
    it('should include all events when none are ignored', () => {
      const isIgnored = vi.fn().mockReturnValue(false);

      const result = filterTimeData(
        mockTimeBlocks,
        mockGoogleEvents,
        getCategorization,
        isIgnored,
        '2024-01-01',
        '2024-01-31'
      );

      // 1 time block + 3 google events = 4 total
      expect(result).toHaveLength(4);
      expect(result.map(r => r.source)).toContain('manual');
      expect(result.filter(r => r.source === 'google_calendar')).toHaveLength(3);
    });

    it('should exclude ignored events from stats', () => {
      // Ignore the lunch break event
      const ignoredIds = new Set(['google-2']);
      const isIgnored = vi.fn((id: string) => ignoredIds.has(id));

      const result = filterTimeData(
        mockTimeBlocks,
        mockGoogleEvents,
        getCategorization,
        isIgnored,
        '2024-01-01',
        '2024-01-31'
      );

      // 1 time block + 2 google events (google-2 ignored) = 3 total
      expect(result).toHaveLength(3);
      expect(result.find(r => r.startTime === '12:00')).toBeUndefined();
    });

    it('should exclude multiple ignored events', () => {
      // Ignore multiple events
      const ignoredIds = new Set(['google-1', 'google-3']);
      const isIgnored = vi.fn((id: string) => ignoredIds.has(id));

      const result = filterTimeData(
        mockTimeBlocks,
        mockGoogleEvents,
        getCategorization,
        isIgnored,
        '2024-01-01',
        '2024-01-31'
      );

      // 1 time block + 1 google event = 2 total
      expect(result).toHaveLength(2);
      expect(result.filter(r => r.source === 'google_calendar')).toHaveLength(1);
    });

    it('should call isIgnored for each Google event', () => {
      const isIgnored = vi.fn().mockReturnValue(false);

      filterTimeData(
        mockTimeBlocks,
        mockGoogleEvents,
        getCategorization,
        isIgnored,
        '2024-01-01',
        '2024-01-31'
      );

      // Should be called for each google event
      expect(isIgnored).toHaveBeenCalledWith('google-1');
      expect(isIgnored).toHaveBeenCalledWith('google-2');
      expect(isIgnored).toHaveBeenCalledWith('google-3');
    });
  });

  describe('insightsTimeBlocks filtering', () => {
    it('should include all events when none are ignored', () => {
      const isIgnored = vi.fn().mockReturnValue(false);

      const result = filterInsightsTimeBlocks(
        mockTimeBlocks,
        mockGoogleEvents,
        getCategorization,
        isIgnored
      );

      expect(result).toHaveLength(4);
    });

    it('should exclude ignored events from insights data', () => {
      const ignoredIds = new Set(['google-2']);
      const isIgnored = vi.fn((id: string) => ignoredIds.has(id));

      const result = filterInsightsTimeBlocks(
        mockTimeBlocks,
        mockGoogleEvents,
        getCategorization,
        isIgnored
      );

      expect(result).toHaveLength(3);
      expect(result.find(r => r.id === 'google-2')).toBeUndefined();
    });

    it('should calculate correct total duration excluding ignored events', () => {
      const ignoredIds = new Set(['google-2']); // Lunch break: 60 mins
      const isIgnored = vi.fn((id: string) => ignoredIds.has(id));

      const result = filterInsightsTimeBlocks(
        mockTimeBlocks,
        mockGoogleEvents,
        getCategorization,
        isIgnored
      );

      const totalMinutes = result.reduce((sum, block) => sum + block.durationMinutes, 0);
      // 60 (Deep Work) + 60 (Team Meeting) + 60 (Client Call) = 180 mins
      // (Lunch break 60 mins is excluded)
      expect(totalMinutes).toBe(180);
    });

    it('should calculate correct total duration with all events', () => {
      const isIgnored = vi.fn().mockReturnValue(false);

      const result = filterInsightsTimeBlocks(
        mockTimeBlocks,
        mockGoogleEvents,
        getCategorization,
        isIgnored
      );

      const totalMinutes = result.reduce((sum, block) => sum + block.durationMinutes, 0);
      // All 4 events at 60 mins each = 240 mins
      expect(totalMinutes).toBe(240);
    });
  });
});

describe('Time Audit Stats Calculation', () => {
  it('should not count ignored events in production time', () => {
    const blocks = [
      { startTime: '09:00', endTime: '10:00', valueQuadrant: 'production' },
      { startTime: '10:00', endTime: '11:00', valueQuadrant: 'production' }, // This would be ignored
      { startTime: '14:00', endTime: '15:00', valueQuadrant: 'delegation' },
    ];

    // Calculate production time (simulating the filtered result)
    const filteredBlocks = blocks.filter((_, i) => i !== 1); // Remove second block

    let productionMinutes = 0;
    filteredBlocks.forEach(block => {
      const [startHour, startMin] = block.startTime.split(':').map(Number);
      const [endHour, endMin] = block.endTime.split(':').map(Number);
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

      if (block.valueQuadrant === 'production') {
        productionMinutes += duration;
      }
    });

    // Only first production block should be counted (60 mins)
    expect(productionMinutes).toBe(60);
  });
});
