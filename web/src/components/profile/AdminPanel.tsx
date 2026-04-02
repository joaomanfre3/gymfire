'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface AdminStats {
  totalUsers: number;
  totalWorkouts: number;
  totalExercises: number;
  totalPosts: number;
}

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  isVerified: boolean;
  totalPoints: number;
  createdAt: string;
}

// Admin icons
function ShieldIcon() {
  return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}
function UsersIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth={1.5} strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function BarChartIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#CCFF00" strokeWidth={1.5} strokeLinecap="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>;
}

type AdminTab = 'dashboard' | 'users' | 'exercises';

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await apiFetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalUsers: data.totalUsers || 0,
          totalWorkouts: data.totalWorkouts || 0,
          totalExercises: data.totalExercises || 0,
          totalPosts: data.totalPosts || 0,
        });
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function loadUsers() {
    try {
      const res = await apiFetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } catch { /* ignore */ }
  }

  async function toggleVerify(userId: string, current: boolean) {
    try {
      await apiFetch(`/api/admin/users`, {
        method: 'PUT',
        body: JSON.stringify({ userId, isVerified: !current }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: !current } : u));
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (tab === 'users' && users.length === 0) loadUsers();
  }, [tab]);

  const filteredUsers = searchUser
    ? users.filter(u => u.username.includes(searchUser) || u.displayName.toLowerCase().includes(searchUser.toLowerCase()))
    : users;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(10, 10, 15, 0.95)',
      backdropFilter: 'blur(16px)',
      overflowY: 'auto',
    }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldIcon />
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F0F8', margin: 0 }}>Painel Admin</h2>
              <p style={{ fontSize: '12px', color: '#5C5C72', margin: 0 }}>Acesso restrito</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid rgba(148,148,172,0.12)',
            color: '#9494AC', padding: '8px 16px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          }}>Fechar</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: '#141420', borderRadius: '12px', padding: '4px',
          marginBottom: '20px', border: '1px solid rgba(148,148,172,0.08)',
        }}>
          {([
            { key: 'dashboard' as const, label: 'Dashboard', icon: <BarChartIcon /> },
            { key: 'users' as const, label: 'Usuários', icon: <UsersIcon /> },
            { key: 'exercises' as const, label: 'Exercícios', icon: <ShieldIcon /> },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: '9px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: tab === t.key ? '#FF6B35' : 'transparent',
              color: tab === t.key ? '#0A0A0F' : '#9494AC',
              fontWeight: tab === t.key ? 700 : 500, fontSize: '13px', transition: 'all 200ms',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="shimmer" style={{ height: '80px', borderRadius: '14px', background: '#141420' }} />
                ))}
              </div>
            ) : stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { label: 'Usuários', value: stats.totalUsers, color: '#00D4FF' },
                  { label: 'Treinos', value: stats.totalWorkouts, color: '#FF6B35' },
                  { label: 'Exercícios', value: stats.totalExercises, color: '#CCFF00' },
                  { label: 'Posts', value: stats.totalPosts, color: '#A855F7' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: '#141420', borderRadius: '14px',
                    border: '1px solid rgba(148,148,172,0.08)',
                    padding: '20px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '12px', color: '#5C5C72', marginTop: '4px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: '#141420', borderRadius: '10px',
              border: '1px solid rgba(148,148,172,0.08)',
              padding: '10px 14px', marginBottom: '12px',
            }}>
              <input
                type="text"
                placeholder="Buscar usuário..."
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#F0F0F8', fontSize: '14px',
                }}
              />
            </div>

            <div style={{
              background: '#141420', borderRadius: '14px',
              border: '1px solid rgba(148,148,172,0.08)',
              overflow: 'hidden',
            }}>
              {filteredUsers.map((user, i) => (
                <div key={user.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px',
                  borderBottom: i < filteredUsers.length - 1 ? '1px solid rgba(148,148,172,0.06)' : 'none',
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF6B35, #E05520)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0,
                  }}>
                    {user.displayName[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8' }}>{user.displayName}</span>
                      {user.isVerified && <span style={{ fontSize: '9px', fontWeight: 800, background: '#FF6B35', color: '#0A0A0F', padding: '1px 5px', borderRadius: '3px' }}>PRO</span>}
                      {user.role === 'ADMIN' && <span style={{ fontSize: '9px', fontWeight: 800, background: '#FF4D6A', color: '#fff', padding: '1px 5px', borderRadius: '3px' }}>ADMIN</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#5C5C72' }}>@{user.username} · {user.totalPoints} XP</div>
                  </div>
                  <button onClick={() => toggleVerify(user.id, user.isVerified)} style={{
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none', borderRadius: '6px',
                    padding: '5px 10px', transition: 'all 200ms',
                    background: user.isVerified ? 'rgba(255,77,106,0.1)' : 'rgba(16,185,129,0.1)',
                    color: user.isVerified ? '#FF4D6A' : '#10B981',
                  }}>
                    {user.isVerified ? 'Remover PRO' : 'Dar PRO'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exercises management */}
        {tab === 'exercises' && (
          <div style={{
            background: '#141420', borderRadius: '14px',
            border: '1px solid rgba(148,148,172,0.08)',
            padding: '24px', textAlign: 'center',
          }}>
            <ShieldIcon />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8', margin: '12px 0 6px' }}>
              Gerenciar Exercícios
            </h3>
            <p style={{ fontSize: '13px', color: '#9494AC', margin: '0 0 16px' }}>
              Para importar 800+ exercícios, execute no terminal:
            </p>
            <code style={{
              display: 'block', background: '#1A1A28', borderRadius: '8px',
              padding: '12px', fontSize: '13px', color: '#CCFF00', fontFamily: 'monospace',
              marginBottom: '12px',
            }}>
              npx tsx prisma/import-exercises.ts
            </code>
            <p style={{ fontSize: '12px', color: '#5C5C72' }}>
              Fonte: free-exercise-db (domínio público, 800+ exercícios com instruções)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
