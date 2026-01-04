'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface NonNegotiable {
  id: string;
  user_id: string;
  vision_id: string;
  title: string;
  description: string | null;
  frequency: 'daily' | 'weekdays' | 'weekends';
  target_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NonNegotiableCompletion {
  id: string;
  user_id: string;
  non_negotiable_id: string;
  completion_date: string;
  completion_count: number;
  notes: string | null;
  completed_at: string;
}

export interface StreakData {
  nonNegotiableId: string;
  title: string;
  currentStreak: number;
  longestStreak: number;
  thisWeekCompletions: number;
  thisMonthCompletions: number;
  totalCompletions: number;
  lastCompletedDate: string | null;
}

interface CreateNonNegotiableInput {
  visionId: string;
  title: string;
  description?: string;
  frequency?: 'daily' | 'weekdays' | 'weekends';
  targetCount?: number;
  sortOrder?: number;
}

interface UpdateNonNegotiableInput {
  id: string;
  title?: string;
  description?: string;
  frequency?: 'daily' | 'weekdays' | 'weekends';
  targetCount?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export function useNonNegotiables(visionId?: string) {
  const queryClient = useQueryClient();

  // Fetch non-negotiables
  const {
    data: nonNegotiables = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['non-negotiables', visionId],
    queryFn: async () => {
      const url = visionId
        ? `/api/non-negotiables?visionId=${visionId}`
        : '/api/non-negotiables';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch non-negotiables');
      return response.json() as Promise<NonNegotiable[]>;
    },
  });

  // Fetch streaks
  const {
    data: streaks = [],
    isLoading: isLoadingStreaks,
    refetch: refetchStreaks,
  } = useQuery({
    queryKey: ['non-negotiable-streaks', visionId],
    queryFn: async () => {
      const url = visionId
        ? `/api/non-negotiables/streaks?visionId=${visionId}`
        : '/api/non-negotiables/streaks';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch streaks');
      return response.json() as Promise<StreakData[]>;
    },
  });

  // Create non-negotiable
  const createMutation = useMutation({
    mutationFn: async (input: CreateNonNegotiableInput) => {
      const response = await fetch('/api/non-negotiables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to create non-negotiable');
      return response.json() as Promise<NonNegotiable>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['non-negotiables'] });
    },
  });

  // Update non-negotiable
  const updateMutation = useMutation({
    mutationFn: async (input: UpdateNonNegotiableInput) => {
      const { id, ...data } = input;
      const response = await fetch(`/api/non-negotiables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update non-negotiable');
      return response.json() as Promise<NonNegotiable>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['non-negotiables'] });
    },
  });

  // Delete non-negotiable
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/non-negotiables/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete non-negotiable');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['non-negotiables'] });
    },
  });

  // Complete non-negotiable
  const completeMutation = useMutation({
    mutationFn: async ({ id, date, notes }: { id: string; date?: string; notes?: string }) => {
      const response = await fetch(`/api/non-negotiables/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, notes }),
      });
      if (!response.ok) throw new Error('Failed to complete non-negotiable');
      return response.json() as Promise<NonNegotiableCompletion>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['non-negotiable-streaks'] });
    },
  });

  // Uncomplete non-negotiable
  const uncompleteMutation = useMutation({
    mutationFn: async ({ id, date }: { id: string; date?: string }) => {
      const dateParam = date || new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/non-negotiables/${id}/complete?date=${dateParam}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove completion');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['non-negotiable-streaks'] });
    },
  });

  return {
    nonNegotiables,
    streaks,
    isLoading,
    isLoadingStreaks,
    error,
    refetch,
    refetchStreaks,
    createNonNegotiable: createMutation.mutateAsync,
    updateNonNegotiable: updateMutation.mutateAsync,
    deleteNonNegotiable: deleteMutation.mutateAsync,
    completeNonNegotiable: completeMutation.mutateAsync,
    uncompleteNonNegotiable: uncompleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isCompleting: completeMutation.isPending,
  };
}
