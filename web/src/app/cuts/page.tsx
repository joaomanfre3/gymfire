'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken, getUser } from '@/lib/api';

interface Cut {
  id: string;
  videoUrl: string;
  caption: string | null;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
  likes: number;
  comments: number;
  isLiked: boolean;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

// Icons
function HeartIcon({ filled }: { filled: boolean }) {
  return filled
    ? <svg width={28} height={28} viewBox="0 0 24 24" fill="#FF4D6A" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
    : <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
}
function CommentIcon() { return <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>; }
function ShareIcon() { return <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>; }
function MusicIcon() { return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>; }
function PlusIcon() { return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#0A0A0F" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function FilmEmptyIcon() { return <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={1}><rect x="2" y="2" width="20" height="20" rx="2" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /></svg>; }

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function CutsPage() {
  const router = useRouter();
  const currentUser = getUser();
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  // Comments drawer
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCuts();
  }, []);

  async function loadCuts(cursor?: string) {
    try {
      const url = cursor ? `/api/cuts?cursor=${cursor}` : '/api/cuts';
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setCuts(prev => cursor ? [...prev, ...data.cuts] : data.cuts);
        setNextCursor(data.nextCursor);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  // Snap scroll handler
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const index = Math.round(container.scrollTop / container.clientHeight);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      setShowComments(false);
    }
    // Load more when near end
    if (index >= cuts.length - 3 && nextCursor) {
      loadCuts(nextCursor);
      setNextCursor(null);
    }
  }, [currentIndex, cuts.length, nextCursor]);

  // Auto play/pause videos
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (i === currentIndex) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [currentIndex]);

  // Like
  async function toggleLike(cutId: string) {
    if (!getToken()) { router.push('/login'); return; }
    setCuts(prev => prev.map(c =>
      c.id === cutId ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 } : c
    ));
    try {
      await apiFetch(`/api/cuts/${cutId}/like`, { method: 'POST' });
    } catch { /* ignore */ }
  }

  // Double tap to like
  const lastTap = useRef(0);
  function handleDoubleTap(cutId: string) {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      const cut = cuts.find(c => c.id === cutId);
      if (cut && !cut.isLiked) toggleLike(cutId);
    }
    lastTap.current = now;
  }

  // Comments
  async function openComments(cutId: string) {
    setShowComments(true);
    setLoadingComments(true);
    setComments([]);
    try {
      const res = await apiFetch(`/api/cuts/${cutId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch { /* ignore */ }
    setLoadingComments(false);
    setTimeout(() => commentInputRef.current?.focus(), 200);
  }

  async function postComment() {
    const cut = cuts[currentIndex];
    if (!cut || !newComment.trim() || !getToken()) return;
    const content = newComment.trim();
    setNewComment('');
    try {
      const res = await apiFetch(`/api/cuts/${cut.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments(prev => [comment, ...prev]);
        setCuts(prev => prev.map(c => c.id === cut.id ? { ...c, comments: c.comments + 1 } : c));
      }
    } catch { /* ignore */ }
  }

  // Empty state
  if (!loading && cuts.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <FilmEmptyIcon />
        <p style={{ color: '#F0F0F8', margin: '16px 0 6px', fontSize: '18px', fontWeight: 700 }}>Nenhum cut ainda</p>
        <p style={{ color: '#5C5C72', margin: '0 0 20px', fontSize: '13px', textAlign: 'center', maxWidth: '280px' }}>
          Seja o primeiro a postar um video curto!
        </p>
        {getToken() && (
          <Link href="/cuts/create" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#FF6B35', color: '#0A0A0F', padding: '12px 24px', borderRadius: '10px',
            fontWeight: 700, fontSize: '14px', textDecoration: 'none',
          }}>
            <PlusIcon /> Criar Cut
          </Link>
        )}
        <Link href="/" style={{ color: '#9494AC', fontSize: '13px', marginTop: '16px', textDecoration: 'none' }}>
          Voltar ao Feed
        </Link>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#5C5C72', fontSize: '14px' }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 50 }}>
      {/* Scroll container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: '100%', overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="hide-scrollbar"
      >
        {cuts.map((cut, i) => (
          <div
            key={cut.id}
            onClick={() => handleDoubleTap(cut.id)}
            style={{
              height: '100vh', width: '100%',
              scrollSnapAlign: 'start',
              position: 'relative', background: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* Video */}
            <video
              ref={el => { if (el) videoRefs.current.set(i, el); }}
              src={cut.videoUrl}
              loop
              playsInline
              muted={i !== currentIndex}
              preload={Math.abs(i - currentIndex) <= 1 ? 'auto' : 'none'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Right side actions */}
            <div style={{
              position: 'absolute', right: '12px', bottom: '120px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
              zIndex: 10,
            }}>
              {/* Avatar */}
              <Link href={`/profile/${cut.user.username}`} style={{
                width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden',
                border: '2px solid #fff', display: 'block',
                background: cut.user.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
              }}>
                {cut.user.avatarUrl ? (
                  <img src={cut.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px' }}>
                    {cut.user.displayName[0].toUpperCase()}
                  </div>
                )}
              </Link>

              {/* Like */}
              <button onClick={(e) => { e.stopPropagation(); toggleLike(cut.id); }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: 0,
              }}>
                <HeartIcon filled={cut.isLiked} />
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>{formatCount(cut.likes)}</span>
              </button>

              {/* Comment */}
              <button onClick={(e) => { e.stopPropagation(); openComments(cut.id); }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: 0,
              }}>
                <CommentIcon />
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>{formatCount(cut.comments)}</span>
              </button>

              {/* Share */}
              <button style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: 0,
              }}>
                <ShareIcon />
              </button>
            </div>

            {/* Bottom info */}
            <div style={{
              position: 'absolute', bottom: '16px', left: '12px', right: '70px',
              zIndex: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Link href={`/profile/${cut.user.username}`} style={{
                  color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none',
                }}>
                  @{cut.user.username}
                </Link>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{timeAgo(cut.createdAt)}</span>
              </div>
              {cut.caption && (
                <p style={{
                  color: '#fff', fontSize: '13px', margin: 0, lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden', textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                }}>
                  {cut.caption}
                </p>
              )}
            </div>

            {/* Gradient overlays */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)', pointerEvents: 'none', zIndex: 5 }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', pointerEvents: 'none', zIndex: 5 }} />
          </div>
        ))}
      </div>

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
      }}>
        <Link href="/" style={{
          color: '#fff', textDecoration: 'none', fontSize: '22px', fontWeight: 900,
          textShadow: '0 1px 6px rgba(0,0,0,0.5)',
        }}>
          Cuts
        </Link>
        {getToken() && (
          <Link href="/cuts/create" style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#FF6B35', display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none',
          }}>
            <PlusIcon />
          </Link>
        )}
      </div>

      {/* Comments drawer */}
      {showComments && (
        <div
          onClick={() => setShowComments(false)}
          style={{
            position: 'absolute', inset: 0, zIndex: 30,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxHeight: '60vh',
              background: '#141420', borderRadius: '20px 20px 0 0',
              display: 'flex', flexDirection: 'column',
              animation: 'slideUp 200ms ease',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px', borderBottom: '1px solid rgba(148,148,172,0.08)',
            }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F8' }}>
                Comentarios ({cuts[currentIndex]?.comments || 0})
              </span>
              <button onClick={() => setShowComments(false)} style={{
                background: 'none', border: 'none', color: '#5C5C72', fontSize: '20px', cursor: 'pointer',
              }}>&times;</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
              {loadingComments ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#5C5C72', fontSize: '13px' }}>Carregando...</div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#5C5C72', fontSize: '13px' }}>Nenhum comentario ainda.</div>
              ) : (
                comments.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: c.user.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: '12px', overflow: 'hidden',
                    }}>
                      {c.user.avatarUrl
                        ? <img src={c.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : c.user.displayName[0].toUpperCase()
                      }
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#F0F0F8' }}>{c.user.username}</span>
                      <span style={{ fontSize: '11px', color: '#5C5C72', marginLeft: '8px' }}>{timeAgo(c.createdAt)}</span>
                      <p style={{ fontSize: '13px', color: '#9494AC', margin: '4px 0 0', lineHeight: 1.4 }}>{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {getToken() && (
              <div style={{
                padding: '12px 16px', borderTop: '1px solid rgba(148,148,172,0.08)',
                display: 'flex', gap: '10px', alignItems: 'center',
              }}>
                <input
                  ref={commentInputRef}
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); postComment(); } }}
                  placeholder="Comentar..."
                  style={{
                    flex: 1, padding: '10px 16px', borderRadius: '24px',
                    background: '#1A1A28', border: '1px solid rgba(148,148,172,0.08)',
                    color: '#F0F0F8', fontSize: '13px', outline: 'none',
                  }}
                />
                <button onClick={postComment} disabled={!newComment.trim()} style={{
                  background: newComment.trim() ? '#FF6B35' : '#1A1A28',
                  border: 'none', borderRadius: '50%', width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: newComment.trim() ? 'pointer' : 'default', flexShrink: 0,
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="#0A0A0F" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
