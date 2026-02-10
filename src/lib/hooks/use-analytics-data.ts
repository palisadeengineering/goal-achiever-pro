'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  getDay,
  parseISO,
  isWithinInterval,
  subWeeks,
} from 'date-fns';
import type { ValueQuadrant, EnergyRating } from '@/types/database';

interface TimeBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  activityName: string;
  valueQuadrant: ValueQuadrant;
  energyRating: EnergyRating;
  leverageType?: string | null;
  activityType?: string | null;
  activityCategory?: string | null;
  detectedProjectId?: string | null;
  detectedProjectName?: string | null;
  tagIds?: string[];
  createdAt: string;
}

interface ValueBreakdown {
  delegation: number;
  replacement: number;
  investment: number;
  production: number;
  na: number;
}

interface EnergyBreakdown {
  green: number;
  yellow: number;
  red: number;
}

interface WeeklyTrendData {
  week: string;
  weekStart: Date;
  delegationHours: number;
  replacementHours: number;
  investmentHours: number;
  productionHours: number;
  totalHours: number;
  productionPercentage: number;
  energyBalance: number;
}

interface HeatmapCell {
  dayOfWeek: number; // 0-6 (Sun-Sat)
  hour: number; // 0-23
  value: number; // 0-1 intensity
  dominantEnergy: EnergyRating | null;
  dominantValue: ValueQuadrant | null;
  hoursLogged: number;
}

interface DailyBreakdown {
  date: string;
  value: ValueBreakdown;
  energy: EnergyBreakdown;
  totalMinutes: number;
}

export interface LeverageBreakdown {
  code: number;
  content: number;
  capital: number;
  collaboration: number;
  none: number;
}

export interface TagBreakdown {
  tagId: string;
  tagName: string;
  minutes: number;
  eventCount: number;
}

export interface AnalyticsData {
  valueBreakdown: ValueBreakdown;
  energyBreakdown: EnergyBreakdown;
  leverageBreakdown: LeverageBreakdown;
  productionPercentage: number;
  energyBalance: number;
  totalHours: number;
  weeklyTrends: WeeklyTrendData[];
  heatmapData: HeatmapCell[];
  dailyBreakdown: DailyBreakdown[];
  mostProductiveDay: string;
  peakProductivityHour: number;
  isLoading: boolean;
}

// Calculate duration in minutes between two time strings
function calculateDuration(startTime: string, endTime: string): number {
  const parseTime = (t: string) => {
    const parts = t.split(':').map(Number);
    return parts[0] * 60 + parts[1];
  };
  return parseTime(endTime) - parseTime(startTime);
}

