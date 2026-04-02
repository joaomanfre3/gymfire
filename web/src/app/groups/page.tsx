'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken, getUser } from '@/lib/api';
import { timeAgo } from '@/lib/format';

interface Group {
  id: string;
  name: string;
  avatar: string | null;
  memberCount: number;
  lastMessage: { content: string; createdAt: string } | null;
  myRole: string;
}

// Icons
function GroupIcon() { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth={1.5}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function PlusIcon() { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function TrophyIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth={1.5}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-.85-3.25-2.03-3.79A1.07 1.07 0 0 1 14 17v-2.34" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>; }

interface SearchResult { id: string; username: string; displayName: string; }

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [searchMember, setSearchMember] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SearchResult[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    loadGroups();
  }, [router]);

  async function loadGroups() {
    try {
      const res = await apiFetch('/api/groups');
      if (res.ok) setGroups(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function searchUsers(query: string) {
    setSearchMember(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const res = await apiFetch(`/api/users/search/${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const currentUser = getUser();
        setSearchResults(data.filter((u: SearchResult) => u.id !== currentUser?.id && !selectedMembers.some(m => m.id === u.id)));
      }
    } catch { /* ignore */ }
  }

  async function createGroup() {
    if (!newGroupName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await apiFetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify({ name: newGroupName.trim(), memberIds: selectedMembers.map(m => m.id) }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreate(false);
        setNewGroupName('');
        setSelectedMembers([]);
        router.push(`/groups/${data.id}`);
      }
    } catch { /* ignore */ }
    setCreating(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GroupIcon />
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F0F8', margin: 0 }}>Grupos</h1>
          </div>
          <button onClick={() => setShowCreate(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', background: '#FF6B35', color: '#0A0A0F',
            padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px',
            border: 'none', cursor: 'pointer',
          }}>
            <PlusIcon /> Criar Grupo
          </button>
        </div>

        {/* Groups list */}
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shimmer" style={{ height: '80px', borderRadius: '14px', marginBottom: '10px', background: '#141420' }} />
          ))
        ) : groups.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 20px', background: '#141420',
            borderRadius: '16px', border: '1px solid rgba(148,148,172,0.08)',
          }}>
            <GroupIcon />
            <p style={{ color: '#9494AC', margin: '12px 0 4px', fontSize: '15px', fontWeight: 600 }}>Nenhum grupo ainda</p>
            <p style={{ color: '#5C5C72', margin: '0 0 16px', fontSize: '13px' }}>Crie um grupo para competir com seus amigos!</p>
            <button onClick={() => setShowCreate(true)} style={{
              background: '#FF6B35', color: '#0A0A0F', padding: '12px 24px', borderRadius: '10px',
              fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer',
            }}>Criar Grupo</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {groups.map(g => (
              <Link key={g.id} href={`/groups/${g.id}`} style={{
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px',
                background: '#141420', borderRadius: '14px', border: '1px solid rgba(148,148,172,0.08)',
                padding: '14px 16px', transition: 'all 200ms',
              }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #FF6B35, #E05520)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: '18px', flexShrink: 0,
                }}>
                  {g.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F8' }}>{g.name}</span>
                    <TrophyIcon />
                  </div>
                  <div style={{ fontSize: '12px', color: '#5C5C72', marginTop: '2px' }}>
                    {g.memberCount} membros
                    {g.lastMessage && ` · ${timeAgo(g.lastMessage.createdAt)}`}
                  </div>
                  {g.lastMessage && (
                    <div style={{ fontSize: '13px', color: '#9494AC', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.lastMessage.content}
                    </div>
                  )}
                </div>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>
              </Link>
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreate && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(10,10,15,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}>
            <div style={{
              background: '#141420', borderRadius: '20px', border: '1px solid rgba(148,148,172,0.12)',
              padding: '24px', maxWidth: '420px', width: '100%', maxHeight: '80vh', overflowY: 'auto',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F0F0F8', margin: '0 0 20px' }}>Criar Grupo</h2>

              {/* Group name */}
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Nome do grupo</label>
              <input
                type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                placeholder="Ex: Treino da Galera" maxLength={50}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px', background: '#1A1A28',
                  border: '1px solid rgba(148,148,172,0.12)', color: '#F0F0F8', fontSize: '15px',
                  outline: 'none', marginBottom: '16px', boxSizing: 'border-box',
                }}
              />

              {/* Add members */}
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Adicionar membros</label>
              <input
                type="text" value={searchMember} onChange={e => searchUsers(e.target.value)}
                placeholder="Buscar por username..."
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px', background: '#1A1A28',
                  border: '1px solid rgba(148,148,172,0.12)', color: '#F0F0F8', fontSize: '14px',
                  outline: 'none', marginBottom: '8px', boxSizing: 'border-box',
                }}
              />

              {/* Search results */}
              {searchResults.length > 0 && (
                <div style={{ background: '#1A1A28', borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
                  {searchResults.slice(0, 5).map(u => (
                    <button key={u.id} onClick={() => { setSelectedMembers(prev => [...prev, u]); setSearchResults(prev => prev.filter(r => r.id !== u.id)); setSearchMember(''); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                        background: 'transparent', border: 'none', borderBottom: '1px solid rgba(148,148,172,0.06)',
                        cursor: 'pointer', textAlign: 'left',
                      }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B35, #E05520)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                        {u.displayName[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{u.displayName}</div>
                        <div style={{ fontSize: '11px', color: '#5C5C72' }}>@{u.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected members */}
              {selectedMembers.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {selectedMembers.map(m => (
                    <span key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                      borderRadius: '20px', background: 'rgba(255,107,53,0.1)', color: '#FF8050',
                      fontSize: '12px', fontWeight: 600,
                    }}>
                      @{m.username}
                      <button onClick={() => setSelectedMembers(prev => prev.filter(x => x.id !== m.id))}
                        style={{ background: 'none', border: 'none', color: '#FF4D6A', cursor: 'pointer', fontSize: '14px', padding: 0, lineHeight: 1 }}>
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setShowCreate(false); setNewGroupName(''); setSelectedMembers([]); }}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(148,148,172,0.12)', background: 'transparent', color: '#9494AC', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={createGroup} disabled={!newGroupName.trim() || creating}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                    background: newGroupName.trim() ? '#FF6B35' : '#1A1A28',
                    color: newGroupName.trim() ? '#0A0A0F' : '#5C5C72',
                    fontSize: '14px', fontWeight: 700, cursor: newGroupName.trim() ? 'pointer' : 'default',
                  }}>
                  {creating ? 'Criando...' : 'Criar Grupo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
