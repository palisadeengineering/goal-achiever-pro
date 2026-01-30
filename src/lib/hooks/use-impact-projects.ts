import { useQuery } from '@tanstack/react-query';

export interface ImpactProject {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  quarter: number;
  year: number;
  status: string;
  progress_percentage: number;
  vision_id: string | null;
  target_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const impactProjectsKeys = {
  all: ['impactProjects'] as const,
  lists: () => [...impactProjectsKeys.all, 'list'] as const,
  list: (filters?: { year?: number; quarter?: number }) =>
    [...impactProjectsKeys.lists(), filters] as const,
  details: () => [...impactProjectsKeys.all, 'detail'] as const,
  detail: (id: string) => [...impactProjectsKeys.details(), id] as const,
};

async function fetchImpactProjects() {
  const response = await fetch('/api/power-goals');
  if (!response.ok) {
    throw new Error('Failed to fetch impact projects');
  }
  const data = await response.json();
  return data.impactProjects as ImpactProject[];
}

export function useImpactProjects() {
  return useQuery({
    queryKey: impactProjectsKeys.lists(),
    queryFn: fetchImpactProjects,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
