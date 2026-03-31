'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken, getUser } from '@/lib/api';

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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    router.push('/');
  }

  const avatarColors = ['#FF6B35', '#4ECDC4', '#22C55E', '#6366F1', '#EC4899'];
  function getColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return avatarColors[Math.abs(h) % avatarColors.length];
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading profile...</div>
        ) : !profile ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Could not load profile.</div>
        ) : (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '2rem',
          }}>
            {/* Avatar + name */}
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
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.15rem' }}>{profile.displayName}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>@{profile.username}</p>
              {profile.bio && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{profile.bio}</p>
              )}
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem', marginBottom: '1.5rem',
            }}>
              <div style={{
                background: 'var(--surface-light)', borderRadius: '0.75rem', padding: '1rem',
                textAlign: 'center',
              }}>
                <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.3rem', margin: 0 }}>
                  {profile.totalPoints.toLocaleString()}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.15rem 0 0' }}>Points</p>
              </div>
              <div style={{
                background: 'var(--surface-light)', borderRadius: '0.75rem', padding: '1rem',
                textAlign: 'center',
              }}>
                <p style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '1.3rem', margin: 0 }}>
                  {profile.currentStreak}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.15rem 0 0' }}>Day Streak</p>
              </div>
              <div style={{
                background: 'var(--surface-light)', borderRadius: '0.75rem', padding: '1rem',
                textAlign: 'center',
              }}>
                <p style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.3rem', margin: 0 }}>
                  {profile.workoutsCount ?? 0}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.15rem 0 0' }}>Workouts</p>
              </div>
            </div>

            {/* Social stats */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '2rem',
              marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem',
            }}>
              <span><strong style={{ color: 'var(--text)' }}>{profile.followersCount ?? 0}</strong> Followers</span>
              <span><strong style={{ color: 'var(--text)' }}>{profile.followingCount ?? 0}</strong> Following</span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1.25rem' }}>
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>

            <button onClick={handleLogout} style={{
              width: '100%',
              padding: '0.7rem',
              background: 'none',
              border: '1px solid var(--error)',
              color: 'var(--error)',
              borderRadius: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              Logout
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
