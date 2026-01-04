'use client';

import { useMemo } from 'react';
import { useLocalStorage } from './use-local-storage';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  getDay,
  parseISO,
  isWithinInterval,
  differenceInMinutes,
  subWeeks,
} from 'date-fns';
import type { DripQuadrant, EnergyRating } from '@/types/database';

interface TimeBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  activityName: string;
  dripQuadrant: DripQuadrant;
  energyRating: EnergyRating;
  createdAt: string;
}

interface DripBreakdown {
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
  dominantDrip: DripQuadrant | null;
  hoursLogged: number;
}

interface DailyBreakdown {
  date: string;
  drip: DripBreakdown;
  energy: EnergyBreakdown;
  totalMinutes: number;
}

export interface AnalyticsData {
  dripBreakdown: DripBreakdown;
  energyBreakdown: EnergyBreakdown;
  productionPercentage: number;
  energyBalance: number;
  totalHours: number;
  weeklyTrends: WeeklyTrendData[];
  heatmapData: HeatmapCell[];
  dailyBreakdown: DailyBreakdown[];
  mostProductiveDay: string;
  peakProductivityHour: number;
}

// Calculate duration in minutes between two time strings
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

export function useAnalyticsData(dateRange: { start: Date; end: Date }): AnalyticsData {
  const [timeBlocks] = useLocalStorage<TimeBlock[]>('time-blocks', []);

  // Filter blocks within date range
  const filteredBlocks = useMemo(() => {
    return timeBlocks.filter((block) => {
      const blockDate = parseISO(block.date);
      return isWithinInterval(blockDate, { start: dateRange.start, end: dateRange.end });
    });
  }, [timeBlocks, dateRange]);

  // DRIP Breakdown
  const dripBreakdown = useMemo((): DripBreakdown => {
    const breakdown: DripBreakdown = { delegation: 0, replacement: 0, investment: 0, production: 0, na: 0 };

    filteredBlocks.forEach((block) => {
      const duration = calculateDuration(block.startTime, block.endTime);
      breakdown[block.dripQuadrant] += duration;
    });

    return breakdown;
  }, [filteredBlocks]);

  // Energy Breakdown
  const energyBreakdown = useMemo((): EnergyBreakdown => {
    const breakdown: EnergyBreakdown = { green: 0, yellow: 0, red: 0 };

    filteredBlocks.forEach((block) => {
      const duration = calculateDuration(block.startTime, block.endTime);
      breakdown[block.energyRating] += duration;
    });

    return breakdown;
  }, [filteredBlocks]);

  // Total hours and percentages
  const totalMinutes = useMemo(() => {
    return Object.values(dripBreakdown).reduce((a, b) => a + b, 0);
  }, [dripBreakdown]);

  const totalHours = totalMinutes / 60;

  const productionPercentage = useMemo(() => {
    if (totalMinutes === 0) return 0;
    return Math.round((dripBreakdown.production / totalMinutes) * 100);
  }, [dripBreakdown, totalMinutes]);

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

      const drip: DripBreakdown = { delegation: 0, replacement: 0, investment: 0, production: 0, na: 0 };
      let greenMins = 0;
      let redMins = 0;

      weekBlocks.forEach((block) => {
        const duration = calculateDuration(block.startTime, block.endTime);
        drip[block.dripQuadrant] += duration;
        if (block.energyRating === 'green') greenMins += duration;
        if (block.energyRating === 'red') redMins += duration;
      });

      const weekTotal = Object.values(drip).reduce((a, b) => a + b, 0);

      return {
        week: format(weekStart, 'MMM d'),
        weekStart,
        delegationHours: drip.delegation / 60,
        replacementHours: drip.replacement / 60,
        investmentHours: drip.investment / 60,
        productionHours: drip.production / 60,
        totalHours: weekTotal / 60,
        productionPercentage: weekTotal > 0 ? Math.round((drip.production / weekTotal) * 100) : 0,
        energyBalance: weekTotal > 0 ? Math.round(((greenMins - redMins) / weekTotal) * 100) : 0,
      };
    });
  }, [timeBlocks, dateRange]);

  // Heatmap Data (hour x day grid)
  const heatmapData = useMemo((): HeatmapCell[] => {
    // Create a grid of 7 days x 24 hours
    const grid: Map<string, {
      totalMins: number;
      energy: EnergyBreakdown;
      drip: DripBreakdown;
    }> = new Map();

    // Initialize grid
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        grid.set(`${day}-${hour}`, {
          totalMins: 0,
          energy: { green: 0, yellow: 0, red: 0 },
          drip: { delegation: 0, replacement: 0, investment: 0, production: 0, na: 0 },
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
        cell.energy[block.energyRating] += duration;
        cell.drip[block.dripQuadrant] += duration;
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

      // Find dominant energy
      let dominantEnergy: EnergyRating | null = null;
      if (cell.totalMins > 0) {
        const maxEnergy = Math.max(cell.energy.green, cell.energy.yellow, cell.energy.red);
        if (maxEnergy === cell.energy.green) dominantEnergy = 'green';
        else if (maxEnergy === cell.energy.red) dominantEnergy = 'red';
        else dominantEnergy = 'yellow';
      }

      // Find dominant DRIP
      let dominantDrip: DripQuadrant | null = null;
      if (cell.totalMins > 0) {
        const entries = Object.entries(cell.drip) as [DripQuadrant, number][];
        const max = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
        if (max[1] > 0) dominantDrip = max[0];
      }

      result.push({
        dayOfWeek: day,
        hour,
        value: maxMins > 0 ? cell.totalMins / maxMins : 0,
        dominantEnergy,
        dominantDrip,
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

      const drip: DripBreakdown = { delegation: 0, replacement: 0, investment: 0, production: 0, na: 0 };
      const energy: EnergyBreakdown = { green: 0, yellow: 0, red: 0 };

      dayBlocks.forEach((block) => {
        const duration = calculateDuration(block.startTime, block.endTime);
        drip[block.dripQuadrant] += duration;
        energy[block.energyRating] += duration;
      });

      return {
        date: dateStr,
        drip,
        energy,
        totalMinutes: Object.values(drip).reduce((a, b) => a + b, 0),
      };
    });
  }, [filteredBlocks, dateRange]);

  // Most productive day
  const mostProductiveDay = useMemo(() => {
    if (dailyBreakdown.length === 0) return 'N/A';

    const best = dailyBreakdown.reduce((a, b) => (b.drip.production > a.drip.production ? b : a));
    return best.drip.production > 0 ? format(parseISO(best.date), 'EEEE') : 'N/A';
  }, [dailyBreakdown]);

  // Peak productivity hour
  const peakProductivityHour = useMemo(() => {
    const productivityByHour = heatmapData.reduce(
      (acc, cell) => {
        if (cell.dominantDrip === 'production') {
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
    dripBreakdown,
    energyBreakdown,
    productionPercentage,
    energyBalance,
    totalHours,
    weeklyTrends,
    heatmapData,
    dailyBreakdown,
    mostProductiveDay,
    peakProductivityHour,
  };
}
