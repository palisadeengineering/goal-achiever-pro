// Shared types for dashboard components

export interface DashboardEvent {
  id: string;
  title: string;
  description: string | null;
  hours: number;
  quadrant: string | null;
  energyRating: string | null;
  blockDate: string | null;
}

export interface DripBreakdown {
  production: number;
  investment: number;
  replacement: number;
  delegation: number;
}

export interface DashboardStats {
  drip: DripBreakdown;
  dripTrend: DripBreakdown;
  totalHours: number;
  uncategorizedCount: number;
  leverageItemCount: number;
  networkTouchCount: number;
  productionTrend: number[];
  events: DashboardEvent[];
}

export type Period = 'week' | '2weeks' | 'month' | '3months';
export type Visualization = 'matrix' | 'timeline' | 'bubble';
