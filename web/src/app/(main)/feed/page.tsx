'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Post {
  id: string;
  user: { displayName: string; username: string };
  workout?: {
    exercises?: { name: string }[];
    totalVolume?: number;
    totalSets?: number;
    duration?: number;
  };
  caption?: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/feed');
      if (res.ok) {
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : data.posts || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchFeed(); }, []);

  const handleLike = async (postId: string) => {
    try {
      await apiFetch(`/api/social/posts/${postId}/like`, { method: 'POST' });
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const wasLiked = p.isLiked;
          return { ...p, isLiked: !wasLiked, likesCount: p.likesCount + (wasLiked ? -1 : 1) };
        }
        return p;
      }));
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 rounded-full"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Feed</h1>
        <button onClick={fetchFeed}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: 'var(--surface-light)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          Refresh
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📰</p>
          <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>No posts yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Complete a workout to share it with your friends!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="rounded-2xl p-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: 'var(--primary)' }}>
                  {(post.user.displayName || post.user.username)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{post.user.displayName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    @{post.user.username} · {timeAgo(post.createdAt)}
                  </p>
                </div>
              </div>

              {/* Workout summary */}
              {post.workout && (
                <div className="rounded-xl p-4 mb-3" style={{ background: 'var(--surface-light)' }}>
                  <div className="flex gap-6 text-sm">
                    {post.workout.exercises && (
                      <div>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs">Exercises</p>
                        <p className="font-semibold">{post.workout.exercises.length}</p>
                      </div>
                    )}
                    {post.workout.totalSets != null && (
                      <div>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs">Sets</p>
                        <p className="font-semibold">{post.workout.totalSets}</p>
                      </div>
                    )}
                    {post.workout.totalVolume != null && (
                      <div>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs">Volume</p>
                        <p className="font-semibold">{post.workout.totalVolume.toLocaleString()} kg</p>
                      </div>
                    )}
                    {post.workout.duration != null && (
                      <div>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs">Duration</p>
                        <p className="font-semibold">{Math.round(post.workout.duration / 60)}min</p>
                      </div>
                    )}
                  </div>
                  {post.workout.exercises && post.workout.exercises.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {post.workout.exercises.map((ex, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--background)', color: 'var(--text-secondary)' }}>
                          {ex.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Caption */}
              {post.caption && (
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{post.caption}</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <button onClick={() => handleLike(post.id)}
                  className="flex items-center gap-1.5 text-sm transition-colors"
                  style={{ color: post.isLiked ? 'var(--error)' : 'var(--text-muted)' }}>
                  {post.isLiked ? '❤️' : '🤍'} {post.likesCount}
                </button>
                <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  💬 {post.commentsCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
