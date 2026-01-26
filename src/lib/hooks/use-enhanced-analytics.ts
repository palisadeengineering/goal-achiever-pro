'use client';

import { useMemo } from 'react';
import { useLocalStorage } from './use-local-storage';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  parseISO,
  isWithinInterval,
  subWeeks,
  subMonths,
  differenceInMinutes,
} from 'date-fns';
import type { DripQuadrant, EnergyRating } from '@/types/database';

// Activity types
export type ActivityType = 'project' | 'meeting' | 'commute' | 'deep_work' | 'admin' | 'break' | 'other';

interface TimeBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  activityName: string;
  dripQuadrant: DripQuadrant;
  energyRating: EnergyRating;
  activityType?: ActivityType;
  detectedProjectId?: string;
  detectedProjectName?: string;
  meetingCategoryId?: string;
  meetingCategoryName?: string;
  createdAt: string;
}

interface ProjectBreakdown {
  projectId: string;
  projectName: string;
  linkedGoalId?: string;
  linkedGoalName?: string;
  totalMinutes: number;
  eventCount: number;
  trend: number; // week-over-week percentage change
}

interface MeetingCategoryBreakdown {
  categoryId: string;
  categoryName: string;
  minutes: number;
  eventCount: number;
}

interface MeetingMetrics {
  totalMeetingMinutes: number;
  meetingFreeMinutes: number;
  meetingPercentage: number;
  categoryBreakdown: MeetingCategoryBreakdown[];
  longestMeetingDay: { date: string; minutes: number };
  averageMeetingDuration: number;
  trend: number; // week-over-week percentage change
}

interface ActivityTypeBreakdown {
  type: ActivityType;
  minutes: number;
  percentage: number;
  trend: number;
}

interface PeriodSummary {
  totalMinutes: number;
  productionMinutes: number;
  meetingMinutes: number;
  projectMinutes: number;
  deepWorkMinutes: number;
  commuteMinutes: number;
  adminMinutes: number;
  productionPercentage: number;
  meetingPercentage: number;
}

interface PeriodComparison {
  current: PeriodSummary;
  previous: PeriodSummary;
  changes: {
    totalHours: number;
    productionPercentage: number;
    meetingPercentage: number;
  };
}

export interface EnhancedAnalyticsData {
  // Project breakdown
  projectBreakdown: ProjectBreakdown[];
  totalProjectMinutes: number;

  // Meeting metrics
  meetingMetrics: MeetingMetrics;

  // Activity type breakdown
  activityTypeBreakdown: ActivityTypeBreakdown[];

  // Period comparison
  periodComparison: PeriodComparison;

  // Summary stats
  totalMinutes: number;
  totalHours: number;
}

// Calculate duration in minutes between two time strings
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

// Infer activity type from activity name if not set
function inferActivityType(block: TimeBlock): ActivityType {
  if (block.activityType && block.activityType !== 'other') {
    return block.activityType;
  }

  const name = block.activityName.toLowerCase();

  // Meeting indicators
  if (
    name.includes('meeting') ||
    name.includes('sync') ||
    name.includes('standup') ||
    name.includes('call') ||
    name.includes('1:1') ||
    name.includes('interview') ||
    name.includes('retro') ||
    name.includes('planning')
  ) {
    return 'meeting';
  }

  // Commute indicators
  if (
    name.includes('commute') ||
    name.includes('drive') ||
    name.includes('travel') ||
    name.includes('train') ||
    name.includes('uber')
  ) {
    return 'commute';
  }

  // Deep work indicators
  if (
    name.includes('focus') ||
    name.includes('deep work') ||
    name.includes('coding') ||
    name.includes('writing') ||
    name.includes('design')
  ) {
    return 'deep_work';
  }

  // Admin indicators
  if (
    name.includes('email') ||
    name.includes('admin') ||
    name.includes('expense') ||
    name.includes('invoice') ||
    name.includes('slack')
  ) {
    return 'admin';
  }

  // Break indicators
  if (
    name.includes('lunch') ||
    name.includes('break') ||
    name.includes('coffee')
  ) {
    return 'break';
  }

  // Project work (if has a project attached or looks like project work)
  if (block.detectedProjectId || block.detectedProjectName) {
    return 'project';
  }

  return 'other';
}

export type TimeGranularity = 'day' | 'week' | 'month' | 'quarter';

