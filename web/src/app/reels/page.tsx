'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';

interface Reel {
  id: string;
  username: string;
  displayName: string;
  caption: string;
  likes: number;
  comments: number;
  thumbnail: string;
  duration: string;
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(n);
}

function PlayIcon() { return <svg width={48} height={48} viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)" stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>; }

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReels();
  }, []);

  async function loadReels() {
    try {
      const res = await apiFetch('/api/feed?type=CUT');
      if (res.ok) {
        const data = await res.json();
        const mapped: Reel[] = (data || []).map((p: Record<string, unknown>) => {
          const user = p.user as { username: string; displayName: string } | undefined;
          const counts = p._count as { likes: number; comments: number } | undefined;
          const mediaUrls = (p.mediaUrls as string[]) || [];
          return {
            id: p.id as string,
            username: user?.username || 'user',
            displayName: user?.displayName || 'Usuário',
            caption: (p.caption as string) || (p.content as string) || '',
            likes: counts?.likes || 0,
            comments: counts?.comments || 0,
            thumbnail: mediaUrls[0] || '',
            duration: '',
          };
        });
        setReels(mapped);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 80px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F0F8', margin: '0 0 16px' }}>
          Reels
        </h1>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shimmer" style={{
                aspectRatio: '9/16', borderRadius: '16px', background: '#141420',
              }} />
            ))}
          </div>
        ) : reels.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px', color: '#5C5C72',
          }}>
            <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={1.5} style={{ marginBottom: '12px' }}>
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
            <p style={{ fontSize: '14px' }}>Nenhum reel ainda.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px',
          }}>
            {reels.map(reel => (
              <div
                key={reel.id}
                style={{
                  position: 'relative', borderRadius: '16px', overflow: 'hidden',
                  aspectRatio: '9/16', cursor: 'pointer',
                  background: reel.thumbnail ? `url(${reel.thumbnail}) center/cover` : '#141420',
                }}
              >
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.8))',
                }} />

                {reel.duration && (
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'rgba(0,0,0,0.6)', borderRadius: '4px',
                    padding: '2px 6px', fontSize: '11px', fontWeight: 600, color: '#fff',
                  }}>{reel.duration}</div>
                )}

                {!reel.thumbnail && (
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', opacity: 0.8,
                  }}>
                    <PlayIcon />
                  </div>
                )}

                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                    @{reel.username}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.3, marginBottom: '8px' }}>
                    {reel.caption}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#fff', fontWeight: 600 }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                      {formatCount(reel.likes)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#fff', fontWeight: 600 }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                      {formatCount(reel.comments)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
