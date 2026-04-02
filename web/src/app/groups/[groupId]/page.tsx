'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken, getUser } from '@/lib/api';
import { usePusherChannel } from '@/hooks/usePusher';
import { useCountUp } from '@/hooks/useCountUp';

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

interface RankEntry {
  rank: number;
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
  currentStreak: number;
  isVerified: boolean;
  workoutsCount: number;
  role: string;
}

// Icons
function ArrowLeftIcon() { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={2}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>; }
function SendIcon() { return <svg width={20} height={20} viewBox="0 0 24 24" fill="#0A0A0F" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>; }
function ChatIcon({ active }: { active: boolean }) { const c = active ? '#F0F0F8' : '#5C5C72'; return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>; }
function TrophyIcon({ active }: { active: boolean }) { const c = active ? '#F0F0F8' : '#5C5C72'; return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-.85-3.25-2.03-3.79A1.07 1.07 0 0 1 14 17v-2.34" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>; }
function CrownIcon() { return <svg width={20} height={20} viewBox="0 0 24 24" fill="#FFD700" stroke="none" style={{ filter: 'drop-shadow(0 1px 3px rgba(255,215,0,0.3))' }}><path d="M2.5 19h19l-2.3-9.3L15 13l-3-6-3 6-4.2-3.3L2.5 19zM12 2l1 2-1 1-1-1 1-2z" /></svg>; }

const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

function PodiumUser({ entry, rank }: { entry: RankEntry; rank: number }) {
  const avatarSize = rank === 1 ? 72 : 56;
  const color = rankColors[rank - 1] || '#5C5C72';
  const value = useCountUp(entry.totalPoints, 1000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, order: rank === 2 ? 0 : rank === 1 ? 1 : 2 }}>
      {rank === 1 && <CrownIcon />}
      <div style={{ position: 'relative', marginBottom: '8px', marginTop: rank === 1 ? '4px' : '16px' }}>
        <div style={{
          width: `${avatarSize}px`, height: `${avatarSize}px`, borderRadius: '50%',
          border: `3px solid ${color}`, boxShadow: `0 0 12px ${color}33`,
          background: entry.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: rank === 1 ? '24px' : '18px', overflow: 'hidden',
        }}>
          {entry.avatarUrl ? <img src={entry.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : entry.displayName[0].toUpperCase()}
        </div>
        <div style={{
          position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)',
          width: '22px', height: '22px', borderRadius: '50%', background: color,
          color: '#0A0A0F', fontSize: '11px', fontWeight: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #141420',
        }}>{rank}</div>
      </div>
      <span style={{ fontSize: rank === 1 ? '14px' : '12px', fontWeight: 700, color: '#F0F0F8', textAlign: 'center', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.displayName}</span>
      <span style={{ fontSize: rank === 1 ? '18px' : '14px', fontWeight: 900, color: '#CCFF00', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>{value.toLocaleString('pt-BR')}</span>
      <span style={{ fontSize: '9px', fontWeight: 600, color: '#5C5C72', textTransform: 'uppercase' }}>XP</span>
    </div>
  );
}

type GroupTab = 'chat' | 'ranking';

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const router = useRouter();
  const currentUser = getUser();
  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [tab, setTab] = useState<GroupTab>('chat');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChat, setLoadingChat] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ranking state
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    params.then(p => {
      setGroupId(p.groupId);
      loadGroupInfo(p.groupId);
      loadMessages(p.groupId);
    });
  }, [params, router]);

  async function loadGroupInfo(gid: string) {
    try {
      const res = await apiFetch('/api/groups');
      if (res.ok) {
        const groups = await res.json();
        const g = groups.find((x: { id: string }) => x.id === gid);
        if (g) { setGroupName(g.name); setMemberCount(g.memberCount); }
      }
    } catch { /* ignore */ }
  }

  async function loadMessages(gid: string) {
    try {
      const res = await apiFetch(`/api/messages/${gid}`);
      if (res.ok) setMessages(await res.json());
    } catch { /* ignore */ }
    setLoadingChat(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function loadRanking() {
    if (!groupId) return;
    setLoadingRanking(true);
    try {
      const res = await apiFetch(`/api/groups/${groupId}/ranking`);
      if (res.ok) setRanking(await res.json());
    } catch { /* ignore */ }
    setLoadingRanking(false);
  }

  useEffect(() => { if (tab === 'ranking' && ranking.length === 0 && groupId) loadRanking(); }, [tab, groupId]);

  async function sendMessage() {
    if (!newMessage.trim() || !groupId || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`, content, senderId: currentUser?.id || '', createdAt: new Date().toISOString(),
      sender: { id: currentUser?.id || '', username: currentUser?.username || '', displayName: currentUser?.displayName || '', avatarUrl: null },
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      const res = await apiFetch(`/api/messages/${groupId}`, { method: 'POST', body: JSON.stringify({ content }) });
      if (res.ok) { const real = await res.json(); setMessages(prev => prev.map(m => m.id === tempMsg.id ? real : m)); }
    } catch { /* ignore */ }
    setSending(false);
    inputRef.current?.focus();
  }

  // Real-time
  const handleNewMessage = useCallback((data: unknown) => {
    const msg = data as ChatMessage & { conversationId: string };
    if (msg.senderId === currentUser?.id) return;
    setMessages(prev => [...prev, msg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [currentUser?.id]);
  usePusherChannel(groupId ? `chat-${groupId}` : '', 'new-message', handleNewMessage, !!groupId);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Group header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
        borderBottom: '1px solid rgba(148,148,172,0.08)', maxWidth: '900px', width: '100%', margin: '0 auto',
      }}>
        <button onClick={() => router.push('/groups')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeftIcon />
        </button>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #FF6B35, #E05520)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '16px', flexShrink: 0,
        }}>{groupName ? groupName[0].toUpperCase() : 'G'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8' }}>{groupName || 'Grupo'}</div>
          <div style={{ fontSize: '12px', color: '#5C5C72' }}>{memberCount} membros</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', maxWidth: '900px', width: '100%', margin: '0 auto',
        borderBottom: '1px solid rgba(148,148,172,0.08)',
      }}>
        {([{ key: 'chat' as const, icon: ChatIcon, label: 'Chat' }, { key: 'ranking' as const, icon: TrophyIcon, label: 'Ranking' }]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '12px', background: 'transparent', border: 'none', cursor: 'pointer',
            borderBottom: tab === t.key ? '2px solid #FF6B35' : '2px solid transparent',
            color: tab === t.key ? '#F0F0F8' : '#5C5C72', fontSize: '14px', fontWeight: tab === t.key ? 700 : 500,
            transition: 'all 200ms',
          }}>
            <t.icon active={tab === t.key} /> {t.label}
          </button>
        ))}
      </div>

      {/* ===== CHAT TAB ===== */}
      {tab === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {loadingChat ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#5C5C72' }}>Carregando...</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#5C5C72', fontSize: '13px' }}>Nenhuma mensagem. Diga oi ao grupo!</div>
            ) : (
              messages.map((msg, i) => {
                const isOwn = msg.senderId === currentUser?.id;
                const showAvatar = !isOwn && (i === 0 || messages[i - 1].senderId !== msg.senderId);
                const showTime = i === messages.length - 1 || messages[i + 1].senderId !== msg.senderId;
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px', marginTop: showAvatar ? '12px' : '1px' }}>
                    {!isOwn && (
                      <div style={{ width: '28px', flexShrink: 0 }}>
                        {showAvatar && <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B35, #E05520)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '11px' }}>{msg.sender.displayName[0].toUpperCase()}</div>}
                      </div>
                    )}
                    <div style={{ maxWidth: '70%' }}>
                      {showAvatar && !isOwn && <div style={{ fontSize: '11px', color: '#FF6B35', fontWeight: 600, marginBottom: '2px', paddingLeft: '4px' }}>{msg.sender.displayName}</div>}
                      <div style={{ padding: '10px 14px', borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isOwn ? '#FF6B35' : '#141420', color: isOwn ? '#0A0A0F' : '#F0F0F8', fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.content}</div>
                      {showTime && <div style={{ fontSize: '10px', color: '#5C5C72', marginTop: '4px', textAlign: isOwn ? 'right' : 'left', paddingInline: '4px' }}>{new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(148,148,172,0.08)', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input ref={inputRef} type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }}
              placeholder="Mensagem..." style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', background: '#141420', border: '1px solid rgba(148,148,172,0.08)', color: '#F0F0F8', fontSize: '14px', outline: 'none' }} />
            <button onClick={sendMessage} disabled={!newMessage.trim()} style={{
              width: '40px', height: '40px', borderRadius: '50%', border: 'none',
              background: newMessage.trim() ? '#FF6B35' : '#1A1A28', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: newMessage.trim() ? 'pointer' : 'default', flexShrink: 0,
            }}><SendIcon /></button>
          </div>
        </div>
      )}

      {/* ===== RANKING TAB ===== */}
      {tab === 'ranking' && (
        <div style={{ flex: 1, overflowY: 'auto', maxWidth: '640px', width: '100%', margin: '0 auto', padding: '20px 16px 80px' }}>
          {loadingRanking ? (
            <div>
              <div className="shimmer" style={{ height: '200px', borderRadius: '20px', marginBottom: '12px', background: '#141420' }} />
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer" style={{ height: '60px', borderRadius: '12px', marginBottom: '6px', background: '#141420' }} />)}
            </div>
          ) : ranking.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#5C5C72' }}>Nenhum dado de ranking disponível.</div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {ranking.length >= 3 && (
                <div style={{
                  background: '#141420', borderRadius: '20px', border: '1px solid rgba(148,148,172,0.08)',
                  padding: '24px 16px 20px', marginBottom: '16px', position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80px', background: 'radial-gradient(ellipse at 50% 0%, rgba(255,107,53,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', position: 'relative', zIndex: 1 }}>
                    <PodiumUser entry={ranking[1]} rank={2} />
                    <PodiumUser entry={ranking[0]} rank={1} />
                    <PodiumUser entry={ranking[2]} rank={3} />
                  </div>
                </div>
              )}

              {/* Rest of ranking */}
              <div style={{ background: '#141420', borderRadius: '16px', border: '1px solid rgba(148,148,172,0.08)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(148,148,172,0.08)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Classificação</span>
                  <span style={{ fontSize: '12px', color: '#5C5C72' }}>{ranking.length} membros</span>
                </div>
                {ranking.slice(3).map((entry, i) => (
                  <div key={entry.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                    borderBottom: i < ranking.length - 4 ? '1px solid rgba(148,148,172,0.06)' : 'none',
                    animation: `rowSlideIn 300ms ease ${i * 30}ms both`,
                  }}>
                    <span style={{ width: '28px', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: '#5C5C72', fontVariantNumeric: 'tabular-nums' }}>{entry.rank}</span>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                      background: entry.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: '14px', overflow: 'hidden',
                      border: '1.5px solid rgba(148,148,172,0.12)',
                    }}>
                      {entry.avatarUrl ? <img src={entry.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : entry.displayName[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.displayName}</span>
                        {entry.isVerified && <span style={{ fontSize: '9px', fontWeight: 800, background: '#FF6B35', color: '#0A0A0F', padding: '1px 5px', borderRadius: '3px' }}>PRO</span>}
                      </div>
                      <span style={{ fontSize: '11px', color: '#5C5C72' }}>@{entry.username} · {entry.workoutsCount} treinos</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#CCFF00', fontVariantNumeric: 'tabular-nums' }}>{entry.totalPoints.toLocaleString('pt-BR')}</div>
                      <div style={{ fontSize: '9px', fontWeight: 600, color: '#5C5C72', textTransform: 'uppercase' }}>XP</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
