'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import type { WorkoutAction } from '@/lib/workout-types';
import { SearchIcon, XIcon, DumbbellIcon } from '../shared/WorkoutIcons';

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment?: string;
}

interface Props {
  dispatch: React.Dispatch<WorkoutAction>;
}

const muscleGroups = ['Todos', 'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'CORE', 'FULL_BODY'];

const muscleLabels: Record<string, string> = {
  CHEST: 'Peito', BACK: 'Costas', SHOULDERS: 'Ombros', BICEPS: 'Bíceps',
  TRICEPS: 'Tríceps', QUADS: 'Quadríceps', HAMSTRINGS: 'Posterior', GLUTES: 'Glúteos',
  CALVES: 'Panturrilha', CORE: 'Core', ABS: 'Abdômen', FULL_BODY: 'Corpo Inteiro',
  FOREARMS: 'Antebraço', CARDIO: 'Cardio',
};

export default function ExercisePicker({ dispatch }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');

  useEffect(() => {
    apiFetch('/api/exercises')
      .then(r => r.ok ? r.json() : [])
      .then(setExercises)
      .catch(() => {});
  }, []);

  const filtered = exercises.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Todos' || e.muscleGroup === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      background: 'rgba(10, 10, 15, 0.9)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        background: '#0E0E16',
        maxWidth: '500px',
        width: '100%',
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid rgba(148, 148, 172, 0.08)',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F8', margin: 0 }}>
            Adicionar Exercício
          </h2>
          <button
            onClick={() => dispatch({ type: 'CLOSE_EXERCISE_PICKER' })}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <XIcon size={20} color="#9494AC" />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#1A1A28', borderRadius: '10px',
            border: '1px solid rgba(148, 148, 172, 0.08)',
            padding: '10px 14px',
          }}>
            <SearchIcon size={18} color="#5C5C72" />
            <input
              type="text"
              placeholder="Buscar exercício..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#F0F0F8', fontSize: '14px',
              }}
            />
          </div>
        </div>

        {/* Muscle group filters */}
        <div className="hide-scrollbar" style={{
          display: 'flex', gap: '6px', padding: '0 16px 12px',
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {muscleGroups.map(mg => (
            <button
              key={mg}
              onClick={() => setFilter(mg)}
              style={{
                padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                whiteSpace: 'nowrap', cursor: 'pointer', border: '1px solid transparent',
                transition: 'all 150ms',
                background: filter === mg ? 'rgba(255, 107, 53, 0.12)' : '#1A1A28',
                color: filter === mg ? '#FF6B35' : '#9494AC',
                borderColor: filter === mg ? 'rgba(255, 107, 53, 0.25)' : 'rgba(148, 148, 172, 0.08)',
              }}
            >
              {mg === 'Todos' ? 'Todos' : (muscleLabels[mg] || mg)}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#5C5C72', fontSize: '14px' }}>
              Nenhum exercício encontrado
            </div>
          ) : (
            filtered.map(ex => (
              <button
                key={ex.id}
                onClick={() => dispatch({
                  type: 'ADD_EXERCISE',
                  exercise: { id: ex.id, name: ex.name, muscleGroup: ex.muscleGroup },
                })}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                  padding: '12px 0', background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(148, 148, 172, 0.06)', cursor: 'pointer',
                  textAlign: 'left', transition: 'background 100ms',
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(255, 107, 53, 0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <DumbbellIcon size={18} color="#FF6B35" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8' }}>{ex.name}</div>
                  <div style={{ fontSize: '12px', color: '#9494AC', marginTop: '1px' }}>
                    {muscleLabels[ex.muscleGroup] || ex.muscleGroup}
                    {ex.equipment && ` · ${ex.equipment}`}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
