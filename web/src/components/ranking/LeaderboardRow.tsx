'use client';

import type { RankingUser, RankingCategory } from '@/lib/ranking-types';
import { formatStatValue, getUserStatValue, getCategoryUnit } from '@/lib/ranking-types';
import { ChevronUpIcon, ChevronDownIcon } from './RankingIcons';
import ExpandedStats from './ExpandedStats';

interface Props {
  user: RankingUser;
  category: RankingCategory;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

export default function LeaderboardRow({ user, category, isExpanded, onToggle, index }: Props) {
  const value = getUserStatValue(user, category);
  const unit = getCategoryUnit(category);

  return (
    <div style={{
      borderBottom: '1px solid rgba(148, 148, 172, 0.08)',
      animation: `rowSlideIn 300ms cubic-bezier(0.25, 0.1, 0.25, 1) ${index * 30}ms both`,
    }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          cursor: 'pointer',
          transition: 'background 150ms ease',
          background: isExpanded ? 'rgba(255, 107, 53, 0.03)' : 'transparent',
        }}
        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#1A1A28'; }}
        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Position */}
        <span style={{
          width: '32px',
          textAlign: 'center',
          flexShrink: 0,
          fontSize: '15px',
          fontWeight: 700,
          color: '#5C5C72',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {user.position}
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
            border: '1.5px solid rgba(148, 148, 172, 0.12)',
            flexShrink: 0,
          }}
        />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#F0F0F8',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user.name}
            </span>
            {user.isVerified && (
              <span style={{
                background: '#FF6B35',
                color: '#0A0A0F',
                fontSize: '10px',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '4px',
                letterSpacing: '0.3px',
              }}>PRO</span>
            )}
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              background: '#1A1A28',
              color: '#9494AC',
            }}>Lv.{user.level}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '12px', color: '#5C5C72' }}>@{user.username}</span>
            <span style={{ fontSize: '12px', color: '#5C5C72' }}>{user.stats.workouts} treinos</span>
          </div>
        </div>

        {/* Position change */}
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

      {/* Expanded content */}
      {isExpanded && <ExpandedStats user={user} />}
    </div>
  );
}
