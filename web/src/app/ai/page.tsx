'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken, getUser } from '@/lib/api';

interface AIMsg {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: string | null;
  blocked?: boolean;
  provider?: string | null;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
  _count?: { messages: number };
}

interface UsageInfo {
  used: number;
  limit: number;
  remaining: number;
  plan: string;
}

// Simple markdown: **bold**, *italic*, - lists, \n
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    // List items
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const content = trimmed.slice(2);
      return <div key={i} style={{ paddingLeft: '12px', display: 'flex', gap: '6px' }}><span>•</span><span>{formatInline(content)}</span></div>;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+\.)\s(.*)$/);
      if (match) return <div key={i} style={{ paddingLeft: '12px', display: 'flex', gap: '6px' }}><span>{match[1]}</span><span>{formatInline(match[2])}</span></div>;
    }
    if (trimmed === '') return <br key={i} />;
    return <div key={i}>{formatInline(trimmed)}</div>;
  });
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });
}

function SparkleIcon({ size = 22, color = '#FF6B35' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" /></svg>;
}

export default function AIPage() {
  const router = useRouter();
  const currentUser = getUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMsg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConvList, setShowConvList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    loadConversations();
    loadUsage();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  async function loadConversations() {
    try {
      const res = await apiFetch('/api/ai/conversations');
      if (res.ok) setConversations(await res.json());
    } catch { /* ignore */ }
  }

  async function loadUsage() {
    try {
      const res = await apiFetch('/api/ai/usage');
      if (res.ok) setUsage(await res.json());
    } catch { /* ignore */ }
  }

  async function openConversation(convId: string) {
    setActiveConvId(convId);
    setShowConvList(false);
    setError(null);
    try {
      const res = await apiFetch(`/api/ai/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch { /* ignore */ }
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function startNewConversation() {
    setError(null);
    try {
      const res = await apiFetch('/api/ai/conversations', { method: 'POST' });
      if (res.ok) {
        const conv = await res.json();
        setActiveConvId(conv.id);
        setMessages([]);
        setShowConvList(false);
        await loadConversations();
        inputRef.current?.focus();
      }
    } catch { /* ignore */ }
  }

  async function sendMessage() {
    if (!input.trim() || streaming) return;
    const content = input.trim();
    setInput('');
    setError(null);

    // Create conversation if none active
    let convId = activeConvId;
    if (!convId) {
      try {
        const res = await apiFetch('/api/ai/conversations', { method: 'POST' });
        if (res.ok) {
          const conv = await res.json();
          convId = conv.id;
          setActiveConvId(conv.id);
        }
      } catch { return; }
    }
    if (!convId) return;

    // Add user message locally
    const userMsg: AIMsg = { id: `temp-${Date.now()}`, role: 'user', content, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);
    setStreamingContent('');

    try {
      const token = getToken();
      const response = await fetch(`/api/ai/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const err = await response.json();
        if (err.type === 'blocked') {
          setMessages(prev => [...prev, {
            id: `blocked-${Date.now()}`, role: 'assistant', content: err.error,
            blocked: true, intent: err.intent, createdAt: new Date().toISOString(),
          }]);
        } else {
          setError(err.error || 'Erro ao enviar mensagem');
        }
        setStreaming(false);
        loadUsage();
        return;
      }

      // Read SSE stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulated += data.content;
                setStreamingContent(accumulated);
              }
              if (data.done) {
                // Streaming complete
              }
            } catch { /* skip */ }
          }
        }
      }

      // Add assistant message
      if (accumulated) {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`, role: 'assistant', content: accumulated, createdAt: new Date().toISOString(),
        }]);
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    }

    setStreaming(false);
    setStreamingContent('');
    loadUsage();
    loadConversations();
  }

  async function deleteConversation(convId: string) {
    await apiFetch(`/api/ai/conversations/${convId}`, { method: 'DELETE' });
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
    }
    loadConversations();
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }, [input, streaming, activeConvId]);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '700px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
          borderBottom: '1px solid rgba(148,148,172,0.08)',
        }}>
          <SparkleIcon size={24} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8' }}>GymFire AI</div>
            <div style={{ fontSize: '11px', color: '#5C5C72' }}>Seu personal trainer virtual</div>
          </div>

          {/* Usage badge */}
          {usage && (
            <div style={{
              padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
              background: usage.remaining <= 2 ? 'rgba(255,77,106,0.1)' : 'rgba(255,107,53,0.1)',
              color: usage.remaining <= 2 ? '#FF4D6A' : '#FF6B35',
            }}>
              {usage.remaining}/{usage.limit} hoje
            </div>
          )}

          {/* Conv list toggle */}
          <button onClick={() => setShowConvList(!showConvList)} style={{
            background: 'none', border: '1px solid rgba(148,148,172,0.12)', borderRadius: '8px',
            padding: '6px 10px', cursor: 'pointer', color: '#9494AC', fontSize: '12px', fontWeight: 600,
          }}>
            {showConvList ? 'Fechar' : 'Conversas'}
          </button>

          <button onClick={startNewConversation} style={{
            background: '#FF6B35', border: 'none', borderRadius: '8px',
            padding: '6px 12px', cursor: 'pointer', color: '#0A0A0F', fontSize: '12px', fontWeight: 700,
          }}>
            + Nova
          </button>
        </div>

        {/* Conversation list dropdown */}
        {showConvList && (
          <div style={{
            borderBottom: '1px solid rgba(148,148,172,0.08)', maxHeight: '240px', overflowY: 'auto',
            background: '#141420',
          }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#5C5C72', fontSize: '13px' }}>
                Nenhuma conversa ainda
              </div>
            ) : conversations.map(c => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px',
                background: c.id === activeConvId ? 'rgba(255,107,53,0.06)' : 'transparent',
                borderBottom: '1px solid rgba(148,148,172,0.04)', cursor: 'pointer',
              }} onClick={() => openConversation(c.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.title || 'Nova conversa'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#5C5C72' }}>
                    {c._count?.messages || 0} msgs
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#5C5C72', fontSize: '16px', padding: '4px',
                }}>&times;</button>
              </div>
            ))}
          </div>
        )}

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.length === 0 && !streaming && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px' }}>
              <SparkleIcon size={48} color="#1A1A28" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F8', marginBottom: '8px' }}>Olá! Sou o GymFire AI</div>
                <div style={{ fontSize: '13px', color: '#5C5C72', lineHeight: 1.6, maxWidth: '300px' }}>
                  Tire dúvidas sobre exercícios, forma de execução, e muito mais. {usage?.plan !== 'FREE' && 'Posso criar treinos personalizados para você!'}
                </div>
              </div>
              {/* Quick actions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                {['Como fazer supino corretamente?', 'Qual a diferença entre hipertrofia e força?', 'Dicas para iniciantes na academia'].map(q => (
                  <button key={q} onClick={() => { setInput(q); }} style={{
                    padding: '8px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                    background: '#141420', border: '1px solid rgba(148,148,172,0.08)',
                    color: '#9494AC', cursor: 'pointer', transition: 'all 200ms',
                  }}>{q}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => {
            const isUser = msg.role === 'user';
            const isBlocked = msg.blocked;

            return (
              <div key={msg.id} style={{
                display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%', padding: isBlocked ? '12px 16px' : '12px 16px',
                  borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isBlocked ? 'rgba(255,184,0,0.08)' : isUser ? '#FF6B35' : '#141420',
                  border: isBlocked ? '1px solid rgba(255,184,0,0.2)' : 'none',
                  color: isUser ? '#0A0A0F' : '#F0F0F8',
                  fontSize: '14px', lineHeight: 1.6,
                }}>
                  {isBlocked && <div style={{ marginBottom: '4px' }}>🔒</div>}
                  {isUser ? msg.content : renderMarkdown(msg.content)}
                  <div style={{
                    fontSize: '9px', marginTop: '6px', textAlign: 'right',
                    color: isUser ? 'rgba(10,10,15,0.4)' : '#5C5C72',
                  }}>
                    {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {msg.provider && !isUser && <span> · {msg.provider}</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Streaming response */}
          {streaming && streamingContent && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                maxWidth: '85%', padding: '12px 16px',
                borderRadius: '18px 18px 18px 4px',
                background: '#141420', color: '#F0F0F8',
                fontSize: '14px', lineHeight: 1.6,
              }}>
                {renderMarkdown(streamingContent)}
                <span className="typing-cursor" style={{ display: 'inline-block', width: '2px', height: '16px', background: '#FF6B35', marginLeft: '2px', animation: 'blink 1s infinite' }} />
              </div>
            </div>
          )}

          {/* Streaming indicator */}
          {streaming && !streamingContent && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '12px 20px', borderRadius: '18px', background: '#141420',
                display: 'flex', gap: '6px', alignItems: 'center',
              }}>
                <div className="dot-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B35', animation: 'pulse 1.2s ease infinite' }} />
                <div className="dot-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B35', animation: 'pulse 1.2s ease infinite 0.2s' }} />
                <div className="dot-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B35', animation: 'pulse 1.2s ease infinite 0.4s' }} />
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div style={{
              textAlign: 'center', padding: '10px 16px', borderRadius: '12px',
              background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)',
              color: '#FF4D6A', fontSize: '13px',
            }}>
              {error}
            </div>
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
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={usage?.remaining === 0 ? 'Limite diário atingido' : 'Pergunte algo sobre fitness...'}
            disabled={streaming || usage?.remaining === 0}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: '24px',
              background: '#141420', border: '1px solid rgba(148,148,172,0.08)',
              color: '#F0F0F8', fontSize: '14px', outline: 'none',
              opacity: usage?.remaining === 0 ? 0.5 : 1,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming || usage?.remaining === 0}
            style={{
              width: '42px', height: '42px', borderRadius: '50%', border: 'none',
              background: input.trim() && !streaming ? '#FF6B35' : '#1A1A28',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() && !streaming ? 'pointer' : 'default', flexShrink: 0,
            }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill={input.trim() ? '#0A0A0F' : '#5C5C72'} stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
