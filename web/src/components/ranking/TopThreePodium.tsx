'use client';

import Link from 'next/link';
import type { RankingUser, RankingCategory } from '@/lib/ranking-types';
import { formatStatValue, getUserStatValue, getCategoryUnit } from '@/lib/ranking-types';
import { useCountUp } from '@/hooks/useCountUp';
import { CrownIcon, MedalSilverIcon, MedalBronzeIcon, ZapRankIcon } from './RankingIcons';

interface Props {
  users: RankingUser[];
  category: RankingCategory;
}

const rankColors = {
  1: { primary: '#FFD700', bg: 'rgba(255, 215, 0, 0.06)', glow: 'rgba(255, 215, 0, 0.2)', border: 'rgba(255, 215, 0, 0.3)' },
  2: { primary: '#C0C0C0', bg: 'rgba(192, 192, 192, 0.04)', glow: 'rgba(192, 192, 192, 0.1)', border: 'rgba(192, 192, 192, 0.2)' },
  3: { primary: '#CD7F32', bg: 'rgba(205, 127, 50, 0.04)', glow: 'rgba(205, 127, 50, 0.1)', border: 'rgba(205, 127, 50, 0.2)' },
} as const;

function PodiumUser({ user, rank, category }: { user: RankingUser; rank: 1 | 2 | 3; category: RankingCategory }) {
  const colors = rankColors[rank];
  const isFirst = rank === 1;
  const avatarSize = isFirst ? 80 : rank === 2 ? 64 : 60;
  const value = getUserStatValue(user, category);
  const animatedValue = useCountUp(value, 1200);
  const unit = getCategoryUnit(category);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flex: 1,
      order: rank === 2 ? 0 : rank === 1 ? 1 : 2,
    }}>
      {/* Medal/Crown */}
      <div style={{ marginBottom: '6px' }}>
        {rank === 1 && <CrownIcon size={28} color="#FFD700" />}
        {rank === 2 && <MedalSilverIcon size={24} />}
        {rank === 3 && <MedalBronzeIcon size={22} />}
      </div>

      {/* Avatar */}
      <div style={{ position: 'relative', marginBottom: isFirst ? '12px' : '10px' }}>
        <Link href={`/profile/${user.username}`} style={{ textDecoration: 'none' }}>
          <img
            src={user.avatar}
            alt={user.name}
            width={avatarSize}
            height={avatarSize}
            style={{
              width: `${avatarSize}px`,
              height: `${avatarSize}px`,
              borderRadius: '50%',
              objectFit: 'cover',
              border: `3px solid ${colors.primary}`,
              boxShadow: `0 0 0 4px ${colors.bg}, 0 0 20px ${colors.glow}`,
              transition: 'transform 300ms ease',
              cursor: 'pointer',
            }}
          />
        </Link>
        {/* Position badge */}
        <div style={{
          position: 'absolute',
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: colors.primary,
          color: '#0A0A0F',
          fontSize: '12px',
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2.5px solid #141420',
        }}>
          {rank}
        </div>
      </div>

      {/* Name */}
      <Link href={`/profile/${user.username}`} style={{
        textDecoration: 'none',
        fontSize: isFirst ? '16px' : '14px',
        fontWeight: 700,
        color: '#F0F0F8',
        textAlign: 'center',
        maxWidth: '120px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        display: 'block',
      }}>
        {user.name}
      </Link>

      {/* Username */}
      <span style={{ fontSize: '12px', color: '#9494AC', marginTop: '2px' }}>@{user.username}</span>

      {/* Value */}
      <span style={{
        fontSize: isFirst ? '22px' : '18px',
        fontWeight: 900,
        color: '#CCFF00',
        marginTop: '6px',
        fontVariantNumeric: 'tabular-nums',
        textShadow: isFirst ? '0 0 12px rgba(204, 255, 0, 0.2)' : 'none',
      }}>
        {formatStatValue(animatedValue, category)}
      </span>

      {/* Unit label */}
      <span style={{
        fontSize: '10px',
        fontWeight: 600,
        color: '#5C5C72',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginTop: '2px',
      }}>{unit}</span>

      {/* Level badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '2px 8px',
        borderRadius: '6px',
        background: 'rgba(204, 255, 0, 0.08)',
        fontSize: '11px',
        fontWeight: 800,
        color: '#CCFF00',
        marginTop: '6px',
      }}>
        <ZapRankIcon size={10} />
        Lv.{user.level}
      </div>
    </div>
  );
}

export default function TopThreePodium({ users, category }: Props) {
  if (users.length < 3) return null;

  return (
    <div style={{
      background: '#141420',
      borderRadius: '20px',
      border: '1px solid rgba(148, 148, 172, 0.08)',
      padding: '28px 20px 24px',
      marginBottom: '16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle background decoration */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '120px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 107, 53, 0.06) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        position: 'relative',
        zIndex: 1,
      }}>
        <PodiumUser user={users[1]} rank={2} category={category} />
        <PodiumUser user={users[0]} rank={1} category={category} />
        <PodiumUser user={users[2]} rank={3} category={category} />
      </div>

      {/* Podium bars */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '12px',
        marginTop: '16px',
        height: '40px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* 2nd place bar */}
        <div className="podium-bar" style={{
          flex: 1,
          height: '28px',
          background: 'linear-gradient(180deg, rgba(192, 192, 192, 0.15) 0%, rgba(192, 192, 192, 0.05) 100%)',
          borderRadius: '6px 6px 0 0',
          borderTop: '2px solid rgba(192, 192, 192, 0.3)',
        }} />
        {/* 1st place bar */}
        <div className="podium-bar" style={{
          flex: 1,
          height: '40px',
          background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%)',
          borderRadius: '6px 6px 0 0',
          borderTop: '2px solid rgba(255, 215, 0, 0.3)',
        }} />
        {/* 3rd place bar */}
        <div className="podium-bar" style={{
          flex: 1,
          height: '20px',
          background: 'linear-gradient(180deg, rgba(205, 127, 50, 0.15) 0%, rgba(205, 127, 50, 0.05) 100%)',
          borderRadius: '6px 6px 0 0',
          borderTop: '2px solid rgba(205, 127, 50, 0.3)',
        }} />
      </div>
    </div>
  );
}
