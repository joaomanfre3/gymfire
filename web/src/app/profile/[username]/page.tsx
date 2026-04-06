'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken, getUser } from '@/lib/api';
import { getTier } from '@/lib/profile-types';

interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  isVerified: boolean;
  totalPoints: number;
  currentStreak: number;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  workoutsCount: number;
  postsCount?: number;
}

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [checkingFollow, setCheckingFollow] = useState(true);

  const currentUser = getUser();
  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (isOwnProfile) { router.replace('/profile'); return; }
    loadProfile();
  }, [username, isOwnProfile, router]);

  async function loadProfile() {
    try {
      const res = await apiFetch(`/api/users/${username}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        // Check if following
        if (getToken() && data.id) {
          checkFollowStatus(data.id);
        } else {
          setCheckingFollow(false);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function checkFollowStatus(userId: string) {
    try {
      // Try to get followers list and check
      const res = await apiFetch(`/api/users/${username}/followers`);
      if (res.ok) {
        const followers = await res.json();
        const me = currentUser?.id;
        setIsFollowing(followers.some((f: { id: string }) => f.id === me));
      }
    } catch { /* ignore */ }
    setCheckingFollow(false);
  }

  async function handleFollow() {
    if (!getToken()) { router.push('/login'); return; }
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await apiFetch(`/api/social/follow/${profile.id}`, { method: 'DELETE' });
        if (res.ok) {
          setIsFollowing(false);
          setProfile(prev => prev ? { ...prev, followersCount: prev.followersCount - 1 } : prev);
        }
      } else {
        const res = await apiFetch(`/api/social/follow/${profile.id}`, { method: 'POST' });
        if (res.ok || res.status === 409) {
          setIsFollowing(true);
          if (res.ok) setProfile(prev => prev ? { ...prev, followersCount: prev.followersCount + 1 } : prev);
        }
      }
    } catch { /* ignore */ }
    setFollowLoading(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
        <Navbar />
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
          <div className="shimmer" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px', background: '#141420' }} />
          <div className="shimmer" style={{ width: '160px', height: '20px', borderRadius: '6px', margin: '0 auto 8px', background: '#141420' }} />
          <div className="shimmer" style={{ width: '100px', height: '14px', borderRadius: '4px', margin: '0 auto', background: '#141420' }} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
        <Navbar />
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '60px 16px', textAlign: 'center' }}>
          <p style={{ color: '#5C5C72', fontSize: '16px' }}>Usuário não encontrado.</p>
        </div>
      </div>
    );
  }

  const level = Math.max(1, Math.floor(profile.totalPoints / 500));
  const tier = getTier(level);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* Instagram-style header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '16px' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              border: `3px solid ${tier.borderColor}`,
              boxShadow: `0 0 20px ${tier.color}33`,
              background: profile.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '28px', overflow: 'hidden',
            }}>
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : profile.displayName[0].toUpperCase()
              }
            </div>
            <div style={{
              position: 'absolute', bottom: '-2px', right: '-2px', width: '24px', height: '24px', borderRadius: '50%',
              background: tier.color, color: '#0A0A0F', fontSize: '10px', fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2.5px solid #0A0A0F',
            }}>{level}</div>
          </div>

          {/* Stats */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F8' }}>{profile.username}</span>
              {profile.isVerified && <span style={{ fontSize: '10px', fontWeight: 800, background: '#FF6B35', color: '#0A0A0F', padding: '2px 6px', borderRadius: '4px' }}>PRO</span>}
              <span style={{ fontSize: '10px', fontWeight: 700, color: tier.color, background: `${tier.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{tier.name}</span>
            </div>

            {/* Counters - clickable */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8' }}>{profile.postsCount || 0}</span>
                <span style={{ fontSize: '13px', color: '#9494AC', marginLeft: '4px' }}>posts</span>
              </div>
              <Link href={`/profile/${profile.username}/followers`} style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8' }}>{profile.followersCount}</span>
                <span style={{ fontSize: '13px', color: '#9494AC', marginLeft: '4px' }}>seguidores</span>
              </Link>
              <Link href={`/profile/${profile.username}/following`} style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8' }}>{profile.followingCount}</span>
                <span style={{ fontSize: '13px', color: '#9494AC', marginLeft: '4px' }}>seguindo</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Display name + bio */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8' }}>{profile.displayName}</div>
          {profile.bio && <div style={{ fontSize: '13px', color: '#9494AC', lineHeight: 1.5, marginTop: '2px' }}>{profile.bio}</div>}
        </div>

        {/* Follow/Message buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={handleFollow}
            disabled={followLoading || checkingFollow}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px',
              border: isFollowing ? '1px solid rgba(148, 148, 172, 0.15)' : 'none',
              background: isFollowing ? 'transparent' : '#FF6B35',
              color: isFollowing ? '#9494AC' : '#0A0A0F',
              fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              transition: 'all 200ms',
              opacity: followLoading || checkingFollow ? 0.5 : 1,
            }}
          >
            {checkingFollow ? '...' : followLoading ? '...' : isFollowing ? 'Seguindo' : 'Seguir'}
          </button>
          <button
            onClick={async () => {
              if (!getToken()) { router.push('/login'); return; }
              try {
                const res = await apiFetch('/api/conversations', {
                  method: 'POST',
                  body: JSON.stringify({ targetUserId: profile.id }),
                });
                if (res.ok) {
                  const data = await res.json();
                  router.push(`/messages?chat=${data.conversationId}`);
                }
              } catch { /* ignore */ }
            }}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px',
              border: 'none', background: '#141420',
              color: '#F0F0F8', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Mensagem
          </button>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {[
            { value: profile.totalPoints.toLocaleString(), label: 'XP', color: '#CCFF00' },
            { value: String(profile.currentStreak), label: 'Streak', color: '#FF6B35' },
            { value: String(profile.workoutsCount), label: 'Treinos', color: '#00D4FF' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#141420', borderRadius: '12px', border: '1px solid rgba(148,148,172,0.08)',
              padding: '14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#5C5C72', fontWeight: 600, textTransform: 'uppercase', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Member since */}
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#5C5C72' }}>
          Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
      </main>
    </div>
  );
}
