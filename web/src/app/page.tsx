'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken } from '@/lib/api';
import { timeAgo, formatDuration } from '@/lib/format';
import { getAvatarColor } from '@/lib/avatar';

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
          <div className="animate-in" style={{
            background: 'var(--gradient-hero)',
            border: '1px solid rgba(255, 107, 53, 0.12)',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem 2rem',
            marginBottom: '2rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 40px rgba(255, 107, 53, 0.08)',
          }}>
            {/* Decorative glow orbs */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '120px',
              height: '120px',
              background: 'radial-gradient(circle, rgba(255,107,53,0.15), transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              left: '-30px',
              width: '100px',
              height: '100px',
              background: 'radial-gradient(circle, rgba(0,240,212,0.1), transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }} />

            <div style={{ fontSize: '3rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 0 15px rgba(255,107,53,0.4))' }}>&#x1F525;</div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 900,
              marginBottom: '0.5rem',
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: '0.03em',
            }}>
              Bem-vindo ao <span className="gradient-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>GYMFIRE</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem', lineHeight: 1.6 }}>
              Registre treinos, compita com amigos e conquiste seus objetivos fitness.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link href="/register" className="btn-glow" style={{
                textDecoration: 'none',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                color: '#fff',
                padding: '0.75rem 2rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                boxShadow: '0 0 25px rgba(255, 107, 53, 0.25)',
              }}>Começar Agora</Link>
              <Link href="/login" style={{
                textDecoration: 'none',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.9rem',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}>Entrar</Link>
            </div>
          </div>
        )}

        <h2 style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-secondary)',
        }}>
          {loggedIn ? 'Seu Feed' : 'Atividade Recente'}
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{
              fontSize: '2.5rem',
              marginBottom: '0.75rem',
              animation: 'pulse 1.5s infinite',
              filter: 'drop-shadow(0 0 10px rgba(255,107,53,0.4))',
            }}>&#x1F525;</div>
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Carregando...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="animate-in" style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>&#x1F4AA;</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {loggedIn ? 'Nenhum post ainda. Inicie um treino para compartilhar seu progresso!' : 'Nenhum post público ainda. Entre para ver seu feed personalizado.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {posts.map((post, idx) => {
              const exerciseNames = post.workout?.sets
                ? [...new Set(post.workout.sets.map(s => s.exercise.name))]
                : [];

              return (
                <div key={post.id} className="card-hover animate-in" style={{
                  background: 'var(--gradient-card)',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  animationDelay: `${idx * 0.05}s`,
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <Link href={`/profile/${post.user.username}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${getAvatarColor(post.user.displayName)}, ${getAvatarColor(post.user.displayName)}dd)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '1rem',
                        boxShadow: `0 0 12px ${getAvatarColor(post.user.displayName)}33`,
                        border: `2px solid ${getAvatarColor(post.user.displayName)}44`,
                      }}>
                        {post.user.displayName[0].toUpperCase()}
                      </div>
                    </Link>
                    <div style={{ flex: 1 }}>
                      <Link href={`/profile/${post.user.username}`} style={{
                        textDecoration: 'none',
                        color: 'var(--text)',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}>
                        {post.user.displayName}
                      </Link>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
                        @{post.user.username} · {timeAgo(post.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  {post.content && (
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {post.content}
                    </p>
                  )}

                  {/* Workout card */}
                  {post.workout && (
                    <div style={{
                      background: 'var(--surface-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      marginBottom: '0.75rem',
                      border: '1px solid rgba(255, 107, 53, 0.06)',
                    }}>
                      {post.workout.title && (
                        <p style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.95rem', letterSpacing: '0.01em' }}>
                          {post.workout.title}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {post.workout.durationSecs && (
                          <span style={{
                            color: 'var(--accent)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            textShadow: '0 0 8px rgba(0, 240, 212, 0.2)',
                          }}>
                            &#x23F1; {formatDuration(post.workout.durationSecs)}
                          </span>
                        )}
                        {post.workout.totalVolume != null && post.workout.totalVolume > 0 && (
                          <span style={{
                            color: 'var(--primary-light)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            textShadow: '0 0 8px rgba(255, 107, 53, 0.15)',
                          }}>
                            &#x1F3CB; {(post.workout.totalVolume / 1000).toFixed(1)}t volume
                          </span>
                        )}
                        {post.workout.totalSets != null && (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            {post.workout.totalSets} séries
                          </span>
                        )}
                      </div>
                      {exerciseNames.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {exerciseNames.slice(0, 5).map(name => (
                            <span key={name} style={{
                              background: 'rgba(255,107,53,0.1)',
                              color: 'var(--primary-light)',
                              padding: '0.2rem 0.65rem',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 500,
                              border: '1px solid rgba(255,107,53,0.08)',
                            }}>{name}</span>
                          ))}
                          {exerciseNames.length > 5 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', padding: '0.2rem 0.4rem' }}>
                              +{exerciseNames.length - 5} mais
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.25rem' }}>
                    <button
                      onClick={() => handleLike(post.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      &#x2764; {post._count.likes}
                    </button>
                    <span style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.6rem',
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
