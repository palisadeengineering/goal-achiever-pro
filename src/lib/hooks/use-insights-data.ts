'use client';

import { useMemo } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import type { Tag } from './use-tags';
import type { ValueQuadrant, EnergyRating } from '@/types/database';

// Helper to parse date string as local date (avoids UTC timezone issues)
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export interface TimeBlockData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  activityName: string;
  valueQuadrant: ValueQuadrant;
  energyRating: EnergyRating;
  tagIds?: string[];
  durationMinutes?: number;
}

export type GroupByOption = 'value' | 'energy' | 'tag' | 'day' | 'week';
export type GranularityOption = 'day' | 'week' | 'month';
export type MeasureOption = 'hours' | 'events';

interface InsightsFilters {
  valueQuadrants?: ValueQuadrant[];
  energyRatings?: EnergyRating[];
  tagIds?: string[];
}

interface ChartDataPoint {
  label: string;
  value: number;
  color: string;
  percentage?: number;
}

interface TimeSeriesDataPoint {
  period: string;
  [key: string]: number | string;
}

interface UseInsightsDataParams {
  timeBlocks: TimeBlockData[];
  tags: Tag[];
  startDate: Date;
  endDate: Date;
  groupBy: GroupByOption;
  granularity: GranularityOption;
  measure: MeasureOption;
  filters?: InsightsFilters;
}

export interface EnergyFlowDataPoint {
  hour: number;
  hourLabel: string;
  avgEnergy: number;
  energizingMinutes: number;
  neutralMinutes: number;
  drainingMinutes: number;
  totalMinutes: number;
  dominantEnergy: 'green' | 'yellow' | 'red' | null;
}

interface UseInsightsDataReturn {
  barChartData: ChartDataPoint[];
  timeSeriesData: TimeSeriesDataPoint[];
  energyFlowData: EnergyFlowDataPoint[];
  totals: {
    totalHours: number;
    totalEvents: number;
    avgHoursPerDay: number;
  };
  breakdown: {
    value: ChartDataPoint[];
    energy: ChartDataPoint[];
    tags: ChartDataPoint[];
  };
}

const VALUE_COLORS: Record<ValueQuadrant, string> = {
  production: '#22c55e',
  investment: '#9333ea',
  replacement: '#eab308',
  delegation: '#ef4444',
  na: '#94a3b8',
};

const VALUE_LABELS: Record<ValueQuadrant, string> = {
  production: 'Production',
  investment: 'Investment',
  replacement: 'Replacement',
  delegation: 'Delegation',
  na: 'N/A',
};

const ENERGY_COLORS: Record<EnergyRating, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

const ENERGY_LABELS: Record<EnergyRating, string> = {
  green: 'Energizing',
  yellow: 'Neutral',
  red: 'Draining',
};

