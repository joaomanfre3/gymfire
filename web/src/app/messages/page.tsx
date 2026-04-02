'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken, getUser } from '@/lib/api';
import { usePusherChannel } from '@/hooks/usePusher';
import { timeAgo } from '@/lib/format';

// Types
interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string;
  avatar: string | null;
  username: string | null;
  userId: string | null;
  memberCount?: number;
  lastMessage: { content: string; createdAt: string; isOwn: boolean } | null;
  unread: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

interface GroupMember {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface SearchResult { id: string; username: string; displayName: string; }

// Icons
function ArrowLeftIcon() { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={2} strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>; }
function SendIcon() { return <svg width={20} height={20} viewBox="0 0 24 24" fill="#0A0A0F" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>; }
function PenIcon() { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={1.5}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>; }
function SearchIconSm() { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function ChatBubbleIcon() { return <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={1}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>; }
function GroupPlusIcon() { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="23" y1="11" x2="17" y2="11" /><line x1="20" y1="8" x2="20" y2="14" /></svg>; }
function TrophySmIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth={1.5}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-.85-3.25-2.03-3.79A1.07 1.07 0 0 1 14 17v-2.34" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>; }
function GroupIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={1.5}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }

export default function MessagesPage() {
  const router = useRouter();
  const currentUser = getUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeChatType, setActiveChatType] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Group members (for mentions)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  // Create group modal
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [searchMember, setSearchMember] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SearchResult[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    loadConversations();
  }, [router]);

  async function loadConversations() {
    try {
      const res = await apiFetch('/api/conversations');
      if (res.ok) setConversations(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function openChat(conv: Conversation) {
    setActiveChat(conv.id);
    setActiveChatType(conv.type);
    setLoadingMessages(true);
    setGroupMembers([]);
    try {
      const res = await apiFetch(`/api/messages/${conv.id}`);
      if (res.ok) {
        setMessages(await res.json());
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: false } : c));
      }
    } catch { /* ignore */ }
    setLoadingMessages(false);

    // Load group members for mentions
    if (conv.type === 'GROUP') {
      try {
        const res = await apiFetch('/api/groups');
        if (res.ok) {
          const groups = await res.json();
          const g = groups.find((x: { id: string }) => x.id === conv.id);
          if (g?.members) {
            setGroupMembers(g.members.filter((m: GroupMember) => m.id !== currentUser?.id));
          }
        }
      } catch { /* ignore */ }
    }

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    inputRef.current?.focus();
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeChat || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    setShowMentions(false);

    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      content,
      senderId: currentUser?.id || '',
      createdAt: new Date().toISOString(),
      sender: { id: currentUser?.id || '', username: currentUser?.username || '', displayName: currentUser?.displayName || '', avatarUrl: null },
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const res = await apiFetch(`/api/messages/${activeChat}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const realMsg = await res.json();
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? realMsg : m));
        setConversations(prev => prev.map(c =>
          c.id === activeChat ? { ...c, lastMessage: { content, createdAt: realMsg.createdAt, isOwn: true } } : c
        ));
      }
    } catch { /* ignore */ }
    setSending(false);
    inputRef.current?.focus();
  }

  // Handle @ mentions
  function handleInputChange(value: string) {
    setNewMessage(value);
    const cursorPos = inputRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch && activeChatType === 'GROUP' && groupMembers.length > 0) {
      setMentionFilter(atMatch[1].toLowerCase());
      setShowMentions(true);
      setMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  }

  function insertMention(member: GroupMember) {
    const cursorPos = inputRef.current?.selectionStart || newMessage.length;
    const textBeforeCursor = newMessage.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const before = newMessage.slice(0, atIndex);
    const after = newMessage.slice(cursorPos);
    setNewMessage(`${before}@${member.username} ${after}`);
    setShowMentions(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showMentions) {
      const filtered = groupMembers.filter(m =>
        m.username.toLowerCase().includes(mentionFilter) ||
        m.displayName.toLowerCase().includes(mentionFilter)
      );
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => Math.min(prev + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (filtered[mentionIndex]) {
          e.preventDefault();
          insertMention(filtered[mentionIndex]);
          return;
        }
      }
      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Real-time
  const handleNewMessage = useCallback((data: unknown) => {
    const msg = data as ChatMessage & { conversationId: string };
    if (msg.senderId === currentUser?.id) return;
    if (msg.conversationId === activeChat) {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
    setConversations(prev => prev.map(c =>
      c.id === msg.conversationId
        ? { ...c, lastMessage: { content: msg.content || '', createdAt: msg.createdAt, isOwn: false }, unread: msg.conversationId !== activeChat }
        : c
    ));
  }, [activeChat, currentUser?.id]);

  usePusherChannel(activeChat ? `chat-${activeChat}` : '', 'new-message', handleNewMessage, !!activeChat);

  // Create group
  async function searchUsers(query: string) {
    setSearchMember(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const res = await apiFetch(`/api/users/search/${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
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
        setShowCreateGroup(false);
        setNewGroupName('');
        setSelectedMembers([]);
        setSearchMember('');
        await loadConversations();
      }
    } catch { /* ignore */ }
    setCreating(false);
  }

  const activeConv = conversations.find(c => c.id === activeChat);
  const filteredConvs = search
    ? conversations.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  const showChatView = !!activeChat;

  // Render mention content with highlighted @mentions
  function renderContent(text: string) {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} style={{ color: '#FF6B35', fontWeight: 600 }}>{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  // Filtered mentions
  const filteredMentions = groupMembers.filter(m =>
    m.username.toLowerCase().includes(mentionFilter) ||
    m.displayName.toLowerCase().includes(mentionFilter)
  ).slice(0, 6);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <div style={{
        maxWidth: '900px', margin: '0 auto',
        display: 'flex', height: 'calc(100vh - 64px)',
        overflow: 'hidden',
      }}>

        {/* ===== CONVERSATION LIST (left panel) ===== */}
        <div className="chat-list-panel" style={{
          width: '340px', borderRight: '1px solid rgba(148,148,172,0.08)',
          display: showChatView ? undefined : 'flex',
          flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(148,148,172,0.08)',
          }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F0F8', margin: 0 }}>Mensagens</h1>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowCreateGroup(true)} title="Criar grupo" style={{
                background: 'none', border: '1px solid rgba(148,148,172,0.12)', cursor: 'pointer',
                padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px',
                color: '#FF6B35', fontSize: '12px', fontWeight: 600,
              }}>
                <GroupPlusIcon /> Grupo
              </button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <PenIcon />
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: '#141420', borderRadius: '10px', padding: '8px 12px',
              border: '1px solid rgba(148,148,172,0.08)',
            }}>
              <SearchIconSm />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar conversa..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F0F0F8', fontSize: '14px' }}
              />
            </div>
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 16px' }}>
                  <div className="shimmer" style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#141420', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="shimmer" style={{ width: '120px', height: '14px', borderRadius: '4px', background: '#141420', marginBottom: '6px' }} />
                    <div className="shimmer" style={{ width: '180px', height: '12px', borderRadius: '4px', background: '#141420' }} />
                  </div>
                </div>
              ))
            ) : filteredConvs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <ChatBubbleIcon />
                <p style={{ color: '#5C5C72', fontSize: '14px', margin: '12px 0 0' }}>
                  {search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                </p>
              </div>
            ) : (
              filteredConvs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => openChat(conv)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', background: activeChat === conv.id ? 'rgba(255,107,53,0.06)' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    borderLeft: activeChat === conv.id ? '3px solid #FF6B35' : '3px solid transparent',
                    transition: 'all 150ms',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '50px', height: '50px', borderRadius: conv.type === 'GROUP' ? '14px' : '50%', flexShrink: 0,
                    background: conv.avatar ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '18px', overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {conv.avatar ? (
                      <img src={conv.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (conv.name || '?')[0].toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <span style={{
                          fontSize: '14px', fontWeight: conv.unread ? 700 : 600,
                          color: conv.unread ? '#F0F0F8' : '#9494AC',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{conv.name}</span>
                        {conv.type === 'GROUP' && <GroupIcon />}
                      </div>
                      {conv.lastMessage && (
                        <span style={{ fontSize: '11px', color: conv.unread ? '#FF6B35' : '#5C5C72', flexShrink: 0, marginLeft: '8px' }}>
                          {timeAgo(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {conv.type === 'GROUP' && conv.memberCount && (
                      <div style={{ fontSize: '11px', color: '#5C5C72', marginTop: '1px' }}>{conv.memberCount} membros</div>
                    )}
                    {conv.lastMessage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <span style={{
                          fontSize: '13px', color: conv.unread ? '#F0F0F8' : '#5C5C72',
                          fontWeight: conv.unread ? 600 : 400,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {conv.lastMessage.isOwn && 'Voce: '}{conv.lastMessage.content}
                        </span>
                        {conv.unread && (
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF6B35', flexShrink: 0, marginLeft: 'auto' }} />
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ===== CHAT VIEW (right panel) ===== */}
        <div className="chat-view-panel" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: '#0A0A0F',
        }}>
          {!activeChat ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <ChatBubbleIcon />
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#F0F0F8' }}>Suas mensagens</p>
              <p style={{ fontSize: '13px', color: '#5C5C72', textAlign: 'center', maxWidth: '280px' }}>
                Selecione uma conversa ou inicie uma nova para comecar a trocar mensagens.
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderBottom: '1px solid rgba(148,148,172,0.08)',
              }}>
                <button onClick={() => { setActiveChat(null); setGroupMembers([]); }} className="chat-back-btn" style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'none',
                }}>
                  <ArrowLeftIcon />
                </button>
                <div style={{
                  width: '40px', height: '40px', borderRadius: activeChatType === 'GROUP' ? '12px' : '50%',
                  background: activeConv?.avatar ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '16px', overflow: 'hidden', flexShrink: 0,
                }}>
                  {activeConv?.avatar ? (
                    <img src={activeConv.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (activeConv?.name || '?')[0].toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F8' }}>{activeConv?.name}</div>
                  {activeChatType === 'DIRECT' && activeConv?.username && (
                    <div style={{ fontSize: '12px', color: '#5C5C72' }}>@{activeConv.username}</div>
                  )}
                  {activeChatType === 'GROUP' && activeConv?.memberCount && (
                    <div style={{ fontSize: '12px', color: '#5C5C72' }}>{activeConv.memberCount} membros</div>
                  )}
                </div>
                {activeChatType === 'GROUP' && (
                  <Link href={`/groups/${activeChat}`} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', borderRadius: '8px',
                    background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.2)',
                    textDecoration: 'none', color: '#FFB800', fontSize: '12px', fontWeight: 700,
                  }}>
                    <TrophySmIcon /> Ranking
                  </Link>
                )}
              </div>

              {/* Messages area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#5C5C72', fontSize: '13px' }}>Carregando...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#5C5C72', fontSize: '13px' }}>
                    Nenhuma mensagem ainda. Diga oi!
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isOwn = msg.senderId === currentUser?.id;
                    const showSenderName = !isOwn && activeChatType === 'GROUP' && (i === 0 || messages[i - 1].senderId !== msg.senderId);
                    const showAvatar = !isOwn && (i === 0 || messages[i - 1].senderId !== msg.senderId);
                    const time = new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={msg.id} style={{
                        display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        alignItems: 'flex-end', gap: '8px',
                        marginTop: showAvatar ? '12px' : '1px',
                      }}>
                        {!isOwn && (
                          <div style={{ width: '28px', flexShrink: 0 }}>
                            {showAvatar && (
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #FF6B35, #E05520)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: '11px',
                              }}>
                                {msg.sender.displayName[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                        <div style={{ maxWidth: '70%' }}>
                          {showSenderName && (
                            <div style={{ fontSize: '11px', color: '#FF6B35', fontWeight: 600, marginBottom: '2px', paddingLeft: '4px' }}>
                              {msg.sender.displayName}
                            </div>
                          )}
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: isOwn ? '#FF6B35' : '#141420',
                            color: isOwn ? '#0A0A0F' : '#F0F0F8',
                            fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word',
                            position: 'relative',
                            paddingBottom: '18px',
                          }}>
                            {renderContent(msg.content)}
                            <span style={{
                              position: 'absolute', bottom: '4px', right: '10px',
                              fontSize: '9px', color: isOwn ? 'rgba(10,10,15,0.5)' : '#5C5C72',
                              fontWeight: 500,
                            }}>
                              {time}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Mention suggestions */}
              {showMentions && filteredMentions.length > 0 && (
                <div style={{
                  borderTop: '1px solid rgba(148,148,172,0.08)',
                  background: '#141420', maxHeight: '200px', overflowY: 'auto',
                }}>
                  {filteredMentions.map((m, i) => (
                    <button key={m.id} onClick={() => insertMention(m)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 16px', background: i === mentionIndex ? 'rgba(255,107,53,0.08)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      borderBottom: '1px solid rgba(148,148,172,0.04)',
                    }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF6B35, #E05520)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: '12px', flexShrink: 0,
                      }}>
                        {m.displayName[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{m.displayName}</div>
                        <div style={{ fontSize: '11px', color: '#5C5C72' }}>@{m.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Input area */}
              <div style={{
                padding: '12px 16px', borderTop: '1px solid rgba(148,148,172,0.08)',
                display: 'flex', gap: '10px', alignItems: 'center',
              }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={e => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={activeChatType === 'GROUP' ? 'Mensagem... (use @ para mencionar)' : 'Mensagem...'}
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: '24px',
                    background: '#141420', border: '1px solid rgba(148,148,172,0.08)',
                    color: '#F0F0F8', fontSize: '14px', outline: 'none',
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                    background: newMessage.trim() ? '#FF6B35' : '#1A1A28',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: newMessage.trim() ? 'pointer' : 'default',
                    transition: 'background 200ms', flexShrink: 0,
                  }}
                >
                  <SendIcon />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== CREATE GROUP MODAL ===== */}
      {showCreateGroup && (
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

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowCreateGroup(false); setNewGroupName(''); setSelectedMembers([]); setSearchMember(''); }}
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
    </div>
  );
}
