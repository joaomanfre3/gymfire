import { useState, useEffect } from 'react';
import api from '../../../api/client';
import type { TaggedUser } from '../types';

export function useUserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TaggedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    const t = setTimeout(() => {
      api
        .get('/users/search', { params: { q: query } })
        .then((r) => setResults(r.data))
        .catch(() => setResults([]))
        .finally(() => setIsLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return { query, setQuery, results, isLoading };
}
