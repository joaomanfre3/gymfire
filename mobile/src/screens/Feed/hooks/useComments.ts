import { useState, useEffect, useCallback } from 'react';
import { fetchComments, addComment } from '../api/feed';
import type { Comment } from '../types';

export function useComments(postId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!postId) return;
    setIsLoading(true);
    fetchComments(postId)
      .then((r) => setComments(r.comments))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [postId]);

  const add = useCallback(
    async (text: string) => {
      if (!postId) return;
      // optimistic
      const temp: Comment = {
        id: `temp_${Date.now()}`,
        postId,
        author: { id: 'me', username: 'eu', name: 'Eu', avatarUrl: null },
        text,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        viewerLiked: false,
      };
      setComments((prev) => [temp, ...prev]);
      try {
        const real = await addComment(postId, text);
        setComments((prev) => prev.map((c) => (c.id === temp.id ? real : c)));
      } catch {
        setComments((prev) => prev.filter((c) => c.id !== temp.id));
      }
    },
    [postId],
  );

  return { comments, isLoading, add };
}
