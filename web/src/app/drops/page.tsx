'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken } from '@/lib/api';
import DropViewer from '@/components/feed/DropViewer';
import DropCreator from '@/components/feed/DropCreator';

interface DropItem {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  duration: number;
  createdAt: string;
  seen: boolean;
}

interface DropUser {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  drops: DropItem[];
  allSeen: boolean;
}

function FlameIcon() { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth={1.5}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.4-2.15 1-3 .22.65.84 1.3 1.5 1.5z" /></svg>; }
function PlusIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }

export default function DropsPage() {
  const router = useRouter();
  const [dropUsers, setDropUsers] = useState<DropUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingUser, setViewingUser] = useState<DropUser | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    loadDrops();
  }, [router]);

  async function loadDrops() {
    try {
      const res = await apiFetch('/api/drops');
      if (res.ok) setDropUsers(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  function handleViewed(dropId: string) {
    setDropUsers(prev => prev.map(u => ({
      ...u,
      drops: u.drops.map(d => d.id === dropId ? { ...d, seen: true } : d),
      allSeen: u.drops.every(d => d.id === dropId ? true : d.seen),
    })));
    apiFetch(`/api/drops/${dropId}/view`, { method: 'POST' }).catch(() => {});
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FlameIcon />
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F0F8', margin: 0 }}>Drops</h1>
          </div>
          <button onClick={() => setShowCreator(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', background: '#FF6B35', color: '#0A0A0F',
            padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px',
            border: 'none', cursor: 'pointer',
          }}>
            <PlusIcon /> Criar Drop
          </button>
        </div>

        <p style={{ color: '#9494AC', fontSize: '13px', marginBottom: '20px' }}>
          Drops desaparecem em 24h. Compartilhe momentos do seu treino!
        </p>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="shimmer" style={{ aspectRatio: '9/16', borderRadius: '12px', background: '#141420' }} />
            ))}
          </div>
        ) : dropUsers.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 20px', background: '#141420',
            borderRadius: '16px', border: '1px solid rgba(148,148,172,0.08)',
          }}>
            <FlameIcon />
            <p style={{ color: '#9494AC', margin: '12px 0 4px', fontSize: '15px', fontWeight: 600 }}>Nenhum drop ativo</p>
            <p style={{ color: '#5C5C72', margin: '0 0 16px', fontSize: '13px' }}>Crie um drop para compartilhar com seus amigos!</p>
            <button onClick={() => setShowCreator(true)} style={{
              background: '#FF6B35', color: '#0A0A0F', padding: '12px 24px', borderRadius: '10px',
              fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer',
            }}>Criar Drop</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            {dropUsers.map(u => (
              <button key={u.userId} onClick={() => setViewingUser(u)} style={{
                position: 'relative', aspectRatio: '9/16', borderRadius: '12px',
                overflow: 'hidden', background: '#141420', border: 'none',
                cursor: 'pointer', padding: 0,
              }}>
                {u.drops[0]?.mediaType === 'VIDEO' ? (
                  <video src={u.drops[0].mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                ) : (
                  <img src={u.drops[0]?.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {/* Glow border for unseen */}
                {!u.allSeen && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '12px',
                    border: '2px solid #FF6B35', boxShadow: '0 0 12px rgba(255,107,53,0.5)',
                    pointerEvents: 'none',
                  }} />
                )}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  padding: '24px 8px 8px',
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    border: u.allSeen ? '1.5px solid #5C5C72' : '1.5px solid #FF6B35',
                    overflow: 'hidden', marginBottom: '4px',
                    background: u.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '11px', fontWeight: 700,
                  }}>
                    {u.avatarUrl
                      ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : u.displayName[0].toUpperCase()
                    }
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 600,
                    color: u.allSeen ? '#9494AC' : '#F0F0F8',
                  }}>{u.displayName.split(' ')[0]}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {viewingUser && (
        <DropViewer user={viewingUser} onClose={() => { setViewingUser(null); loadDrops(); }} onViewed={handleViewed} />
      )}
      {showCreator && (
        <DropCreator onClose={() => setShowCreator(false)} onCreated={() => { setShowCreator(false); loadDrops(); }} />
      )}
    </div>
  );
}
