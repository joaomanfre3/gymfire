'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar'; // kept for mobile top bar
import { apiFetch, getToken, getUser } from '@/lib/api';
import { startImpersonation } from '@/components/ImpersonationBanner';

interface AdminUser {
  id: string; username: string; displayName: string; email: string;
  role: string; isVerified: boolean; isPremium: boolean; totalPoints: number;
  currentStreak: number; createdAt: string;
  workoutsCount: number; postsCount: number; followersCount: number; followingCount: number;
  plan?: string; aiEnabled?: boolean; aiLimitOverride?: number | null;
}

interface AIProviderItem {
  id: string; name: string; displayName: string; model: string;
  isEnabled: boolean; maxRPD: number; todayUsed: number; quality: number; priority: number;
}

type AdminTab = 'users' | 'ai-config' | 'ai-providers' | 'ai-usage';

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
  const [editForm, setEditForm] = useState({ displayName: '', username: '', email: '', bio: '', role: '', isVerified: false, plan: 'FREE', aiEnabled: true, aiLimitOverride: '' as string });
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [aiProviders, setAiProviders] = useState<AIProviderItem[]>([]);
  const [aiConfig, setAiConfig] = useState<Record<string, unknown>>({});
  const [aiUsageData, setAiUsageData] = useState<{
    alert: { level: string; message: string; providers: Array<{ name: string; displayName: string; isEnabled: boolean; todayUsed: number; maxRPD: number; percentUsed: number; quality: number }>; totalUsed: number; totalCapacity: number; percentUsed: number };
    today: { requests: number; capacity: number };
    topUsers: Array<{ requestCount: number; user: { username: string; displayName: string; plan: string } }>;
  } | null>(null);

  useEffect(() => {
    if (!getToken() || currentUser?.role !== 'ADMIN') { router.push('/'); return; }
    loadData();
    loadAIUsage(); // Load alerts on mount
    // Auto-refresh alerts every 30s
    const interval = setInterval(loadAIUsage, 30000);
    return () => clearInterval(interval);
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
      const payload = {
        ...editForm,
        aiLimitOverride: editForm.aiLimitOverride ? parseInt(editForm.aiLimitOverride) : null,
      };
      await apiFetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT', body: JSON.stringify(payload),
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

  // AI management functions
  async function loadAIProviders() {
    try {
      const res = await apiFetch('/api/admin/ai/providers');
      if (res.ok) setAiProviders(await res.json());
    } catch { /* ignore */ }
  }
  async function loadAIConfig() {
    try {
      const res = await apiFetch('/api/admin/ai/config');
      if (res.ok) setAiConfig(await res.json());
    } catch { /* ignore */ }
  }
  async function loadAIUsage() {
    try {
      const res = await apiFetch('/api/admin/ai/usage');
      if (res.ok) setAiUsageData(await res.json());
    } catch { /* ignore */ }
  }
  async function toggleProvider(id: string, isEnabled: boolean) {
    await apiFetch('/api/admin/ai/providers', { method: 'PUT', body: JSON.stringify({ id, isEnabled: !isEnabled }) });
    loadAIProviders();
  }
  async function saveAIConfig(key: string, value: unknown) {
    await apiFetch('/api/admin/ai/config', { method: 'PUT', body: JSON.stringify({ [key]: value }) });
    loadAIConfig();
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

        {/* AI Alert Banner */}
        {aiUsageData?.alert && aiUsageData.alert.level !== 'ok' && (
          <div style={{
            padding: '12px 16px', borderRadius: '12px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '12px',
            background: aiUsageData.alert.level === 'exhausted' ? 'rgba(255,77,106,0.1)' : aiUsageData.alert.level === 'critical' ? 'rgba(255,77,106,0.08)' : 'rgba(255,184,0,0.08)',
            border: `1px solid ${aiUsageData.alert.level === 'exhausted' ? 'rgba(255,77,106,0.3)' : aiUsageData.alert.level === 'critical' ? 'rgba(255,77,106,0.2)' : 'rgba(255,184,0,0.2)'}`,
          }}>
            <span style={{ fontSize: '20px' }}>{aiUsageData.alert.level === 'exhausted' ? '🔴' : aiUsageData.alert.level === 'critical' ? '🟠' : '🟡'}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '13px', fontWeight: 700,
                color: aiUsageData.alert.level === 'exhausted' ? '#FF4D6A' : aiUsageData.alert.level === 'critical' ? '#FF6B35' : '#FFB800',
              }}>
                {aiUsageData.alert.level === 'exhausted' ? 'IA OFFLINE' : aiUsageData.alert.level === 'critical' ? 'IA EM ESTADO CRÍTICO' : 'ATENÇÃO: Uso elevado'}
              </div>
              <div style={{ fontSize: '12px', color: '#9494AC', marginTop: '2px' }}>{aiUsageData.alert.message}</div>
            </div>
            <div style={{
              padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
              background: 'rgba(148,148,172,0.1)', color: '#F0F0F8',
            }}>
              {aiUsageData.alert.percentUsed}%
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', overflowX: 'auto' }}>
          {([
            { key: 'users' as AdminTab, label: 'Usuários' },
            { key: 'ai-config' as AdminTab, label: 'IA Config' },
            { key: 'ai-providers' as AdminTab, label: 'Providers' },
            { key: 'ai-usage' as AdminTab, label: 'IA Uso' },
          ]).map(tab => (
            <button key={tab.key} onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === 'ai-config') loadAIConfig();
              if (tab.key === 'ai-providers') loadAIProviders();
              if (tab.key === 'ai-usage') { loadAIUsage(); loadAIProviders(); }
            }} style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap',
              background: activeTab === tab.key ? '#FF6B35' : '#141420',
              color: activeTab === tab.key ? '#0A0A0F' : '#9494AC',
              transition: 'all 200ms',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* ===== AI CONFIG TAB ===== */}
        {activeTab === 'ai-config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Global toggle */}
            <div style={{ background: '#141420', borderRadius: '12px', border: '1px solid rgba(148,148,172,0.08)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8' }}>IA Global</span>
                <button onClick={() => saveAIConfig('globalEnabled', !(aiConfig.globalEnabled as boolean))} style={{
                  padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                  background: aiConfig.globalEnabled ? '#10B981' : '#FF4D6A',
                  color: '#fff',
                }}>{aiConfig.globalEnabled ? 'ATIVADA' : 'DESATIVADA'}</button>
              </div>
              {/* Limits per plan */}
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', marginBottom: '8px', textTransform: 'uppercase' }}>Limites diários por plano</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['FREE', 'PLUS', 'PRO'].map(plan => {
                  const limits = (aiConfig.limits || {}) as Record<string, number>;
                  return (
                    <div key={plan} style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', color: '#9494AC', display: 'block', marginBottom: '4px' }}>{plan}</label>
                      <input type="number" defaultValue={limits[plan] || 0}
                        onBlur={e => { const newLimits = { ...limits, [plan]: parseInt(e.target.value) || 0 }; saveAIConfig('limits', newLimits); }}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#1A1A28', border: '1px solid rgba(148,148,172,0.08)', color: '#F0F0F8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            {/* System prompt */}
            <div style={{ background: '#141420', borderRadius: '12px', border: '1px solid rgba(148,148,172,0.08)', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8', marginBottom: '8px' }}>System Prompt</div>
              <textarea defaultValue={(aiConfig.systemPrompt as string) || ''} rows={8}
                onBlur={e => saveAIConfig('systemPrompt', e.target.value)}
                style={{ width: '100%', background: '#1A1A28', border: '1px solid rgba(148,148,172,0.08)', borderRadius: '8px', color: '#F0F0F8', fontSize: '13px', padding: '12px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
              />
            </div>
            {/* Temperature & Max Tokens */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, background: '#141420', borderRadius: '12px', border: '1px solid rgba(148,148,172,0.08)', padding: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', display: 'block', marginBottom: '6px' }}>Temperature</label>
                <input type="number" step="0.1" min="0" max="2" defaultValue={(aiConfig.temperature as number) || 0.7}
                  onBlur={e => saveAIConfig('temperature', parseFloat(e.target.value))}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#1A1A28', border: '1px solid rgba(148,148,172,0.08)', color: '#F0F0F8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1, background: '#141420', borderRadius: '12px', border: '1px solid rgba(148,148,172,0.08)', padding: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', display: 'block', marginBottom: '6px' }}>Max Tokens</label>
                <input type="number" defaultValue={(aiConfig.maxTokens as number) || 1024}
                  onBlur={e => saveAIConfig('maxTokens', parseInt(e.target.value))}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#1A1A28', border: '1px solid rgba(148,148,172,0.08)', color: '#F0F0F8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== AI PROVIDERS TAB ===== */}
        {activeTab === 'ai-providers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {aiProviders.map(p => (
              <div key={p.id} style={{
                background: '#141420', borderRadius: '12px', border: '1px solid rgba(148,148,172,0.08)', padding: '16px',
                opacity: p.isEnabled ? 1 : 0.5,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8' }}>{p.displayName}</span>
                    <span style={{ fontSize: '11px', color: '#5C5C72', marginLeft: '8px' }}>P{p.priority} · Q{p.quality}</span>
                  </div>
                  <button onClick={() => toggleProvider(p.id, p.isEnabled)} style={{
                    padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                    background: p.isEnabled ? '#10B981' : '#FF4D6A', color: '#fff',
                  }}>{p.isEnabled ? 'ON' : 'OFF'}</button>
                </div>
                <div style={{ fontSize: '12px', color: '#9494AC', marginBottom: '8px' }}>{p.model}</div>
                {/* Usage bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: '#1A1A28', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px', transition: 'width 300ms',
                      width: `${Math.min(100, (p.todayUsed / p.maxRPD) * 100)}%`,
                      background: p.todayUsed / p.maxRPD > 0.9 ? '#FF4D6A' : p.todayUsed / p.maxRPD > 0.7 ? '#FFB800' : '#10B981',
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#9494AC', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {p.todayUsed}/{p.maxRPD}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== AI USAGE TAB ===== */}
        {activeTab === 'ai-usage' && aiUsageData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Alert card */}
            {aiUsageData.alert && (
              <div style={{
                background: '#141420', borderRadius: '12px', padding: '16px',
                border: `1px solid ${aiUsageData.alert.level === 'exhausted' ? 'rgba(255,77,106,0.3)' : aiUsageData.alert.level === 'critical' ? 'rgba(255,77,106,0.2)' : aiUsageData.alert.level === 'warning' ? 'rgba(255,184,0,0.2)' : 'rgba(16,185,129,0.2)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '24px' }}>
                    {aiUsageData.alert.level === 'exhausted' ? '🔴' : aiUsageData.alert.level === 'critical' ? '🟠' : aiUsageData.alert.level === 'warning' ? '🟡' : '🟢'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8' }}>
                      {aiUsageData.alert.level === 'ok' ? 'Tudo certo' : aiUsageData.alert.level === 'warning' ? 'Atenção' : aiUsageData.alert.level === 'critical' ? 'Crítico' : 'IA Offline'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9494AC' }}>{aiUsageData.alert.message}</div>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#FF6B35' }}>{aiUsageData.alert.percentUsed}%</div>
                </div>
                {/* Per-provider bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {aiUsageData.alert.providers.filter(p => p.isEnabled).map(p => (
                    <div key={p.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#9494AC', fontWeight: 600 }}>{p.displayName} <span style={{ color: '#5C5C72' }}>Q{p.quality}</span></span>
                        <span style={{ fontSize: '11px', fontVariantNumeric: 'tabular-nums', color: p.percentUsed >= 90 ? '#FF4D6A' : p.percentUsed >= 70 ? '#FFB800' : '#10B981', fontWeight: 600 }}>
                          {p.todayUsed}/{p.maxRPD} ({p.percentUsed}%)
                        </span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', background: '#1A1A28', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '3px', transition: 'width 500ms',
                          width: `${Math.min(100, p.percentUsed)}%`,
                          background: p.percentUsed >= 90 ? '#FF4D6A' : p.percentUsed >= 70 ? '#FFB800' : '#10B981',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Today summary */}
            <div style={{ background: '#141420', borderRadius: '12px', border: '1px solid rgba(148,148,172,0.08)', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#FF6B35' }}>{aiUsageData.today.requests}</div>
              <div style={{ fontSize: '12px', color: '#5C5C72' }}>requests hoje / {aiUsageData.today.capacity} capacidade</div>
              <div style={{ height: '8px', borderRadius: '4px', background: '#1A1A28', marginTop: '12px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '4px',
                  width: `${Math.min(100, aiUsageData.today.capacity > 0 ? (aiUsageData.today.requests / aiUsageData.today.capacity) * 100 : 0)}%`,
                  background: 'linear-gradient(90deg, #FF6B35, #FF8050)',
                }} />
              </div>
            </div>
            {/* Top users */}
            <div style={{ background: '#141420', borderRadius: '12px', border: '1px solid rgba(148,148,172,0.08)', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8', marginBottom: '12px' }}>Top Usuários Hoje</div>
              {aiUsageData.topUsers.length === 0 ? (
                <div style={{ color: '#5C5C72', fontSize: '13px' }}>Nenhum uso hoje</div>
              ) : (
                aiUsageData.topUsers.map((u, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(148,148,172,0.04)' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{u.user.displayName}</span>
                      <span style={{ fontSize: '11px', color: '#5C5C72', marginLeft: '6px' }}>@{u.user.username}</span>
                      <span style={{ fontSize: '10px', color: '#FF6B35', marginLeft: '6px', fontWeight: 600 }}>{u.user.plan}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35' }}>{u.requestCount} req</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===== USERS TAB (original content) ===== */}
        {activeTab === 'users' && <>
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
                  <button onClick={() => { setEditingUser(u); setEditForm({ displayName: u.displayName, username: u.username, email: u.email, bio: '', role: u.role, isVerified: u.isVerified, plan: u.plan || 'FREE', aiEnabled: u.aiEnabled !== false, aiLimitOverride: u.aiLimitOverride != null ? String(u.aiLimitOverride) : '' }); }}
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

        </>}

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
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={editForm.isVerified} onChange={e => setEditForm(prev => ({ ...prev, isVerified: e.target.checked }))} />
                <span style={{ fontSize: '13px', color: '#9494AC' }}>Verificado (PRO)</span>
              </label>
              {/* Plan */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Plano IA</label>
                <select value={editForm.plan} onChange={e => setEditForm(prev => ({ ...prev, plan: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#1A1A28', border: '1px solid rgba(148,148,172,0.12)', color: '#F0F0F8', fontSize: '14px', outline: 'none' }}>
                  <option value="FREE">FREE</option>
                  <option value="PLUS">PLUS</option>
                  <option value="PRO">PRO</option>
                </select>
              </div>
              {/* AI enabled */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={editForm.aiEnabled} onChange={e => setEditForm(prev => ({ ...prev, aiEnabled: e.target.checked }))} />
                <span style={{ fontSize: '13px', color: '#9494AC' }}>IA Habilitada</span>
              </label>
              {/* AI limit override */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Limite IA (override, vazio = padrão)</label>
                <input type="number" value={editForm.aiLimitOverride} onChange={e => setEditForm(prev => ({ ...prev, aiLimitOverride: e.target.value }))}
                  placeholder="Padrão do plano"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#1A1A28', border: '1px solid rgba(148,148,172,0.12)', color: '#F0F0F8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
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
