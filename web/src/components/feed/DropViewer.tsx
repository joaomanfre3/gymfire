'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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
}

interface Props {
  user: DropUser;
  onClose: () => void;
  onViewed: (dropId: string) => void;
}

function timeAgoShort(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h`;
}

export default function DropViewer({ user, onClose, onViewed }: Props) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    // Start at first unseen drop
    const firstUnseen = user.drops.findIndex(d => !d.seen);
    return firstUnseen >= 0 ? firstUnseen : 0;
  });
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const drop = user.drops[currentIndex];
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
    if (!drop || paused || isVideo) return;
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
  }, [currentIndex, paused, isVideo]);

  // Video progress tracking
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
    if (currentIndex < user.drops.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }

  function goPrev() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }

  // Tap to navigate: left 30% = prev, right 70% = next
  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) {
      goPrev();
    } else {
      goNext();
    }
  }

  // Hold to pause
  function handlePointerDown() {
    setPaused(true);
    if (videoRef.current) videoRef.current.pause();
  }

  function handlePointerUp() {
    setPaused(false);
    if (videoRef.current) videoRef.current.play();
  }

  // Keyboard
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex]);

  // Swipe detection
  const touchStartY = useRef(0);
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 100) onClose(); // swipe down to close
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
          {user.drops.map((_, i) => (
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

        {/* User info */}
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
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            color: '#fff', fontSize: '24px', lineHeight: 1,
          }}>&times;</button>
        </div>

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
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
            }}
          />
        ) : (
          <img
            src={drop.mediaUrl}
            alt=""
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
            }}
          />
        )}

        {/* Caption */}
        {drop.caption && (
          <div style={{
            position: 'absolute', bottom: '40px', left: '16px', right: '16px', zIndex: 10,
            background: 'rgba(0,0,0,0.5)', borderRadius: '12px', padding: '12px 16px',
            backdropFilter: 'blur(8px)',
          }}>
            <p style={{ color: '#fff', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>{drop.caption}</p>
          </div>
        )}

        {/* Gradient overlays */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '120px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
          pointerEvents: 'none', zIndex: 5,
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
          pointerEvents: 'none', zIndex: 5,
        }} />
      </div>
    </div>
  );
}
