import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';

interface UserResult {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

export function useMentionSearch(query?: string) {
  const [results, setResults] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query || query.length < 1) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      try {
        const { data } = await api.get('/users/search', {
          params: { q: query, limit: 6 },
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setResults(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!controller.signal.aborted) setResults([]);
      }
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, isLoading };
}
