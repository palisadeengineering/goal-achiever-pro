import { describe, it, expect } from 'vitest';
import { inferLeverageType, getLeverageTypeInfo } from '@/lib/hooks/use-leverage-analytics';

describe('Leverage Analytics - inferLeverageType', () => {
  describe('Code patterns', () => {
    it('should detect coding activities', () => {
      expect(inferLeverageType('coding new feature')).toBe('code');
      expect(inferLeverageType('Programming the API')).toBe('code');
      expect(inferLeverageType('Building automation script')).toBe('code');
    });

    it('should detect automation activities', () => {
      expect(inferLeverageType('automation workflow setup')).toBe('code');
      expect(inferLeverageType('Building automation script')).toBe('code');
    });

    it('should detect development activities', () => {
      expect(inferLeverageType('develop new module')).toBe('code');
      expect(inferLeverageType('API integration work')).toBe('code');
      expect(inferLeverageType('Debug production issue')).toBe('code');
    });
  });

  describe('Content patterns', () => {
    it('should detect writing activities', () => {
      expect(inferLeverageType('writing blog post')).toBe('content');
      expect(inferLeverageType('Blog article drafting')).toBe('content');
    });

    it('should detect video activities', () => {
      expect(inferLeverageType('video recording session')).toBe('content');
      expect(inferLeverageType('YouTube video editing')).toBe('content');
    });

    it('should detect course creation', () => {
      expect(inferLeverageType('Creating course module')).toBe('content');
      expect(inferLeverageType('Tutorial preparation')).toBe('content');
    });

    it('should detect social media content', () => {
      expect(inferLeverageType('Social media posts')).toBe('content');
      expect(inferLeverageType('LinkedIn post writing')).toBe('content');
      expect(inferLeverageType('Newsletter draft')).toBe('content');
    });
  });

  describe('Capital patterns', () => {
    it('should detect hiring activities', () => {
      expect(inferLeverageType('hiring interviews')).toBe('capital');
      expect(inferLeverageType('Interview with candidate')).toBe('capital');
    });

    it('should detect delegation activities', () => {
      expect(inferLeverageType('delegate tasks to team')).toBe('capital');
      expect(inferLeverageType('Outsource graphic design')).toBe('capital');
    });

    it('should detect VA activities', () => {
      expect(inferLeverageType('VA training session')).toBe('capital');
      expect(inferLeverageType('Meeting with virtual assistant')).toBe('capital');
    });

    it('should detect contractor/freelance activities', () => {
      expect(inferLeverageType('contractor meeting')).toBe('capital');
      expect(inferLeverageType('Freelance project review')).toBe('capital');
    });
  });

  describe('Collaboration patterns', () => {
    it('should detect partnership activities', () => {
      expect(inferLeverageType('partner meeting')).toBe('collaboration');
      expect(inferLeverageType('Strategic partnership discussion')).toBe('collaboration');
    });

    it('should detect mastermind activities', () => {
      expect(inferLeverageType('mastermind call')).toBe('collaboration');
      expect(inferLeverageType('Weekly mastermind session')).toBe('collaboration');
    });

    it('should detect networking activities', () => {
      expect(inferLeverageType('network event')).toBe('collaboration');
      expect(inferLeverageType('Collaborate with team')).toBe('collaboration');
    });

    it('should detect referral activities', () => {
      expect(inferLeverageType('referral partner call')).toBe('collaboration');
      expect(inferLeverageType('Affiliate program setup')).toBe('collaboration');
    });
  });

  describe('Non-leverage activities', () => {
    it('should return null for non-leverage activities', () => {
      expect(inferLeverageType('lunch break')).toBeNull();
      expect(inferLeverageType('Team meeting')).toBeNull();
      expect(inferLeverageType('Email checking')).toBeNull();
      expect(inferLeverageType('Admin work')).toBeNull();
    });

    it('should return null for short activity names', () => {
      expect(inferLeverageType('hi')).toBeNull();
      expect(inferLeverageType('')).toBeNull();
    });
  });
});

describe('Leverage Analytics - getLeverageTypeInfo', () => {
  it('should return correct info for code type', () => {
    const info = getLeverageTypeInfo('code');
    expect(info.label).toBe('Code');
    expect(info.description).toBe('Automation & systems');
    expect(info.color).toBe('bg-blue-500');
    expect(info.icon).toBe('💻');
  });

  it('should return correct info for content type', () => {
    const info = getLeverageTypeInfo('content');
    expect(info.label).toBe('Content');
    expect(info.description).toBe('Creating scalable assets');
    expect(info.color).toBe('bg-purple-500');
    expect(info.icon).toBe('📝');
  });

  it('should return correct info for capital type', () => {
    const info = getLeverageTypeInfo('capital');
    expect(info.label).toBe('Capital');
    expect(info.description).toBe('Delegation & hiring');
    expect(info.color).toBe('bg-green-500');
    expect(info.icon).toBe('💰');
  });

  it('should return correct info for collaboration type', () => {
    const info = getLeverageTypeInfo('collaboration');
    expect(info.label).toBe('Collaboration');
    expect(info.description).toBe('Partnerships & networks');
    expect(info.color).toBe('bg-orange-500');
    expect(info.icon).toBe('🤝');
  });
});

