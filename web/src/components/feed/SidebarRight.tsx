'use client';

import { useState } from 'react';
import type { SuggestedUser, FeedChallenge } from '@/lib/feed-types';

interface Props {
  suggestions: SuggestedUser[];
  challenges: FeedChallenge[];
}

function formatParticipants(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(n);
}

export default function SidebarRight({ suggestions, challenges }: Props) {
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const toggleFollow = (id: string) => {
    setFollowing(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside style={{
      width: '320px',
      padding: '24px 16px',
      position: 'sticky',
      top: '80px',
      height: 'fit-content',
      flexShrink: 0,
    }}>
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#5C5C72' }}>Sugestões para você</span>
            <button style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#FF6B35',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}>Ver todos</button>
          </div>

          {suggestions.map(user => {
            const isFollowing = following.has(user.id);
            return (
              <div key={user.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 0',
              }}>
                <img
                  src={user.avatar}
                  alt={user.name}
                  width={36}
                  height={36}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                  <div style={{ fontSize: '12px', color: '#9494AC' }}>@{user.username}</div>
                </div>
                <button
                  onClick={() => toggleFollow(user.id)}
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: isFollowing ? '#9494AC' : '#FF6B35',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'opacity 200ms ease',
                  }}
                >
                  {isFollowing ? 'Seguindo' : 'Seguir'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Challenges */}
      {challenges.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#5C5C72' }}>Desafios em destaque</span>
            <button style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#FF6B35',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}>Ver todos</button>
          </div>

          {challenges.map(ch => (
            <div key={ch.id} style={{ padding: '8px 0' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8', marginBottom: '6px' }}>{ch.name}</div>
              <div style={{
                height: '4px',
                borderRadius: '2px',
                background: '#1A1A28',
                overflow: 'hidden',
                marginBottom: '4px',
              }}>
                <div style={{
                  height: '100%',
                  width: `${ch.progress}%`,
                  borderRadius: '2px',
                  background: 'linear-gradient(90deg, #FF6B35, #FF8050)',
                  transition: 'width 500ms ease',
                }} />
              </div>
              <div style={{ fontSize: '11px', color: '#5C5C72' }}>
                {ch.progress}% · {formatParticipants(ch.participants)} participantes
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '32px',
        fontSize: '11px',
        color: '#5C5C72',
      }}>
        <span>© 2026 GymFire</span>
        <span style={{ margin: '0 6px' }}>·</span>
        <span style={{ cursor: 'pointer' }}>Sobre</span>
        <span style={{ margin: '0 6px' }}>·</span>
        <span style={{ cursor: 'pointer' }}>Termos</span>
        <span style={{ margin: '0 6px' }}>·</span>
        <span style={{ cursor: 'pointer' }}>Privacidade</span>
      </div>
    </aside>
  );
}
