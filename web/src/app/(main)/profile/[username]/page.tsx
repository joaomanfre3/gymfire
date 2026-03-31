'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  bio?: string;
  totalPoints: number;
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
}

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`/api/users/${username}`);
        if (res.ok) setUser(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [username]);

  const toggleFollow = async () => {
    if (!user) return;
    setToggling(true);
    try {
      const method = user.isFollowing ? 'DELETE' : 'POST';
      const res = await apiFetch(`/api/social/follow/${user.id}`, { method });
      if (res.ok) {
        setUser(prev => prev ? {
          ...prev,
          isFollowing: !prev.isFollowing,
          followersCount: (prev.followersCount || 0) + (prev.isFollowing ? -1 : 1),
        } : null);
      }
    } catch { /* ignore */ }
    setToggling(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 rounded-full"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p style={{ color: 'var(--text-secondary)' }}>User not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Profile card */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: 'var(--primary)' }}>
            {user.displayName[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user.displayName}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>@{user.username}</p>
          </div>
          <button onClick={toggleFollow} disabled={toggling}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{
              background: user.isFollowing ? 'var(--surface-light)' : 'var(--primary)',
              color: user.isFollowing ? 'var(--text-secondary)' : '#fff',
              border: user.isFollowing ? '1px solid var(--border)' : 'none',
            }}>
            {user.isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
        {user.bio && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user.bio}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Points</p>
          <p className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
            {user.totalPoints?.toLocaleString() || 0}
          </p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Followers</p>
          <p className="text-xl font-bold">{user.followersCount || 0}</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Following</p>
          <p className="text-xl font-bold">{user.followingCount || 0}</p>
        </div>
      </div>
    </div>
  );
}
