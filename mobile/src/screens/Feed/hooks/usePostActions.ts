import { useCallback } from 'react';
import { useFeedStore } from '../store/feedStore';
import { likePost, unlikePost, savePost, unsavePost } from '../api/feed';
import type { Post } from '../types';

export function usePostActions(post: Post) {
  const patchPost = useFeedStore((s) => s.patchPost);

  const toggleLike = useCallback(async () => {
    const prev = { viewerLiked: post.viewerLiked, likesCount: post.likesCount };
    patchPost(post.id, {
      viewerLiked: !post.viewerLiked,
      likesCount: post.likesCount + (post.viewerLiked ? -1 : 1),
    });
    try {
      if (post.viewerLiked) await unlikePost(post.id);
      else await likePost(post.id);
    } catch {
      patchPost(post.id, prev);
    }
  }, [post.id, post.viewerLiked, post.likesCount, patchPost]);

  const toggleSave = useCallback(async () => {
    const prev = { viewerSaved: post.viewerSaved };
    patchPost(post.id, { viewerSaved: !post.viewerSaved });
    try {
      if (post.viewerSaved) await unsavePost(post.id);
      else await savePost(post.id);
    } catch {
      patchPost(post.id, prev);
    }
  }, [post.id, post.viewerSaved, patchPost]);

  return { toggleLike, toggleSave };
}
