'use client';

import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';

export type LeverageType = 'code' | 'content' | 'capital' | 'collaboration';

export interface LeverageTimeData {
  leverageType: LeverageType;
  totalMinutes: number;
  blockCount: number;
  percentage: number;
}

export interface WeeklyTrend {
  weekStart: string;
  code: number;
  content: number;
  capital: number;
  collaboration: number;
  total: number;
}

export interface LeverageItemROI {
  id: string;
  title: string;
  leverageType: LeverageType;
  hoursInvested: number;
  estimatedHoursSaved: number;
  actualHoursSaved: number;
  roi: number;
}

export interface LeverageAnalyticsSummary {
  totalLeverageMinutes: number;
  totalMinutesTracked: number;
  leveragePercentage: number;
  topType: LeverageType | null;
  estimatedWeeklyHoursSaved: number;
}

export interface LeverageAnalyticsData {
  byType: LeverageTimeData[];
  weeklyTrends: WeeklyTrend[];
  itemROI: LeverageItemROI[];
  summary: LeverageAnalyticsSummary;
}

interface UseLeverageAnalyticsOptions {
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
}

export function useLeverageAnalytics(options: UseLeverageAnalyticsOptions = {}) {
  const {
    startDate = subDays(new Date(), 30),
    endDate = new Date(),
    enabled = true,
  } = options;

  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');

  return useQuery<LeverageAnalyticsData>({
    queryKey: ['leverage-analytics', startDateStr, endDateStr],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startDateStr,
        endDate: endDateStr,
      });

      const response = await fetch(`/api/leverage/analytics?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch leverage analytics');
      }

      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Helper to get leverage type display info
export function getLeverageTypeInfo(type: LeverageType) {
  const info: Record<LeverageType, { label: string; description: string; color: string; icon: string }> = {
    code: {
      label: 'Code',
      description: 'Automation & systems',
      color: 'bg-blue-500',
      icon: '💻',
    },
    content: {
      label: 'Content',
      description: 'Creating scalable assets',
      color: 'bg-purple-500',
      icon: '📝',
    },
    capital: {
      label: 'Capital',
      description: 'Delegation & hiring',
      color: 'bg-green-500',
      icon: '💰',
    },
    collaboration: {
      label: 'Collaboration',
      description: 'Partnerships & networks',
      color: 'bg-orange-500',
      icon: '🤝',
    },
  };

  return info[type];
}

// Infer leverage type from activity name (client-side suggestion)
export function inferLeverageType(activityName: string): LeverageType | null {
  const name = activityName.toLowerCase();

  // Code patterns
  const codePatterns = [
    'coding', 'programming', 'automation', 'script', 'develop', 'build',
    'api', 'software', 'debug', 'deploy', 'integrate', 'system',
  ];
  if (codePatterns.some(p => name.includes(p))) {
    return 'code';
  }

  // Content patterns
  const contentPatterns = [
    'writing', 'blog', 'video', 'podcast', 'record', 'create content',
    'social media', 'course', 'tutorial', 'newsletter', 'article',
    'youtube', 'tiktok', 'instagram', 'twitter', 'linkedin post',
  ];
  if (contentPatterns.some(p => name.includes(p))) {
    return 'content';
  }

  // Capital patterns
  const capitalPatterns = [
    'hiring', 'interview', 'delegate', 'outsource', 'va ', 'virtual assistant',
    'contractor', 'freelance', 'agency', 'training', 'onboard', 'manage team',
    'payroll', 'vendor', 'supplier',
  ];
  if (capitalPatterns.some(p => name.includes(p))) {
    return 'capital';
  }

  // Collaboration patterns
  const collaborationPatterns = [
    'partner', 'mastermind', 'network', 'collaborate', 'joint venture',
    'referral', 'affiliate', 'strategic', 'alliance', 'co-create',
    'introduction', 'connect with', 'relationship',
  ];
  if (collaborationPatterns.some(p => name.includes(p))) {
    return 'collaboration';
  }

  return null;
}
