'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { FeedPost } from '@/lib/feed-types';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { apiFetch, getToken, getUser } from '@/lib/api';
import PostHeader from './PostHeader';
import WorkoutSummary from './WorkoutSummary';
import PostImage from './PostImage';
import EngagementBar from './EngagementBar';
import ShareModal from './ShareModal';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

interface Props {
  post: FeedPost;
  currentUserId?: string;
  onLike: (postId: string, unlike: boolean) => void;
  onDelete?: (postId: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function PostCard({ post, currentUserId, onLike, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(post.engagement.isLiked);
  const [likeCount, setLikeCount] = useState(post.engagement.likes);
  const [commentCount, setCommentCount] = useState(post.engagement.comments);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content.text);
  const [postText, setPostText] = useState(post.content.text);

  // Comments inline state
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const { ref, isVisible } = useIntersectionObserver();
  const user = getUser();
  const isOwn = currentUserId === post.author.id;

  const handleLike = useCallback(() => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(c => newLiked ? c + 1 : c - 1);
    onLike(post.id, !newLiked);
  }, [liked, onLike, post.id]);

  const handleToggleComments = useCallback(() => {
    setShowComments(prev => {
      if (!prev) loadComments();
      return !prev;
    });
  }, []);

  async function loadComments() {
    setLoadingComments(true);
    try {
      const res = await apiFetch(`/api/social/posts/${post.id}/comments`);
      if (res.ok) setComments(await res.json());
    } catch { /* ignore */ }
    setLoadingComments(false);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  }

  async function handleSendComment() {
    if (!commentText.trim() || sendingComment || !getToken()) return;
    setSendingComment(true);
    try {
      const res = await apiFetch(`/api/social/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        const c = await res.json();
        setComments(prev => [c, ...prev]);
        setCommentText('');
        setCommentCount(n => n + 1);
      }
    } catch { /* ignore */ }
    setSendingComment(false);
  }

  async function handleEdit() {
    if (!editText.trim()) return;
    try {
      const res = await apiFetch(`/api/social/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: editText.trim() }),
      });
      if (res.ok) {
        setPostText(editText.trim());
        setEditing(false);
      }
    } catch { /* ignore */ }
  }

  async function handleDelete() {
    try {
      const res = await apiFetch(`/api/social/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) onDelete?.(post.id);
    } catch { /* ignore */ }
  }

  const text = postText;
  const isLong = text.length > 180;
  const displayText = isLong && !expanded ? text.slice(0, 180) : text;

  const renderText = (t: string) => {
    const parts = t.split(/(@[\w.]+|#[\w]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@') || part.startsWith('#')) {
        return <span key={i} style={{ color: '#FF6B35', fontWeight: part.startsWith('@') ? 600 : 500, cursor: 'pointer' }}>{part}</span>;
      }
      return part;
    });
  };

  return (
    <div
      ref={ref}
      style={{
        background: '#141420',
        borderBottom: '1px solid rgba(148,148,172,0.08)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 300ms ease, transform 300ms ease',
      }}
    >
      <PostHeader
        author={post.author}
        createdAt={post.createdAt}
        location={post.location}
        isOwn={isOwn}
        onEdit={() => { setEditText(postText); setEditing(true); }}
        onDelete={handleDelete}
      />

      <WorkoutSummary post={post} />

      {/* Text content */}
      {editing ? (
        <div style={{ padding: '0 16px 10px' }}>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            maxLength={500}
            rows={3}
            style={{
              width: '100%', background: '#1A1A28', border: '1px solid rgba(255,107,53,0.3)',
              borderRadius: '10px', padding: '10px 14px', color: '#F0F0F8',
              fontSize: '14px', lineHeight: 1.6, resize: 'none', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(false)} style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              background: 'transparent', border: '1px solid rgba(148,148,172,0.15)',
              color: '#9494AC', cursor: 'pointer',
            }}>Cancelar</button>
            <button onClick={handleEdit} style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
              background: '#FF6B35', border: 'none', color: '#0A0A0F', cursor: 'pointer',
            }}>Salvar</button>
          </div>
        </div>
      ) : text ? (
        <div style={{ padding: '0 16px 10px' }}>
          <p style={{
            fontSize: '14px', fontWeight: 400, color: '#F0F0F8',
            lineHeight: 1.6, margin: 0, wordBreak: 'break-word',
          }}>
            {renderText(displayText)}
            {isLong && !expanded && (
              <button onClick={() => setExpanded(true)} style={{
                background: 'none', border: 'none', color: '#9494AC',
                cursor: 'pointer', fontSize: '14px', padding: 0, marginLeft: '4px',
              }}>... mais</button>
            )}
          </p>
        </div>
      ) : null}

      {/* Images */}
      {post.content.images && post.content.images.length > 0 && (
        <PostImage images={post.content.images} isLiked={liked} onLike={handleLike} />
      )}

      {/* Engagement */}
      <EngagementBar
        likes={likeCount}
        comments={commentCount}
        isLiked={liked}
        xpEarned={post.xpEarned}
        onLike={handleLike}
        onComment={handleToggleComments}
        onShare={() => setShowShare(true)}
      />

      {/* Comment hint */}
      {!showComments && commentCount > 0 && (
        <div style={{ padding: '0 16px 12px' }}>
          <button onClick={handleToggleComments} style={{
            fontSize: '13px', fontWeight: 400, color: '#5C5C72',
            cursor: 'pointer', background: 'none', border: 'none', padding: 0,
          }}>
            Ver {commentCount === 1 ? '1 comentário' : `todos os ${commentCount} comentários`}
          </button>
        </div>
      )}

      {/* Inline comments section */}
      {showComments && (
        <div style={{
          borderTop: '1px solid rgba(148,148,172,0.06)',
          background: '#0E0E16',
        }}>
          {/* Comment input */}
          {getToken() && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 16px',
              borderBottom: '1px solid rgba(148,148,172,0.06)',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #FF6B35, #E05520)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '11px',
              }}>
                {user ? (user.displayName || user.username || '?')[0].toUpperCase() : '?'}
              </div>
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendComment(); }}
                placeholder="Adicionar comentário..."
                maxLength={300}
                style={{
                  flex: 1, background: '#141420', border: '1px solid rgba(148,148,172,0.08)',
                  borderRadius: '20px', padding: '8px 14px',
                  color: '#F0F0F8', fontSize: '13px', outline: 'none',
                }}
              />
              <button
                onClick={handleSendComment}
                disabled={!commentText.trim() || sendingComment}
                style={{
                  background: 'none', border: 'none',
                  color: commentText.trim() ? '#FF6B35' : '#5C5C72',
                  fontWeight: 700, fontSize: '12px', cursor: commentText.trim() ? 'pointer' : 'default',
                  padding: '6px',
                }}
              >
                {sendingComment ? '...' : 'Enviar'}
              </button>
            </div>
          )}

          {/* Comments list */}
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {loadingComments ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#5C5C72', fontSize: '12px' }}>
                Carregando...
              </div>
            ) : comments.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#5C5C72', fontSize: '12px' }}>
                Nenhum comentário ainda.
              </div>
            ) : (
              comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '10px', padding: '10px 16px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #FF6B35, #E05520)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '10px', overflow: 'hidden',
                  }}>
                    {c.user.avatarUrl
                      ? <img src={c.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : c.user.displayName[0].toUpperCase()
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>
                      {c.user.username}
                    </span>
                    <span style={{ fontSize: '11px', color: '#5C5C72', marginLeft: '6px' }}>{timeAgo(c.createdAt)}</span>
                    <p style={{ fontSize: '13px', color: '#C8C8D8', lineHeight: 1.4, margin: '2px 0 0' }}>
                      {c.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Collapse */}
          <button onClick={() => setShowComments(false)} style={{
            display: 'block', width: '100%', padding: '8px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '11px', fontWeight: 600, color: '#5C5C72',
            borderTop: '1px solid rgba(148,148,172,0.06)',
          }}>
            Fechar comentários
          </button>
        </div>
      )}

      {/* Share Modal */}
      {showShare && (
        <ShareModal
          postId={post.id}
          postText={postText}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
