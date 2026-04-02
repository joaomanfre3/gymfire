'use client';

import { useState, useCallback } from 'react';
import type { FeedPost } from '@/lib/feed-types';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import PostHeader from './PostHeader';
import WorkoutSummary from './WorkoutSummary';
import PostImage from './PostImage';
import EngagementBar from './EngagementBar';
import CommentsPreview from './CommentsPreview';

interface Props {
  post: FeedPost;
  onLike: (postId: string) => void;
}

export default function PostCard({ post, onLike }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(post.engagement.isLiked);
  const [likeCount, setLikeCount] = useState(post.engagement.likes);
  const { ref, isVisible } = useIntersectionObserver();

  const handleLike = useCallback(() => {
    if (!liked) {
      setLiked(true);
      setLikeCount(c => c + 1);
      onLike(post.id);
    }
  }, [liked, onLike, post.id]);

  const text = post.content.text;
  const isLong = text.length > 180;
  const displayText = isLong && !expanded ? text.slice(0, 180) : text;

  // Render text with highlights for @mentions and #hashtags
  const renderText = (t: string) => {
    const parts = t.split(/(@[\w.]+|#[\w]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@') || part.startsWith('#')) {
        return <span key={i} style={{ color: '#FF6B35', fontWeight: part.startsWith('@') ? 600 : 500, cursor: 'pointer' }}>{part}</span>;
      }
      return part;
    });
  };

  return (
    <div
      ref={ref}
      style={{
        background: '#141420',
        borderBottom: '1px solid rgba(148, 148, 172, 0.08)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 300ms ease, transform 300ms ease',
      }}
    >
      <PostHeader
        author={post.author}
        createdAt={post.createdAt}
        location={post.location}
      />

      {/* Workout/Run/PR summary */}
      <WorkoutSummary post={post} />

      {/* Text content */}
      <div style={{ padding: '0 16px 10px' }}>
        <p style={{
          fontSize: '14px',
          fontWeight: 400,
          color: '#F0F0F8',
          lineHeight: 1.6,
          margin: 0,
          wordBreak: 'break-word',
        }}>
          {renderText(displayText)}
          {isLong && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#9494AC',
                cursor: 'pointer',
                fontSize: '14px',
                padding: 0,
                marginLeft: '4px',
              }}
            >... mais</button>
          )}
          {isLong && expanded && (
            <button
              onClick={() => setExpanded(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#9494AC',
                cursor: 'pointer',
                fontSize: '14px',
                padding: 0,
                marginLeft: '4px',
                display: 'block',
                marginTop: '4px',
              }}
            >menos</button>
          )}
        </p>
      </div>

      {/* Images */}
      {post.content.images && post.content.images.length > 0 && (
        <PostImage
          images={post.content.images}
          isLiked={liked}
          onLike={handleLike}
        />
      )}

      {/* Engagement */}
      <EngagementBar
        likes={likeCount}
        comments={post.engagement.comments}
        isLiked={liked}
        xpEarned={post.xpEarned}
        onLike={handleLike}
      />

      {/* Comments */}
      <CommentsPreview
        totalComments={post.engagement.comments}
        preview={post.commentPreview}
        createdAt={post.createdAt}
      />
    </div>
  );
}
