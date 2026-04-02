'use client';

import Link from 'next/link';
import type { RankingUser } from '@/lib/ranking-types';
import { ChevronRightSmallIcon } from './RankingIcons';

interface Props {
  user: RankingUser;
}

export default function ExpandedStats({ user }: Props) {
  const stats = [
    { label: 'Treinos', value: String(user.stats.workouts) },
    { label: 'Volume', value: user.stats.volume >= 1000 ? (user.stats.volume / 1000).toFixed(0) + 't' : user.stats.volume + 'kg' },
    { label: 'Streak', value: user.stats.streak + ' dias' },
    { label: 'PRs', value: String(user.stats.prs) },
  ];

  return (
    <div style={{
      padding: '0 16px 14px',
      animation: 'expandIn 250ms ease forwards',
    }}>
      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1px',
        background: 'rgba(148, 148, 172, 0.08)',
        borderRadius: '10px',
        overflow: 'hidden',
        margin: '10px 0',
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: '#1A1A28',
            padding: '10px 8px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#5C5C72',
              textTransform: 'uppercase',
              marginBottom: '3px',
            }}>{s.label}</div>
            <div style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#F0F0F8',
            }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Level progress bar */}
      <div style={{ margin: '8px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: '#5C5C72' }}>Lv.{user.level}</span>
          <span style={{ fontSize: '11px', color: '#CCFF00', fontWeight: 700 }}>{user.levelProgress}%</span>
          <span style={{ fontSize: '11px', color: '#5C5C72' }}>Lv.{user.level + 1}</span>
        </div>
        <div style={{
          height: '6px',
          borderRadius: '3px',
          background: '#1A1A28',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${user.levelProgress}%`,
            borderRadius: '3px',
            background: 'linear-gradient(90deg, #CCFF00, rgba(204, 255, 0, 0.6))',
            transition: 'width 500ms ease',
          }} />
        </div>
      </div>

      {/* View profile link */}
      <div style={{ marginTop: '8px', textAlign: 'right' }}>
        <Link
          href={`/profile/${user.username}`}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#FF6B35',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          Ver Perfil Completo
          <ChevronRightSmallIcon />
        </Link>
      </div>
    </div>
  );
}
