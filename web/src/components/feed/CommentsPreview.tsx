'use client';

import type { FeedCommentPreview } from '@/lib/feed-types';
import { timeAgo } from '@/lib/format';

interface Props {
  totalComments: number;
  preview?: FeedCommentPreview;
  createdAt: string;
}

export default function CommentsPreview({ totalComments, preview, createdAt }: Props) {
  return (
    <div>
      {/* Comments preview */}
      <div style={{ padding: '0 16px 8px' }}>
        {totalComments > 1 && (
          <button style={{
            fontSize: '13px',
            fontWeight: 400,
            color: '#5C5C72',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
            marginBottom: '4px',
            display: 'block',
          }}>
            Ver todos os {totalComments} comentários
          </button>
        )}

        {preview && (
          <div style={{
            display: 'flex',
            gap: '4px',
            fontSize: '13px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontWeight: 600, color: '#F0F0F8', flexShrink: 0 }}>{preview.username}</span>
            <span style={{ fontWeight: 400, color: '#9494AC', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview.text}</span>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div style={{
        fontSize: '10px',
        fontWeight: 400,
        color: '#5C5C72',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        padding: '2px 16px 14px',
      }}>
        {timeAgo(createdAt)}
      </div>
    </div>
  );
}
