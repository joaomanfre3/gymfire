'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch, getToken, getUser } from '@/lib/api';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

interface Props {
  postId: string;
  onClose: () => void;
  onCommentAdded: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function CommentsDrawer({ postId, onClose, onCommentAdded }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const user = getUser();

  useEffect(() => {
    loadComments();
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  async function loadComments() {
    try {
      const res = await apiFetch(`/api/social/posts/${postId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleSend() {
    if (!text.trim() || sending || !getToken()) return;
    setSending(true);
    try {
      const res = await apiFetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [newComment, ...prev]);
        setText('');
        onCommentAdded();
      }
    } catch { /* ignore */ }
    setSending(false);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: '480px',
        maxHeight: '70vh', background: '#141420',
        borderRadius: '20px 20px 0 0',
        border: '1px solid rgba(148,148,172,0.1)',
        borderBottom: 'none',
        display: 'flex', flexDirection: 'column',
        animation: 'slideUp 250ms ease',
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#5C5C72' }} />
        </div>

        {/* Header */}
        <div style={{
          padding: '0 16px 12px',
          borderBottom: '1px solid rgba(148,148,172,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F8' }}>Comentários</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#5C5C72',
            fontSize: '22px', cursor: 'pointer', padding: '0 4px', lineHeight: 1,
          }}>&times;</button>
        </div>

        {/* Comments list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#5C5C72', fontSize: '13px' }}>
              Carregando...
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#5C5C72' }}>
              <p style={{ fontSize: '13px' }}>Nenhum comentário ainda. Seja o primeiro!</p>
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #FF6B35, #E05520)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '12px', overflow: 'hidden',
                }}>
                  {c.user.avatarUrl
                    ? <img src={c.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : c.user.displayName[0].toUpperCase()
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>
                      {c.user.username}
                    </span>
                    <span style={{ fontSize: '11px', color: '#5C5C72' }}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#C8C8D8', lineHeight: 1.5, margin: '2px 0 0' }}>
                    {c.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        {getToken() && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(148,148,172,0.08)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #FF6B35, #E05520)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '12px',
            }}>
              {user ? (user.displayName || user.username || '?')[0].toUpperCase() : '?'}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Adicionar comentário..."
              maxLength={300}
              style={{
                flex: 1, background: '#1A1A28', border: '1px solid rgba(148,148,172,0.08)',
                borderRadius: '24px', padding: '10px 16px',
                color: '#F0F0F8', fontSize: '13px', outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              style={{
                background: 'none', border: 'none',
                color: text.trim() ? '#FF6B35' : '#5C5C72',
                fontWeight: 700, fontSize: '13px', cursor: text.trim() ? 'pointer' : 'default',
                padding: '8px',
              }}
            >
              {sending ? '...' : 'Enviar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
