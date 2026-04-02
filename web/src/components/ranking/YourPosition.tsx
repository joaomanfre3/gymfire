'use client';

import type { RankingUser, RankingCategory } from '@/lib/ranking-types';
import { formatStatValue, getUserStatValue, getCategoryUnit } from '@/lib/ranking-types';
import { ChevronUpIcon, ChevronDownIcon, ZapRankIcon } from './RankingIcons';

interface Props {
  user: RankingUser | null;
  category: RankingCategory;
}

export default function YourPosition({ user, category }: Props) {
  if (!user) return null;

  const value = getUserStatValue(user, category);
  const unit = getCategoryUnit(category);

  return (
    <div style={{
      background: '#141420',
      borderRadius: '14px',
      border: '1px solid rgba(255, 107, 53, 0.2)',
      padding: '14px 16px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 0 20px rgba(255, 107, 53, 0.06)',
    }}>
      {/* Position */}
      <span style={{
        width: '32px',
        textAlign: 'center',
        fontSize: '18px',
        fontWeight: 900,
        color: '#FF6B35',
        fontVariantNumeric: 'tabular-nums',
      }}>
        #{user.position}
      </span>

      {/* Avatar */}
      <img
        src={user.avatar}
        alt={user.name}
        width={40}
        height={40}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid rgba(255, 107, 53, 0.3)',
          flexShrink: 0,
        }}
      />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8' }}>Você</span>
          <span style={{
            fontSize: '10px',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(255, 107, 53, 0.12)',
            color: '#FF6B35',
          }}>Lv.{user.level}</span>
        </div>
        <span style={{ fontSize: '12px', color: '#9494AC' }}>@{user.username}</span>
      </div>

      {/* Variation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        minWidth: '36px',
        justifyContent: 'center',
      }}>
        {user.positionChange > 0 && (
          <>
            <ChevronUpIcon />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>{user.positionChange}</span>
          </>
        )}
        {user.positionChange < 0 && (
          <>
            <ChevronDownIcon />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF4D6A' }}>{Math.abs(user.positionChange)}</span>
          </>
        )}
        {user.positionChange === 0 && (
          <span style={{ fontSize: '12px', color: '#5C5C72' }}>—</span>
        )}
      </div>

      {/* Value */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '70px' }}>
        <div style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#CCFF00',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatStatValue(value, category)}
        </div>
        <div style={{
          fontSize: '10px',
          fontWeight: 600,
          color: '#5C5C72',
          textTransform: 'uppercase',
          marginTop: '1px',
        }}>{unit}</div>
      </div>
    </div>
  );
}
