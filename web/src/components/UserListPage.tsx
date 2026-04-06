'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken, getUser } from '@/lib/api';

interface UserItem {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isFollowing: boolean;
  isMe: boolean;
}

interface Props {
  username: string;
  type: 'followers' | 'following';
}

export default function UserListPage({ username, type }: Props) {
  const router = useRouter();
  const currentUser = getUser();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isOwnProfile = currentUser?.username === username;
  const title = type === 'followers' ? 'Seguidores' : 'Seguindo';

  useEffect(() => {
    loadUsers();
  }, [username, type]);

  async function loadUsers() {
    try {
      const res = await apiFetch(`/api/users/${username}/${type}`);
      if (res.ok) setUsers(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function toggleFollow(userId: string, currentlyFollowing: boolean) {
    if (!getToken()) { router.push('/login'); return; }
    setActionLoading(userId);

    try {
      if (currentlyFollowing) {
        await apiFetch(`/api/social/follow/${userId}`, { method: 'DELETE' });
      } else {
        await apiFetch(`/api/social/follow/${userId}`, { method: 'POST' });
      }
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, isFollowing: !currentlyFollowing } : u
      ));
    } catch { /* ignore */ }
    setActionLoading(null);
  }

  async function removeFollower(followerId: string) {
    setActionLoading(followerId);
    try {
      const res = await apiFetch(`/api/social/followers/${followerId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== followerId));
      }
    } catch { /* ignore */ }
    setActionLoading(null);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 16px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button onClick={() => router.back()} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
          }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={2}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          </button>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F0F8', margin: 0 }}>{title}</h1>
            <p style={{ fontSize: '13px', color: '#9494AC', margin: 0 }}>@{username} · {users.length}</p>
          </div>
        </div>

        {/* List */}
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 0' }}>
              <div className="shimmer" style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#141420', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="shimmer" style={{ width: '120px', height: '14px', borderRadius: '4px', background: '#141420', marginBottom: '6px' }} />
                <div className="shimmer" style={{ width: '80px', height: '12px', borderRadius: '4px', background: '#141420' }} />
              </div>
            </div>
          ))
        ) : users.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: '#141420', borderRadius: '16px',
            border: '1px solid rgba(148, 148, 172, 0.08)',
            color: '#5C5C72', fontSize: '14px',
          }}>
            {type === 'followers' ? 'Nenhum seguidor ainda.' : 'Não segue ninguém ainda.'}
          </div>
        ) : (
          <div style={{
            background: '#141420', borderRadius: '16px',
            border: '1px solid rgba(148, 148, 172, 0.08)',
            overflow: 'hidden',
          }}>
            {users.map((user, i) => (
              <div key={user.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                borderBottom: i < users.length - 1 ? '1px solid rgba(148, 148, 172, 0.06)' : 'none',
              }}>
                {/* Avatar */}
                <Link href={`/profile/${user.username}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: user.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '18px', overflow: 'hidden',
                    border: '1.5px solid rgba(148, 148, 172, 0.12)',
                  }}>
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : user.displayName[0].toUpperCase()
                    }
                  </div>
                </Link>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/profile/${user.username}`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8' }}>{user.displayName}</span>
                      {user.isVerified && (
                        <span style={{ fontSize: '9px', fontWeight: 800, background: '#FF6B35', color: '#0A0A0F', padding: '1px 5px', borderRadius: '3px' }}>PRO</span>
                      )}
                    </div>
                    <span style={{ fontSize: '13px', color: '#9494AC' }}>@{user.username}</span>
                  </Link>
                </div>

                {/* Action button */}
                {!user.isMe && (
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {/* Follow/Unfollow */}
                    <button
                      onClick={() => toggleFollow(user.id, user.isFollowing)}
                      disabled={actionLoading === user.id}
                      style={{
                        padding: '7px 16px', borderRadius: '8px',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        transition: 'all 200ms',
                        border: user.isFollowing ? '1px solid rgba(148, 148, 172, 0.15)' : 'none',
                        background: user.isFollowing ? 'transparent' : '#FF6B35',
                        color: user.isFollowing ? '#9494AC' : '#0A0A0F',
                        opacity: actionLoading === user.id ? 0.5 : 1,
                      }}
                    >
                      {user.isFollowing ? 'Seguindo' : 'Seguir'}
                    </button>

                    {/* Remove follower (only on own followers list) */}
                    {type === 'followers' && isOwnProfile && (
                      <button
                        onClick={() => removeFollower(user.id)}
                        disabled={actionLoading === user.id}
                        title="Remover seguidor"
                        style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: 'rgba(255, 77, 106, 0.08)', border: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: actionLoading === user.id ? 0.5 : 1,
                        }}
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FF4D6A" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
