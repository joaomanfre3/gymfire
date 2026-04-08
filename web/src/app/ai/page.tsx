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

interface ParsedWorkout {
  nome: string;
  exercicios: Array<{ nome: string; series: number; reps: number; descanso: number }>;
}

interface RoutineOption {
  id: string;
  name: string;
  sets: Array<{ id: string; exercise: { name: string } }>;
}

// Parse workout JSON from AI response
function parseWorkoutFromMessage(content: string): ParsedWorkout | null {
  const match = content.match(/---TREINO_JSON---\s*([\s\S]*?)\s*---FIM_JSON---/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    if (data.nome && Array.isArray(data.exercicios) && data.exercicios.length > 0) {
      return data as ParsedWorkout;
    }
  } catch { /* invalid JSON */ }
  return null;
}

// Remove JSON block from display text
function cleanMessageContent(content: string): string {
  return content.replace(/---TREINO_JSON---[\s\S]*?---FIM_JSON---/, '').trim();
}

// Simple markdown: **bold**, *italic*, - lists, \n
function renderMarkdown(text: string) {
  const cleaned = cleanMessageContent(text);
  const lines = cleaned.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
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

function SaveIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
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

  // Save workout modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savingWorkout, setSavingWorkout] = useState<ParsedWorkout | null>(null);
  const [routines, setRoutines] = useState<RoutineOption[]>([]);
  const [saveMode, setSaveMode] = useState<'new' | 'existing'>('new');
  const [selectedRoutineId, setSelectedRoutineId] = useState('');
  const [newRoutineName, setNewRoutineName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

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

  async function loadRoutines() {
    try {
      const res = await apiFetch('/api/routines');
      if (res.ok) setRoutines(await res.json());
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
            } catch { /* skip */ }
          }
        }
      }

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

  function openSaveModal(workout: ParsedWorkout) {
    setSavingWorkout(workout);
    setNewRoutineName(workout.nome);
    setSaveMode('new');
    setSelectedRoutineId('');
    setSaveSuccess(null);
    setShowSaveModal(true);
    loadRoutines();
  }

  async function handleSaveWorkout() {
    if (!savingWorkout) return;
    setSaving(true);
    setSaveSuccess(null);

    try {
      const payload: Record<string, unknown> = {
        nome: saveMode === 'new' ? (newRoutineName || savingWorkout.nome) : savingWorkout.nome,
        exercicios: savingWorkout.exercicios,
      };

      if (saveMode === 'existing' && selectedRoutineId) {
        payload.routineId = selectedRoutineId;
      }

      const res = await apiFetch('/api/ai/save-workout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSaveSuccess(saveMode === 'new'
          ? `Rotina "${data.name}" criada com sucesso!`
          : `Exercícios adicionados à rotina!`
        );
        setTimeout(() => {
          setShowSaveModal(false);
          setSaveSuccess(null);
        }, 2000);
      } else {
        const err = await res.json();
        setSaveSuccess(`Erro: ${err.error}`);
      }
    } catch {
      setSaveSuccess('Erro ao salvar. Tente novamente.');
    }

    setSaving(false);
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

          {usage && (
            <div style={{
              padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
              background: usage.remaining <= 2 ? 'rgba(255,77,106,0.1)' : 'rgba(255,107,53,0.1)',
              color: usage.remaining <= 2 ? '#FF4D6A' : '#FF6B35',
            }}>
              {usage.remaining}/{usage.limit} hoje
            </div>
          )}

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
            const parsedWorkout = !isUser && !isBlocked ? parseWorkoutFromMessage(msg.content) : null;

            return (
              <div key={msg.id}>
                <div style={{
                  display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '85%', padding: '12px 16px',
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

                {/* Save workout button */}
                {parsedWorkout && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '8px' }}>
                    <button
                      onClick={() => openSaveModal(parsedWorkout)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 18px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
                        border: 'none', cursor: 'pointer',
                        color: '#0A0A0F', fontSize: '13px', fontWeight: 700,
                        boxShadow: '0 2px 12px rgba(255,107,53,0.3)',
                        transition: 'all 200ms',
                      }}
                    >
                      <SaveIcon />
                      Adicionar à Rotina
                    </button>
                  </div>
                )}
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

      {/* Save Workout Modal */}
      {showSaveModal && savingWorkout && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px',
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowSaveModal(false); }}>
          <div style={{
            background: '#141420', borderRadius: '20px',
            border: '1px solid rgba(148,148,172,0.12)',
            width: '100%', maxWidth: '480px', maxHeight: '80vh',
            overflowY: 'auto', padding: '24px',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#F0F0F8' }}>Adicionar à Rotina</div>
                <div style={{ fontSize: '12px', color: '#5C5C72', marginTop: '2px' }}>
                  {savingWorkout.exercicios.length} exercícios
                </div>
              </div>
              <button onClick={() => setShowSaveModal(false)} style={{
                background: 'none', border: 'none', color: '#5C5C72', fontSize: '24px',
                cursor: 'pointer', padding: '4px',
              }}>&times;</button>
            </div>

            {/* Workout preview */}
            <div style={{
              background: '#0A0A0F', borderRadius: '12px', padding: '14px',
              marginBottom: '20px', border: '1px solid rgba(148,148,172,0.06)',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FF6B35', marginBottom: '10px' }}>
                {savingWorkout.nome}
              </div>
              {savingWorkout.exercicios.map((ex, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '6px 0',
                  borderBottom: i < savingWorkout.exercicios.length - 1 ? '1px solid rgba(148,148,172,0.06)' : 'none',
                }}>
                  <span style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: 'rgba(255,107,53,0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700, color: '#FF6B35', flexShrink: 0,
                  }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{ex.nome}</div>
                    <div style={{ fontSize: '11px', color: '#5C5C72' }}>
                      {ex.series}x{ex.reps} | {ex.descanso}s descanso
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Save options */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => setSaveMode('new')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  background: saveMode === 'new' ? 'rgba(255,107,53,0.12)' : '#0A0A0F',
                  border: saveMode === 'new' ? '1px solid rgba(255,107,53,0.3)' : '1px solid rgba(148,148,172,0.08)',
                  color: saveMode === 'new' ? '#FF6B35' : '#9494AC',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 200ms',
                }}
              >
                Nova Rotina
              </button>
              <button
                onClick={() => setSaveMode('existing')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  background: saveMode === 'existing' ? 'rgba(255,107,53,0.12)' : '#0A0A0F',
                  border: saveMode === 'existing' ? '1px solid rgba(255,107,53,0.3)' : '1px solid rgba(148,148,172,0.08)',
                  color: saveMode === 'existing' ? '#FF6B35' : '#9494AC',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 200ms',
                }}
              >
                Rotina Existente
              </button>
            </div>

            {/* New routine name */}
            {saveMode === 'new' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5C5C72', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Nome da Rotina
                </label>
                <input
                  type="text"
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  placeholder="Ex: Treino A - Peito e Tríceps"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    background: '#0A0A0F', border: '1px solid rgba(148,148,172,0.1)',
                    color: '#F0F0F8', fontSize: '14px', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* Existing routine selector */}
            {saveMode === 'existing' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5C5C72', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Selecione a Rotina
                </label>
                {routines.length === 0 ? (
                  <div style={{
                    padding: '16px', textAlign: 'center', color: '#5C5C72', fontSize: '13px',
                    background: '#0A0A0F', borderRadius: '10px', border: '1px solid rgba(148,148,172,0.06)',
                  }}>
                    Nenhuma rotina encontrada. Crie uma nova!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {routines.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRoutineId(r.id)}
                        style={{
                          padding: '12px 14px', borderRadius: '10px', textAlign: 'left',
                          background: selectedRoutineId === r.id ? 'rgba(255,107,53,0.08)' : '#0A0A0F',
                          border: selectedRoutineId === r.id ? '1px solid rgba(255,107,53,0.25)' : '1px solid rgba(148,148,172,0.06)',
                          cursor: 'pointer', transition: 'all 200ms',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{r.name}</div>
                        <div style={{ fontSize: '11px', color: '#5C5C72', marginTop: '2px' }}>
                          {r.sets?.length || 0} exercícios
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedRoutineId && (
                  <div style={{
                    marginTop: '10px', padding: '10px 12px', borderRadius: '8px',
                    background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.15)',
                    fontSize: '12px', color: '#FFB800', lineHeight: 1.5,
                  }}>
                    Os exercícios serão adicionados ao final da rotina selecionada.
                  </div>
                )}
              </div>
            )}

            {/* Success/Error message */}
            {saveSuccess && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px', marginBottom: '12px',
                background: saveSuccess.startsWith('Erro') ? 'rgba(255,77,106,0.08)' : 'rgba(76,217,100,0.08)',
                border: saveSuccess.startsWith('Erro') ? '1px solid rgba(255,77,106,0.2)' : '1px solid rgba(76,217,100,0.2)',
                color: saveSuccess.startsWith('Erro') ? '#FF4D6A' : '#4CD964',
                fontSize: '13px', fontWeight: 600, textAlign: 'center',
              }}>
                {saveSuccess}
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSaveWorkout}
              disabled={saving || (saveMode === 'existing' && !selectedRoutineId) || (saveMode === 'new' && !newRoutineName.trim())}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: saving ? '#1A1A28' : 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
                color: saving ? '#5C5C72' : '#0A0A0F',
                fontSize: '14px', fontWeight: 700, cursor: saving ? 'default' : 'pointer',
                opacity: (saving || (saveMode === 'existing' && !selectedRoutineId) || (saveMode === 'new' && !newRoutineName.trim())) ? 0.5 : 1,
                transition: 'all 200ms',
              }}
            >
              {saving ? 'Salvando...' : saveMode === 'new' ? 'Criar Rotina' : 'Adicionar à Rotina'}
            </button>

            {/* Link to routines */}
            {saveSuccess && !saveSuccess.startsWith('Erro') && (
              <button
                onClick={() => { setShowSaveModal(false); router.push('/routines'); }}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px', marginTop: '8px',
                  background: 'none', border: '1px solid rgba(148,148,172,0.12)',
                  color: '#9494AC', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Ver Minhas Rotinas
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
