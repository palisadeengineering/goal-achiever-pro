import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEnhancedAnalytics } from '@/lib/hooks/use-enhanced-analytics';

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
    detectedProjectId: 'detectedProjectId' in overrides ? overrides.detectedProjectId : null,
    detectedProjectName: 'detectedProjectName' in overrides ? overrides.detectedProjectName : null,
    meetingCategoryId: 'meetingCategoryId' in overrides ? overrides.meetingCategoryId : null,
    meetingCategoryName: 'meetingCategoryName' in overrides ? overrides.meetingCategoryName : null,
    createdAt: '2026-02-05T09:00:00Z',
  };
}

function mockFetchReturning(currentBlocks: unknown[], prevBlocks: unknown[] = []) {
  let callCount = 0;
  mockFetch.mockImplementation(() => {
    callCount++;
    const blocks = callCount === 1 ? currentBlocks : prevBlocks;
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ timeBlocks: blocks }),
    });
  });
}

describe('useEnhancedAnalytics', () => {
  const defaultDateRange = {
    start: new Date('2026-02-03'),
    end: new Date('2026-02-09'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data fetching', () => {
    it('fetches current and comparison periods in parallel', async () => {
      mockFetchReturning([], []);

      renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => {
        // Should make two fetch calls: current period + comparison period
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('handles fetch failure gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalMinutes).toBe(0);
      expect(result.current.projectBreakdown).toEqual([]);
    });
  });

  describe('Activity Type Inference', () => {
    it('uses explicit activityType when set', async () => {
      const blocks = [
        makeBlock({ id: '1', activityType: 'deep_work', activityName: 'Some meeting call' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const deepWork = result.current.activityTypeBreakdown.find((a) => a.type === 'deep_work');
      expect(deepWork).toBeDefined();
      expect(deepWork!.minutes).toBe(60);
    });

    it('infers "meeting" from activity names containing meeting keywords', async () => {
      const blocks = [
        makeBlock({ id: '1', activityName: 'Team Standup' }),
        makeBlock({ id: '2', activityName: 'Weekly Sync', startTime: '10:00', endTime: '11:00' }),
        makeBlock({ id: '3', activityName: '1:1 with Manager', startTime: '11:00', endTime: '11:30' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const meetings = result.current.activityTypeBreakdown.find((a) => a.type === 'meeting');
      expect(meetings).toBeDefined();
      expect(meetings!.minutes).toBe(150); // 60 + 60 + 30
    });

    it('infers "commute" from commute-related names', async () => {
      const blocks = [
        makeBlock({ id: '1', activityName: 'Morning Commute' }),
        makeBlock({ id: '2', activityName: 'Drive to office', startTime: '17:00', endTime: '18:00' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const commute = result.current.activityTypeBreakdown.find((a) => a.type === 'commute');
      expect(commute).toBeDefined();
      expect(commute!.minutes).toBe(120);
    });

    it('infers "deep_work" from focus/coding/writing names', async () => {
      const blocks = [
        makeBlock({ id: '1', activityName: 'Focus time - coding' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const deepWork = result.current.activityTypeBreakdown.find((a) => a.type === 'deep_work');
      expect(deepWork).toBeDefined();
      expect(deepWork!.minutes).toBe(60);
    });

    it('infers "admin" from admin/email/slack names', async () => {
      const blocks = [
        makeBlock({ id: '1', activityName: 'Email and Slack catch-up' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const admin = result.current.activityTypeBreakdown.find((a) => a.type === 'admin');
      expect(admin).toBeDefined();
      expect(admin!.minutes).toBe(60);
    });

    it('infers "break" from lunch/break/coffee names', async () => {
      const blocks = [
        makeBlock({ id: '1', activityName: 'Lunch break' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const breakType = result.current.activityTypeBreakdown.find((a) => a.type === 'break');
      expect(breakType).toBeDefined();
      expect(breakType!.minutes).toBe(60);
    });

    it('infers "project" when block has detectedProjectId', async () => {
      const blocks = [
        makeBlock({ id: '1', activityName: 'Random thing', detectedProjectId: 'proj-1', detectedProjectName: 'Bridge' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const project = result.current.activityTypeBreakdown.find((a) => a.type === 'project');
      expect(project).toBeDefined();
      expect(project!.minutes).toBe(60);
    });

    it('defaults to "other" for unrecognized activity names', async () => {
      const blocks = [
        makeBlock({ id: '1', activityName: 'Something completely random' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const other = result.current.activityTypeBreakdown.find((a) => a.type === 'other');
      expect(other).toBeDefined();
      expect(other!.minutes).toBe(60);
    });
  });

  describe('Project Breakdown', () => {
    it('groups blocks by detected project', async () => {
      const blocks = [
        makeBlock({ id: '1', detectedProjectId: 'proj-1', detectedProjectName: 'Bridge', startTime: '09:00', endTime: '10:00' }),
        makeBlock({ id: '2', detectedProjectId: 'proj-1', detectedProjectName: 'Bridge', startTime: '10:00', endTime: '11:00' }),
        makeBlock({ id: '3', detectedProjectId: 'proj-2', detectedProjectName: 'Highway', startTime: '11:00', endTime: '11:30' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.projectBreakdown.length).toBe(2);

      const bridge = result.current.projectBreakdown.find((p) => p.projectName === 'Bridge');
      expect(bridge).toBeDefined();
      expect(bridge!.totalMinutes).toBe(120);
      expect(bridge!.eventCount).toBe(2);

      const highway = result.current.projectBreakdown.find((p) => p.projectName === 'Highway');
      expect(highway).toBeDefined();
      expect(highway!.totalMinutes).toBe(30);
      expect(highway!.eventCount).toBe(1);
    });

    it('sorts projects by total minutes descending', async () => {
      const blocks = [
        makeBlock({ id: '1', detectedProjectId: 'proj-1', detectedProjectName: 'Small', startTime: '09:00', endTime: '09:30' }),
        makeBlock({ id: '2', detectedProjectId: 'proj-2', detectedProjectName: 'Big', startTime: '10:00', endTime: '12:00' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.projectBreakdown[0].projectName).toBe('Big');
      expect(result.current.projectBreakdown[1].projectName).toBe('Small');
    });

    it('calculates total project minutes', async () => {
      const blocks = [
        makeBlock({ id: '1', detectedProjectId: 'proj-1', detectedProjectName: 'Bridge', startTime: '09:00', endTime: '10:00' }),
        makeBlock({ id: '2', detectedProjectId: 'proj-2', detectedProjectName: 'Highway', startTime: '10:00', endTime: '11:00' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.totalProjectMinutes).toBe(120);
    });

    it('calculates trend vs comparison period', async () => {
      const currentBlocks = [
        makeBlock({ id: '1', detectedProjectId: 'proj-1', detectedProjectName: 'Bridge', startTime: '09:00', endTime: '11:00' }), // 120 min
      ];
      const prevBlocks = [
        makeBlock({ id: '2', detectedProjectId: 'proj-1', detectedProjectName: 'Bridge', startTime: '09:00', endTime: '10:00' }), // 60 min
      ];
      mockFetchReturning(currentBlocks, prevBlocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const bridge = result.current.projectBreakdown.find((p) => p.projectName === 'Bridge');
      expect(bridge).toBeDefined();
      expect(bridge!.trend).toBe(100); // 100% increase (60 → 120)
    });

    it('shows 100% trend for new projects with no previous data', async () => {
      const currentBlocks = [
        makeBlock({ id: '1', detectedProjectId: 'proj-new', detectedProjectName: 'New Project', startTime: '09:00', endTime: '10:00' }),
      ];
      mockFetchReturning(currentBlocks, []);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const newProject = result.current.projectBreakdown.find((p) => p.projectName === 'New Project');
      expect(newProject).toBeDefined();
      expect(newProject!.trend).toBe(100);
    });
  });

  describe('Meeting Metrics', () => {
    it('computes total meeting minutes and percentage', async () => {
      const blocks = [
        makeBlock({ id: '1', activityName: 'Team Meeting', startTime: '09:00', endTime: '10:00' }),
        makeBlock({ id: '2', activityName: 'Deep work session', startTime: '10:00', endTime: '12:00' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.meetingMetrics.totalMeetingMinutes).toBe(60);
      // 60 / 180 * 100 = 33
      expect(result.current.meetingMetrics.meetingPercentage).toBe(33);
    });

    it('computes meeting-free minutes', async () => {
      const blocks = [
        makeBlock({ id: '1', activityName: 'Team Meeting', startTime: '09:00', endTime: '10:00' }),
        makeBlock({ id: '2', activityName: 'Deep focus coding', startTime: '10:00', endTime: '12:00' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Total = 180, meetings = 60, free = 120
      expect(result.current.meetingMetrics.meetingFreeMinutes).toBe(120);
    });

    it('groups meetings by category', async () => {
      const blocks = [
        makeBlock({ id: '1', activityName: 'Client Call', meetingCategoryId: 'cat-1', meetingCategoryName: 'Client Meetings' }),
        makeBlock({ id: '2', activityName: 'Team Standup', meetingCategoryId: 'cat-2', meetingCategoryName: 'Internal' }),
        makeBlock({ id: '3', activityName: 'Client Review call', meetingCategoryId: 'cat-1', meetingCategoryName: 'Client Meetings', startTime: '11:00', endTime: '12:00' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const clientCat = result.current.meetingMetrics.categoryBreakdown.find(
        (c) => c.categoryName === 'Client Meetings'
      );
      expect(clientCat).toBeDefined();
      expect(clientCat!.minutes).toBe(120);
      expect(clientCat!.eventCount).toBe(2);
    });

    it('uses "Uncategorized" for meetings without a category', async () => {
      const blocks = [
        makeBlock({ id: '1', activityName: 'Random Call', meetingCategoryId: null }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const uncategorized = result.current.meetingMetrics.categoryBreakdown.find(
        (c) => c.categoryName === 'Uncategorized'
      );
      expect(uncategorized).toBeDefined();
    });

    it('finds the longest meeting day', async () => {
      const blocks = [
        makeBlock({ id: '1', date: '2026-02-05', activityName: 'Meeting 1', startTime: '09:00', endTime: '10:00' }),
        makeBlock({ id: '2', date: '2026-02-05', activityName: 'Meeting 2', startTime: '10:00', endTime: '11:00' }),
        makeBlock({ id: '3', date: '2026-02-06', activityName: 'Meeting 3', startTime: '09:00', endTime: '09:30' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.meetingMetrics.longestMeetingDay.date).toBe('2026-02-05');
      expect(result.current.meetingMetrics.longestMeetingDay.minutes).toBe(120);
    });

    it('computes average meeting duration', async () => {
      const blocks = [
        makeBlock({ id: '1', activityName: 'Meeting A', startTime: '09:00', endTime: '10:00' }), // 60 min
        makeBlock({ id: '2', activityName: 'Meeting B', startTime: '10:00', endTime: '10:30' }), // 30 min
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // (60 + 30) / 2 = 45
      expect(result.current.meetingMetrics.averageMeetingDuration).toBe(45);
    });
  });

  describe('Leverage Breakdown', () => {
    it('computes leverage breakdown with percentages', async () => {
      const blocks = [
        makeBlock({ id: '1', leverageType: 'code', startTime: '09:00', endTime: '11:00' }),     // 120 min
        makeBlock({ id: '2', leverageType: 'content', startTime: '11:00', endTime: '11:30' }),   // 30 min
        makeBlock({ id: '3', leverageType: 'capital', startTime: '11:30', endTime: '12:00' }),   // 30 min
        makeBlock({ id: '4', leverageType: 'collaboration', startTime: '14:00', endTime: '14:30' }), // 30 min (not counted: this needs "meeting" in name or activityType)
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.leverageBreakdown.length).toBeGreaterThan(0);

      const code = result.current.leverageBreakdown.find((l) => l.type === 'code');
      expect(code).toBeDefined();
      expect(code!.minutes).toBe(120);
    });

    it('filters out leverage types with 0 minutes', async () => {
      const blocks = [
        makeBlock({ id: '1', leverageType: 'code', startTime: '09:00', endTime: '10:00' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Only 'code' should appear (others have 0 minutes)
      expect(result.current.leverageBreakdown.length).toBe(1);
      expect(result.current.leverageBreakdown[0].type).toBe('code');
      expect(result.current.leverageBreakdown[0].percentage).toBe(100);
    });

    it('returns empty array when no leverage types assigned', async () => {
      const blocks = [
        makeBlock({ id: '1', leverageType: null }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.leverageBreakdown).toEqual([]);
    });
  });

  describe('Period Comparison', () => {
    it('calculates current vs previous period summaries', async () => {
      const currentBlocks = [
        makeBlock({ id: '1', valueQuadrant: 'production', activityName: 'Team Meeting', startTime: '09:00', endTime: '10:00' }),
        makeBlock({ id: '2', valueQuadrant: 'investment', activityName: 'Deep focus coding', startTime: '10:00', endTime: '12:00' }),
      ];
      const prevBlocks = [
        makeBlock({ id: '3', valueQuadrant: 'production', activityName: 'Work', startTime: '09:00', endTime: '10:00' }),
      ];
      mockFetchReturning(currentBlocks, prevBlocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Current: 180 total minutes
      expect(result.current.periodComparison.current.totalMinutes).toBe(180);
      // Previous: 60 total minutes
      expect(result.current.periodComparison.previous.totalMinutes).toBe(60);
      // Change: (180 - 60) / 60 = 2 hours change
      expect(result.current.periodComparison.changes.totalHours).toBe(2);
    });

    it('handles empty comparison period', async () => {
      const currentBlocks = [
        makeBlock({ id: '1', startTime: '09:00', endTime: '10:00' }),
      ];
      mockFetchReturning(currentBlocks, []);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.periodComparison.previous.totalMinutes).toBe(0);
      expect(result.current.periodComparison.changes.totalHours).toBeCloseTo(1);
    });
  });

  describe('Activity Type Breakdown', () => {
    it('calculates percentages relative to total', async () => {
      const blocks = [
        makeBlock({ id: '1', activityName: 'Team Meeting', startTime: '09:00', endTime: '10:00' }),    // 60 min meeting
        makeBlock({ id: '2', activityName: 'Deep focus coding', startTime: '10:00', endTime: '12:00' }), // 120 min deep_work
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const meeting = result.current.activityTypeBreakdown.find((a) => a.type === 'meeting');
      const deepWork = result.current.activityTypeBreakdown.find((a) => a.type === 'deep_work');

      // 60 / 180 = 33%
      expect(meeting!.percentage).toBe(33);
      // 120 / 180 = 67%
      expect(deepWork!.percentage).toBe(67);
    });

    it('filters out activity types with 0 minutes', async () => {
      const blocks = [
        makeBlock({ id: '1', activityName: 'Team Meeting', startTime: '09:00', endTime: '10:00' }),
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Only 'meeting' should appear
      expect(result.current.activityTypeBreakdown.length).toBe(1);
      expect(result.current.activityTypeBreakdown[0].type).toBe('meeting');
    });

    it('sorts by minutes descending', async () => {
      const blocks = [
        makeBlock({ id: '1', activityName: 'Quick call', startTime: '09:00', endTime: '09:15' }),       // 15 min meeting
        makeBlock({ id: '2', activityName: 'Deep focus coding', startTime: '10:00', endTime: '12:00' }), // 120 min deep_work
      ];
      mockFetchReturning(blocks);

      const { result } = renderHook(() => useEnhancedAnalytics(defaultDateRange));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.activityTypeBreakdown[0].type).toBe('deep_work');
      expect(result.current.activityTypeBreakdown[1].type).toBe('meeting');
    });
  });
});
