import { useState, useEffect, useCallback } from 'react';
import { fetchUserPosts, FeedPage } from '../api/profile';
import type { Post } from '../../../components/Post/types';

export function useUserPosts(userId: string, canFetch: boolean) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!canFetch) {
      setPosts([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetchUserPosts(userId, true)
      .then((page) => setPosts(page.posts))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [userId, canFetch]);

  return { posts, isLoading };
}
