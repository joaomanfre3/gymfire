'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken, getUser } from '@/lib/api';
import { usePusherChannel } from '@/hooks/usePusher';
import { timeAgo } from '@/lib/format';

// Types
interface Conversation {
  id: string;
  name: string;
  avatar: string | null;
  username: string | null;
  userId: string | null;
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

// Icons
function ArrowLeftIcon() { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={2} strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>; }
function SendIcon() { return <svg width={20} height={20} viewBox="0 0 24 24" fill="#0A0A0F" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>; }
function PenIcon() { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={1.5}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>; }
function SearchIcon() { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function ChatBubbleIcon() { return <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={1}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>; }

export default function MessagesPage() {
  const router = useRouter();
  const currentUser = getUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  async function openChat(convId: string) {
    setActiveChat(convId);
    setLoadingMessages(true);
    try {
      const res = await apiFetch(`/api/messages/${convId}`);
      if (res.ok) {
        setMessages(await res.json());
        // Mark as read locally
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread: false } : c));
      }
    } catch { /* ignore */ }
    setLoadingMessages(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    inputRef.current?.focus();
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeChat || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    // Optimistic update
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
        // Update conversation list
        setConversations(prev => prev.map(c =>
          c.id === activeChat ? { ...c, lastMessage: { content, createdAt: realMsg.createdAt, isOwn: true } } : c
        ));
      }
    } catch { /* ignore */ }
    setSending(false);
    inputRef.current?.focus();
  }

  // Real-time: listen for new messages in active chat
  const handleNewMessage = useCallback((data: unknown) => {
    const msg = data as ChatMessage & { conversationId: string };
    if (msg.senderId === currentUser?.id) return; // skip own
    if (msg.conversationId === activeChat) {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
    // Update conversation list
    setConversations(prev => prev.map(c =>
      c.id === msg.conversationId
        ? { ...c, lastMessage: { content: msg.content || '', createdAt: msg.createdAt, isOwn: false }, unread: msg.conversationId !== activeChat }
        : c
    ));
  }, [activeChat, currentUser?.id]);

  usePusherChannel(activeChat ? `chat-${activeChat}` : '', 'new-message', handleNewMessage, !!activeChat);

  const activeConv = conversations.find(c => c.id === activeChat);
  const filteredConvs = search
    ? conversations.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  // Mobile: show chat or list
  const showChatView = !!activeChat;

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
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <PenIcon />
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: '#141420', borderRadius: '10px', padding: '8px 12px',
              border: '1px solid rgba(148,148,172,0.08)',
            }}>
              <SearchIcon />
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
                  onClick={() => openChat(conv.id)}
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
                    width: '50px', height: '50px', borderRadius: '50%', flexShrink: 0,
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
                      <span style={{
                        fontSize: '14px', fontWeight: conv.unread ? 700 : 600,
                        color: conv.unread ? '#F0F0F8' : '#9494AC',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{conv.name}</span>
                      {conv.lastMessage && (
                        <span style={{ fontSize: '11px', color: conv.unread ? '#FF6B35' : '#5C5C72', flexShrink: 0, marginLeft: '8px' }}>
                          {timeAgo(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <span style={{
                          fontSize: '13px', color: conv.unread ? '#F0F0F8' : '#5C5C72',
                          fontWeight: conv.unread ? 600 : 400,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {conv.lastMessage.isOwn && 'Você: '}{conv.lastMessage.content}
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
            /* Empty state */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <ChatBubbleIcon />
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#F0F0F8' }}>Suas mensagens</p>
              <p style={{ fontSize: '13px', color: '#5C5C72', textAlign: 'center', maxWidth: '280px' }}>
                Selecione uma conversa ou inicie uma nova para começar a trocar mensagens.
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderBottom: '1px solid rgba(148,148,172,0.08)',
              }}>
                <button onClick={() => setActiveChat(null)} className="chat-back-btn" style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'none',
                }}>
                  <ArrowLeftIcon />
                </button>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
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
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F8' }}>{activeConv?.name}</div>
                  {activeConv?.username && (
                    <div style={{ fontSize: '12px', color: '#5C5C72' }}>@{activeConv.username}</div>
                  )}
                </div>
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
                    const showAvatar = !isOwn && (i === 0 || messages[i - 1].senderId !== msg.senderId);
                    const showTime = i === messages.length - 1 || messages[i + 1].senderId !== msg.senderId;

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
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: isOwn ? '#FF6B35' : '#141420',
                            color: isOwn ? '#0A0A0F' : '#F0F0F8',
                            fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word',
                          }}>
                            {msg.content}
                          </div>
                          {showTime && (
                            <div style={{
                              fontSize: '10px', color: '#5C5C72', marginTop: '4px',
                              textAlign: isOwn ? 'right' : 'left', paddingInline: '4px',
                            }}>
                              {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div style={{
                padding: '12px 16px', borderTop: '1px solid rgba(148,148,172,0.08)',
                display: 'flex', gap: '10px', alignItems: 'center',
              }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Mensagem..."
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
    </div>
  );
}
