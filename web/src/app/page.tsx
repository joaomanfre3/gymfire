'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken } from '@/lib/api';

interface Post {
  id: string;
  content?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  workout?: {
    title?: string;
    totalVolume?: number;
    totalSets?: number;
    totalReps?: number;
    durationSecs?: number;
    sets?: Array<{
      exercise: { name: string };
      reps?: number;
      weight?: number;
    }>;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atrás`;
  return new Date(date).toLocaleDateString();
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const avatarColors = ['#FF6B35', '#4ECDC4', '#22C55E', '#6366F1', '#EC4899', '#F59E0B', '#8B5CF6'];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
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
        setPosts(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(postId: string) {
    if (!getToken()) {
      alert('Faça login para curtir posts');
      return;
    }
    try {
      const res = await apiFetch(`/api/social/posts/${postId}/like`, { method: 'POST' });
      if (res.ok || res.status === 409) {
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, _count: { ...p._count, likes: p._count.likes + 1 } } : p
        ));
      }
    } catch { /* ignore */ }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Hero if not logged in */}
        {!loggedIn && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(78,205,196,0.1))',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Bem-vindo ao <span style={{ color: 'var(--primary)' }}>GymFire</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '1rem' }}>
              Registre treinos, compita com amigos e conquiste seus objetivos fitness.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link href="/register" style={{
                textDecoration: 'none',
                background: 'var(--primary)',
                color: '#fff',
                padding: '0.65rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}>Começar</Link>
              <Link href="/login" style={{
                textDecoration: 'none',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                padding: '0.65rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: 500,
                fontSize: '0.95rem',
              }}>Entrar</Link>
            </div>
          </div>
        )}

        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
          {loggedIn ? 'Seu Feed' : 'Atividade Recente'}
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', animation: 'pulse 1.5s infinite' }}>&#x1F525;</div>
            Carregando...
          </div>
        ) : posts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'var(--surface)',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#x1F4AA;</p>
            <p style={{ color: 'var(--text-secondary)' }}>
              {loggedIn ? 'Nenhum post ainda. Inicie um treino para compartilhar seu progresso!' : 'Nenhum post público ainda. Entre para ver seu feed personalizado.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {posts.map(post => {
              const exerciseNames = post.workout?.sets
                ? [...new Set(post.workout.sets.map(s => s.exercise.name))]
                : [];

              return (
                <div key={post.id} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  transition: 'border-color 0.2s',
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <Link href={`/profile/${post.user.username}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: getAvatarColor(post.user.displayName),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '1rem',
                      }}>
                        {post.user.displayName[0].toUpperCase()}
                      </div>
                    </Link>
                    <div style={{ flex: 1 }}>
                      <Link href={`/profile/${post.user.username}`} style={{
                        textDecoration: 'none',
                        color: 'var(--text)',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                      }}>
                        {post.user.displayName}
                      </Link>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                        @{post.user.username} · {timeAgo(post.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  {post.content && (
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                      {post.content}
                    </p>
                  )}

                  {/* Workout card */}
                  {post.workout && (
                    <div style={{
                      background: 'var(--surface-light)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      marginBottom: '0.75rem',
                    }}>
                      {post.workout.title && (
                        <p style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                          {post.workout.title}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {post.workout.durationSecs && (
                          <span style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>
                            &#x23F1; {formatDuration(post.workout.durationSecs)}
                          </span>
                        )}
                        {post.workout.totalVolume != null && post.workout.totalVolume > 0 && (
                          <span style={{ color: 'var(--primary-light)', fontSize: '0.85rem', fontWeight: 600 }}>
                            &#x1F3CB; {(post.workout.totalVolume / 1000).toFixed(1)}t volume
                          </span>
                        )}
                        {post.workout.totalSets != null && (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {post.workout.totalSets} séries
                          </span>
                        )}
                      </div>
                      {exerciseNames.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {exerciseNames.slice(0, 5).map(name => (
                            <span key={name} style={{
                              background: 'rgba(255,107,53,0.12)',
                              color: 'var(--primary-light)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                            }}>{name}</span>
                          ))}
                          {exerciseNames.length > 5 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}>
                              +{exerciseNames.length - 5} mais
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '1.25rem', paddingTop: '0.25rem' }}>
                    <button
                      onClick={() => handleLike(post.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.3rem 0.5rem',
                        borderRadius: '0.5rem',
                        transition: 'color 0.2s',
                      }}
                    >
                      &#x2764; {post._count.likes}
                    </button>
                    <span style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.5rem',
                    }}>
                      &#x1F4AC; {post._count.comments}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
