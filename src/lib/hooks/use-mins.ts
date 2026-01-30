import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface Min {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number;
  priority: number;
  time_scope: 'daily' | 'weekly';
  week_start_date: string | null;
  week_end_date: string | null;
  drip_quadrant: string | null;
  makes_money_score: number | null;
  energy_score: number | null;
  power_goal_id: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  parent_min_id: string | null;
  created_at: string;
  updated_at: string;
  impact_projects?: {
    id: string;
    title: string;
    category: string | null;
    visions: {
      id: string;
      title: string;
      color: string | null;
    } | null;
  } | null;
}

export interface CreateMinInput {
  title: string;
  description?: string;
  scheduledDate: string;
  scheduledTime?: string;
  durationMinutes?: number;
  priority?: number;
  timeScope?: 'daily' | 'weekly';
  weekStartDate?: string;
  weekEndDate?: string;
  valueQuadrant?: string;
  makesMoneyScore?: number;
  energyScore?: number;
  impactProjectId?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

export interface UpdateMinInput extends Partial<CreateMinInput> {
  status?: 'pending' | 'in_progress' | 'completed';
  _wasCompleted?: boolean;
}

// Query keys
export const minsKeys = {
  all: ['mins'] as const,
  lists: () => [...minsKeys.all, 'list'] as const,
  list: (filters: { date?: string; timeScope?: string; status?: string; impactProjectId?: string }) =>
    [...minsKeys.lists(), filters] as const,
  details: () => [...minsKeys.all, 'detail'] as const,
  detail: (id: string) => [...minsKeys.details(), id] as const,
};

// Fetch functions
async function fetchMins(filters: { date?: string; timeScope?: string; status?: string; impactProjectId?: string }) {
  const params = new URLSearchParams();
  if (filters.date) params.set('date', filters.date);
  if (filters.timeScope) params.set('timeScope', filters.timeScope);
  if (filters.status) params.set('status', filters.status);
  if (filters.impactProjectId) params.set('impactProjectId', filters.impactProjectId);

  const response = await fetch(`/api/mins?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch MINS');
  }
  const data = await response.json();
  return data.mins as Min[];
}

async function fetchMin(id: string) {
  const response = await fetch(`/api/mins/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch MIN');
  }
  const data = await response.json();
  return data.min as Min;
}

async function createMin(input: CreateMinInput) {
  const response = await fetch('/api/mins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create MIN');
  }
  const data = await response.json();
  return data.min as Min;
}

async function updateMin({ id, ...input }: UpdateMinInput & { id: string }) {
  const response = await fetch(`/api/mins/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update MIN');
  }
  return response.json();
}

async function deleteMin(id: string) {
  const response = await fetch(`/api/mins/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete MIN');
  }
  return response.json();
}

// Hooks
export function useMins(filters: { date?: string; timeScope?: string; status?: string; impactProjectId?: string } = {}) {
  return useQuery({
    queryKey: minsKeys.list(filters),
    queryFn: () => fetchMins(filters),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useMin(id: string) {
  return useQuery({
    queryKey: minsKeys.detail(id),
    queryFn: () => fetchMin(id),
    enabled: !!id,
  });
}

export function useCreateMin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: minsKeys.lists() });
    },
  });
}

export function useUpdateMin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMin,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: minsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: minsKeys.detail(variables.id) });
      // Also invalidate gamification stats if status changed to completed
      if (variables.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['gamification'] });
      }
    },
  });
}

export function useDeleteMin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: minsKeys.lists() });
    },
  });
}

export function useToggleMinComplete() {
  const updateMin = useUpdateMin();

  return {
    ...updateMin,
    mutate: (id: string, currentlyCompleted: boolean) => {
      updateMin.mutate({
        id,
        status: currentlyCompleted ? 'pending' : 'completed',
        _wasCompleted: currentlyCompleted,
      });
    },
    mutateAsync: async (id: string, currentlyCompleted: boolean) => {
      return updateMin.mutateAsync({
        id,
        status: currentlyCompleted ? 'pending' : 'completed',
        _wasCompleted: currentlyCompleted,
      });
    },
  };
}
