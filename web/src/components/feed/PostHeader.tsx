'use client';

import Link from 'next/link';
import type { FeedAuthor } from '@/lib/feed-types';
import { MoreHorizontalIcon, MapPinIcon } from './FeedIcons';
import { timeAgo } from '@/lib/format';

interface Props {
  author: FeedAuthor;
  createdAt: string;
  location?: string;
}

export default function PostHeader({ author, createdAt, location }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '14px 16px 10px',
    }}>
      <Link href={`/profile/${author.username}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
        <img
          src={author.avatar}
          alt={author.name}
          width={38}
          height={38}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '1.5px solid rgba(148, 148, 172, 0.12)',
            transition: 'opacity 150ms ease',
            cursor: 'pointer',
          }}
        />
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <Link href={`/profile/${author.username}`} style={{
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            color: '#F0F0F8',
            cursor: 'pointer',
          }}>
            {author.name}
          </Link>

          {author.isVerified && (
            <>
              <span style={{ fontSize: '12px', color: '#5C5C72' }}>·</span>
              <span style={{
                background: '#FF6B35',
                color: '#0A0A0F',
                fontSize: '10px',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '4px',
                letterSpacing: '0.3px',
              }}>PRO</span>
            </>
          )}

          <span style={{ fontSize: '12px', color: '#5C5C72' }}>·</span>
          <span style={{ fontSize: '12px', color: '#5C5C72' }}>{timeAgo(createdAt)}</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '1px',
        }}>
          <span style={{ fontSize: '12px', color: '#9494AC' }}>@{author.username}</span>
          {location && (
            <>
              <span style={{ fontSize: '12px', color: '#5C5C72' }}>·</span>
              <MapPinIcon size={12} color="#5C5C72" />
              <span style={{ fontSize: '12px', color: '#9494AC' }}>{location}</span>
            </>
          )}
        </div>
      </div>

      <button
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#5C5C72',
          transition: 'background 200ms ease',
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1A1A28')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <MoreHorizontalIcon size={20} color="#5C5C72" />
      </button>
    </div>
  );
}
