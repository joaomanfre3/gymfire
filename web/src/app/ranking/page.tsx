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
        <h1 style={{
          fontSize: '1.4rem',
          fontWeight: 900,
          marginBottom: '1rem',
          fontFamily: "'Orbitron', sans-serif",
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          <span className="gradient-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>Ranking</span>
        </h1>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-sm)',
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
                background: tab === t ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'transparent',
                color: tab === t ? '#fff' : 'var(--text-secondary)',
                fontWeight: tab === t ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.8rem',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                boxShadow: tab === t ? '0 0 15px rgba(255, 107, 53, 0.2)' : 'none',
              }}
            >
              {t === 'weekly' ? 'Semanal' : 'Geral'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Carregando ranking...</span>
          </div>
        ) : ranking.length === 0 ? (
          <div className="animate-in" style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow-card)',
          }}>
            Sem dados de ranking ainda.
          </div>
        ) : (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Top 3 podium */}
            {ranking.length >= 3 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.65rem',
                marginBottom: '1.25rem',
                alignItems: 'flex-end',
              }}>
                {[1, 0, 2].map(idx => {
                  const entry = ranking[idx];
                  if (!entry) return null;
                  const isFirst = idx === 0;
                  const glowColor = isFirst ? 'rgba(255, 107, 53, 0.15)' : idx === 1 ? 'rgba(192, 192, 192, 0.08)' : 'rgba(205, 127, 50, 0.08)';
                  return (
                    <div key={entry.rank} className="card-hover" style={{
                      textAlign: 'center',
                      background: isFirst
                        ? 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,107,53,0.02))'
                        : 'var(--surface)',
                      backgroundColor: 'var(--surface)',
                      border: `1px solid ${isFirst ? 'rgba(255, 107, 53, 0.2)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: isFirst ? '1.75rem 1rem' : '1.25rem 0.75rem',
                      flex: 1,
                      maxWidth: '170px',
                      boxShadow: isFirst ? '0 0 30px rgba(255, 107, 53, 0.1)' : 'var(--shadow-card)',
                    }}>
                      <div style={{
                        fontSize: isFirst ? '2.25rem' : '1.5rem',
                        marginBottom: '0.35rem',
                        filter: isFirst ? 'drop-shadow(0 0 8px rgba(255,215,0,0.3))' : 'none',
                      }}>
                        {medals[entry.rank]}
                      </div>
                      <div style={{
                        width: isFirst ? '60px' : '46px',
                        height: isFirst ? '60px' : '46px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${getAvatarColor(entry.displayName || '?')}, ${getAvatarColor(entry.displayName || '?')}cc)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: isFirst ? '1.3rem' : '1rem',
                        margin: '0 auto 0.4rem',
                        boxShadow: `0 0 15px ${getAvatarColor(entry.displayName || '?')}33`,
                        border: `2px solid ${getAvatarColor(entry.displayName || '?')}44`,
                      }}>
                        {(entry.displayName || '?')[0].toUpperCase()}
                      </div>
                      <Link href={`/profile/${entry.username}`} style={{
                        textDecoration: 'none',
                        color: 'var(--text)',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        display: 'block',
                      }}>
                        {entry.displayName}
                      </Link>
                      <p className="gradient-text" style={{
                        fontWeight: 800,
                        fontSize: isFirst ? '1.15rem' : '0.9rem',
                        margin: '0.25rem 0 0',
                        fontFamily: "'Orbitron', sans-serif",
                      }}>
                        {getPoints(entry).toLocaleString()}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', margin: '0.1rem 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        pontos
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rest of ranking */}
            {ranking.slice(3).map((entry, idx) => (
              <div key={entry.rank} className="card-hover animate-in" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                animationDelay: `${idx * 0.03}s`,
              }}>
                <span style={{
                  width: '32px',
                  textAlign: 'center',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontFamily: "'Orbitron', sans-serif",
                }}>
                  #{entry.rank}
                </span>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${getAvatarColor(entry.displayName || '?')}, ${getAvatarColor(entry.displayName || '?')}cc)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  flexShrink: 0,
                  border: `2px solid ${getAvatarColor(entry.displayName || '?')}33`,
                }}>
                  {(entry.displayName || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/profile/${entry.username}`} style={{
                    textDecoration: 'none',
                    color: 'var(--text)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                  }}>
                    {entry.displayName}
                  </Link>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
                    @{entry.username}
                  </p>
                </div>
                <span className="gradient-text" style={{
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  fontFamily: "'Orbitron', sans-serif",
                }}>
                  {getPoints(entry).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
