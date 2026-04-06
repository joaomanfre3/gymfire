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

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserEntry | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserEntry | null>(null);

  // Create form
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit form
  const [editUsername, setEditUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);

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
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  async function handleAction(userId: string, action: string) {
    try {
      const res = await apiFetch('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ userId, action }) });
      if (res.ok) loadUsers();
    } catch { /* ignore */ }
  }

  async function handleCreate() {
    if (!newUsername.trim() || !newDisplayName.trim() || !newEmail.trim() || !newPassword.trim() || creating) return;
    setCreating(true);
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ action: 'create', username: newUsername.trim(), displayName: newDisplayName.trim(), email: newEmail.trim(), password: newPassword }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewUsername(''); setNewDisplayName(''); setNewEmail(''); setNewPassword('');
        loadUsers();
      }
    } catch { /* ignore */ }
    setCreating(false);
  }

  function openEdit(u: UserEntry) {
    setEditUser(u);
    setEditUsername(u.username);
    setEditDisplayName(u.displayName);
    setEditEmail(u.email);
    setEditBio(u.bio || '');
  }

  async function handleEdit() {
    if (!editUser || saving) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({
          userId: editUser.id, action: 'edit',
          value: { username: editUsername.trim(), displayName: editDisplayName.trim(), email: editEmail.trim(), bio: editBio.trim() },
        }),
      });
      if (res.ok) { setEditUser(null); loadUsers(); }
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteUser) return;
    try {
      const res = await apiFetch('/api/admin/users', { method: 'DELETE', body: JSON.stringify({ userId: deleteUser.id }) });
      if (res.ok) { setDeleteUser(null); loadUsers(); }
    } catch { /* ignore */ }
  }

  async function handleImpersonate(u: UserEntry) {
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ action: 'impersonate', userId: u.id }),
      });
      if (res.ok) {
        const data = await res.json();
        // Save current admin to restore later
        localStorage.setItem('admin_backup_token', getToken() || '');
        localStorage.setItem('admin_backup_user', localStorage.getItem('user_info') || '');
        // Set impersonated user
        localStorage.setItem('user_info', JSON.stringify(data));
        window.location.href = '/profile';
      }
    } catch { /* ignore */ }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    background: '#1A1A28', border: '1px solid rgba(148,148,172,0.12)',
    color: '#F0F0F8', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

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
            <span style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GYMFIRE ADMIN</span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link href="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, padding: '0.4rem 0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dashboard</Link>
            <Link href="/admin/users" style={{ color: '#A855F7', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, padding: '0.4rem 0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuarios</Link>
            <Link href="/admin/exercises" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, padding: '0.4rem 0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exercicios</Link>
            <button onClick={() => logout()} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem', textTransform: 'uppercase' }}>Sair</button>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em' }}>
            <span style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>USUARIOS</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif', fontWeight: 500, marginLeft: '0.5rem' }}>({total})</span>
          </h1>
          <button onClick={() => setShowCreate(true)} style={{
            background: '#A855F7', color: '#fff', border: 'none', padding: '0.5rem 1rem',
            borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            + Criar Usuario
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); loadUsers(); }} style={{ marginBottom: '1rem' }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, email ou username..."
            style={{
              width: '100%', padding: '0.75rem 1rem',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.9rem',
              outline: 'none', boxSizing: 'border-box',
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
                    {actionBtn('Editar', () => openEdit(u), '#60A5FA')}
                    {actionBtn('Entrar', () => handleImpersonate(u), '#FBBF24')}
                    {!u.isVerified && actionBtn('Verificar', () => handleAction(u.id, 'verify'), 'var(--accent)')}
                    {!u.isPremium && actionBtn('Premium', () => handleAction(u.id, 'premium'), 'var(--warning)')}
                    {u.role !== 'ADMIN' && actionBtn('Admin', () => handleAction(u.id, 'promote'), '#A855F7')}
                    {u.role === 'ADMIN' && actionBtn('Rebaixar', () => handleAction(u.id, 'demote'), 'var(--error)')}
                    {actionBtn('Deletar', () => setDeleteUser(u), '#EF4444')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CREATE MODAL */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#141420', borderRadius: '16px', border: '1px solid rgba(148,148,172,0.12)', padding: '24px', maxWidth: '420px', width: '100%' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F0F0F8', margin: '0 0 16px' }}>Criar Usuario</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <input type="text" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="Nome" style={inputStyle} />
              <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Username" style={inputStyle} />
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email" style={inputStyle} />
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Senha" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(148,148,172,0.12)', background: 'transparent', color: '#9494AC', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleCreate} disabled={creating} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#A855F7', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>{creating ? 'Criando...' : 'Criar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#141420', borderRadius: '16px', border: '1px solid rgba(148,148,172,0.12)', padding: '24px', maxWidth: '420px', width: '100%' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F0F0F8', margin: '0 0 16px' }}>Editar Usuario</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase' }}>Nome</label>
              <input type="text" value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} style={inputStyle} />
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase' }}>Username</label>
              <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} style={inputStyle} />
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase' }}>Email</label>
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} style={inputStyle} />
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase' }}>Bio</label>
              <input type="text" value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Bio do usuario" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEditUser(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(148,148,172,0.12)', background: 'transparent', color: '#9494AC', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleEdit} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#60A5FA', color: '#0A0A0F', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#141420', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.2)', padding: '24px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#F0F0F8', margin: '0 0 8px' }}>Deletar usuario?</h2>
            <p style={{ fontSize: '13px', color: '#9494AC', margin: '0 0 20px' }}>
              <strong style={{ color: '#F0F0F8' }}>{deleteUser.displayName}</strong> (@{deleteUser.username}) sera removido permanentemente.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteUser(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(148,148,172,0.12)', background: 'transparent', color: '#9494AC', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Deletar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
