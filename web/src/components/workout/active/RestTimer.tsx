'use client';

import type { WorkoutAction } from '@/lib/workout-types';
import { formatWorkoutTimer } from '@/lib/workout-utils';

interface Props {
  remaining: number;
  duration: number;
  dispatch: React.Dispatch<WorkoutAction>;
}

export default function RestTimer({ remaining, duration, dispatch }: Props) {
  const progress = duration > 0 ? (1 - remaining / duration) * 100 : 0;

  return (
    <div style={{
      background: '#141420',
      borderRadius: '14px',
      border: '1px solid rgba(0, 212, 255, 0.15)',
      padding: '16px 20px',
      marginBottom: '12px',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: '#00D4FF', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Descanso
      </span>
      <div style={{
        fontSize: '32px',
        fontWeight: 800,
        color: '#F0F0F8',
        margin: '6px 0',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {formatWorkoutTimer(remaining)}
      </div>

      {/* Progress bar */}
      <div style={{
        height: '4px',
        borderRadius: '2px',
        background: '#1A1A28',
        overflow: 'hidden',
        margin: '8px 0 12px',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          borderRadius: '2px',
          background: 'linear-gradient(90deg, #00D4FF, rgba(0, 212, 255, 0.5))',
          transition: 'width 1s linear',
        }} />
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          onClick={() => dispatch({ type: 'SKIP_REST' })}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid rgba(148, 148, 172, 0.12)',
            background: 'transparent',
            color: '#9494AC',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Pular
        </button>
        <button
          onClick={() => dispatch({ type: 'ADD_REST_TIME', seconds: 30 })}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            background: 'rgba(0, 212, 255, 0.08)',
            color: '#00D4FF',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          +30s
        </button>
      </div>
    </div>
  );
}
