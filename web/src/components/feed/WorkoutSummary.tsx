'use client';

import type { FeedPost } from '@/lib/feed-types';

interface Props {
  post: FeedPost;
}

export default function WorkoutSummary({ post }: Props) {
  // Personal record rendering
  if (post.type === 'personal_record' && post.personalRecord) {
    return (
      <div style={{
        margin: '0 16px 10px',
        background: '#1A1A28',
        borderRadius: '12px',
        border: '1px solid rgba(148, 148, 172, 0.08)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        overflow: 'hidden',
      }}>
        {[
          { label: 'Exercício', value: post.personalRecord.exercise },
          { label: 'Peso', value: post.personalRecord.newValue.split(' ')[0] },
          { label: 'Reps', value: post.personalRecord.newValue.split('x ')[1] || '-' },
          { label: 'Anterior', value: post.personalRecord.previousValue.split(' ')[0] },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '10px 0',
            textAlign: 'center',
            position: 'relative',
          }}>
            {i < 3 && <div style={{
              position: 'absolute',
              right: 0,
              top: '20%',
              height: '60%',
              width: '1px',
              background: 'rgba(148, 148, 172, 0.08)',
            }} />}
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#5C5C72',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '3px',
            }}>{s.label}</div>
            <div style={{
              fontSize: '15px',
              fontWeight: 700,
              color: i === 3 ? '#10B981' : '#F0F0F8',
            }}>
              {i === 3 && <span style={{ fontSize: '11px', marginRight: '2px' }}>↑</span>}
              {s.value}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Workout/Run rendering
  if (!post.workout || (post.type !== 'workout' && post.type !== 'run')) return null;

  const w = post.workout;
  const isRun = post.type === 'run';

  const stats = isRun
    ? [
        { label: 'Distância', value: w.distance || '-' },
        { label: 'Pace', value: w.pace || '-' },
        { label: 'Duração', value: w.duration },
        { label: 'Calorias', value: String(w.calories) },
      ]
    : [
        { label: 'Duração', value: w.duration },
        { label: 'Volume', value: w.volume || '-' },
        { label: 'Séries', value: String(w.sets || 0) },
        { label: 'Calorias', value: String(w.calories) },
      ];

  return (
    <div style={{
      margin: '0 16px 10px',
      background: '#1A1A28',
      borderRadius: '12px',
      border: '1px solid rgba(148, 148, 172, 0.08)',
      display: 'grid',
      gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
      overflow: 'hidden',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          padding: '10px 0',
          textAlign: 'center',
          position: 'relative',
        }}>
          {i < stats.length - 1 && <div style={{
            position: 'absolute',
            right: 0,
            top: '20%',
            height: '60%',
            width: '1px',
            background: 'rgba(148, 148, 172, 0.08)',
          }} />}
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            color: '#5C5C72',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '3px',
          }}>{s.label}</div>
          <div style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#F0F0F8',
          }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
