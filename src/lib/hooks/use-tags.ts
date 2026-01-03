'use client';

import { useState, useCallback, useEffect } from 'react';

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseTagsReturn {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
  fetchTags: () => Promise<void>;
  createTag: (name: string, color?: string, description?: string) => Promise<Tag | null>;
  updateTag: (id: string, updates: Partial<Pick<Tag, 'name' | 'color' | 'description'>>) => Promise<Tag | null>;
  deleteTag: (id: string) => Promise<boolean>;
}

export function useTags(): UseTagsReturn {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tags');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch tags');
      }

      const data = await response.json();
      setTags(data.tags || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tags';
      setError(message);
      console.error('Tags fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch tags on mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const createTag = useCallback(async (
    name: string,
    color?: string,
    description?: string
  ): Promise<Tag | null> => {
    setError(null);

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create tag');
      }

      const data = await response.json();
      const newTag = data.tag;

      setTags(prev => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
      return newTag;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create tag';
      setError(message);
      console.error('Tag create error:', err);
      return null;
    }
  }, []);

  const updateTag = useCallback(async (
    id: string,
    updates: Partial<Pick<Tag, 'name' | 'color' | 'description'>>
  ): Promise<Tag | null> => {
    setError(null);

    try {
      const response = await fetch('/api/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update tag');
      }

      const data = await response.json();
      const updatedTag = data.tag;

      setTags(prev =>
        prev.map(t => t.id === id ? updatedTag : t)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      return updatedTag;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update tag';
      setError(message);
      console.error('Tag update error:', err);
      return null;
    }
  }, []);

  const deleteTag = useCallback(async (id: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await fetch(`/api/tags?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete tag');
      }

      setTags(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete tag';
      setError(message);
      console.error('Tag delete error:', err);
      return false;
    }
  }, []);

  return {
    tags,
    isLoading,
    error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
  };
}
