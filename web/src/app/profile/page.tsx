'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken, getUser, logout } from '@/lib/api';
import { getAvatarColor } from '@/lib/avatar';

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  bio?: string;
  totalPoints: number;
  currentStreak: number;
  longestStreak?: number;
  createdAt: string;
  followersCount?: number;
  followingCount?: number;
  workoutsCount?: number;
}

export default function MyProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    const user = getUser();
    if (user?.username) {
      loadProfile(user.username);
    } else {
      setLoading(false);
    }
  }, [router]);

  async function loadProfile(username: string) {
    try {
      const res = await apiFetch(`/api/users/${username}`);
      if (res.ok) {
        setProfile(await res.json());
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Carregando perfil...</span>
          </div>
        ) : !profile ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Não foi possível carregar o perfil.</div>
        ) : (
          <div className="animate-in" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Background decorative glow */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '200px',
              height: '200px',
              background: `radial-gradient(circle, ${getAvatarColor(profile.displayName)}15, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            {/* Avatar + name */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', position: 'relative' }}>
              <div style={{
                width: '88px', height: '88px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${getAvatarColor(profile.displayName)}, ${getAvatarColor(profile.displayName)}cc)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: '2.2rem',
                margin: '0 auto 0.85rem',
                boxShadow: `0 0 30px ${getAvatarColor(profile.displayName)}33, 0 0 60px ${getAvatarColor(profile.displayName)}11`,
                border: `3px solid ${getAvatarColor(profile.displayName)}44`,
                fontFamily: "'Orbitron', sans-serif",
              }}>
                {profile.displayName[0].toUpperCase()}
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.15rem' }}>{profile.displayName}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, letterSpacing: '0.02em' }}>@{profile.username}</p>
              {profile.bio && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.6rem', lineHeight: 1.5 }}>{profile.bio}</p>
              )}
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.65rem', marginBottom: '1.5rem',
            }}>
              <div style={{
                background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', padding: '1rem',
                textAlign: 'center',
                border: '1px solid rgba(255, 107, 53, 0.06)',
                transition: 'all 0.25s',
              }}>
                <p className="gradient-text" style={{
                  fontWeight: 900,
                  fontSize: '1.4rem',
                  margin: 0,
                  fontFamily: "'Orbitron', sans-serif",
                }}>
                  {profile.totalPoints.toLocaleString()}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: '0.2rem 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pontos</p>
              </div>
              <div style={{
                background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', padding: '1rem',
                textAlign: 'center',
                border: '1px solid rgba(0, 240, 212, 0.06)',
              }}>
                <p className="accent-gradient-text" style={{
                  fontWeight: 900,
                  fontSize: '1.4rem',
                  margin: 0,
                  fontFamily: "'Orbitron', sans-serif",
                }}>
                  {profile.currentStreak}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: '0.2rem 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sequência</p>
              </div>
              <div style={{
                background: 'var(--surface-light)', borderRadius: 'var(--radius-md)', padding: '1rem',
                textAlign: 'center',
                border: '1px solid rgba(16, 185, 129, 0.06)',
              }}>
                <p style={{
                  color: 'var(--success)',
                  fontWeight: 900,
                  fontSize: '1.4rem',
                  margin: 0,
                  fontFamily: "'Orbitron', sans-serif",
                  textShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
                }}>
                  {profile.workoutsCount ?? 0}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: '0.2rem 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Treinos</p>
              </div>
            </div>

            {/* Social stats */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '2.5rem',
              marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.88rem',
            }}>
              <span><strong style={{ color: 'var(--text)', fontWeight: 700 }}>{profile.followersCount ?? 0}</strong> Seguidores</span>
              <span><strong style={{ color: 'var(--text)', fontWeight: 700 }}>{profile.followingCount ?? 0}</strong> Seguindo</span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', marginBottom: '1.25rem', letterSpacing: '0.02em' }}>
              Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-BR')}
            </p>

            <button onClick={handleLogout} style={{
              width: '100%',
              padding: '0.7rem',
              background: 'none',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--error)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}>
              Sair
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