export function useEnhancedAnalytics(
  dateRange: { start: Date; end: Date },
  granularity: TimeGranularity = 'week'
): EnhancedAnalyticsData {
  const [timeBlocks] = useLocalStorage<TimeBlock[]>('time-blocks', []);

  // Get comparison period based on granularity
  const getComparisonRange = useMemo(() => {
    const diffMs = dateRange.end.getTime() - dateRange.start.getTime();
    const prevEnd = new Date(dateRange.start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diffMs);
    return { start: prevStart, end: prevEnd };
  }, [dateRange]);

  // Filter blocks within date range
  const filteredBlocks = useMemo(() => {
    return timeBlocks.filter((block) => {
      const blockDate = parseISO(block.date);
      return isWithinInterval(blockDate, { start: dateRange.start, end: dateRange.end });
    });
  }, [timeBlocks, dateRange]);

  // Filter blocks for comparison period
  const comparisonBlocks = useMemo(() => {
    return timeBlocks.filter((block) => {
      const blockDate = parseISO(block.date);
      return isWithinInterval(blockDate, { start: getComparisonRange.start, end: getComparisonRange.end });
    });
  }, [timeBlocks, getComparisonRange]);

  // Calculate total minutes
  const totalMinutes = useMemo(() => {
    return filteredBlocks.reduce((sum, block) => {
      return sum + calculateDuration(block.startTime, block.endTime);
    }, 0);
  }, [filteredBlocks]);

  // Project breakdown
  const projectBreakdown = useMemo((): ProjectBreakdown[] => {
    const projectMap = new Map<string, {
      name: string;
      goalId?: string;
      goalName?: string;
      minutes: number;
      count: number;
    }>();

    // Current period
    filteredBlocks.forEach((block) => {
      const type = inferActivityType(block);
      if (type === 'project' || block.detectedProjectId) {
        const projectId = block.detectedProjectId || `inferred-${block.activityName}`;
        const projectName = block.detectedProjectName || block.activityName;

        const existing = projectMap.get(projectId) || {
          name: projectName,
          minutes: 0,
          count: 0,
        };

        existing.minutes += calculateDuration(block.startTime, block.endTime);
        existing.count += 1;
        projectMap.set(projectId, existing);
      }
    });

    // Calculate previous period for trend
    const prevProjectMinutes = new Map<string, number>();
    comparisonBlocks.forEach((block) => {
      const type = inferActivityType(block);
      if (type === 'project' || block.detectedProjectId) {
        const projectId = block.detectedProjectId || `inferred-${block.activityName}`;
        const existing = prevProjectMinutes.get(projectId) || 0;
        prevProjectMinutes.set(projectId, existing + calculateDuration(block.startTime, block.endTime));
      }
    });

    return Array.from(projectMap.entries())
      .map(([projectId, data]) => {
        const prevMinutes = prevProjectMinutes.get(projectId) || 0;
        const trend = prevMinutes > 0
          ? ((data.minutes - prevMinutes) / prevMinutes) * 100
          : data.minutes > 0 ? 100 : 0;

        return {
          projectId,
          projectName: data.name,
          linkedGoalId: data.goalId,
          linkedGoalName: data.goalName,
          totalMinutes: data.minutes,
          eventCount: data.count,
          trend: Math.round(trend),
        };
      })
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [filteredBlocks, comparisonBlocks]);

  // Meeting metrics
  const meetingMetrics = useMemo((): MeetingMetrics => {
    const categoryMap = new Map<string, { name: string; minutes: number; count: number }>();
    let totalMeetingMinutes = 0;
    const dailyMeetingMinutes = new Map<string, number>();
    let meetingCount = 0;

    filteredBlocks.forEach((block) => {
      const type = inferActivityType(block);
      if (type === 'meeting') {
        const duration = calculateDuration(block.startTime, block.endTime);
        totalMeetingMinutes += duration;
        meetingCount += 1;

        // Track by category
        const categoryId = block.meetingCategoryId || 'uncategorized';
        const categoryName = block.meetingCategoryName || 'Uncategorized';
        const existing = categoryMap.get(categoryId) || { name: categoryName, minutes: 0, count: 0 };
        existing.minutes += duration;
        existing.count += 1;
        categoryMap.set(categoryId, existing);

        // Track daily
        const dailyExisting = dailyMeetingMinutes.get(block.date) || 0;
        dailyMeetingMinutes.set(block.date, dailyExisting + duration);
      }
    });

    // Find longest meeting day
    let longestDay = { date: '', minutes: 0 };
    dailyMeetingMinutes.forEach((minutes, date) => {
      if (minutes > longestDay.minutes) {
        longestDay = { date, minutes };
      }
    });

    // Calculate trend
    let prevMeetingMinutes = 0;
    comparisonBlocks.forEach((block) => {
      const type = inferActivityType(block);
      if (type === 'meeting') {
        prevMeetingMinutes += calculateDuration(block.startTime, block.endTime);
      }
    });

    const trend = prevMeetingMinutes > 0
      ? ((totalMeetingMinutes - prevMeetingMinutes) / prevMeetingMinutes) * 100
      : totalMeetingMinutes > 0 ? 100 : 0;

    return {
      totalMeetingMinutes,
      meetingFreeMinutes: totalMinutes - totalMeetingMinutes,
      meetingPercentage: totalMinutes > 0 ? Math.round((totalMeetingMinutes / totalMinutes) * 100) : 0,
      categoryBreakdown: Array.from(categoryMap.entries())
        .map(([categoryId, data]) => ({
          categoryId,
          categoryName: data.name,
          minutes: data.minutes,
          eventCount: data.count,
        }))
        .sort((a, b) => b.minutes - a.minutes),
      longestMeetingDay: longestDay,
      averageMeetingDuration: meetingCount > 0 ? Math.round(totalMeetingMinutes / meetingCount) : 0,
      trend: Math.round(trend),
    };
  }, [filteredBlocks, comparisonBlocks, totalMinutes]);

  // Activity type breakdown
  const activityTypeBreakdown = useMemo((): ActivityTypeBreakdown[] => {
    const typeMinutes: Record<ActivityType, number> = {
      project: 0,
      meeting: 0,
      commute: 0,
      deep_work: 0,
      admin: 0,
      break: 0,
      other: 0,
    };

    filteredBlocks.forEach((block) => {
      const type = inferActivityType(block);
      typeMinutes[type] += calculateDuration(block.startTime, block.endTime);
    });

    // Previous period for trend
    const prevTypeMinutes: Record<ActivityType, number> = {
      project: 0,
      meeting: 0,
      commute: 0,
      deep_work: 0,
      admin: 0,
      break: 0,
      other: 0,
    };

    comparisonBlocks.forEach((block) => {
      const type = inferActivityType(block);
      prevTypeMinutes[type] += calculateDuration(block.startTime, block.endTime);
    });

    return (Object.keys(typeMinutes) as ActivityType[])
      .map((type) => {
        const minutes = typeMinutes[type];
        const prevMinutes = prevTypeMinutes[type];
        const trend = prevMinutes > 0
          ? ((minutes - prevMinutes) / prevMinutes) * 100
          : minutes > 0 ? 100 : 0;

        return {
          type,
          minutes,
          percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
          trend: Math.round(trend),
        };
      })
      .filter((item) => item.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);
  }, [filteredBlocks, comparisonBlocks, totalMinutes]);

  // Period comparison
  const periodComparison = useMemo((): PeriodComparison => {
    const calculateSummary = (blocks: TimeBlock[]): PeriodSummary => {
      const summary: PeriodSummary = {
        totalMinutes: 0,
        productionMinutes: 0,
        meetingMinutes: 0,
        projectMinutes: 0,
        deepWorkMinutes: 0,
        commuteMinutes: 0,
        adminMinutes: 0,
        productionPercentage: 0,
        meetingPercentage: 0,
      };

      blocks.forEach((block) => {
        const duration = calculateDuration(block.startTime, block.endTime);
        const type = inferActivityType(block);

        summary.totalMinutes += duration;

        if (block.dripQuadrant === 'production') {
          summary.productionMinutes += duration;
        }

        switch (type) {
          case 'meeting':
            summary.meetingMinutes += duration;
            break;
          case 'project':
            summary.projectMinutes += duration;
            break;
          case 'deep_work':
            summary.deepWorkMinutes += duration;
            break;
          case 'commute':
            summary.commuteMinutes += duration;
            break;
          case 'admin':
            summary.adminMinutes += duration;
            break;
        }
      });

      summary.productionPercentage = summary.totalMinutes > 0
        ? Math.round((summary.productionMinutes / summary.totalMinutes) * 100)
        : 0;
      summary.meetingPercentage = summary.totalMinutes > 0
        ? Math.round((summary.meetingMinutes / summary.totalMinutes) * 100)
        : 0;

      return summary;
    };

    const current = calculateSummary(filteredBlocks);
    const previous = calculateSummary(comparisonBlocks);

    return {
      current,
      previous,
      changes: {
        totalHours: (current.totalMinutes - previous.totalMinutes) / 60,
        productionPercentage: current.productionPercentage - previous.productionPercentage,
        meetingPercentage: current.meetingPercentage - previous.meetingPercentage,
      },
    };
  }, [filteredBlocks, comparisonBlocks]);

  // Total project minutes
  const totalProjectMinutes = useMemo(() => {
    return projectBreakdown.reduce((sum, p) => sum + p.totalMinutes, 0);
  }, [projectBreakdown]);

  return {
    projectBreakdown,
    totalProjectMinutes,
    meetingMetrics,
    activityTypeBreakdown,
    periodComparison,
    totalMinutes,
    totalHours: totalMinutes / 60,
  };
}
