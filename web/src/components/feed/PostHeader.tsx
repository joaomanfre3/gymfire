'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { FeedAuthor } from '@/lib/feed-types';
import { MoreHorizontalIcon, MapPinIcon } from './FeedIcons';
import { timeAgo } from '@/lib/format';

interface Props {
  author: FeedAuthor;
  createdAt: string;
  location?: string;
  isOwn: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PostHeader({ author, createdAt, location, isOwn, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '14px 16px 10px',
    }}>
      <Link href={`/profile/${author.username}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%',
          border: '1.5px solid rgba(148,148,172,0.12)',
          background: author.avatar ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '14px', overflow: 'hidden',
        }}>
          {author.avatar
            ? <img src={author.avatar} alt={author.name} width={38} height={38} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : author.name[0].toUpperCase()
          }
        </div>
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <Link href={`/profile/${author.username}`} style={{
            textDecoration: 'none', fontSize: '14px', fontWeight: 600, color: '#F0F0F8',
          }}>{author.name}</Link>
          {author.isVerified && (
            <>
              <span style={{ fontSize: '12px', color: '#5C5C72' }}>·</span>
              <span style={{ background: '#FF6B35', color: '#0A0A0F', fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>PRO</span>
            </>
          )}
          <span style={{ fontSize: '12px', color: '#5C5C72' }}>·</span>
          <span style={{ fontSize: '12px', color: '#5C5C72' }}>{timeAgo(createdAt)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
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

      {/* Three dots menu */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: menuOpen ? '#1A1A28' : 'transparent',
            border: 'none', cursor: 'pointer', color: '#5C5C72',
            transition: 'background 200ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1A1A28')}
          onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = 'transparent'; }}
        >
          <MoreHorizontalIcon size={20} color="#5C5C72" />
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: '4px',
            background: '#1A1A28', borderRadius: '12px',
            border: '1px solid rgba(148,148,172,0.1)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            overflow: 'hidden', zIndex: 50, minWidth: '160px',
          }}>
            {isOwn && onEdit && (
              <button onClick={() => { setMenuOpen(false); onEdit(); }} style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                padding: '12px 16px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#F0F0F8',
                transition: 'background 150ms', textAlign: 'left',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(148,148,172,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9494AC" strokeWidth={1.5} strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                Editar post
              </button>
            )}
            {isOwn && onDelete && (
              <button onClick={() => { setMenuOpen(false); onDelete(); }} style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                padding: '12px 16px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#FF4D6A',
                transition: 'background 150ms', textAlign: 'left',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(148,148,172,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FF4D6A" strokeWidth={1.5} strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                Excluir post
              </button>
            )}
            {!isOwn && (
              <button onClick={() => setMenuOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                padding: '12px 16px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#FF4D6A',
                transition: 'background 150ms', textAlign: 'left',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(148,148,172,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FF4D6A" strokeWidth={1.5} strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                Denunciar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
