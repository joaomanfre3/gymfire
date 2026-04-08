'use client';

import { useState, useCallback } from 'react';
import type { WorkoutState, WorkoutAction } from '@/lib/workout-types';
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';
import { useRestTimer } from '@/hooks/useRestTimer';
import { formatWorkoutTimer, calcTotalVolume, calcTotalSets, formatVolume } from '@/lib/workout-utils';
import { PlusIcon, CheckIcon, XIcon, TimerIcon, FlameIcon } from '../shared/WorkoutIcons';
import ExerciseCard from './ExerciseCard';
import RestTimer from './RestTimer';
import ExercisePicker from './ExercisePicker';

interface Props {
  state: WorkoutState;
  dispatch: React.Dispatch<WorkoutAction>;
}

export default function ActiveView({ state, dispatch }: Props) {
  const elapsed = useWorkoutTimer(state.startTime);
  const [showCancel, setShowCancel] = useState(false);

  const onTick = useCallback(() => dispatch({ type: 'TICK_REST' }), [dispatch]);
  useRestTimer(state.restTimerActive, onTick);

  const volume = calcTotalVolume(state.exercises);
  const completedSets = calcTotalSets(state.exercises);
  const totalSets = state.exercises.reduce((t, e) => t + e.sets.length, 0);
  const exercisesDone = state.exercises.filter(e => e.sets.some(s => s.completed)).length;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Sticky Header */}
      <div style={{
        position: 'sticky',
        top: '64px',
        zIndex: 50,
        background: 'rgba(14, 14, 22, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(148, 148, 172, 0.08)',
        padding: '12px 16px',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8' }}>Treino Ativo</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TimerIcon size={16} color="#FF6B35" />
              <span style={{
                fontSize: '18px', fontWeight: 800, color: '#FF6B35',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {formatWorkoutTimer(elapsed)}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(148,148,172,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
            {[
              { label: 'VOLUME', value: formatVolume(volume) },
              { label: 'SÉRIES', value: `${completedSets}/${totalSets}` },
              { label: 'EXERC.', value: `${exercisesDone}/${state.exercises.length}` },
              { label: 'CAL', value: String(Math.round(elapsed / 60 * 5 + volume / 200)) },
            ].map((s, i) => (
              <div key={i} style={{ background: '#141420', padding: '8px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: 600, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8', marginTop: '2px' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '120px 16px 16px' }}>
        {/* Rest timer */}
        {state.restTimerActive && (
          <RestTimer
            remaining={state.restTimerRemaining}
            duration={state.restTimerDuration}
            dispatch={dispatch}
          />
        )}

        {/* Exercise cards */}
        {state.exercises.map(ex => (
          <ExerciseCard key={ex.id} exercise={ex} dispatch={dispatch} />
        ))}

        {/* Add exercise button */}
        <button
          onClick={() => dispatch({ type: 'OPEN_EXERCISE_PICKER' })}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '16px',
            background: 'transparent',
            border: '2px dashed rgba(255, 107, 53, 0.2)',
            borderRadius: '14px', color: '#FF6B35',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.4)'; e.currentTarget.style.background = 'rgba(255, 107, 53, 0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.2)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <PlusIcon size={18} color="#FF6B35" />
          Adicionar Exercício
        </button>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(14, 14, 22, 0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(148, 148, 172, 0.08)',
        padding: '12px 16px',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowCancel(true)}
            style={{
              flex: 1, padding: '14px', borderRadius: '12px',
              border: '1px solid rgba(255, 77, 106, 0.2)', background: 'transparent',
              color: '#FF4D6A', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <XIcon size={16} color="#FF4D6A" />
            Cancelar
          </button>
          <button
            onClick={() => dispatch({ type: 'FINISH_WORKOUT' })}
            style={{
              flex: 2, padding: '14px', borderRadius: '12px',
              border: 'none', background: '#FF6B35',
              color: '#0A0A0F', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <CheckIcon size={16} color="#0A0A0F" />
            Finalizar Treino
          </button>
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {showCancel && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(10, 10, 15, 0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#141420', borderRadius: '16px',
            border: '1px solid rgba(148, 148, 172, 0.12)',
            padding: '24px', maxWidth: '340px', width: '100%', textAlign: 'center',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8', margin: '0 0 8px' }}>
              Cancelar treino?
            </h3>
            <p style={{ fontSize: '13px', color: '#9494AC', margin: '0 0 20px' }}>
              Todo o progresso será perdido.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowCancel(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '1px solid rgba(148, 148, 172, 0.12)', background: 'transparent',
                  color: '#9494AC', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}
              >Voltar</button>
              <button
                onClick={() => { dispatch({ type: 'CANCEL_WORKOUT' }); setShowCancel(false); }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: 'none', background: '#FF4D6A',
                  color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                }}
              >Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise picker modal */}
      {state.exercisePickerOpen && <ExercisePicker dispatch={dispatch} />}
    </div>
  );
}
