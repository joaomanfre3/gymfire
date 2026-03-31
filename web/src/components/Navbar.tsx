'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/feed', label: 'Feed', icon: '📰' },
  { href: '/routines', label: 'Routines', icon: '📋' },
  { href: '/exercises', label: 'Exercises', icon: '💪' },
  { href: '/ranking', label: 'Ranking', icon: '🏆' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ displayName?: string; username?: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user_info');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    router.push('/login');
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 flex-col z-50"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        <div className="p-6 pb-4">
          <Link href="/feed" className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--primary)' }}>
            🔥 GymFire
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: isActive(item.href) ? 'rgba(255, 107, 53, 0.12)' : 'transparent',
                color: isActive(item.href) ? 'var(--primary)' : 'var(--text-secondary)',
              }}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <Link
            href="/workout/start"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 mt-4"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            <span className="text-lg">⚡</span>
            Start Workout
          </Link>
        </nav>
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'var(--primary)' }}>
                {(user.displayName || user.username || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                  {user.displayName || user.username}
                </p>
                {user.username && (
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>@{user.username}</p>
                )}
              </div>
            </div>
          )}
          <button onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center py-2 px-1"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs transition-colors"
            style={{ color: isActive(item.href) ? 'var(--primary)' : 'var(--text-muted)' }}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
