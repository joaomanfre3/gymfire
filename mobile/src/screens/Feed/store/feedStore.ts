import { create } from 'zustand';
import { fetchFeed } from '../api/feed';
import type { Post } from '../types';

interface FeedState {
  posts: Post[];
  nextCursor: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error: string | null;

  loadFirstPage: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  patchPost: (id: string, patch: Partial<Post>) => void;
  prependPost: (post: Post) => void;
  reset: () => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  nextCursor: null,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  error: null,

  loadFirstPage: async () => {
    set({ isLoading: true, error: null });
    try {
      const page = await fetchFeed(undefined, 10);
      set({ posts: page.posts, nextCursor: page.nextCursor });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMore: async () => {
    const { nextCursor, isLoadingMore } = get();
    if (!nextCursor || isLoadingMore) return;
    set({ isLoadingMore: true });
    try {
      const page = await fetchFeed(nextCursor, 10);
      set((s) => ({
        posts: [...s.posts, ...page.posts],
        nextCursor: page.nextCursor,
      }));
    } catch {
      // silently fail on pagination
    } finally {
      set({ isLoadingMore: false });
    }
  },

  refresh: async () => {
    set({ isRefreshing: true });
    try {
      const page = await fetchFeed(undefined, 10);
      set({ posts: page.posts, nextCursor: page.nextCursor });
    } catch {
      // keep existing data
    } finally {
      set({ isRefreshing: false });
    }
  },

  patchPost: (id, patch) => {
    set((s) => ({
      posts: s.posts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  },

  prependPost: (post) => {
    set((s) => ({ posts: [post, ...s.posts] }));
  },

  reset: () => set({ posts: [], nextCursor: null, isLoading: false, error: null }),
}));
