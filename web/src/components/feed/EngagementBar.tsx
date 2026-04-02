'use client';

import { useState } from 'react';
import { HeartIcon, HeartFilledIcon, MessageCircleIcon, SendIcon, ZapIcon } from './FeedIcons';

interface Props {
  likes: number;
  comments: number;
  isLiked: boolean;
  xpEarned: number;
  onLike: () => void;
}

export default function EngagementBar({ likes, comments, isLiked, xpEarned, onLike }: Props) {
  const [animating, setAnimating] = useState(false);

  const handleLike = () => {
    if (!isLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }
    onLike();
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '6px 16px 4px',
      gap: '4px',
    }}>
      {/* Like */}
      <button
        onClick={handleLike}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 10px',
          borderRadius: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1A1A28')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span style={{
          display: 'inline-flex',
          transform: animating ? 'scale(1.3)' : 'scale(1)',
          transition: 'transform 300ms cubic-bezier(.17,.67,.35,1.5)',
        }}>
          {isLiked ? <HeartFilledIcon size={22} /> : <HeartIcon size={22} color="#9494AC" />}
        </span>
        <span style={{
          fontSize: '13px',
          fontWeight: 600,
          color: isLiked ? '#FF4D6A' : '#9494AC',
        }}>{likes}</span>
      </button>

      {/* Comment */}
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 10px',
          borderRadius: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1A1A28')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <MessageCircleIcon size={22} color="#9494AC" />
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#9494AC' }}>{comments}</span>
      </button>

      {/* Share */}
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 10px',
          borderRadius: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1A1A28')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <SendIcon size={22} color="#9494AC" />
      </button>

      {/* XP Badge */}
      {xpEarned > 0 && (
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(204, 255, 0, 0.08)',
        }}>
          <ZapIcon size={13} />
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#CCFF00',
          }}>+{xpEarned} XP</span>
        </div>
      )}
    </div>
  );
}
