'use client';

import useSWR from 'swr';
import { apiFetch } from '@/lib/api';

const fetcher = (url: string) => apiFetch(url).then(r => r.ok ? r.json() : []);

export function useFeed() {
  return useSWR('/api/feed', fetcher, {
    refreshInterval: 30000, // poll every 30s
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  });
}

export function useRanking(type: string) {
  return useSWR(`/api/ranking?type=${type}`, fetcher, {
    refreshInterval: 60000, // poll every 60s
    revalidateOnFocus: true,
  });
}

export function useProfile(username: string | null) {
  return useSWR(
    username ? `/api/users/${username}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );
}

export function useExercises() {
  return useSWR('/api/exercises', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // cache 5 min
  });
}
