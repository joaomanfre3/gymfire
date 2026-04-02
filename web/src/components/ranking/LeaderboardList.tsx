'use client';

import { useState } from 'react';
import type { RankingUser, RankingCategory } from '@/lib/ranking-types';
import LeaderboardRow from './LeaderboardRow';

interface Props {
  users: RankingUser[];
  category: RankingCategory;
}

export default function LeaderboardList({ users, category }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const listUsers = users.slice(3); // positions #4+

  if (listUsers.length === 0) return null;

  return (
    <div style={{
      background: '#141420',
      borderRadius: '16px',
      border: '1px solid rgba(148, 148, 172, 0.08)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(148, 148, 172, 0.08)',
      }}>
        <span style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#5C5C72',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
        }}>Classificação Completa</span>
        <span style={{
          fontSize: '12px',
          fontWeight: 500,
          color: '#5C5C72',
        }}>{users.length} atletas</span>
      </div>

      {/* Rows */}
      {listUsers.map((user, i) => (
        <LeaderboardRow
          key={user.id}
          user={user}
          category={category}
          isExpanded={expandedId === user.id}
          onToggle={() => setExpandedId(prev => prev === user.id ? null : user.id)}
          index={i}
        />
      ))}
    </div>
  );
}
