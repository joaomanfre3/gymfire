'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken, getUser } from '@/lib/api';

interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  isVerified: boolean;
  isPremium: boolean;
  totalPoints: number;
  currentStreak: number;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  workoutsCount: number;
}

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username]);

  async function loadProfile() {
    try {
      const res = await apiFetch(`/api/users/${username}`);
      if (res.ok) {
        setProfile(await res.json());
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function handleFollow() {
    if (!getToken()) {
      alert('Faça login para seguir usuários');
      return;
    }
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (following) {
        const res = await apiFetch(`/api/social/follow/${profile.id}`, { method: 'DELETE' });
        if (res.ok) {
          setFollowing(false);
          setProfile(prev => prev ? { ...prev, followersCount: prev.followersCount - 1 } : prev);
        }
      } else {
        const res = await apiFetch(`/api/social/follow/${profile.id}`, { method: 'POST' });
        if (res.ok) {
          setFollowing(true);
          setProfile(prev => prev ? { ...prev, followersCount: prev.followersCount + 1 } : prev);
        } else if (res.status === 409) {
          setFollowing(true);
        }
      }
    } catch { /* ignore */ } finally {
      setFollowLoading(false);
    }
  }

  const avatarColors = ['#FF6B35', '#4ECDC4', '#22C55E', '#6366F1', '#EC4899'];
  function getColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return avatarColors[Math.abs(h) % avatarColors.length];
  }

  const currentUser = getUser();
  const isOwnProfile = currentUser && profile && currentUser.username === profile.username;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando perfil...</div>
        ) : !profile ? (
          <div style={{
            textAlign: 'center', padding: '3rem',
            background: 'var(--surface)', borderRadius: '1rem', border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}>
            Usuário não encontrado.
          </div>
        ) : (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '2rem',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: getColor(profile.displayName),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '2rem',
                margin: '0 auto 0.75rem',
              }}>
                {profile.displayName[0].toUpperCase()}
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.15rem' }}>
                {profile.displayName}
                {profile.isVerified && <span style={{ color: 'var(--accent)', marginLeft: '0.35rem' }}>&#x2713;</span>}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>@{profile.username}</p>
              {profile.bio && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{profile.bio}</p>
              )}

              {!isOwnProfile && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  style={{
                    marginTop: '1rem',
                    padding: '0.55rem 1.5rem',
                    background: following ? 'transparent' : 'var(--primary)',
                    color: following ? 'var(--primary)' : '#fff',
                    border: following ? '1px solid var(--primary)' : 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: followLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {followLoading ? '...' : following ? 'Seguindo' : 'Seguir'}
                </button>
              )}
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem', marginBottom: '1.5rem',
            }}>
              <div style={{
                background: 'var(--surface-light)', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center',
              }}>
                <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.3rem', margin: 0 }}>
                  {profile.totalPoints.toLocaleString()}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.15rem 0 0' }}>Pontos</p>
              </div>
              <div style={{
                background: 'var(--surface-light)', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center',
              }}>
                <p style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '1.3rem', margin: 0 }}>
                  {profile.currentStreak}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.15rem 0 0' }}>Sequência</p>
              </div>
              <div style={{
                background: 'var(--surface-light)', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center',
              }}>
                <p style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.3rem', margin: 0 }}>
                  {profile.workoutsCount}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.15rem 0 0' }}>Treinos</p>
              </div>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'center', gap: '2rem',
              color: 'var(--text-secondary)', fontSize: '0.9rem',
            }}>
              <span><strong style={{ color: 'var(--text)' }}>{profile.followersCount}</strong> Seguidores</span>
              <span><strong style={{ color: 'var(--text)' }}>{profile.followingCount}</strong> Seguindo</span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem' }}>
              Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
