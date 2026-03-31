'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { getAvatarColor } from '@/lib/avatar';

interface RankEntry {
  rank: number;
  id?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  totalPoints?: number;
  weeklyPoints?: number;
}

const medals = ['', '\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];

export default function RankingPage() {
  const [tab, setTab] = useState<'weekly' | 'alltime'>('weekly');
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, [tab]);

  async function loadRanking() {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/ranking?type=${tab}`);
      if (res.ok) {
        setRanking(await res.json());
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  const getPoints = (entry: RankEntry) => tab === 'weekly' ? (entry.weeklyPoints ?? 0) : (entry.totalPoints ?? 0);


  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Ranking</h1>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--surface)',
          borderRadius: '0.5rem',
          padding: '0.25rem',
          marginBottom: '1.25rem',
          border: '1px solid var(--border)',
        }}>
          {(['weekly', 'alltime'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '0.35rem',
                border: 'none',
                background: tab === t ? 'var(--primary)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--text-secondary)',
                fontWeight: tab === t ? 600 : 400,
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
            >
              {t === 'weekly' ? 'Semanal' : 'Geral'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando ranking...</div>
        ) : ranking.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'var(--surface)',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}>
            Sem dados de ranking ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Top 3 podium */}
            {ranking.length >= 3 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
                alignItems: 'flex-end',
              }}>
                {[1, 0, 2].map(idx => {
                  const entry = ranking[idx];
                  if (!entry) return null;
                  const isFirst = idx === 0;
                  return (
                    <div key={entry.rank} style={{
                      textAlign: 'center',
                      background: 'var(--surface)',
                      border: `1px solid ${isFirst ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: '1rem',
                      padding: isFirst ? '1.5rem 1rem' : '1rem 0.75rem',
                      flex: 1,
                      maxWidth: '160px',
                    }}>
                      <div style={{ fontSize: isFirst ? '2rem' : '1.5rem', marginBottom: '0.35rem' }}>
                        {medals[entry.rank]}
                      </div>
                      <div style={{
                        width: isFirst ? '56px' : '44px',
                        height: isFirst ? '56px' : '44px',
                        borderRadius: '50%',
                        background: getAvatarColor(entry.displayName || '?'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: isFirst ? '1.2rem' : '0.95rem',
                        margin: '0 auto 0.35rem',
                      }}>
                        {(entry.displayName || '?')[0].toUpperCase()}
                      </div>
                      <Link href={`/profile/${entry.username}`} style={{
                        textDecoration: 'none',
                        color: 'var(--text)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        display: 'block',
                      }}>
                        {entry.displayName}
                      </Link>
                      <p style={{
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontSize: isFirst ? '1.1rem' : '0.9rem',
                        margin: '0.25rem 0 0',
                      }}>
                        {getPoints(entry).toLocaleString()} pts
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rest of ranking */}
            {ranking.slice(3).map(entry => (
              <div key={entry.rank} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
              }}>
                <span style={{
                  width: '32px',
                  textAlign: 'center',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                }}>
                  #{entry.rank}
                </span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: getAvatarColor(entry.displayName || '?'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  flexShrink: 0,
                }}>
                  {(entry.displayName || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/profile/${entry.username}`} style={{
                    textDecoration: 'none',
                    color: 'var(--text)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}>
                    {entry.displayName}
                  </Link>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                    @{entry.username}
                  </p>
                </div>
                <span style={{
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}>
                  {getPoints(entry).toLocaleString()} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