export function useAnalyticsData(dateRange: { start: Date; end: Date }): AnalyticsData {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize date timestamps to avoid re-fetching on every render
  const startTime = dateRange.start.getTime();
  const endTime = dateRange.end.getTime();

  // Fetch time blocks from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const startDate = format(dateRange.start, 'yyyy-MM-dd');
        const endDate = format(dateRange.end, 'yyyy-MM-dd');

        // Fetch a broader range for weekly trends (8 weeks back from end)
        const trendsStart = format(subWeeks(dateRange.end, 8), 'yyyy-MM-dd');
        const fetchStart = trendsStart < startDate ? trendsStart : startDate;

        const res = await fetch(`/api/time-blocks?startDate=${fetchStart}&endDate=${endDate}`);
        if (res.ok) {
          const data = await res.json();
          setTimeBlocks(data.timeBlocks || []);
        }
      } catch (error) {
        console.error('Failed to fetch time blocks for analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, endTime]);

  // Filter blocks within the selected date range
  const filteredBlocks = useMemo(() => {
    return timeBlocks.filter((block) => {
      const blockDate = parseISO(block.date);
      return isWithinInterval(blockDate, { start: dateRange.start, end: dateRange.end });
    });
  }, [timeBlocks, dateRange]);

  // Value Breakdown
  const valueBreakdown = useMemo((): ValueBreakdown => {
    const breakdown: ValueBreakdown = { delegation: 0, replacement: 0, investment: 0, production: 0, na: 0 };

    filteredBlocks.forEach((block) => {
      const duration = calculateDuration(block.startTime, block.endTime);
      const quadrant = block.valueQuadrant || 'na';
      if (quadrant in breakdown) {
        breakdown[quadrant as keyof ValueBreakdown] += duration;
      }
    });

    return breakdown;
  }, [filteredBlocks]);

  // Energy Breakdown
  const energyBreakdown = useMemo((): EnergyBreakdown => {
    const breakdown: EnergyBreakdown = { green: 0, yellow: 0, red: 0 };

    filteredBlocks.forEach((block) => {
      const duration = calculateDuration(block.startTime, block.endTime);
      const rating = block.energyRating || 'yellow';
      if (rating in breakdown) {
        breakdown[rating as keyof EnergyBreakdown] += duration;
      }
    });

    return breakdown;
  }, [filteredBlocks]);

  // Leverage Type Breakdown (4 C's)
  const leverageBreakdown = useMemo((): LeverageBreakdown => {
    const breakdown: LeverageBreakdown = { code: 0, content: 0, capital: 0, collaboration: 0, none: 0 };

    filteredBlocks.forEach((block) => {
      const duration = calculateDuration(block.startTime, block.endTime);
      const leverage = block.leverageType || 'none';
      if (leverage in breakdown) {
        breakdown[leverage as keyof LeverageBreakdown] += duration;
      } else {
        breakdown.none += duration;
      }
    });

    return breakdown;
  }, [filteredBlocks]);

  // Total hours and percentages
  const totalMinutes = useMemo(() => {
    return Object.values(valueBreakdown).reduce((a, b) => a + b, 0);
  }, [valueBreakdown]);

  const totalHours = totalMinutes / 60;

  const productionPercentage = useMemo(() => {
    if (totalMinutes === 0) return 0;
    return Math.round((valueBreakdown.production / totalMinutes) * 100);
  }, [valueBreakdown, totalMinutes]);

  const energyBalance = useMemo(() => {
    if (totalMinutes === 0) return 0;
    return Math.round(((energyBreakdown.green - energyBreakdown.red) / totalMinutes) * 100);
  }, [energyBreakdown, totalMinutes]);

  // Weekly Trends (last 8 weeks)
  const weeklyTrends = useMemo((): WeeklyTrendData[] => {
    const weeks = eachWeekOfInterval(
      {
        start: subWeeks(dateRange.end, 7),
        end: dateRange.end,
      },
      { weekStartsOn: 1 }
    );

    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

      const weekBlocks = timeBlocks.filter((block) => {
        const blockDate = parseISO(block.date);
        return isWithinInterval(blockDate, { start: weekStart, end: weekEnd });
      });

      const value: ValueBreakdown = { delegation: 0, replacement: 0, investment: 0, production: 0, na: 0 };
      let greenMins = 0;
      let redMins = 0;

      weekBlocks.forEach((block) => {
        const duration = calculateDuration(block.startTime, block.endTime);
        const quadrant = block.valueQuadrant || 'na';
        if (quadrant in value) {
          value[quadrant as keyof ValueBreakdown] += duration;
        }
        if (block.energyRating === 'green') greenMins += duration;
        if (block.energyRating === 'red') redMins += duration;
      });

      const weekTotal = Object.values(value).reduce((a, b) => a + b, 0);

      return {
        week: format(weekStart, 'MMM d'),
        weekStart,
        delegationHours: value.delegation / 60,
        replacementHours: value.replacement / 60,
        investmentHours: value.investment / 60,
        productionHours: value.production / 60,
        totalHours: weekTotal / 60,
        productionPercentage: weekTotal > 0 ? Math.round((value.production / weekTotal) * 100) : 0,
        energyBalance: weekTotal > 0 ? Math.round(((greenMins - redMins) / weekTotal) * 100) : 0,
      };
    });
  }, [timeBlocks, dateRange]);

  // Heatmap Data (hour x day grid)
  const heatmapData = useMemo((): HeatmapCell[] => {
    const grid: Map<string, {
      totalMins: number;
      energy: EnergyBreakdown;
      value: ValueBreakdown;
    }> = new Map();

    // Initialize grid
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        grid.set(`${day}-${hour}`, {
          totalMins: 0,
          energy: { green: 0, yellow: 0, red: 0 },
          value: { delegation: 0, replacement: 0, investment: 0, production: 0, na: 0 },
        });
      }
    }

    // Fill grid with data
    filteredBlocks.forEach((block) => {
      const blockDate = parseISO(block.date);
      const dayOfWeek = getDay(blockDate);
      const startHour = parseInt(block.startTime.split(':')[0]);
      const duration = calculateDuration(block.startTime, block.endTime);

      const key = `${dayOfWeek}-${startHour}`;
      const cell = grid.get(key);
      if (cell) {
        cell.totalMins += duration;
        const rating = block.energyRating || 'yellow';
        if (rating in cell.energy) {
          cell.energy[rating as keyof EnergyBreakdown] += duration;
        }
        const quadrant = block.valueQuadrant || 'na';
        if (quadrant in cell.value) {
          cell.value[quadrant as keyof ValueBreakdown] += duration;
        }
      }
    });

    // Find max for normalization
    let maxMins = 0;
    grid.forEach((cell) => {
      if (cell.totalMins > maxMins) maxMins = cell.totalMins;
    });

    // Convert to array
    const result: HeatmapCell[] = [];
    grid.forEach((cell, key) => {
      const [day, hour] = key.split('-').map(Number);

      let dominantEnergy: EnergyRating | null = null;
      if (cell.totalMins > 0) {
        const maxEnergy = Math.max(cell.energy.green, cell.energy.yellow, cell.energy.red);
        if (maxEnergy === cell.energy.green) dominantEnergy = 'green';
        else if (maxEnergy === cell.energy.red) dominantEnergy = 'red';
        else dominantEnergy = 'yellow';
      }

      let dominantValue: ValueQuadrant | null = null;
      if (cell.totalMins > 0) {
        const entries = Object.entries(cell.value) as [ValueQuadrant, number][];
        const max = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
        if (max[1] > 0) dominantValue = max[0];
      }

      result.push({
        dayOfWeek: day,
        hour,
        value: maxMins > 0 ? cell.totalMins / maxMins : 0,
        dominantEnergy,
        dominantValue,
        hoursLogged: cell.totalMins / 60,
      });
    });

    return result;
  }, [filteredBlocks]);

  // Daily Breakdown
  const dailyBreakdown = useMemo((): DailyBreakdown[] => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayBlocks = filteredBlocks.filter((b) => b.date === dateStr);

      const value: ValueBreakdown = { delegation: 0, replacement: 0, investment: 0, production: 0, na: 0 };
      const energy: EnergyBreakdown = { green: 0, yellow: 0, red: 0 };

      dayBlocks.forEach((block) => {
        const duration = calculateDuration(block.startTime, block.endTime);
        const quadrant = block.valueQuadrant || 'na';
        if (quadrant in value) {
          value[quadrant as keyof ValueBreakdown] += duration;
        }
        const rating = block.energyRating || 'yellow';
        if (rating in energy) {
          energy[rating as keyof EnergyBreakdown] += duration;
        }
      });

      return {
        date: dateStr,
        value,
        energy,
        totalMinutes: Object.values(value).reduce((a, b) => a + b, 0),
      };
    });
  }, [filteredBlocks, dateRange]);

  // Most productive day
  const mostProductiveDay = useMemo(() => {
    if (dailyBreakdown.length === 0) return 'N/A';

    const best = dailyBreakdown.reduce((a, b) => (b.value.production > a.value.production ? b : a));
    return best.value.production > 0 ? format(parseISO(best.date), 'EEEE') : 'N/A';
  }, [dailyBreakdown]);

  // Peak productivity hour
  const peakProductivityHour = useMemo(() => {
    const productivityByHour = heatmapData.reduce(
      (acc, cell) => {
        if (cell.dominantValue === 'production') {
          acc[cell.hour] = (acc[cell.hour] || 0) + cell.hoursLogged;
        }
        return acc;
      },
      {} as Record<number, number>
    );

    const entries = Object.entries(productivityByHour);
    if (entries.length === 0) return 9; // Default to 9 AM

    const peak = entries.reduce((a, b) => (parseFloat(b[1].toString()) > parseFloat(a[1].toString()) ? b : a));
    return parseInt(peak[0]);
  }, [heatmapData]);

  return {
    valueBreakdown,
    energyBreakdown,
    leverageBreakdown,
    productionPercentage,
    energyBalance,
    totalHours,
    weeklyTrends,
    heatmapData,
    dailyBreakdown,
    mostProductiveDay,
    peakProductivityHour,
    isLoading,
  };
}
