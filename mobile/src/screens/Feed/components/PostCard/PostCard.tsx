import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import PostHeader from './PostHeader';
import PostImageCarousel from './PostImageCarousel';
import PostActions from './PostActions';
import PostEngagement from './PostEngagement';
import { usePostActions } from '../../hooks/usePostActions';
import type { Post } from '../../types';

interface Props {
  post: Post;
}

function PostCard({ post }: Props) {
  const { toggleLike } = usePostActions(post);

  const handleDoubleTap = () => {
    if (!post.viewerLiked) {
      toggleLike();
    }
  };

  return (
    <View style={styles.card}>
      <PostHeader post={post} />
      <PostImageCarousel
        images={post.images}
        postId={post.id}
        viewerLiked={post.viewerLiked}
        onDoubleTap={handleDoubleTap}
      />
      <PostActions post={post} />
      <PostEngagement post={post} />
    </View>
  );
}

export default memo(PostCard);

const styles = StyleSheet.create({
  card: { marginBottom: 8 },
});
