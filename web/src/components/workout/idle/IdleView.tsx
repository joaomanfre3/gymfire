'use client';

import { useState, useEffect } from 'react';
import { apiFetch, getToken } from '@/lib/api';
import type { WorkoutAction, WorkoutExercise } from '@/lib/workout-types';
import { generateId } from '@/lib/workout-utils';
import { PlayIcon, DumbbellIcon, TimerIcon, ChevronRightIcon } from '../shared/WorkoutIcons';

interface Props {
  dispatch: React.Dispatch<WorkoutAction>;
}

interface Routine {
  id: string;
  name: string;
  description?: string;
  sets: Array<{ exercise: { id: string; name: string; muscleGroup: string } }>;
}


export default function IdleView({ dispatch }: Props) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const loggedIn = !!getToken();

  useEffect(() => {
    if (loggedIn) {
      apiFetch('/api/routines').then(r => r.ok ? r.json() : []).then(setRoutines).catch(() => {});
    }
  }, [loggedIn]);

  const startFromRoutine = (routine: Routine) => {
    const exerciseMap = new Map<string, { id: string; name: string; muscleGroup: string }>();
    (routine.sets || []).forEach(s => {
      if (!exerciseMap.has(s.exercise.id)) {
        exerciseMap.set(s.exercise.id, s.exercise);
      }
    });

    const exercises: WorkoutExercise[] = Array.from(exerciseMap.values()).map(ex => ({
      id: generateId(),
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: [1, 2, 3].map(n => ({
        id: generateId(), setNumber: n, weight: null, reps: null, completed: false, isWarmup: false, isPR: false,
      })),
    }));

    dispatch({ type: 'START_WITH_EXERCISES', exercises });
  };

  return (
    <div style={{ padding: '20px 16px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Quick Start */}
      <div style={{
        background: '#141420',
        borderRadius: '16px',
        border: '1px solid rgba(148, 148, 172, 0.08)',
        padding: '24px 20px',
        marginBottom: '20px',
        textAlign: 'center',
      }}>
        <DumbbellIcon size={32} color="#FF6B35" />
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F8', margin: '12px 0 6px' }}>
          Comece seu treino
        </h2>
        <p style={{ fontSize: '13px', color: '#9494AC', margin: '0 0 20px', lineHeight: 1.5 }}>
          Inicie um treino vazio e adicione exercícios conforme treina
        </p>
        <button
          onClick={() => dispatch({ type: 'START_EMPTY' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FF6B35',
            color: '#0A0A0F',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 28px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'opacity 200ms ease',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <PlayIcon size={18} color="#0A0A0F" />
          Iniciar Treino Vazio
        </button>
      </div>

      {/* User Routines */}
      {loggedIn && routines.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Minhas Rotinas
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#FF6B35', cursor: 'pointer' }}>Ver mais</span>
          </div>
          <div className="hide-scrollbar" style={{ display: 'flex', gap: '10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {routines.map(r => (
              <button
                key={r.id}
                onClick={() => startFromRoutine(r)}
                style={{
                  minWidth: '150px',
                  background: '#141420',
                  border: '1px solid rgba(148, 148, 172, 0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8', marginBottom: '6px' }}>{r.name}</div>
                <div style={{ fontSize: '12px', color: '#9494AC', marginBottom: '4px' }}>
                  {new Set((r.sets || []).map(s => s.exercise.id)).size} exercícios
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '11px', fontWeight: 600, color: '#FF6B35', marginTop: '6px',
                }}>
                  Iniciar <ChevronRightIcon size={12} color="#FF6B35" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
