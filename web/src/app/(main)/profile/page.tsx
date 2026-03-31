'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  email: string;
  bio?: string;
  totalPoints: number;
  createdAt: string;
}

interface Streak {
  currentStreak: number;
  longestStreak: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [userRes, streakRes] = await Promise.all([
          apiFetch('/api/auth/me'),
          apiFetch('/api/streak'),
        ]);
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          localStorage.setItem('user_info', JSON.stringify(userData));
        }
        if (streakRes.ok) {
          setStreak(await streakRes.json());
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    router.push('/login');
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
        <p style={{ color: 'var(--text-secondary)' }}>Could not load profile</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      {/* Profile card */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: 'var(--primary)' }}>
            {user.displayName[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.displayName}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>@{user.username}</p>
          </div>
        </div>
        {user.bio && (
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{user.bio}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Points</p>
          <p className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
            {user.totalPoints?.toLocaleString() || 0}
          </p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Streak</p>
          <p className="text-xl font-bold">
            🔥 {streak?.currentStreak || 0}
          </p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Best Streak</p>
          <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
            {streak?.longestStreak || 0}
          </p>
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
        style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        Logout
      </button>
    </div>
  );
}
