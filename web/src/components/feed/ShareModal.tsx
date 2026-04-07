'use client';

import { useState, useEffect } from 'react';
import { apiFetch, getToken } from '@/lib/api';

interface Conversation {
  id: string;
  name: string;
  avatar: string | null;
  username: string | null;
  userId: string | null;
}

interface Props {
  postId: string;
  postText: string;
  onClose: () => void;
}

export default function ShareModal({ postId, postText, onClose }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const res = await apiFetch('/api/conversations');
      if (res.ok) setConversations(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function sendToConversation(convId: string) {
    if (sentTo.has(convId)) return;
    try {
      const postUrl = `${window.location.origin}/post/${postId}`;
      const res = await apiFetch(`/api/messages/${convId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postText ? `"${postText.slice(0, 80)}${postText.length > 80 ? '...' : ''}" — ${postUrl}` : postUrl,
          type: 'POST_SHARE',
        }),
      });
      if (res.ok) setSentTo(prev => new Set(prev).add(convId));
    } catch { /* ignore */ }
  }

  async function copyLink() {
    const url = `${window.location.origin}/post/${postId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: '400px',
        background: '#141420', borderRadius: '20px',
        border: '1px solid rgba(148,148,172,0.1)',
        overflow: 'hidden', maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(148,148,172,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8' }}>Compartilhar</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#5C5C72',
            fontSize: '22px', cursor: 'pointer', lineHeight: 1,
          }}>&times;</button>
        </div>

        {/* Copy link */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(148,148,172,0.08)' }}>
          <button onClick={copyLink} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px', borderRadius: '12px',
            background: '#1A1A28', border: '1px solid rgba(148,148,172,0.08)',
            cursor: 'pointer', transition: 'all 200ms',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'rgba(255,107,53,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth={2} strokeLinecap="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8' }}>
              {copied ? 'Link copiado!' : 'Copiar link'}
            </span>
          </button>
        </div>

        {/* Send to friends */}
        {getToken() && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{
              padding: '12px 20px 6px', fontSize: '12px', fontWeight: 700,
              color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Enviar para
            </div>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#5C5C72', fontSize: '13px' }}>
                Carregando...
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#5C5C72', fontSize: '13px' }}>
                Nenhuma conversa ainda.
              </div>
            ) : (
              conversations.map(c => {
                const isSent = sentTo.has(c.id);
                return (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 20px',
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #FF6B35, #E05520)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: '14px', overflow: 'hidden',
                    }}>
                      {c.avatar
                        ? <img src={c.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (c.name || '?')[0].toUpperCase()
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </div>
                      {c.username && (
                        <div style={{ fontSize: '12px', color: '#5C5C72' }}>@{c.username}</div>
                      )}
                    </div>
                    <button
                      onClick={() => sendToConversation(c.id)}
                      disabled={isSent}
                      style={{
                        padding: '7px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                        border: 'none', cursor: isSent ? 'default' : 'pointer',
                        background: isSent ? '#1A1A28' : '#FF6B35',
                        color: isSent ? '#5C5C72' : '#0A0A0F',
                        transition: 'all 200ms',
                      }}
                    >
                      {isSent ? 'Enviado' : 'Enviar'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
