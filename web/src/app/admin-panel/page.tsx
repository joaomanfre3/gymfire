'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken, getUser } from '@/lib/api';
import { startImpersonation } from '@/components/ImpersonationBanner';

interface AdminUser {
  id: string; username: string; displayName: string; email: string;
  role: string; isVerified: boolean; isPremium: boolean; totalPoints: number;
  currentStreak: number; createdAt: string;
  workoutsCount: number; postsCount: number; followersCount: number; followingCount: number;
}

interface DashboardStats { totalUsers: number; totalExercises: number; totalWorkouts: number; totalPosts: number; totalConversations: number; }

// Icons
function ShieldIcon() { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth={1.5}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>; }
function EyeIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth={1.5}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>; }
function EditIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#CCFF00" strokeWidth={1.5}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>; }
function BanIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FF4D6A" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>; }
function TrashIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FF4D6A" strokeWidth={1.5}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>; }
function DownloadIcon() { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#CCFF00" strokeWidth={1.5}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>; }
function SearchIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }

export default function AdminPanelPage() {
  const router = useRouter();
  const currentUser = getUser();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ displayName: '', username: '', email: '', bio: '', role: '', isVerified: false });

  useEffect(() => {
    if (!getToken() || currentUser?.role !== 'ADMIN') { router.push('/'); return; }
    loadData();
  }, [router, currentUser?.role]);

  const [loadError, setLoadError] = useState('');

  async function loadData() {
    setLoadError('');
    try {
      // Load users
      const usersRes = await apiFetch('/api/admin/users');
      if (usersRes.ok) {
        const data = await usersRes.json();
        const usersList = Array.isArray(data) ? data : data.users || [];
        // Map _count fields if present
        setUsers(usersList.map((u: Record<string, unknown>) => ({
          ...u,
          workoutsCount: (u._count as Record<string, number>)?.workouts ?? u.workoutsCount ?? 0,
          postsCount: (u._count as Record<string, number>)?.posts ?? u.postsCount ?? 0,
          followersCount: (u._count as Record<string, number>)?.followers ?? u.followersCount ?? 0,
          followingCount: (u._count as Record<string, number>)?.following ?? u.followingCount ?? 0,
        })));
      } else {
        const err = await usersRes.json().catch(() => ({ error: `HTTP ${usersRes.status}` }));
        setLoadError(`Erro ao carregar usuários: ${err.error || usersRes.status}`);
      }

      // Load stats
      const statsRes = await apiFetch('/api/admin/dashboard');
      if (statsRes.ok) {
        const d = await statsRes.json();
        const s = d.stats || d;
        setStats({ totalUsers: s.totalUsers || 0, totalExercises: s.totalExercises || 0, totalWorkouts: s.totalWorkouts || 0, totalPosts: s.totalPosts || 0, totalConversations: 0 });
      }
    } catch (e) {
      setLoadError(`Erro de conexão: ${e}`);
    }
    setLoading(false);
  }

  async function handleImpersonate(userId: string) {
    try {
      const res = await apiFetch('/api/admin/impersonate', {
        method: 'POST', body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        startImpersonation(
          { accessToken: getToken()!, refreshToken: localStorage.getItem('refresh_token')!, user: currentUser as Record<string, unknown> },
          { accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user }
        );
      }
    } catch { /* ignore */ }
  }

  async function handleBan(userId: string, username: string) {
    try {
      await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PUT', body: JSON.stringify({ isBanned: true, username }),
      });
      loadData();
    } catch { /* ignore */ }
  }

  async function handleDelete(userId: string) {
    try {
      await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch { /* ignore */ }
  }

  async function handleSaveEdit() {
    if (!editingUser) return;
    try {
      await apiFetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT', body: JSON.stringify(editForm),
      });
      setEditingUser(null);
      loadData();
    } catch { /* ignore */ }
  }

  async function handleExportDB() {
    try {
      const res = await apiFetch('/api/admin/db-export');
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `gymfire-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click(); URL.revokeObjectURL(url);
      }
    } catch { /* ignore */ }
  }

  const filtered = search
    ? users.filter(u => u.username.includes(search.toLowerCase()) || u.displayName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : users;

  if (currentUser?.role !== 'ADMIN') return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 16px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldIcon />
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F0F8', margin: 0 }}>Painel Admin</h1>
              <p style={{ fontSize: '12px', color: '#FF4D6A', margin: 0, fontWeight: 600 }}>Acesso restrito</p>
            </div>
          </div>
          <button onClick={handleExportDB} style={{
            display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(204,255,0,0.1)',
            border: '1px solid rgba(204,255,0,0.2)', color: '#CCFF00', padding: '10px 16px',
            borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          }}>
            <DownloadIcon /> Exportar DB
          </button>
        </div>

        {/* Dashboard stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '20px' }}>
            {[
              { v: stats.totalUsers, l: 'Usuários', c: '#00D4FF' },
              { v: stats.totalWorkouts, l: 'Treinos', c: '#FF6B35' },
              { v: stats.totalExercises, l: 'Exercícios', c: '#CCFF00' },
              { v: stats.totalPosts, l: 'Posts', c: '#A855F7' },
              { v: stats.totalConversations, l: 'Chats', c: '#10B981' },
            ].map(s => (
              <div key={s.l} style={{
                background: '#141420', borderRadius: '12px', border: '1px solid rgba(148,148,172,0.08)',
                padding: '14px 8px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: '10px', color: '#5C5C72', fontWeight: 600, textTransform: 'uppercase', marginTop: '2px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', background: '#141420', borderRadius: '12px',
          border: '1px solid rgba(148,148,172,0.08)', padding: '10px 14px', marginBottom: '16px',
        }}>
          <SearchIcon />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, username ou email..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F0F0F8', fontSize: '14px' }} />
        </div>

        {/* Error display */}
        {loadError && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px', marginBottom: '12px',
            background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)',
            color: '#FF4D6A', fontSize: '13px', fontWeight: 600,
          }}>{loadError}</div>
        )}

        {/* Users table */}
        <div style={{ background: '#141420', borderRadius: '16px', border: '1px solid rgba(148,148,172,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(148,148,172,0.08)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Usuários ({filtered.length})</span>
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer" style={{ height: '60px', background: '#1A1A28' }} />)
          ) : (
            filtered.map((u, i) => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(148,148,172,0.06)' : 'none',
              }}>
                {/* Avatar */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #FF6B35, #E05520)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '15px',
                }}>{u.displayName[0].toUpperCase()}</div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8' }}>{u.displayName}</span>
                    {u.role === 'ADMIN' && <span style={{ fontSize: '9px', fontWeight: 800, background: '#FF4D6A', color: '#fff', padding: '1px 5px', borderRadius: '3px' }}>ADMIN</span>}
                    {u.isVerified && <span style={{ fontSize: '9px', fontWeight: 800, background: '#FF6B35', color: '#0A0A0F', padding: '1px 5px', borderRadius: '3px' }}>PRO</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: '#5C5C72' }}>@{u.username} · {u.email} · {u.totalPoints} XP</div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  {/* Impersonate */}
                  <button onClick={() => handleImpersonate(u.id)} title="Logar como este usuário"
                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0,212,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EyeIcon />
                  </button>
                  {/* Edit */}
                  <button onClick={() => { setEditingUser(u); setEditForm({ displayName: u.displayName, username: u.username, email: u.email, bio: '', role: u.role, isVerified: u.isVerified }); }}
                    title="Editar" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(204,255,0,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EditIcon />
                  </button>
                  {/* Ban */}
                  {u.role !== 'ADMIN' && (
                    <button onClick={() => handleBan(u.id, u.username)} title="Banir"
                      style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,77,106,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BanIcon />
                    </button>
                  )}
                  {/* Delete */}
                  {u.role !== 'ADMIN' && (
                    <button onClick={() => handleDelete(u.id)} title="Excluir"
                      style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,77,106,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Edit Modal */}
        {editingUser && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(10,10,15,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#141420', borderRadius: '20px', border: '1px solid rgba(148,148,172,0.12)', padding: '24px', maxWidth: '420px', width: '100%' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#F0F0F8', margin: '0 0 16px' }}>Editar @{editingUser.username}</h3>
              {[
                { key: 'displayName', label: 'Nome', type: 'text' },
                { key: 'username', label: 'Username', type: 'text' },
                { key: 'email', label: 'E-mail', type: 'email' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <input type={f.type} value={String((editForm as unknown as Record<string, string | boolean>)[f.key] || '')}
                    onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#1A1A28', border: '1px solid rgba(148,148,172,0.12)', color: '#F0F0F8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Role</label>
                <select value={editForm.role} onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#1A1A28', border: '1px solid rgba(148,148,172,0.12)', color: '#F0F0F8', fontSize: '14px', outline: 'none' }}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer' }}>
                <input type="checkbox" checked={editForm.isVerified} onChange={e => setEditForm(prev => ({ ...prev, isVerified: e.target.checked }))} />
                <span style={{ fontSize: '13px', color: '#9494AC' }}>Verificado (PRO)</span>
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(148,148,172,0.12)', background: 'transparent', color: '#9494AC', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleSaveEdit} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#FF6B35', color: '#0A0A0F', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Salvar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
