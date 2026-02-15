import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAnalyticsData } from '@/lib/hooks/use-analytics-data';

// Mock fetch globally
const mockFetch = vi.fn() as Mock;
global.fetch = mockFetch;

// Helper: build a mock TimeBlock
// Uses 'in' check so explicitly passing null will override the default (unlike ??)
function makeBlock(overrides: Record<string, unknown> = {}) {
  return {
    id: 'id' in overrides ? overrides.id : 'block-1',
    date: 'date' in overrides ? overrides.date : '2026-02-05',
    startTime: 'startTime' in overrides ? overrides.startTime : '09:00',
    endTime: 'endTime' in overrides ? overrides.endTime : '10:00',
    activityName: 'activityName' in overrides ? overrides.activityName : 'Test Activity',
    valueQuadrant: 'valueQuadrant' in overrides ? overrides.valueQuadrant : 'production',
    energyRating: 'energyRating' in overrides ? overrides.energyRating : 'green',
    leverageType: 'leverageType' in overrides ? overrides.leverageType : null,
    activityType: 'activityType' in overrides ? overrides.activityType : null,
    activityCategory: 'activityCategory' in overrides ? overrides.activityCategory : null,
    detectedProjectId: 'detectedProjectId' in overrides ? overrides.detectedProjectId : null,
    detectedProjectName: 'detectedProjectName' in overrides ? overrides.detectedProjectName : null,
    tagIds: 'tagIds' in overrides ? overrides.tagIds : [],
    createdAt: '2026-02-05T09:00:00Z',
  };
}

// Helper: make fetch return specific blocks for range and trend requests
function mockFetchWithBlocks(rangeBlocks: unknown[], trendBlocks?: unknown[]) {
  mockFetch.mockImplementation((url: string) => {
    // Determine if this is the range fetch or the trends fetch based on URL params
    if (trendBlocks) {
      // If trendBlocks is provided, the second fetch (wider date range) returns trendBlocks
      const urlObj = new URL(url, 'http://localhost');
      const startDate = urlObj.searchParams.get('startDate');
      // Range fetch uses the exact start date, trends fetch uses an earlier date
      // We check if the start date is earlier (trends) or exact (range)
      if (startDate && startDate < '2026-02-01') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ timeBlocks: trendBlocks }),
        });
      }
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ timeBlocks: rangeBlocks }),
    });
  });
}

