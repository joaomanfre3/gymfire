'use client';

import { useRef } from 'react';
import type { StoryUser } from '@/lib/feed-types';
import { PlusIcon } from './FeedIcons';

interface Props {
  stories: StoryUser[];
  currentUserAvatar?: string;
}

export default function StoriesBar({ stories, currentUserAvatar }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{
      borderBottom: '1px solid rgba(148, 148, 172, 0.08)',
      padding: '16px 0',
    }}>
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          padding: '0 16px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="hide-scrollbar"
      >
        {stories.map((story, i) => (
          <button
            key={story.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
              width: '62px',
            }}
          >
            <div style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              padding: '2px',
              background: i === 0
                ? 'transparent'
                : story.seen
                  ? 'rgba(148, 148, 172, 0.2)'
                  : 'linear-gradient(135deg, #FF6B35, #FF3D00, #FFB800)',
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '2px solid #0A0A0F',
                overflow: 'hidden',
                background: '#141420',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                {i === 0 ? (
                  <>
                    {currentUserAvatar ? (
                      <img src={currentUserAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: '#1A1A28',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(148, 148, 172, 0.3)',
                        }} />
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#FF6B35',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #0A0A0F',
                    }}>
                      <PlusIcon size={11} color="#0A0A0F" />
                    </div>
                  </>
                ) : (
                  <img
                    src={story.avatar}
                    alt={story.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 400,
              color: i === 0 ? 'var(--text-secondary, #9494AC)' : story.seen ? '#5C5C72' : '#F0F0F8',
              maxWidth: '62px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {story.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
