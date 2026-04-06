'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch, getUser } from '@/lib/api';

interface DropItem {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  duration: number;
  createdAt: string;
  seen: boolean;
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
}

interface DropUser {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  drops: DropItem[];
}

interface CommentItem {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

interface Props {
  user: DropUser;
  onClose: () => void;
  onViewed: (dropId: string) => void;
  onDeleted?: (dropId: string) => void;
}

function timeAgoShort(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h`;
}

// Render caption with @mentions highlighted
function CaptionText({ text }: { text: string }) {
  const parts = text.split(/(@\w+)/g);
  return (
    <p style={{ color: '#fff', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} style={{ color: '#FF6B35', fontWeight: 600 }}>{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

export default function DropViewer({ user, onClose, onViewed, onDeleted }: Props) {
  const currentUser = getUser();
  const isOwner = currentUser?.id === user.userId;

  const [drops, setDrops] = useState(user.drops);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstUnseen = user.drops.findIndex(d => !d.seen);
    return firstUnseen >= 0 ? firstUnseen : 0;
  });
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // UI states
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const lastTapRef = useRef(0);

  const drop = drops[currentIndex];
  const isVideo = drop?.mediaType === 'VIDEO';
  const duration = isVideo ? undefined : (drop?.duration || 5000);

  // Mark as viewed
  useEffect(() => {
    if (drop && !drop.seen) {
      onViewed(drop.id);
    }
  }, [drop?.id]);

  // Progress timer for images
  useEffect(() => {
    if (!drop || paused || isVideo || showComments) return;
    setProgress(0);
    const interval = 50;
    const totalDuration = duration || 5000;
    let elapsed = 0;

    timerRef.current = window.setInterval(() => {
      elapsed += interval;
      setProgress(Math.min(elapsed / totalDuration, 1));
      if (elapsed >= totalDuration) {
        goNext();
      }
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, paused, isVideo, showComments]);

  // Pause timer when comments panel is open
  useEffect(() => {
    if (showComments) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (videoRef.current) videoRef.current.pause();
    } else {
      if (videoRef.current) videoRef.current.play();
    }
  }, [showComments]);

  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const v = videoRef.current;
      if (v.duration) setProgress(v.currentTime / v.duration);
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    goNext();
  }, [currentIndex]);

  function goNext() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentIndex < drops.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
      setShowComments(false);
      setShowMenu(false);
    } else {
      onClose();
    }
  }

  function goPrev() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
      setShowComments(false);
      setShowMenu(false);
    }
  }

  // Tap: left 30% = prev, right 70% = next, double tap = like
  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (showComments || showMenu) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap = like
      toggleLike();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    setTimeout(() => {
      if (lastTapRef.current === 0) return; // was double tap
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e as React.MouseEvent).clientX - rect.left;
      if (x < rect.width * 0.3) {
        goPrev();
      } else {
        goNext();
      }
      lastTapRef.current = 0;
    }, 310);
  }

  function handlePointerDown() {
    if (showComments) return;
    setPaused(true);
    if (videoRef.current) videoRef.current.pause();
  }

  function handlePointerUp() {
    if (showComments) return;
    setPaused(false);
    if (videoRef.current) videoRef.current.play();
  }

  // Keyboard
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (showComments && e.key !== 'Escape') return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') {
        if (showComments) setShowComments(false);
        else if (showMenu) setShowMenu(false);
        else onClose();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, showComments, showMenu]);

  // Swipe detection
  const touchStartY = useRef(0);
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 100 && !showComments) onClose();
    if (deltaY < -100 && !showComments) setShowComments(true);
  }

  // ==================== INTERACTIONS ====================

  async function toggleLike() {
    if (!currentUser || !drop) return;
    // Optimistic update
    setDrops(prev => prev.map((d, i) =>
      i === currentIndex
        ? { ...d, isLiked: !d.isLiked, likesCount: d.likesCount + (d.isLiked ? -1 : 1) }
        : d
    ));
    if (!drop.isLiked) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 600);
    }
    try {
      await apiFetch(`/api/drops/${drop.id}/like`, { method: 'POST' });
    } catch { /* revert silently */ }
  }

  async function handleDelete() {
    if (!drop) return;
    setShowMenu(false);
    try {
      const res = await apiFetch(`/api/drops/${drop.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDeleted?.(drop.id);
        const newDrops = drops.filter((_, i) => i !== currentIndex);
        if (newDrops.length === 0) {
          onClose();
        } else {
          setDrops(newDrops);
          setCurrentIndex(Math.min(currentIndex, newDrops.length - 1));
        }
      }
    } catch { /* ignore */ }
  }

  async function handleRepost() {
    if (!drop) return;
    setShowMenu(false);
    try {
      const res = await apiFetch(`/api/drops/${drop.id}/repost`, { method: 'POST' });
      if (res.ok) {
        // Show brief feedback
      }
    } catch { /* ignore */ }
  }

  // Comments
  async function loadComments() {
    if (!drop) return;
    try {
      const res = await apiFetch(`/api/drops/${drop.id}/comments`);
      if (res.ok) setComments(await res.json());
    } catch { /* ignore */ }
  }

  function openComments() {
    setShowComments(true);
    setShowMenu(false);
    loadComments();
    setTimeout(() => commentInputRef.current?.focus(), 200);
  }

  async function sendComment() {
    if (!commentText.trim() || !drop || sendingComment) return;
    setSendingComment(true);
    try {
      const res = await apiFetch(`/api/drops/${drop.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [...prev, newComment]);
        setCommentText('');
        setDrops(prev => prev.map((d, i) =>
          i === currentIndex ? { ...d, commentsCount: d.commentsCount + 1 } : d
        ));
      }
    } catch { /* ignore */ }
    setSendingComment(false);
  }

  if (!drop) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Container 9:16 */}
      <div
        style={{
          position: 'relative', width: '100%', maxWidth: '420px',
          height: '100%', maxHeight: '100vh',
          aspectRatio: '9/16',
          background: '#0A0A0F', overflow: 'hidden',
          margin: '0 auto',
        }}
        onClick={handleTap}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Progress bars */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          display: 'flex', gap: '3px', padding: '8px 8px 0',
        }}>
          {drops.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: '2px', borderRadius: '1px',
              background: 'rgba(255,255,255,0.2)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: '1px',
                background: '#fff',
                width: i < currentIndex ? '100%' : i === currentIndex ? `${progress * 100}%` : '0%',
                transition: i === currentIndex ? 'none' : 'width 200ms',
              }} />
            </div>
          ))}
        </div>

        {/* Header: user info + actions */}
        <div style={{
          position: 'absolute', top: '18px', left: '12px', right: '12px', zIndex: 10,
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden',
            background: user.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '13px', flexShrink: 0,
          }}>
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user.displayName[0].toUpperCase()
            }
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{user.username}</span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{timeAgoShort(drop.createdAt)}</span>
          <div style={{ flex: 1 }} />

          {/* Three dots menu */}
          <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            color: '#fff', fontSize: '20px', lineHeight: 1,
          }}>•••</button>

          {/* Close */}
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            color: '#fff', fontSize: '24px', lineHeight: 1,
          }}>&times;</button>
        </div>

        {/* Dropdown menu */}
        {showMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', top: '56px', right: '12px', zIndex: 20,
              background: '#1A1A28', borderRadius: '12px', overflow: 'hidden',
              border: '1px solid rgba(148,148,172,0.12)',
              minWidth: '180px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {isOwner && (
              <button onClick={handleDelete} style={{
                width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                color: '#FF4D6A', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                Excluir Drop
              </button>
            )}
            {!isOwner && (
              <button onClick={handleRepost} style={{
                width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                color: '#F0F0F8', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
                Repostar
              </button>
            )}
            <button onClick={() => setShowMenu(false)} style={{
              width: '100%', padding: '14px 16px', background: 'none', border: 'none',
              color: '#9494AC', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              textAlign: 'left', borderTop: '1px solid rgba(148,148,172,0.08)',
            }}>
              Cancelar
            </button>
          </div>
        )}

        {/* Media */}
        {isVideo ? (
          <video
            ref={videoRef}
            src={drop.mediaUrl}
            autoPlay
            playsInline
            muted={false}
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={handleVideoEnded}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <img
            src={drop.mediaUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Double-tap heart animation */}
        {likeAnimating && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 15, pointerEvents: 'none',
            animation: 'dropHeartPop 600ms ease forwards',
          }}>
            <svg width={80} height={80} viewBox="0 0 24 24" fill="#FF4D6A" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </div>
        )}

        {/* Right-side action buttons */}
        <div style={{
          position: 'absolute', right: '12px', bottom: drop.caption ? '100px' : '60px',
          zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
        }}>
          {/* Like */}
          <button onClick={(e) => { e.stopPropagation(); toggleLike(); }} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          }}>
            <svg width={26} height={26} viewBox="0 0 24 24"
              fill={drop.isLiked ? '#FF4D6A' : 'none'}
              stroke={drop.isLiked ? '#FF4D6A' : '#fff'}
              strokeWidth={2}
              style={{ transition: 'all 200ms', transform: drop.isLiked ? 'scale(1.1)' : 'scale(1)' }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            {drop.likesCount > 0 && (
              <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>{drop.likesCount}</span>
            )}
          </button>

          {/* Comment */}
          <button onClick={(e) => { e.stopPropagation(); openComments(); }} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            {drop.commentsCount > 0 && (
              <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>{drop.commentsCount}</span>
            )}
          </button>

          {/* Repost (non-owner) */}
          {!isOwner && (
            <button onClick={(e) => { e.stopPropagation(); handleRepost(); }} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
                <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
              </svg>
            </button>
          )}

          {/* Delete (owner) */}
          {isOwner && (
            <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#FF4D6A" strokeWidth={2}>
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          )}
        </div>

        {/* Caption */}
        {drop.caption && !showComments && (
          <div style={{
            position: 'absolute', bottom: '40px', left: '16px', right: '56px', zIndex: 10,
            background: 'rgba(0,0,0,0.5)', borderRadius: '12px', padding: '12px 16px',
            backdropFilter: 'blur(8px)',
          }}>
            <CaptionText text={drop.caption} />
          </div>
        )}

        {/* Quick reply bar (non-owner, when comments panel is closed) */}
        {!isOwner && !showComments && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: '0', left: '0', right: '0', zIndex: 10,
              padding: '12px 16px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            }}
          >
            <div
              onClick={openComments}
              style={{
                padding: '10px 16px', borderRadius: '24px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.5)', fontSize: '14px',
                cursor: 'text', backdropFilter: 'blur(8px)',
              }}
            >
              Enviar mensagem...
            </div>
          </div>
        )}

        {/* Comments panel (slide up) */}
        {showComments && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
              background: '#141420', borderRadius: '16px 16px 0 0',
              maxHeight: '60%', display: 'flex', flexDirection: 'column',
              animation: 'slideUp 250ms ease',
            }}
          >
            {/* Handle bar */}
            <div style={{
              display: 'flex', justifyContent: 'center', padding: '10px 0 4px',
            }}>
              <div style={{
                width: '36px', height: '4px', borderRadius: '2px',
                background: 'rgba(148,148,172,0.3)',
              }} />
            </div>

            {/* Title */}
            <div style={{
              padding: '8px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid rgba(148,148,172,0.08)',
            }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F8' }}>
                {isOwner ? 'Mensagens' : `Responder a ${user.displayName.split(' ')[0]}`}
              </span>
              <button onClick={() => setShowComments(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9494AC', fontSize: '20px', lineHeight: 1,
              }}>&times;</button>
            </div>

            {/* Comments list */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '12px 16px',
              display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
              {comments.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '24px 0', color: '#5C5C72', fontSize: '13px',
                }}>
                  {isOwner ? 'Nenhuma mensagem ainda.' : 'Envie uma mensagem privada sobre este drop.'}
                </div>
              )}
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden',
                    background: '#1A1A28', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {c.user.avatarUrl
                      ? <img src={c.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ color: '#9494AC', fontSize: '11px', fontWeight: 700 }}>{c.user.displayName[0]}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#F0F0F8' }}>{c.user.username}</span>
                      <span style={{ fontSize: '10px', color: '#5C5C72' }}>{timeAgoShort(c.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#D0D0E0', margin: '2px 0 0', lineHeight: 1.4 }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment input */}
            <div style={{
              padding: '12px 16px', borderTop: '1px solid rgba(148,148,172,0.08)',
              display: 'flex', gap: '10px', alignItems: 'center',
            }}>
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendComment()}
                placeholder={isOwner ? 'Responder...' : `Mensagem para ${user.displayName.split(' ')[0]}...`}
                maxLength={500}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: '24px',
                  background: 'rgba(148,148,172,0.08)',
                  border: '1px solid rgba(148,148,172,0.12)',
                  color: '#F0F0F8', fontSize: '14px', outline: 'none',
                }}
              />
              <button
                onClick={sendComment}
                disabled={!commentText.trim() || sendingComment}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: commentText.trim() ? '#FF6B35' : '#5C5C72',
                  fontWeight: 700, fontSize: '14px', padding: '8px',
                  transition: 'color 200ms',
                }}
              >
                Enviar
              </button>
            </div>
          </div>
        )}

        {/* Gradient overlays */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '120px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
          pointerEvents: 'none', zIndex: 5,
        }} />
        {!showComments && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
            pointerEvents: 'none', zIndex: 5,
          }} />
        )}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes dropHeartPop {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
          60% { transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -60%) scale(1.2); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
