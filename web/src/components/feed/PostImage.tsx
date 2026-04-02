'use client';

import { useState, useCallback } from 'react';
import { useDoubleTap } from '@/hooks/useDoubleTap';
import { HeartFilledIcon, ChevronLeftIcon, ChevronRightIcon } from './FeedIcons';

interface Props {
  images: string[];
  isLiked: boolean;
  onLike: () => void;
}

export default function PostImage({ images, isLiked, onLike }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHeart, setShowHeart] = useState(false);

  const triggerLike = useCallback(() => {
    if (!isLiked) onLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  }, [isLiked, onLike]);

  const handleDoubleTap = useDoubleTap(triggerLike);

  const prev = () => setCurrentIndex(i => Math.max(0, i - 1));
  const next = () => setCurrentIndex(i => Math.min(images.length - 1, i + 1));

  return (
    <div
      style={{
        width: '100%',
        maxHeight: '580px',
        overflow: 'hidden',
        background: '#1A1A28',
        position: 'relative',
        cursor: 'pointer',
      }}
      onClick={handleDoubleTap}
    >
      <img
        src={images[currentIndex]}
        alt=""
        width={600}
        height={750}
        style={{
          width: '100%',
          height: 'auto',
          objectFit: 'cover',
          maxHeight: '580px',
          display: 'block',
        }}
      />

      {/* Double-tap heart animation */}
      {showHeart && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'heartPop 1s ease-out forwards',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          <HeartFilledIcon size={80} color="#FF4D6A" />
        </div>
      )}

      {/* Carousel navigation */}
      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              className="carousel-nav"
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 200ms ease',
              }}
            >
              <ChevronLeftIcon size={16} color="#F0F0F8" />
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              className="carousel-nav"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 200ms ease',
              }}
            >
              <ChevronRightIcon size={16} color="#F0F0F8" />
            </button>
          )}

          {/* Dots */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '4px',
          }}>
            {images.map((_, i) => (
              <div key={i} style={{
                width: i === currentIndex ? '7px' : '6px',
                height: i === currentIndex ? '7px' : '6px',
                borderRadius: '50%',
                background: i === currentIndex ? '#F0F0F8' : 'rgba(255,255,255,0.4)',
                transition: 'all 200ms ease',
              }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
