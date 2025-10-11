// web/app/console/hooks/usePrompts.ts
import { useState, useEffect } from 'react';

export interface Prompt {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrompts = async (query = '') => {
    try {
      const url = query
        ? `/api/prompts?q=${encodeURIComponent(query)}`
        : '/api/prompts';
      const res = await fetch(url);
      const data = await res.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPrompt = async (data: { title: string; body: string; tags: string[] }) => {
    try {
      await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchPrompts();
    } catch (error) {
      console.error('Failed to create prompt:', error);
    }
  };

  const updatePrompt = async (id: string, data: { title: string; body: string; tags: string[] }) => {
    try {
      await fetch(`/api/prompts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchPrompts();
    } catch (error) {
      console.error('Failed to update prompt:', error);
    }
  };

  const deletePrompt = async (id: string) => {
    if (!confirm('Delete this prompt?')) return;
    
    try {
      await fetch(`/api/prompts/${id}`, { method: 'DELETE' });
      await fetchPrompts();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  return {
    prompts,
    loading,
    fetchPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
  };
}
