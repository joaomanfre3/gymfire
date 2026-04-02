'use client';

import type { WorkoutExercise, WorkoutAction } from '@/lib/workout-types';
import { PlusIcon, TrashIcon } from '../shared/WorkoutIcons';
import SetRow from './SetRow';

interface Props {
  exercise: WorkoutExercise;
  dispatch: React.Dispatch<WorkoutAction>;
}

export default function ExerciseCard({ exercise, dispatch }: Props) {
  const completedSets = exercise.sets.filter(s => s.completed).length;

  return (
    <div style={{
      background: '#141420',
      borderRadius: '14px',
      border: '1px solid rgba(148, 148, 172, 0.08)',
      marginBottom: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px 8px',
      }}>
        <div>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F8' }}>
            {exercise.name}
          </span>
          <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 600, color: '#FF6B35',
              background: 'rgba(255, 107, 53, 0.1)', padding: '2px 8px', borderRadius: '4px',
            }}>
              {exercise.muscleGroup}
            </span>
            <span style={{ fontSize: '11px', color: '#5C5C72' }}>
              {completedSets}/{exercise.sets.length} séries
            </span>
          </div>
        </div>
        <button
          onClick={() => dispatch({ type: 'REMOVE_EXERCISE', exerciseId: exercise.id })}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            opacity: 0.6, transition: 'opacity 200ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
        >
          <TrashIcon />
        </button>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 1fr 48px',
        gap: '8px',
        padding: '4px 16px',
      }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#5C5C72', textTransform: 'uppercase', textAlign: 'center' }}>SET</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#5C5C72', textTransform: 'uppercase', textAlign: 'center' }}>KG</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#5C5C72', textTransform: 'uppercase', textAlign: 'center' }}>REPS</span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#5C5C72', textTransform: 'uppercase', textAlign: 'center' }}></span>
      </div>

      {/* Sets */}
      <div style={{ padding: '0 16px' }}>
        {exercise.sets.map(set => (
          <SetRow key={set.id} set={set} exerciseId={exercise.id} dispatch={dispatch} />
        ))}
      </div>

      {/* Add set button */}
      <button
        onClick={() => dispatch({ type: 'ADD_SET', exerciseId: exercise.id })}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          width: '100%',
          padding: '12px',
          background: 'transparent',
          border: 'none',
          borderTop: '1px solid rgba(148, 148, 172, 0.08)',
          color: '#FF6B35',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 107, 53, 0.04)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <PlusIcon size={14} color="#FF6B35" />
        Adicionar Série
      </button>
    </div>
  );
}