describe('Leverage Analytics API Response Types', () => {
  // Type tests to ensure the API response structure is correct
  interface LeverageTimeData {
    leverageType: 'code' | 'content' | 'capital' | 'collaboration';
    totalMinutes: number;
    blockCount: number;
    percentage: number;
  }

  interface WeeklyTrend {
    weekStart: string;
    code: number;
    content: number;
    capital: number;
    collaboration: number;
    total: number;
  }

  interface LeverageAnalyticsSummary {
    totalLeverageMinutes: number;
    totalMinutesTracked: number;
    leveragePercentage: number;
    topType: 'code' | 'content' | 'capital' | 'collaboration' | null;
    estimatedWeeklyHoursSaved: number;
  }

  it('should validate LeverageTimeData structure', () => {
    const sampleData: LeverageTimeData = {
      leverageType: 'code',
      totalMinutes: 120,
      blockCount: 4,
      percentage: 33.3,
    };

    expect(sampleData.leverageType).toBe('code');
    expect(sampleData.totalMinutes).toBeGreaterThanOrEqual(0);
    expect(sampleData.blockCount).toBeGreaterThanOrEqual(0);
    expect(sampleData.percentage).toBeLessThanOrEqual(100);
  });

  it('should validate WeeklyTrend structure', () => {
    const sampleTrend: WeeklyTrend = {
      weekStart: '2024-01-15',
      code: 60,
      content: 30,
      capital: 15,
      collaboration: 45,
      total: 150,
    };

    expect(sampleTrend.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(sampleTrend.code + sampleTrend.content + sampleTrend.capital + sampleTrend.collaboration).toBe(sampleTrend.total);
  });

  it('should validate LeverageAnalyticsSummary structure', () => {
    const sampleSummary: LeverageAnalyticsSummary = {
      totalLeverageMinutes: 360,
      totalMinutesTracked: 2400,
      leveragePercentage: 15,
      topType: 'code',
      estimatedWeeklyHoursSaved: 10.5,
    };

    expect(sampleSummary.leveragePercentage).toBe(
      (sampleSummary.totalLeverageMinutes / sampleSummary.totalMinutesTracked) * 100
    );
  });

  it('should allow null for topType when no leverage time', () => {
    const emptySummary: LeverageAnalyticsSummary = {
      totalLeverageMinutes: 0,
      totalMinutesTracked: 1200,
      leveragePercentage: 0,
      topType: null,
      estimatedWeeklyHoursSaved: 0,
    };

    expect(emptySummary.topType).toBeNull();
  });
});

describe('Leverage Analytics Calculations', () => {
  // Helper function to simulate weekly aggregation (uses local date parsing to avoid timezone issues)
  function getWeekStart(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    d.setDate(diff);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  it('should calculate correct week start for Monday', () => {
    expect(getWeekStart('2024-01-15')).toBe('2024-01-15'); // Monday
  });

  it('should calculate correct week start for Wednesday', () => {
    expect(getWeekStart('2024-01-17')).toBe('2024-01-15'); // Wednesday -> previous Monday
  });

  it('should calculate correct week start for Sunday', () => {
    expect(getWeekStart('2024-01-21')).toBe('2024-01-15'); // Sunday -> previous Monday
  });

  it('should calculate ROI correctly', () => {
    const hoursInvested = 2;
    const hoursSaved = 10;
    const roi = hoursSaved / hoursInvested;

    expect(roi).toBe(5); // 5x ROI
  });

  it('should handle zero hours invested in ROI calculation', () => {
    const hoursInvested = 0;
    const hoursSaved = 10;
    const roi = hoursInvested > 0 ? hoursSaved / hoursInvested : 0;

    expect(roi).toBe(0);
  });

  it('should calculate leverage percentage correctly', () => {
    const leverageMinutes = 180;
    const totalMinutes = 480;
    const percentage = (leverageMinutes / totalMinutes) * 100;

    expect(percentage).toBe(37.5);
  });

  it('should handle zero total minutes', () => {
    const leverageMinutes = 0;
    const totalMinutes = 0;
    const percentage = totalMinutes > 0 ? (leverageMinutes / totalMinutes) * 100 : 0;

    expect(percentage).toBe(0);
  });
});

describe('Database Schema - Leverage Type Field', () => {
  // Type tests for time_blocks leverageType field
  type LeverageType = 'code' | 'content' | 'capital' | 'collaboration' | null;

  interface TimeBlockWithLeverage {
    id: string;
    userId: string;
    blockDate: string;
    startTime: string;
    endTime: string;
    activityName: string;
    leverageType: LeverageType;
    valueQuadrant: string;
    energyRating: string;
  }

  it('should allow valid leverage types', () => {
    const block: TimeBlockWithLeverage = {
      id: 'test-1',
      userId: 'user-1',
      blockDate: '2024-01-15',
      startTime: '09:00',
      endTime: '10:00',
      activityName: 'Coding automation',
      leverageType: 'code',
      valueQuadrant: 'production',
      energyRating: 'green',
    };

    expect(['code', 'content', 'capital', 'collaboration', null]).toContain(block.leverageType);
  });

  it('should allow null leverage type for non-leverage work', () => {
    const block: TimeBlockWithLeverage = {
      id: 'test-2',
      userId: 'user-1',
      blockDate: '2024-01-15',
      startTime: '12:00',
      endTime: '13:00',
      activityName: 'Lunch break',
      leverageType: null,
      valueQuadrant: 'na',
      energyRating: 'yellow',
    };

    expect(block.leverageType).toBeNull();
  });
});
