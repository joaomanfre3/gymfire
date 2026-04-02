'use client';

import { useState, useRef, useEffect } from 'react';
import { apiFetch, getToken, getUser } from '@/lib/api';
import { PlusIcon } from './FeedIcons';
import DropViewer from './DropViewer';
import DropCreator from './DropCreator';

interface DropItem {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  duration: number;
  createdAt: string;
  seen: boolean;
}

interface DropUser {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  drops: DropItem[];
  allSeen: boolean;
}

export default function DropsBar() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dropUsers, setDropUsers] = useState<DropUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingUser, setViewingUser] = useState<DropUser | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const currentUser = getUser();
  const loggedIn = !!getToken();

  useEffect(() => {
    if (loggedIn) loadDrops();
    else setLoading(false);
  }, [loggedIn]);

  async function loadDrops() {
    try {
      const res = await apiFetch('/api/drops');
      if (res.ok) {
        setDropUsers(await res.json());
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  function handleDropViewed(dropId: string) {
    // Mark as seen locally
    setDropUsers(prev => prev.map(u => ({
      ...u,
      drops: u.drops.map(d => d.id === dropId ? { ...d, seen: true } : d),
      allSeen: u.drops.every(d => d.id === dropId ? true : d.seen),
    })));
    // Fire API
    apiFetch(`/api/drops/${dropId}/view`, { method: 'POST' }).catch(() => {});
  }

  function handleCloseViewer() {
    setViewingUser(null);
    // Re-sort: move fully seen to end
    setDropUsers(prev => {
      const sorted = [...prev].sort((a, b) => {
        const aIsMe = a.userId === currentUser?.id;
        const bIsMe = b.userId === currentUser?.id;
        if (aIsMe) return -1;
        if (bIsMe) return 1;
        const aAllSeen = a.drops.every(d => d.seen);
        const bAllSeen = b.drops.every(d => d.seen);
        if (!aAllSeen && bAllSeen) return -1;
        if (aAllSeen && !bAllSeen) return 1;
        return 0;
      });
      return sorted;
    });
  }

  function handleDropCreated() {
    setShowCreator(false);
    loadDrops();
  }

  // Find own user entry
  const ownEntry = dropUsers.find(u => u.userId === currentUser?.id);
  const hasOwnDrop = ownEntry && ownEntry.drops.length > 0;

  return (
    <>
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
          {/* Own Drop / Create button */}
          {loggedIn && (
            <button
              onClick={() => hasOwnDrop ? setViewingUser(ownEntry!) : setShowCreator(true)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '6px', background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, flexShrink: 0, width: '62px',
              }}
            >
              <div style={{
                width: '58px', height: '58px', borderRadius: '50%', padding: '2px',
                background: hasOwnDrop ? 'linear-gradient(135deg, #FF6B35, #FF3D00, #FFB800)' : 'transparent',
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  border: '2px solid #0A0A0F', overflow: 'hidden',
                  background: '#141420', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  {ownEntry?.avatarUrl ? (
                    <img src={ownEntry.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', background: '#1A1A28',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(148,148,172,0.3)' }} />
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: '-2px', right: '-2px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#FF6B35', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #0A0A0F',
                  }}>
                    <PlusIcon size={11} color="#0A0A0F" />
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 400, color: '#9494AC', maxWidth: '62px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Seu Drop
              </span>
            </button>
          )}

          {/* Loading shimmer */}
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0, width: '62px' }}>
              <div className="shimmer" style={{ width: '58px', height: '58px', borderRadius: '50%', background: '#141420' }} />
              <div className="shimmer" style={{ width: '40px', height: '10px', borderRadius: '3px', background: '#141420' }} />
            </div>
          ))}

          {/* Other users' drops */}
          {!loading && dropUsers
            .filter(u => u.userId !== currentUser?.id)
            .map(u => {
              const allSeen = u.drops.every(d => d.seen);
              return (
                <button
                  key={u.userId}
                  onClick={() => setViewingUser(u)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '6px', background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0, flexShrink: 0, width: '62px',
                  }}
                >
                  <div style={{
                    width: '58px', height: '58px', borderRadius: '50%', padding: '2px',
                    background: allSeen
                      ? 'rgba(148, 148, 172, 0.2)'
                      : 'linear-gradient(135deg, #FF6B35, #FF3D00, #FFB800)',
                    boxShadow: allSeen ? 'none' : '0 0 12px rgba(255,107,53,0.4)',
                    transition: 'box-shadow 300ms, background 300ms',
                  }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      border: '2px solid #0A0A0F', overflow: 'hidden',
                      background: '#141420', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: allSeen ? 0.5 : 1,
                      transition: 'opacity 300ms',
                    }}>
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>
                          {u.displayName[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 400,
                    color: allSeen ? '#5C5C72' : '#F0F0F8',
                    maxWidth: '62px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    transition: 'color 300ms',
                  }}>
                    {u.displayName.split(' ')[0]}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Fullscreen viewer */}
      {viewingUser && (
        <DropViewer
          user={viewingUser}
          onClose={handleCloseViewer}
          onViewed={handleDropViewed}
        />
      )}

      {/* Creator */}
      {showCreator && (
        <DropCreator
          onClose={() => setShowCreator(false)}
          onCreated={handleDropCreated}
        />
      )}
    </>
  );
}