describe('useAnalyticsData', () => {
  const defaultDateRange = {
    start: new Date('2026-02-03'), // Monday
    end: new Date('2026-02-09'),   // Sunday
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data fetching', () => {
    it('fetches time blocks from the API on mount', async () => {
      mockFetchWithBlocks([]);

      renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
        const url = mockFetch.mock.calls[0][0] as string;
        expect(url).toContain('/api/time-blocks');
        expect(url).toContain('startDate=2026-02-03');
        expect(url).toContain('endDate=2026-02-09');
      });
    });

    it('starts in loading state and finishes loading after fetch', async () => {
      mockFetchWithBlocks([]);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles fetch failure gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should return zeroed data, not crash
      expect(result.current.totalHours).toBe(0);
      expect(result.current.valueBreakdown.production).toBe(0);
    });

    it('handles non-ok response gracefully', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalHours).toBe(0);
    });
  });

  describe('Value Breakdown', () => {
    it('computes value breakdown from range blocks', async () => {
      const blocks = [
        makeBlock({ id: '1', valueQuadrant: 'production', startTime: '09:00', endTime: '10:00' }),
        makeBlock({ id: '2', valueQuadrant: 'investment', startTime: '10:00', endTime: '11:00' }),
        makeBlock({ id: '3', valueQuadrant: 'replacement', startTime: '11:00', endTime: '11:30' }),
        makeBlock({ id: '4', valueQuadrant: 'delegation', startTime: '11:30', endTime: '12:00' }),
        makeBlock({ id: '5', valueQuadrant: 'na', startTime: '12:00', endTime: '12:15' }),
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.valueBreakdown.production).toBe(60);
      expect(result.current.valueBreakdown.investment).toBe(60);
      expect(result.current.valueBreakdown.replacement).toBe(30);
      expect(result.current.valueBreakdown.delegation).toBe(30);
      expect(result.current.valueBreakdown.na).toBe(15);
    });

    it('defaults to "na" when valueQuadrant is null/undefined', async () => {
      const blocks = [
        makeBlock({ id: '1', valueQuadrant: null, startTime: '09:00', endTime: '10:00' }),
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.valueBreakdown.na).toBe(60);
    });

    it('returns all zeros when no blocks', async () => {
      mockFetchWithBlocks([]);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.valueBreakdown.production).toBe(0);
      expect(result.current.valueBreakdown.investment).toBe(0);
      expect(result.current.valueBreakdown.replacement).toBe(0);
      expect(result.current.valueBreakdown.delegation).toBe(0);
      expect(result.current.valueBreakdown.na).toBe(0);
    });
  });

  describe('Energy Breakdown', () => {
    it('computes energy breakdown correctly', async () => {
      const blocks = [
        makeBlock({ id: '1', energyRating: 'green', startTime: '09:00', endTime: '10:00' }),
        makeBlock({ id: '2', energyRating: 'yellow', startTime: '10:00', endTime: '10:30' }),
        makeBlock({ id: '3', energyRating: 'red', startTime: '10:30', endTime: '11:00' }),
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.energyBreakdown.green).toBe(60);
      expect(result.current.energyBreakdown.yellow).toBe(30);
      expect(result.current.energyBreakdown.red).toBe(30);
    });

    it('defaults to "yellow" when energyRating is null', async () => {
      const blocks = [
        makeBlock({ id: '1', energyRating: null, startTime: '09:00', endTime: '10:00' }),
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.energyBreakdown.yellow).toBe(60);
    });
  });

  describe('Leverage Breakdown', () => {
    it('computes leverage breakdown for each type', async () => {
      const blocks = [
        makeBlock({ id: '1', leverageType: 'code', startTime: '09:00', endTime: '10:00' }),
        makeBlock({ id: '2', leverageType: 'content', startTime: '10:00', endTime: '10:30' }),
        makeBlock({ id: '3', leverageType: 'capital', startTime: '10:30', endTime: '11:00' }),
        makeBlock({ id: '4', leverageType: 'collaboration', startTime: '11:00', endTime: '11:15' }),
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.leverageBreakdown.code).toBe(60);
      expect(result.current.leverageBreakdown.content).toBe(30);
      expect(result.current.leverageBreakdown.capital).toBe(30);
      expect(result.current.leverageBreakdown.collaboration).toBe(15);
      expect(result.current.leverageBreakdown.none).toBe(0);
    });

    it('counts blocks without leverageType as "none"', async () => {
      const blocks = [
        makeBlock({ id: '1', leverageType: null, startTime: '09:00', endTime: '10:00' }),
        makeBlock({ id: '2', leverageType: undefined, startTime: '10:00', endTime: '11:00' }),
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.leverageBreakdown.none).toBe(120);
    });

    it('counts unknown leverage types as "none"', async () => {
      const blocks = [
        makeBlock({ id: '1', leverageType: 'unknown_type', startTime: '09:00', endTime: '10:00' }),
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.leverageBreakdown.none).toBe(60);
    });
  });

  describe('Total Hours & Percentages', () => {
    it('calculates total hours correctly', async () => {
      const blocks = [
        makeBlock({ id: '1', startTime: '09:00', endTime: '10:00' }),  // 60 min
        makeBlock({ id: '2', startTime: '10:00', endTime: '10:30' }),  // 30 min
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.totalHours).toBe(1.5);
    });

    it('calculates production percentage correctly', async () => {
      const blocks = [
        makeBlock({ id: '1', valueQuadrant: 'production', startTime: '09:00', endTime: '10:00' }),  // 60 min
        makeBlock({ id: '2', valueQuadrant: 'investment', startTime: '10:00', endTime: '11:00' }),  // 60 min
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.productionPercentage).toBe(50);
    });

    it('returns 0 production percentage when no blocks', async () => {
      mockFetchWithBlocks([]);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.productionPercentage).toBe(0);
    });

    it('calculates energy balance (green - red) / total * 100', async () => {
      const blocks = [
        makeBlock({ id: '1', energyRating: 'green', startTime: '09:00', endTime: '10:00' }),  // 60 min
        makeBlock({ id: '2', energyRating: 'red', startTime: '10:00', endTime: '10:30' }),     // 30 min
        makeBlock({ id: '3', energyRating: 'yellow', startTime: '10:30', endTime: '11:00' }),  // 30 min
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // (60 - 30) / 120 * 100 = 25
      expect(result.current.energyBalance).toBe(25);
    });
  });

  describe('Heatmap Data', () => {
    it('generates 168 cells (7 days x 24 hours)', async () => {
      mockFetchWithBlocks([]);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.heatmapData.length).toBe(168);
    });

    it('populates heatmap cells with block data', async () => {
      // 2026-02-05 is a Thursday (dayOfWeek = 4)
      const blocks = [
        makeBlock({ id: '1', date: '2026-02-05', startTime: '09:00', endTime: '10:00', energyRating: 'green', valueQuadrant: 'production' }),
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Find the cell for Thursday 9am (dayOfWeek=4, hour=9)
      const cell = result.current.heatmapData.find(
        (c) => c.dayOfWeek === 4 && c.hour === 9
      );

      expect(cell).toBeDefined();
      expect(cell!.hoursLogged).toBe(1); // 60 min = 1 hour
      expect(cell!.dominantEnergy).toBe('green');
      expect(cell!.dominantValue).toBe('production');
      expect(cell!.value).toBe(1); // max intensity (only cell with data)
    });

    it('normalizes heatmap values relative to max', async () => {
      // Two blocks on the same day: one hour at 9am, two hours at 10am
      const blocks = [
        makeBlock({ id: '1', date: '2026-02-05', startTime: '09:00', endTime: '10:00' }),
        makeBlock({ id: '2', date: '2026-02-05', startTime: '10:00', endTime: '12:00' }),
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const cell9am = result.current.heatmapData.find(
        (c) => c.dayOfWeek === 4 && c.hour === 9
      );
      const cell10am = result.current.heatmapData.find(
        (c) => c.dayOfWeek === 4 && c.hour === 10
      );

      // 10am block has max (120 min), so normalized to 1; 9am block has 60 min = 0.5
      expect(cell10am!.value).toBe(1);
      expect(cell9am!.value).toBe(0.5);
    });
  });

  describe('Daily Breakdown', () => {
    it('returns one entry per day in the range', async () => {
      mockFetchWithBlocks([]);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Feb 3 to Feb 9 = 7 days
      expect(result.current.dailyBreakdown.length).toBe(7);
      expect(result.current.dailyBreakdown[0].date).toBe('2026-02-03');
      expect(result.current.dailyBreakdown[6].date).toBe('2026-02-09');
    });

    it('aggregates block data into the correct day', async () => {
      const blocks = [
        makeBlock({ id: '1', date: '2026-02-05', valueQuadrant: 'production', startTime: '09:00', endTime: '10:00' }),
        makeBlock({ id: '2', date: '2026-02-05', valueQuadrant: 'investment', startTime: '10:00', endTime: '10:30' }),
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const feb5 = result.current.dailyBreakdown.find((d) => d.date === '2026-02-05');
      expect(feb5).toBeDefined();
      expect(feb5!.value.production).toBe(60);
      expect(feb5!.value.investment).toBe(30);
      expect(feb5!.totalMinutes).toBe(90);
    });
  });

  describe('Most Productive Day', () => {
    it('returns the day name with most production minutes', async () => {
      const blocks = [
        makeBlock({ id: '1', date: '2026-02-05', valueQuadrant: 'production', startTime: '09:00', endTime: '12:00' }), // Thursday, 180 min
        makeBlock({ id: '2', date: '2026-02-06', valueQuadrant: 'production', startTime: '09:00', endTime: '10:00' }), // Friday, 60 min
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.mostProductiveDay).toBe('Thursday');
    });

    it('returns N/A when no production blocks exist', async () => {
      const blocks = [
        makeBlock({ id: '1', date: '2026-02-05', valueQuadrant: 'investment', startTime: '09:00', endTime: '10:00' }),
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.mostProductiveDay).toBe('N/A');
    });

    it('returns N/A when no blocks at all', async () => {
      mockFetchWithBlocks([]);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.mostProductiveDay).toBe('N/A');
    });
  });

  describe('Peak Productivity Hour', () => {
    it('defaults to 9 AM when no production blocks', async () => {
      mockFetchWithBlocks([]);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.peakProductivityHour).toBe(9);
    });

    it('identifies the hour with most production time', async () => {
      const blocks = [
        makeBlock({ id: '1', date: '2026-02-05', valueQuadrant: 'production', startTime: '14:00', endTime: '16:00' }), // 2pm, 120 min
        makeBlock({ id: '2', date: '2026-02-06', valueQuadrant: 'production', startTime: '14:00', endTime: '15:00' }), // 2pm, 60 min — stacks
        makeBlock({ id: '3', date: '2026-02-05', valueQuadrant: 'production', startTime: '09:00', endTime: '10:00' }), // 9am, 60 min
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.peakProductivityHour).toBe(14);
    });
  });

  describe('Weekly Trends', () => {
    it('generates trend data for 8 weeks', async () => {
      mockFetchWithBlocks([]);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Should have entries for each week (8 weeks back from end)
      expect(result.current.weeklyTrends.length).toBeGreaterThan(0);
      expect(result.current.weeklyTrends.length).toBeLessThanOrEqual(9); // up to 9 weeks
    });

    it('assigns blocks to correct week buckets', async () => {
      const blocks = [
        makeBlock({ id: '1', date: '2026-02-05', valueQuadrant: 'production', startTime: '09:00', endTime: '10:00' }),
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // At least one week should have production hours > 0
      const weekWithData = result.current.weeklyTrends.find((w) => w.productionHours > 0);
      expect(weekWithData).toBeDefined();
      expect(weekWithData!.productionHours).toBe(1); // 60 min = 1 hr
      expect(weekWithData!.totalHours).toBe(1);
    });

    it('calculates production percentage per week', async () => {
      const blocks = [
        makeBlock({ id: '1', date: '2026-02-05', valueQuadrant: 'production', startTime: '09:00', endTime: '10:00' }),
        makeBlock({ id: '2', date: '2026-02-05', valueQuadrant: 'investment', startTime: '10:00', endTime: '11:00' }),
      ];
      mockFetchWithBlocks(blocks);

      const { result } = renderHook(() => useAnalyticsData(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const weekWithData = result.current.weeklyTrends.find((w) => w.totalHours > 0);
      expect(weekWithData).toBeDefined();
      expect(weekWithData!.productionPercentage).toBe(50);
    });
  });
});
