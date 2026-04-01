'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getToken, getUser, logout } from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  usersThisWeek: number;
  usersThisMonth: number;
  totalExercises: number;
  totalWorkouts: number;
  workoutsThisWeek: number;
  totalPosts: number;
  postsThisWeek: number;
  totalPointsDistributed: number;
}

interface RecentUser {
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
  _count: { workouts: number; posts: number };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [importStatus, setImportStatus] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!getToken() || user?.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
    loadDashboard();
  }, [router]);

  async function loadDashboard() {
    try {
      const res = await apiFetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentUsers(data.recentUsers);
      } else if (res.status === 403) {
        router.push('/admin/login');
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function handleImportExercises() {
    setImporting(true);
    setImportStatus('Importando exercícios...');
    try {
      const res = await apiFetch('/api/admin/exercises/import', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setImportStatus(`${data.imported} exercícios importados com sucesso!`);
        loadDashboard();
      } else {
        setImportStatus('Erro ao importar exercícios.');
      }
    } catch {
      setImportStatus('Erro de conexão.');
    } finally {
      setImporting(false);
    }
  }

  const statCard = (label: string, value: number | string, color: string, sub?: string) => (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem',
      textAlign: 'center',
    }}>
      <p style={{
        color,
        fontWeight: 900,
        fontSize: '1.5rem',
        margin: 0,
        fontFamily: "'Orbitron', sans-serif",
      }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: '0.2rem 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
      {sub && <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', margin: '0.1rem 0 0' }}>{sub}</p>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Admin Navbar */}
      <header className="glass" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,5,10,0.8)',
        borderBottom: '1px solid rgba(168,85,247,0.1)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1.5rem', height: '64px',
        }}>
          <Link href="/admin" style={{
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '1.1rem',
            letterSpacing: '0.05em',
          }}>
            <span>&#x1F6E1;&#xFE0F;</span>
            <span style={{
              background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>GYMFIRE ADMIN</span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link href="/admin" style={{ color: '#A855F7', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, padding: '0.4rem 0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dashboard</Link>
            <Link href="/admin/users" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, padding: '0.4rem 0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuários</Link>
            <Link href="/admin/exercises" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, padding: '0.4rem 0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exercícios</Link>
            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.75rem', padding: '0.4rem 0.8rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>GymFire</Link>
            <button onClick={() => logout()} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Sair</button>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Carregando dashboard...</span>
          </div>
        ) : !stats ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Erro ao carregar dados.</div>
        ) : (
          <>
            <h1 style={{
              fontSize: '1.3rem', fontWeight: 900, marginBottom: '1.25rem',
              fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em',
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>PAINEL DE CONTROLE</span>
            </h1>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {statCard('Usuários', stats.totalUsers, '#A855F7', `+${stats.usersThisWeek} esta semana`)}
              {statCard('Exercícios', stats.totalExercises, 'var(--accent)')}
              {statCard('Treinos', stats.totalWorkouts, 'var(--primary)', `+${stats.workoutsThisWeek} esta semana`)}
              {statCard('Posts', stats.totalPosts, '#3B82F6', `+${stats.postsThisWeek} esta semana`)}
              {statCard('Pontos Totais', stats.totalPointsDistributed, 'var(--success)')}
              {statCard('Novos (Mês)', stats.usersThisMonth, 'var(--warning)')}
            </div>

            {/* Quick Actions */}
            <div style={{
              display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap',
            }}>
              <button onClick={handleImportExercises} disabled={importing} style={{
                padding: '0.7rem 1.5rem',
                background: importing ? 'var(--surface-light)' : 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                color: '#000', border: 'none', borderRadius: 'var(--radius-sm)',
                fontWeight: 700, cursor: importing ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                {importing ? 'Importando...' : '&#x1F4E5; Importar 150+ Exercícios'}
              </button>
              <Link href="/admin/users" style={{
                padding: '0.7rem 1.5rem',
                background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
                fontWeight: 700, textDecoration: 'none',
                fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>&#x1F465; Gerenciar Usuários</Link>
            </div>

            {importStatus && (
              <div style={{
                background: importStatus.includes('sucesso') ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${importStatus.includes('sucesso') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                color: importStatus.includes('sucesso') ? 'var(--success)' : 'var(--error)',
                padding: '0.7rem 1rem', borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem', marginBottom: '1.25rem',
              }}>{importStatus}</div>
            )}

            {/* Recent Users */}
            <h2 style={{
              fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem',
              textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)',
            }}>Últimos Usuários</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentUsers.map((u, idx) => (
                <div key={u.id} className="card-hover animate-in" style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  animationDelay: `${idx * 0.03}s`,
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: u.role === 'ADMIN' ? 'linear-gradient(135deg, #A855F7, #7C3AED)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                  }}>{u.displayName[0].toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.displayName}</span>
                      {u.role === 'ADMIN' && <span style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7', padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Admin</span>}
                      {u.isVerified && <span style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>&#x2713;</span>}
                      {u.isPremium && <span style={{ color: 'var(--warning)', fontSize: '0.7rem' }}>&#x2B50;</span>}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
                      @{u.username} · {u.email} · {u._count.workouts} treinos · {u._count.posts} posts
                    </p>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', flexShrink: 0 }}>
                    {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