function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function formatPeriod(date: Date, granularity: GranularityOption): string {
  switch (granularity) {
    case 'day':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'week':
      return `Week ${getWeekNumber(date)}`;
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
}

function getPeriodKey(date: Date, granularity: GranularityOption): string {
  switch (granularity) {
    case 'day':
      return date.toISOString().split('T')[0];
    case 'week':
      return `${date.getFullYear()}-W${getWeekNumber(date)}`;
    case 'month':
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }
}

export function useInsightsData({
  timeBlocks,
  tags,
  startDate,
  endDate,
  groupBy,
  granularity,
  measure,
  filters,
}: UseInsightsDataParams): UseInsightsDataReturn {
  const filteredBlocks = useMemo(() => {
    // Normalize date range to start/end of day for consistent comparison
    const rangeStart = startOfDay(startDate);
    const rangeEnd = endOfDay(endDate);

    return timeBlocks.filter(block => {
      // Parse date string as local date to avoid UTC timezone issues
      const blockDate = parseLocalDate(block.date);
      if (blockDate < rangeStart || blockDate > rangeEnd) return false;

      if (filters?.valueQuadrants?.length && !filters.valueQuadrants.includes(block.valueQuadrant)) {
        return false;
      }

      if (filters?.energyRatings?.length && !filters.energyRatings.includes(block.energyRating)) {
        return false;
      }

      if (filters?.tagIds?.length) {
        const blockTags = block.tagIds || [];
        if (!filters.tagIds.some(id => blockTags.includes(id))) {
          return false;
        }
      }

      return true;
    });
  }, [timeBlocks, startDate, endDate, filters]);

  const blocksWithDuration = useMemo(() => {
    return filteredBlocks.map(block => ({
      ...block,
      durationMinutes: block.durationMinutes || calculateDuration(block.startTime, block.endTime),
    }));
  }, [filteredBlocks]);

  const tagMap = useMemo(() => {
    return tags.reduce((acc, tag) => {
      acc[tag.id] = tag;
      return acc;
    }, {} as Record<string, Tag>);
  }, [tags]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalMinutes = blocksWithDuration.reduce((sum, b) => sum + b.durationMinutes, 0);
    const totalHours = totalMinutes / 60;
    const totalEvents = blocksWithDuration.length;

    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const avgHoursPerDay = totalHours / daysDiff;

    return { totalHours, totalEvents, avgHoursPerDay };
  }, [blocksWithDuration, startDate, endDate]);

  // Calculate breakdown by Value
  const valueBreakdown = useMemo(() => {
    const totals: Record<ValueQuadrant, number> = {
      production: 0,
      investment: 0,
      replacement: 0,
      delegation: 0,
      na: 0,
    };

    blocksWithDuration.forEach(block => {
      const value = measure === 'hours' ? block.durationMinutes / 60 : 1;
      totals[block.valueQuadrant] += value;
    });

    const total = Object.values(totals).reduce((sum, v) => sum + v, 0);

    return (['production', 'investment', 'replacement', 'delegation', 'na'] as ValueQuadrant[]).map(quadrant => ({
      label: VALUE_LABELS[quadrant],
      value: Math.round(totals[quadrant] * 10) / 10,
      color: VALUE_COLORS[quadrant],
      percentage: total > 0 ? Math.round((totals[quadrant] / total) * 100) : 0,
    }));
  }, [blocksWithDuration, measure]);

  // Calculate breakdown by energy
  const energyBreakdown = useMemo(() => {
    const totals: Record<EnergyRating, number> = {
      green: 0,
      yellow: 0,
      red: 0,
    };

    blocksWithDuration.forEach(block => {
      const value = measure === 'hours' ? block.durationMinutes / 60 : 1;
      totals[block.energyRating] += value;
    });

    const total = Object.values(totals).reduce((sum, v) => sum + v, 0);

    return (['green', 'yellow', 'red'] as EnergyRating[]).map(rating => ({
      label: ENERGY_LABELS[rating],
      value: Math.round(totals[rating] * 10) / 10,
      color: ENERGY_COLORS[rating],
      percentage: total > 0 ? Math.round((totals[rating] / total) * 100) : 0,
    }));
  }, [blocksWithDuration, measure]);

  // Calculate breakdown by tags
  const tagsBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};

    blocksWithDuration.forEach(block => {
      const value = measure === 'hours' ? block.durationMinutes / 60 : 1;
      const blockTags = block.tagIds || [];

      if (blockTags.length === 0) {
        totals['untagged'] = (totals['untagged'] || 0) + value;
      } else {
        blockTags.forEach(tagId => {
          totals[tagId] = (totals[tagId] || 0) + value;
        });
      }
    });

    const total = Object.values(totals).reduce((sum, v) => sum + v, 0);

    return Object.entries(totals)
      .map(([key, value]) => {
        const tag = tagMap[key];
        return {
          label: tag ? tag.name : 'Untagged',
          value: Math.round(value * 10) / 10,
          color: tag ? tag.color : '#94a3b8',
          percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [blocksWithDuration, measure, tagMap]);

  // Bar chart data based on groupBy
  const barChartData = useMemo(() => {
    switch (groupBy) {
      case 'value':
        return valueBreakdown;
      case 'energy':
        return energyBreakdown;
      case 'tag':
        return tagsBreakdown;
      default:
        return valueBreakdown;
    }
  }, [groupBy, valueBreakdown, energyBreakdown, tagsBreakdown]);

  // Time series data
  const timeSeriesData = useMemo(() => {
    const periodData: Record<string, Record<string, number>> = {};

    // Initialize all periods in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const periodKey = getPeriodKey(currentDate, granularity);
      if (!periodData[periodKey]) {
        periodData[periodKey] = {};
      }

      switch (granularity) {
        case 'day':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'week':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'month':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }

    // Aggregate data by period and group
    blocksWithDuration.forEach(block => {
      // Parse date string as local date to avoid UTC timezone issues
      const blockDate = parseLocalDate(block.date);
      const periodKey = getPeriodKey(blockDate, granularity);
      const value = measure === 'hours' ? block.durationMinutes / 60 : 1;

      if (!periodData[periodKey]) {
        periodData[periodKey] = {};
      }

      switch (groupBy) {
        case 'value':
          periodData[periodKey][block.valueQuadrant] = (periodData[periodKey][block.valueQuadrant] || 0) + value;
          break;
        case 'energy':
          periodData[periodKey][block.energyRating] = (periodData[periodKey][block.energyRating] || 0) + value;
          break;
        case 'tag':
          const blockTags = block.tagIds || [];
          if (blockTags.length === 0) {
            periodData[periodKey]['untagged'] = (periodData[periodKey]['untagged'] || 0) + value;
          } else {
            blockTags.forEach(tagId => {
              const tag = tagMap[tagId];
              const tagName = tag ? tag.name : 'Unknown';
              periodData[periodKey][tagName] = (periodData[periodKey][tagName] || 0) + value;
            });
          }
          break;
        case 'day':
        case 'week':
          periodData[periodKey]['total'] = (periodData[periodKey]['total'] || 0) + value;
          break;
      }
    });

    // Convert to array and format
    return Object.entries(periodData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periodKey, data]) => {
        // Parse period key back to date for formatting
        let date: Date;
        if (granularity === 'day') {
          // Parse as local date to avoid timezone issues
          // periodKey is in format "YYYY-MM-DD"
          const [year, month, day] = periodKey.split('-').map(Number);
          date = new Date(year, month - 1, day);
        } else if (granularity === 'week') {
          const [year, week] = periodKey.split('-W');
          date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
        } else {
          const [year, month] = periodKey.split('-');
          date = new Date(parseInt(year), parseInt(month) - 1, 1);
        }

        return {
          period: formatPeriod(date, granularity),
          ...Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, Math.round(v * 10) / 10])
          ),
        };
      });
  }, [blocksWithDuration, groupBy, granularity, measure, tagMap, startDate, endDate]);

  // Energy flow data - shows energy levels by hour of day
  const energyFlowData = useMemo((): EnergyFlowDataPoint[] => {
    // Initialize data for each hour (6 AM to 10 PM for typical work hours)
    const hourlyData: Record<number, {
      energizingMinutes: number;
      neutralMinutes: number;
      drainingMinutes: number;
      totalMinutes: number;
    }> = {};

    // Initialize all hours from 6 AM to 10 PM
    for (let hour = 6; hour <= 22; hour++) {
      hourlyData[hour] = {
        energizingMinutes: 0,
        neutralMinutes: 0,
        drainingMinutes: 0,
        totalMinutes: 0,
      };
    }

    // Process each time block and distribute minutes to appropriate hours
    blocksWithDuration.forEach(block => {
      const [startHour, startMin] = block.startTime.split(':').map(Number);
      const [endHour, endMin] = block.endTime.split(':').map(Number);

      // Handle blocks that span multiple hours
      for (let hour = startHour; hour <= endHour && hour <= 22; hour++) {
        if (hour < 6) continue; // Skip hours before 6 AM

        let minutesInHour = 0;

        if (hour === startHour && hour === endHour) {
          // Block is entirely within one hour
          minutesInHour = endMin - startMin;
        } else if (hour === startHour) {
          // First hour of a multi-hour block
          minutesInHour = 60 - startMin;
        } else if (hour === endHour) {
          // Last hour of a multi-hour block
          minutesInHour = endMin;
        } else {
          // Middle hours (full 60 minutes)
          minutesInHour = 60;
        }

        if (minutesInHour <= 0) continue;

        if (!hourlyData[hour]) {
          hourlyData[hour] = {
            energizingMinutes: 0,
            neutralMinutes: 0,
            drainingMinutes: 0,
            totalMinutes: 0,
          };
        }

        hourlyData[hour].totalMinutes += minutesInHour;

        // Distribute minutes by energy rating
        switch (block.energyRating) {
          case 'green':
            hourlyData[hour].energizingMinutes += minutesInHour;
            break;
          case 'yellow':
            hourlyData[hour].neutralMinutes += minutesInHour;
            break;
          case 'red':
            hourlyData[hour].drainingMinutes += minutesInHour;
            break;
        }
      }
    });

    // Convert energy ratings to numeric scores: green=3, yellow=2, red=1
    const ENERGY_SCORES: Record<string, number> = {
      green: 3,
      yellow: 2,
      red: 1,
    };

    // Format hour labels and calculate averages
    return Object.entries(hourlyData)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([hourStr, data]) => {
        const hour = parseInt(hourStr);
        const { energizingMinutes, neutralMinutes, drainingMinutes, totalMinutes } = data;

        // Calculate weighted average energy score
        let avgEnergy = 0;
        if (totalMinutes > 0) {
          avgEnergy = (
            (energizingMinutes * ENERGY_SCORES.green) +
            (neutralMinutes * ENERGY_SCORES.yellow) +
            (drainingMinutes * ENERGY_SCORES.red)
          ) / totalMinutes;
        }

        // Determine dominant energy
        let dominantEnergy: 'green' | 'yellow' | 'red' | null = null;
        if (totalMinutes > 0) {
          if (energizingMinutes >= neutralMinutes && energizingMinutes >= drainingMinutes) {
            dominantEnergy = 'green';
          } else if (neutralMinutes >= drainingMinutes) {
            dominantEnergy = 'yellow';
          } else {
            dominantEnergy = 'red';
          }
        }

        // Format hour label (e.g., "6 AM", "12 PM", "6 PM")
        const hourLabel = hour === 0 ? '12 AM'
          : hour < 12 ? `${hour} AM`
          : hour === 12 ? '12 PM'
          : `${hour - 12} PM`;

        return {
          hour,
          hourLabel,
          avgEnergy: Math.round(avgEnergy * 100) / 100,
          energizingMinutes,
          neutralMinutes,
          drainingMinutes,
          totalMinutes,
          dominantEnergy,
        };
      });
  }, [blocksWithDuration]);

  return {
    barChartData,
    timeSeriesData,
    energyFlowData,
    totals,
    breakdown: {
      value: valueBreakdown,
      energy: energyBreakdown,
      tags: tagsBreakdown,
    },
  };
}
