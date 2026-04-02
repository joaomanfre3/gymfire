'use client';

import type { WorkoutSet, WorkoutAction } from '@/lib/workout-types';
import { CheckIcon } from '../shared/WorkoutIcons';

interface Props {
  set: WorkoutSet;
  exerciseId: string;
  dispatch: React.Dispatch<WorkoutAction>;
}

export default function SetRow({ set, exerciseId, dispatch }: Props) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1fr 1fr 48px',
      gap: '8px',
      alignItems: 'center',
      padding: '6px 0',
    }}>
      {/* Set number */}
      <span style={{
        fontSize: '13px',
        fontWeight: 600,
        color: set.completed ? '#CCFF00' : '#5C5C72',
        textAlign: 'center',
      }}>
        {set.setNumber}
      </span>

      {/* Weight */}
      <input
        type="number"
        placeholder="kg"
        value={set.weight ?? ''}
        onChange={e => dispatch({
          type: 'UPDATE_SET', exerciseId, setId: set.id,
          field: 'weight', value: e.target.value ? Number(e.target.value) : null,
        })}
        style={{
          background: '#1A1A28',
          border: '1px solid rgba(148, 148, 172, 0.08)',
          borderRadius: '8px',
          padding: '8px 10px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#F0F0F8',
          textAlign: 'center',
          outline: 'none',
          width: '100%',
          transition: 'border-color 200ms',
        }}
      />

      {/* Reps */}
      <input
        type="number"
        placeholder="reps"
        value={set.reps ?? ''}
        onChange={e => dispatch({
          type: 'UPDATE_SET', exerciseId, setId: set.id,
          field: 'reps', value: e.target.value ? Number(e.target.value) : null,
        })}
        style={{
          background: '#1A1A28',
          border: '1px solid rgba(148, 148, 172, 0.08)',
          borderRadius: '8px',
          padding: '8px 10px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#F0F0F8',
          textAlign: 'center',
          outline: 'none',
          width: '100%',
          transition: 'border-color 200ms',
        }}
      />

      {/* Complete button */}
      <button
        onClick={() => dispatch({ type: 'COMPLETE_SET', exerciseId, setId: set.id })}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          border: 'none',
          background: set.completed ? '#CCFF00' : '#1A1A28',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 200ms ease',
          margin: '0 auto',
        }}
      >
        <CheckIcon size={16} color={set.completed ? '#0A0A0F' : '#5C5C72'} />
      </button>
    </div>
  );
}
