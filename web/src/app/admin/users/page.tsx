'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getToken, getUser, logout } from '@/lib/api';

interface UserEntry {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  isVerified: boolean;
  isPremium: boolean;
  totalPoints: number;
  currentStreak: number;
  createdAt: string;
  bio?: string;
  _count: { workouts: number; posts: number; followers: number; following: number };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const user = getUser();
    if (!getToken() || user?.role !== 'ADMIN') { router.push('/admin/login'); return; }
    loadUsers();
  }, [router]);

  async function loadUsers(s?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (s || search) params.set('search', s || search);
      const res = await apiFetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function handleAction(userId: string, action: string) {
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) {
        loadUsers();
      }
    } catch { /* ignore */ }
  }

  const actionBtn = (label: string, onClick: () => void, color: string) => (
    <button onClick={onClick} style={{
      background: 'none', border: `1px solid ${color}33`, color,
      padding: '0.25rem 0.6rem', borderRadius: '999px', cursor: 'pointer',
      fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.03em', transition: 'all 0.2s',
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <header className="glass" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,5,10,0.8)',
        borderBottom: '1px solid rgba(168,85,247,0.1)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: '64px' }}>
          <Link href="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.05em' }}>
            <span>&#x1F6E1;&#xFE0F;</span>
            <span style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GYMFIRE ADMIN</span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link href="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, padding: '0.4rem 0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dashboard</Link>
            <Link href="/admin/users" style={{ color: '#A855F7', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, padding: '0.4rem 0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuários</Link>
            <Link href="/admin/exercises" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, padding: '0.4rem 0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exercícios</Link>
            <button onClick={() => logout()} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem', textTransform: 'uppercase' }}>Sair</button>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em' }}>
            <span style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>USUÁRIOS</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif', fontWeight: 500, marginLeft: '0.5rem' }}>({total})</span>
          </h1>
        </div>

        <form onSubmit={e => { e.preventDefault(); loadUsers(); }} style={{ marginBottom: '1rem' }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, email ou username..."
            style={{
              width: '100%', padding: '0.75rem 1rem',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.9rem',
              outline: 'none', boxSizing: 'border-box', transition: 'all 0.25s',
            }}
          />
        </form>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {users.map((u, idx) => (
              <div key={u.id} className="card-hover animate-in" style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem',
                animationDelay: `${idx * 0.02}s`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: u.role === 'ADMIN' ? 'linear-gradient(135deg, #A855F7, #7C3AED)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
                  }}>{u.displayName[0].toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{u.displayName}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>@{u.username}</span>
                      {u.role === 'ADMIN' && <span style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7', padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Admin</span>}
                      {u.isVerified && <span style={{ background: 'rgba(0,240,212,0.08)', color: 'var(--accent)', padding: '0.1rem 0.35rem', borderRadius: '999px', fontSize: '0.6rem', fontWeight: 700 }}>Verificado</span>}
                      {u.isPremium && <span style={{ background: 'rgba(245,158,11,0.08)', color: 'var(--warning)', padding: '0.1rem 0.35rem', borderRadius: '999px', fontSize: '0.6rem', fontWeight: 700 }}>Premium</span>}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.15rem 0' }}>
                      {u.email} · {u.totalPoints} pts · {u.currentStreak} streak · {u._count.workouts} treinos · {u._count.posts} posts · {u._count.followers} seguidores
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0, flexWrap: 'wrap' }}>
                    {!u.isVerified && actionBtn('Verificar', () => handleAction(u.id, 'verify'), 'var(--accent)')}
                    {!u.isPremium && actionBtn('Premium', () => handleAction(u.id, 'premium'), 'var(--warning)')}
                    {u.role !== 'ADMIN' && actionBtn('Admin', () => handleAction(u.id, 'promote'), '#A855F7')}
                    {u.role === 'ADMIN' && actionBtn('Rebaixar', () => handleAction(u.id, 'demote'), 'var(--error)')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
