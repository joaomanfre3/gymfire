'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

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

const mockCuts: Reel[] = [
  { id: 'r1', username: 'anabeatriz.fit', displayName: 'Ana Beatriz', caption: 'PR no Supino! 100kg x 5 reps', likes: 342, comments: 28, thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=700&fit=crop', duration: '0:32' },
  { id: 'r2', username: 'carlos.runner', displayName: 'Carlos Eduardo', caption: 'Corrida matinal no Ibirapuera', likes: 189, comments: 15, thumbnail: 'https://images.unsplash.com/photo-1461896836934-bd45ba448c52?w=400&h=700&fit=crop', duration: '0:45' },
  { id: 'r3', username: 'rafa.lima', displayName: 'Rafael Lima', caption: 'CrossFit WOD - Fran em 4:23', likes: 567, comments: 42, thumbnail: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&h=700&fit=crop', duration: '1:02' },
  { id: 'r4', username: 'marina.costa', displayName: 'Marina Costa', caption: 'Transformação 6 meses', likes: 1200, comments: 89, thumbnail: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=700&fit=crop', duration: '0:58' },
  { id: 'r5', username: 'pedro.iron', displayName: 'Pedro Santos', caption: 'Treino de perna completo', likes: 445, comments: 31, thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=700&fit=crop', duration: '0:40' },
  { id: 'r6', username: 'fe.silva', displayName: 'Fernanda Silva', caption: 'Primeira meia maratona!', likes: 890, comments: 67, thumbnail: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=700&fit=crop', duration: '1:15' },
];

// Icons
function HeartIcon() { return <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={2}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>; }
function CommentIcon() { return <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={2}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>; }
function ShareIcon() { return <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>; }
function PlayIcon() { return <svg width={48} height={48} viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)" stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>; }

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(n);
}

export default function CutsPage() {
  const [activeReel, setActiveReel] = useState<string | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 80px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F0F8', margin: '0 0 16px' }}>
          Cuts
        </h1>

        {/* Cuts grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px',
        }}>
          {mockCuts.map(reel => (
            <div
              key={reel.id}
              onClick={() => setActiveReel(activeReel === reel.id ? null : reel.id)}
              style={{
                position: 'relative', borderRadius: '16px', overflow: 'hidden',
                aspectRatio: '9/16', cursor: 'pointer',
                backgroundImage: `url(${reel.thumbnail})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
              }}
            >
              {/* Gradient overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.8))',
              }} />

              {/* Duration badge */}
              <div style={{
                position: 'absolute', top: '8px', right: '8px',
                background: 'rgba(0,0,0,0.6)', borderRadius: '4px',
                padding: '2px 6px', fontSize: '11px', fontWeight: 600, color: '#fff',
              }}>{reel.duration}</div>

              {/* Play icon */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)', opacity: 0.8,
              }}>
                <PlayIcon />
              </div>

              {/* Bottom info */}
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
      </main>
    </div>
  );
}
