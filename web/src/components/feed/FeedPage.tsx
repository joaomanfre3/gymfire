'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getToken, apiFetch } from '@/lib/api';
import { usePusherChannel } from '@/hooks/usePusher';
import type { FeedPost } from '@/lib/feed-types';
import DropsBar from './DropsBar';
import PostCard from './PostCard';
import PostSkeleton from './PostSkeleton';
import SidebarRight from './SidebarRight';

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getToken());
    loadFeed();
  }, []);

  async function loadFeed() {
    try {
      const res = await apiFetch('/api/feed');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const mapped: FeedPost[] = data.map((p: Record<string, unknown>) => {
            const user = p.user as { id: string; username: string; displayName: string; avatarUrl?: string } | undefined;
            const workout = p.workout as { title?: string; totalVolume?: number; totalSets?: number; durationSecs?: number; sets?: Array<{ exercise: { name: string } }> } | undefined;
            const counts = p._count as { likes: number; comments: number } | undefined;
            return {
              id: p.id as string,
              author: {
                id: user?.id || '',
                name: user?.displayName || 'Usuário',
                username: user?.username || 'user',
                avatar: user?.avatarUrl || '',
                isVerified: false,
                level: 1,
              },
              type: 'workout' as const,
              content: {
                text: (p.caption as string) || (p.content as string) || '',
                images: (p.mediaUrls as string[])?.length > 0 ? (p.mediaUrls as string[]) : undefined,
              },
              workout: workout ? {
                name: workout.title || 'Treino',
                duration: workout.durationSecs ? formatDuration(workout.durationSecs) : '-',
                volume: workout.totalVolume ? `${(workout.totalVolume / 1000).toFixed(1)}t` : undefined,
                sets: workout.totalSets || 0,
                exercises: workout.sets ? new Set(workout.sets.map(s => s.exercise.name)).size : 0,
                calories: 0,
              } : undefined,
              engagement: {
                likes: counts?.likes || 0,
                comments: counts?.comments || 0,
                isLiked: !!(p.isLiked),
                isSaved: false,
              },
              xpEarned: 0,
              createdAt: p.createdAt as string,
            };
          });
          setPosts(mapped);
          setLoading(false);
          return;
        }
      }
    } catch {
      // API failed, show empty feed
    }
    setLoading(false);
  }

  function formatDuration(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}min`;
  }

  // Real-time: listen for new posts and reload feed
  const handleNewPost = useCallback(() => {
    loadFeed();
  }, []);
  usePusherChannel('feed', 'new-post', handleNewPost, !loading);

  const handleLike = useCallback(async (postId: string, unlike: boolean) => {
    if (!getToken()) return;
    try {
      if (unlike) {
        await apiFetch(`/api/social/posts/${postId}/like`, { method: 'DELETE' });
      } else {
        await apiFetch(`/api/social/posts/${postId}/like`, { method: 'POST' });
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '0',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 64px)',
    }}>
      {/* Main feed column */}
      <div style={{
        width: '100%',
        maxWidth: '470px',
      }}>
        <DropsBar />

        {/* Hero for non-logged users */}
        {!loggedIn && (
          <div style={{
            padding: '32px 20px',
            textAlign: 'center',
            borderBottom: '1px solid rgba(148, 148, 172, 0.08)',
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#F0F0F8',
              marginBottom: '8px',
              fontFamily: "'Inter', sans-serif",
            }}>
              Bem-vindo ao <span style={{ color: '#FF6B35' }}>GymFire</span>
            </h1>
            <p style={{
              color: '#9494AC',
              fontSize: '14px',
              lineHeight: 1.6,
              marginBottom: '16px',
            }}>
              Registre treinos, compita com amigos e conquiste seus objetivos fitness.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Link href="/register" style={{
                textDecoration: 'none',
                background: '#FF6B35',
                color: '#0A0A0F',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                transition: 'opacity 200ms ease',
              }}>Começar Agora</Link>
              <Link href="/login" style={{
                textDecoration: 'none',
                color: '#F0F0F8',
                border: '1px solid rgba(148, 148, 172, 0.12)',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 200ms ease',
              }}>Entrar</Link>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: '#5C5C72',
          }}>
            <p style={{ fontSize: '14px' }}>
              {loggedIn
                ? 'Nenhum post ainda. Inicie um treino para compartilhar!'
                : 'Nenhum post público ainda.'}
            </p>
          </div>
        ) : (
          <div>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right sidebar - desktop only */}
      <div className="feed-sidebar-right">
        <SidebarRight
          suggestions={[]}
          challenges={[]}
        />
      </div>
    </div>
  );
}
