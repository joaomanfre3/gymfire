'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface RankEntry {
  position: number;
  user: { displayName: string; username: string };
  points: number;
}

type RankType = 'weekly' | 'alltime';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function RankingPage() {
  const [tab, setTab] = useState<RankType>('weekly');
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = async (type: RankType) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/ranking?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setRanking(Array.isArray(data) ? data : data.ranking || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchRanking(tab); }, [tab]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ranking</h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'var(--surface)' }}>
        {[
          { key: 'weekly' as RankType, label: 'Weekly' },
          { key: 'alltime' as RankType, label: 'All Time' },
        ].map(({ key, label }) => (
          <button key={key}
            onClick={() => setTab(key)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === key ? 'var(--primary)' : 'transparent',
              color: tab === key ? '#fff' : 'var(--text-muted)',
            }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-3 rounded-full"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
        </div>
      ) : ranking.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🏆</p>
          <p style={{ color: 'var(--text-muted)' }}>No rankings yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Top 3 podium */}
          {ranking.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 0, 2].map((idx) => {
                const entry = ranking[idx];
                if (!entry) return null;
                const isFirst = idx === 0;
                return (
                  <div key={idx}
                    className={`rounded-2xl p-4 text-center ${isFirst ? 'order-2' : idx === 1 ? 'order-1 mt-4' : 'order-3 mt-4'}`}
                    style={{
                      background: isFirst
                        ? 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,143,96,0.08))'
                        : 'var(--surface)',
                      border: `1px solid ${isFirst ? 'var(--primary)' : 'var(--border)'}`,
                    }}>
                    <p className="text-3xl mb-2">{MEDALS[idx]}</p>
                    <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-lg font-bold text-white mb-2"
                      style={{ background: isFirst ? 'var(--primary)' : 'var(--surface-light)' }}>
                      {(entry.user.displayName || entry.user.username)[0].toUpperCase()}
                    </div>
                    <p className="font-bold text-sm truncate">{entry.user.displayName}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>@{entry.user.username}</p>
                    <p className="font-bold mt-2" style={{ color: 'var(--primary)' }}>
                      {entry.points.toLocaleString()} pts
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full list */}
          {ranking.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-4 rounded-xl px-4 py-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span className="w-8 text-center font-bold text-sm"
                style={{ color: idx < 3 ? 'var(--primary)' : 'var(--text-muted)' }}>
                {idx < 3 ? MEDALS[idx] : entry.position || idx + 1}
              </span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: idx < 3 ? 'var(--primary)' : 'var(--surface-light)', color: idx < 3 ? '#fff' : 'var(--text-muted)' }}>
                {(entry.user.displayName || entry.user.username)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{entry.user.displayName}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{entry.user.username}</p>
              </div>
              <p className="font-bold text-sm" style={{ color: 'var(--primary)' }}>
                {entry.points.toLocaleString()} pts
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
