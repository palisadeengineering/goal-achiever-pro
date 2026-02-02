'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { ComponentType } from 'react';

// Loading component for charts
const ChartLoading = () => (
  <div className="w-full h-[300px] flex items-center justify-center">
    <Skeleton className="w-full h-full rounded-lg" />
  </div>
);

// Lazy load chart components from recharts
export const LazyPieChart = dynamic(
  () => import('recharts').then(mod => mod.PieChart as ComponentType<any>),
  { loading: ChartLoading, ssr: false }
);

export const LazyLineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart as ComponentType<any>),
  { loading: ChartLoading, ssr: false }
);

export const LazyBarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart as ComponentType<any>),
  { loading: ChartLoading, ssr: false }
);

export const LazyAreaChart = dynamic(
  () => import('recharts').then(mod => mod.AreaChart as ComponentType<any>),
  { loading: ChartLoading, ssr: false }
);

export const LazyComposedChart = dynamic(
  () => import('recharts').then(mod => mod.ComposedChart as ComponentType<any>),
  { loading: ChartLoading, ssr: false }
);

// Re-export commonly used components that don't need lazy loading
// These are small and used inside the chart components
export {
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  Cell,
  Line,
  Bar,
  Area,
} from 'recharts';
