'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

// ============ Types ============
interface ExerciseInfo {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
}

interface RoutineExercise {
  id: string;
  exerciseId: string;
  exercise: ExerciseInfo;
  order: number;
  sets: number;
  reps: number;
  weight: number;
}

interface RoutineWorkout {
  id: string;
  day: string;
  name: string;
  order: number;
  exercises: RoutineExercise[];
}

interface Routine {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  routineWorkouts: RoutineWorkout[];
  createdAt: string;
}

const DAYS = [
  { key: 'SUN', label: 'Domingo', short: 'Dom' },
  { key: 'MON', label: 'Segunda', short: 'Seg' },
  { key: 'TUE', label: 'Terça', short: 'Ter' },
  { key: 'WED', label: 'Quarta', short: 'Qua' },
  { key: 'THU', label: 'Quinta', short: 'Qui' },
  { key: 'FRI', label: 'Sexta', short: 'Sex' },
  { key: 'SAT', label: 'Sábado', short: 'Sáb' },
];

const MUSCLE_LABELS: Record<string, string> = {
  CHEST: 'Peito', BACK: 'Costas', SHOULDERS: 'Ombros', BICEPS: 'Bíceps',
  TRICEPS: 'Tríceps', FOREARMS: 'Antebraço', CORE: 'Core', ABS: 'Abdômen',
  GLUTES: 'Glúteos', QUADS: 'Quadríceps', HAMSTRINGS: 'Posteriores',
  CALVES: 'Panturrilhas', FULL_BODY: 'Full Body', CARDIO: 'Cardio', OTHER: 'Outro',
};

// ============ Icons ============
function PlusIcon({ size = 16, color = '#FF6B35' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}

function TrashIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FF4D6A" strokeWidth={1.5} strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
}

function DumbbellIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth={1.5} strokeLinecap="round"><path d="M6.5 6.5h11M6 12H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2m0 8H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2m0-4v8m12-8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2m0-8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2m0 4V8" /></svg>;
}

function SearchIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={2}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}

function ChevronIcon({ dir = 'down', size = 16 }: { dir?: 'down' | 'up' | 'right'; size?: number }) {
  const rotation = dir === 'up' ? 180 : dir === 'right' ? -90 : 0;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={2} strokeLinecap="round" style={{ transform: `rotate(${rotation}deg)` }}><polyline points="6 9 12 15 18 9" /></svg>;
}

export default function RoutineTab() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(DAYS[1].key); // Monday
  const [showCreateRoutine, setShowCreateRoutine] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [showCreateWorkout, setShowCreateWorkout] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<ExerciseInfo[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Array<{ exerciseId: string; exercise: ExerciseInfo; sets: number; reps: number; weight: number }>>([]);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  const [filterMuscle, setFilterMuscle] = useState('');

  const activeRoutine = routines.find(r => r.isActive);

  const loadRoutines = useCallback(async () => {
    try {
      const res = await apiFetch('/api/routines');
      if (res.ok) {
        const data = await res.json();
        setRoutines(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const loadExercises = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (exerciseSearch) params.set('search', exerciseSearch);
      if (filterMuscle) params.set('muscleGroup', filterMuscle);
      const res = await apiFetch(`/api/exercises?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExercises(data);
      }
    } catch { /* ignore */ }
  }, [exerciseSearch, filterMuscle]);

  useEffect(() => { loadRoutines(); }, [loadRoutines]);
  useEffect(() => {
    if (showExercisePicker) loadExercises();
  }, [showExercisePicker, loadExercises]);

  const dayWorkouts = activeRoutine?.routineWorkouts.filter(w => w.day === selectedDay) || [];

  async function createRoutine() {
    if (!newRoutineName.trim()) return;
    try {
      const res = await apiFetch('/api/routines', {
        method: 'POST',
        body: JSON.stringify({ name: newRoutineName.trim() }),
      });
      if (res.ok) {
        setNewRoutineName('');
        setShowCreateRoutine(false);
        loadRoutines();
      }
    } catch { /* ignore */ }
  }

  async function deleteRoutine(id: string) {
    try {
      const res = await apiFetch(`/api/routines/${id}`, { method: 'DELETE' });
      if (res.ok) loadRoutines();
    } catch { /* ignore */ }
  }

  async function activateRoutine(id: string) {
    try {
      const res = await apiFetch(`/api/routines/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: true }),
      });
      if (res.ok) loadRoutines();
    } catch { /* ignore */ }
  }

  async function createWorkout() {
    if (!newWorkoutName.trim() || !activeRoutine) return;
    try {
      const res = await apiFetch(`/api/routines/${activeRoutine.id}/workouts`, {
        method: 'POST',
        body: JSON.stringify({
          day: selectedDay,
          name: newWorkoutName.trim(),
          exercises: selectedExercises.map(e => ({
            exerciseId: e.exerciseId,
            sets: e.sets,
            reps: e.reps,
            weight: e.weight,
          })),
        }),
      });
      if (res.ok) {
        setNewWorkoutName('');
        setSelectedExercises([]);
        setShowCreateWorkout(false);
        loadRoutines();
      }
    } catch { /* ignore */ }
  }

  async function deleteWorkout(workoutId: string) {
    if (!activeRoutine) return;
    try {
      const res = await apiFetch(`/api/routines/${activeRoutine.id}/workouts?workoutId=${workoutId}`, {
        method: 'DELETE',
      });
      if (res.ok) loadRoutines();
    } catch { /* ignore */ }
  }

  async function updateWorkoutExercises(workoutId: string, exercises: Array<{ exerciseId: string; sets: number; reps: number; weight: number }>) {
    if (!activeRoutine) return;
    try {
      const res = await apiFetch(`/api/routines/${activeRoutine.id}/workouts`, {
        method: 'PATCH',
        body: JSON.stringify({ workoutId, exercises }),
      });
      if (res.ok) loadRoutines();
    } catch { /* ignore */ }
  }

  function openExercisePickerForWorkout(workoutId: string) {
    const workout = activeRoutine?.routineWorkouts.find(w => w.id === workoutId);
    if (workout) {
      setSelectedExercises(workout.exercises.map(e => ({
        exerciseId: e.exerciseId,
        exercise: e.exercise,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight,
      })));
    }
    setEditingWorkoutId(workoutId);
    setShowExercisePicker(true);
  }

  function addExerciseToSelection(ex: ExerciseInfo) {
    if (selectedExercises.find(e => e.exerciseId === ex.id)) return;
    setSelectedExercises(prev => [...prev, { exerciseId: ex.id, exercise: ex, sets: 3, reps: 12, weight: 0 }]);
  }

  function removeExerciseFromSelection(exerciseId: string) {
    setSelectedExercises(prev => prev.filter(e => e.exerciseId !== exerciseId));
  }

  function updateExerciseInSelection(exerciseId: string, field: 'sets' | 'reps' | 'weight', value: number) {
    setSelectedExercises(prev => prev.map(e => e.exerciseId === exerciseId ? { ...e, [field]: value } : e));
  }

  function saveExercisePicker() {
    if (editingWorkoutId) {
      updateWorkoutExercises(editingWorkoutId, selectedExercises.map(e => ({
        exerciseId: e.exerciseId,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight,
      })));
    }
    setShowExercisePicker(false);
    setEditingWorkoutId(null);
    setSelectedExercises([]);
    setExerciseSearch('');
    setFilterMuscle('');
  }

  function toggleWorkout(id: string) {
    setExpandedWorkouts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="shimmer" style={{ width: '200px', height: '20px', borderRadius: '6px', margin: '0 auto', background: '#1A1A28' }} />
      </div>
    );
  }

  // ============ Exercise Picker Modal ============
  if (showExercisePicker) {
    return (
      <div style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button onClick={() => { setShowExercisePicker(false); setEditingWorkoutId(null); setExerciseSearch(''); setFilterMuscle(''); }}
            style={{ background: 'none', border: 'none', color: '#9494AC', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Voltar
          </button>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F8' }}>Exercícios</span>
          <button onClick={saveExercisePicker}
            style={{ background: 'none', border: 'none', color: '#FF6B35', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Salvar
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
          background: '#141420', borderRadius: '12px', border: '1px solid rgba(148,148,172,0.08)', marginBottom: '8px',
        }}>
          <SearchIcon />
          <input
            type="text" placeholder="Buscar exercício..."
            value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', color: '#F0F0F8', fontSize: '14px', outline: 'none' }}
          />
        </div>

        {/* Muscle filter */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <button onClick={() => setFilterMuscle('')}
            style={{
              padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 600,
              background: !filterMuscle ? '#FF6B35' : '#1A1A28',
              color: !filterMuscle ? '#0A0A0F' : '#9494AC',
            }}>Todos</button>
          {Object.entries(MUSCLE_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => setFilterMuscle(key)}
              style={{
                padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: 600,
                background: filterMuscle === key ? '#FF6B35' : '#1A1A28',
                color: filterMuscle === key ? '#0A0A0F' : '#9494AC',
              }}>{label}</button>
          ))}
        </div>

        {/* Selected exercises */}
        {selectedExercises.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Selecionados ({selectedExercises.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selectedExercises.map(sel => (
                <div key={sel.exerciseId} style={{
                  background: '#141420', borderRadius: '12px', border: '1px solid rgba(255,107,53,0.15)',
                  padding: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{sel.exercise.name}</span>
                    <button onClick={() => removeExerciseFromSelection(sel.exerciseId)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                      <TrashIcon size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', color: '#5C5C72', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Séries</label>
                      <input type="number" value={sel.sets} min={1}
                        onChange={e => updateExerciseInSelection(sel.exerciseId, 'sets', parseInt(e.target.value) || 1)}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(148,148,172,0.1)', background: '#0E0E16', color: '#F0F0F8', fontSize: '14px', fontWeight: 700, textAlign: 'center', outline: 'none' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', color: '#5C5C72', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Reps</label>
                      <input type="number" value={sel.reps} min={1}
                        onChange={e => updateExerciseInSelection(sel.exerciseId, 'reps', parseInt(e.target.value) || 1)}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(148,148,172,0.1)', background: '#0E0E16', color: '#F0F0F8', fontSize: '14px', fontWeight: 700, textAlign: 'center', outline: 'none' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', color: '#5C5C72', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Peso (kg)</label>
                      <input type="number" value={sel.weight} min={0} step={0.5}
                        onChange={e => updateExerciseInSelection(sel.exerciseId, 'weight', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(148,148,172,0.1)', background: '#0E0E16', color: '#F0F0F8', fontSize: '14px', fontWeight: 700, textAlign: 'center', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exercise list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
          {exercises.map(ex => {
            const isSelected = selectedExercises.some(e => e.exerciseId === ex.id);
            return (
              <button key={ex.id} onClick={() => !isSelected && addExerciseToSelection(ex)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                  background: isSelected ? 'rgba(255,107,53,0.06)' : '#141420',
                  border: isSelected ? '1px solid rgba(255,107,53,0.2)' : '1px solid rgba(148,148,172,0.06)',
                  borderRadius: '10px', cursor: isSelected ? 'default' : 'pointer', textAlign: 'left', width: '100%',
                  opacity: isSelected ? 0.6 : 1,
                }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(255,107,53,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <DumbbellIcon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{ex.name}</div>
                  <div style={{ fontSize: '11px', color: '#5C5C72' }}>{MUSCLE_LABELS[ex.muscleGroup] || ex.muscleGroup}</div>
                </div>
                {isSelected && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#FF6B35', background: 'rgba(255,107,53,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Adicionado</span>
                )}
              </button>
            );
          })}
          {exercises.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#5C5C72', fontSize: '13px' }}>
              Nenhum exercício encontrado.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ Create Workout Form ============
  if (showCreateWorkout && activeRoutine) {
    return (
      <div style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button onClick={() => { setShowCreateWorkout(false); setSelectedExercises([]); setNewWorkoutName(''); }}
            style={{ background: 'none', border: 'none', color: '#9494AC', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Voltar
          </button>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F8' }}>
            Novo Treino - {DAYS.find(d => d.key === selectedDay)?.label}
          </span>
          <div style={{ width: '40px' }} />
        </div>

        {/* Workout name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#5C5C72', display: 'block', marginBottom: '6px' }}>Nome do treino</label>
          <input
            type="text" placeholder="Ex: Treino A - Peito e Tríceps"
            value={newWorkoutName} onChange={e => setNewWorkoutName(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '12px',
              border: '1px solid rgba(148,148,172,0.1)', background: '#141420',
              color: '#F0F0F8', fontSize: '14px', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Selected exercises */}
        {selectedExercises.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Exercícios ({selectedExercises.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selectedExercises.map(sel => (
                <div key={sel.exerciseId} style={{
                  background: '#141420', borderRadius: '12px', border: '1px solid rgba(148,148,172,0.08)', padding: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{sel.exercise.name}</span>
                    <button onClick={() => removeExerciseFromSelection(sel.exerciseId)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                      <TrashIcon size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', color: '#5C5C72', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Séries</label>
                      <input type="number" value={sel.sets} min={1}
                        onChange={e => updateExerciseInSelection(sel.exerciseId, 'sets', parseInt(e.target.value) || 1)}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(148,148,172,0.1)', background: '#0E0E16', color: '#F0F0F8', fontSize: '14px', fontWeight: 700, textAlign: 'center', outline: 'none' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', color: '#5C5C72', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Reps</label>
                      <input type="number" value={sel.reps} min={1}
                        onChange={e => updateExerciseInSelection(sel.exerciseId, 'reps', parseInt(e.target.value) || 1)}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(148,148,172,0.1)', background: '#0E0E16', color: '#F0F0F8', fontSize: '14px', fontWeight: 700, textAlign: 'center', outline: 'none' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', color: '#5C5C72', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Peso (kg)</label>
                      <input type="number" value={sel.weight} min={0} step={0.5}
                        onChange={e => updateExerciseInSelection(sel.exerciseId, 'weight', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(148,148,172,0.1)', background: '#0E0E16', color: '#F0F0F8', fontSize: '14px', fontWeight: 700, textAlign: 'center', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add exercises button */}
        <button onClick={() => setShowExercisePicker(true)}
          style={{
            width: '100%', padding: '12px', borderRadius: '12px',
            border: '1.5px dashed rgba(255,107,53,0.3)', background: 'rgba(255,107,53,0.04)',
            color: '#FF6B35', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginBottom: '16px',
          }}>
          <PlusIcon size={16} /> Adicionar Exercícios
        </button>

        {/* Save button */}
        <button onClick={createWorkout}
          disabled={!newWorkoutName.trim()}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: newWorkoutName.trim() ? 'linear-gradient(135deg, #FF6B35, #E05520)' : '#1A1A28',
            color: newWorkoutName.trim() ? '#fff' : '#5C5C72',
            fontSize: '14px', fontWeight: 700, cursor: newWorkoutName.trim() ? 'pointer' : 'default',
            boxShadow: newWorkoutName.trim() ? '0 4px 15px rgba(255, 107, 53, 0.3)' : 'none',
          }}>
          Criar Treino
        </button>
      </div>
    );
  }

  // ============ Main View ============
  return (
    <div style={{ marginTop: '8px' }}>

      {/* No routine - create prompt */}
      {!activeRoutine && (
        <>
          {/* List of inactive routines */}
          {routines.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Rotinas salvas
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {routines.map(r => (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                    background: '#141420', borderRadius: '12px', border: '1px solid rgba(148,148,172,0.08)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8' }}>{r.name}</div>
                      <div style={{ fontSize: '11px', color: '#5C5C72', marginTop: '2px' }}>
                        {r.routineWorkouts.length} treinos
                      </div>
                    </div>
                    <button onClick={() => activateRoutine(r.id)}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', border: 'none',
                        background: 'rgba(255,107,53,0.1)', color: '#FF6B35',
                        fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                      }}>Ativar</button>
                    <button onClick={() => deleteRoutine(r.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                      <TrashIcon size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create routine */}
          {showCreateRoutine ? (
            <div style={{
              background: '#141420', borderRadius: '14px', border: '1px solid rgba(148,148,172,0.08)',
              padding: '20px',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F8', marginBottom: '14px' }}>Nova Rotina</div>
              <input
                type="text" placeholder="Nome da rotina (ex: Rotina PPL)"
                value={newRoutineName} onChange={e => setNewRoutineName(e.target.value)}
                autoFocus
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '12px',
                  border: '1px solid rgba(148,148,172,0.1)', background: '#0E0E16',
                  color: '#F0F0F8', fontSize: '14px', outline: 'none', marginBottom: '14px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setShowCreateRoutine(false); setNewRoutineName(''); }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(148,148,172,0.1)',
                    background: 'transparent', color: '#9494AC', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  }}>Cancelar</button>
                <button onClick={createRoutine} disabled={!newRoutineName.trim()}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                    background: newRoutineName.trim() ? 'linear-gradient(135deg, #FF6B35, #E05520)' : '#1A1A28',
                    color: newRoutineName.trim() ? '#fff' : '#5C5C72',
                    fontSize: '13px', fontWeight: 700, cursor: newRoutineName.trim() ? 'pointer' : 'default',
                  }}>Criar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowCreateRoutine(true)}
              style={{
                width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #FF6B35, #E05520)',
                color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
              }}>
              <PlusIcon size={20} color="#fff" /> Criar Rotina
            </button>
          )}

          {routines.length === 0 && !showCreateRoutine && (
            <div style={{ textAlign: 'center', padding: '20px', marginTop: '8px' }}>
              <p style={{ fontSize: '13px', color: '#5C5C72', lineHeight: 1.6 }}>
                Crie sua primeira rotina de treino!<br />
                Organize seus treinos por dia da semana.
              </p>
            </div>
          )}
        </>
      )}

      {/* Active routine view */}
      {activeRoutine && (
        <>
          {/* Routine header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', background: '#141420', borderRadius: '14px',
            border: '1px solid rgba(255,107,53,0.15)', marginBottom: '12px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F8' }}>{activeRoutine.name}</span>
                <span style={{
                  fontSize: '9px', fontWeight: 800, background: '#FF6B35', color: '#0A0A0F',
                  padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase',
                }}>Ativa</span>
              </div>
              <div style={{ fontSize: '11px', color: '#5C5C72', marginTop: '3px' }}>
                {activeRoutine.routineWorkouts.length} treinos no total
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => {
                apiFetch(`/api/routines/${activeRoutine.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: false }) }).then(() => loadRoutines());
              }}
                style={{ background: 'none', border: 'none', color: '#5C5C72', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                Desativar
              </button>
              <button onClick={() => deleteRoutine(activeRoutine.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                <TrashIcon size={16} />
              </button>
            </div>
          </div>

          {/* Day selector */}
          <div style={{
            display: 'flex', gap: '4px', marginBottom: '12px',
            overflowX: 'auto', paddingBottom: '2px',
          }}>
            {DAYS.map(d => {
              const isActive = selectedDay === d.key;
              const dayCount = activeRoutine.routineWorkouts.filter(w => w.day === d.key).length;
              return (
                <button key={d.key} onClick={() => setSelectedDay(d.key)}
                  style={{
                    flex: 1, minWidth: '44px', padding: '10px 4px', borderRadius: '10px', border: 'none',
                    background: isActive ? '#FF6B35' : '#141420',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                    transition: 'all 200ms',
                  }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: isActive ? '#0A0A0F' : '#9494AC' }}>
                    {d.short}
                  </span>
                  {dayCount > 0 && (
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: isActive ? '#0A0A0F' : '#FF6B35',
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Day label */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {DAYS.find(d => d.key === selectedDay)?.label}
            </span>
            <span style={{ fontSize: '11px', color: '#5C5C72' }}>
              {dayWorkouts.length} treino{dayWorkouts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Workouts for this day */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {dayWorkouts.map(workout => {
              const isExpanded = expandedWorkouts.has(workout.id);
              return (
                <div key={workout.id} style={{
                  background: '#141420', borderRadius: '12px', border: '1px solid rgba(148,148,172,0.08)',
                  overflow: 'hidden',
                }}>
                  {/* Workout header */}
                  <button onClick={() => toggleWorkout(workout.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: 'rgba(255,107,53,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <DumbbellIcon size={16} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8' }}>{workout.name}</div>
                        <div style={{ fontSize: '11px', color: '#5C5C72', marginTop: '1px' }}>
                          {workout.exercises.length} exercício{workout.exercises.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ChevronIcon dir={isExpanded ? 'up' : 'down'} />
                    </div>
                  </button>

                  {/* Expanded exercises */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid rgba(148,148,172,0.06)', padding: '12px 16px' }}>
                      {workout.exercises.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {workout.exercises.map(ex => (
                            <div key={ex.id} style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '8px 12px', background: '#0E0E16', borderRadius: '10px',
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{ex.exercise.name}</div>
                                <div style={{ fontSize: '11px', color: '#5C5C72', marginTop: '2px' }}>
                                  {MUSCLE_LABELS[ex.exercise.muscleGroup] || ex.exercise.muscleGroup}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9494AC' }}>
                                <span><span style={{ color: '#FF6B35', fontWeight: 700 }}>{ex.sets}</span>x<span style={{ color: '#FF6B35', fontWeight: 700 }}>{ex.reps}</span></span>
                                {ex.weight > 0 && <span style={{ color: '#CCFF00', fontWeight: 600 }}>{ex.weight}kg</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '8px', color: '#5C5C72', fontSize: '12px' }}>
                          Nenhum exercício adicionado.
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button onClick={() => openExercisePickerForWorkout(workout.id)}
                          style={{
                            flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,107,53,0.2)',
                            background: 'rgba(255,107,53,0.04)', color: '#FF6B35', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                          }}>
                          <PlusIcon size={12} /> Editar Exercícios
                        </button>
                        <button onClick={() => deleteWorkout(workout.id)}
                          style={{
                            padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,77,106,0.2)',
                            background: 'rgba(255,77,106,0.04)', color: '#FF4D6A', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                          }}>
                          Remover
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add workout button */}
          <button onClick={() => setShowCreateWorkout(true)}
            style={{
              width: '100%', padding: '12px', borderRadius: '12px',
              border: '1.5px dashed rgba(255,107,53,0.3)', background: 'rgba(255,107,53,0.04)',
              color: '#FF6B35', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
            <PlusIcon size={16} /> Adicionar Treino em {DAYS.find(d => d.key === selectedDay)?.label}
          </button>

          {/* Other routines */}
          {routines.filter(r => !r.isActive).length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Outras rotinas
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {routines.filter(r => !r.isActive).map(r => (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                    background: '#141420', borderRadius: '10px', border: '1px solid rgba(148,148,172,0.06)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{r.name}</div>
                      <div style={{ fontSize: '11px', color: '#5C5C72' }}>{r.routineWorkouts.length} treinos</div>
                    </div>
                    <button onClick={() => activateRoutine(r.id)}
                      style={{
                        padding: '5px 12px', borderRadius: '8px', border: 'none',
                        background: 'rgba(255,107,53,0.1)', color: '#FF6B35',
                        fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                      }}>Ativar</button>
                    <button onClick={() => deleteRoutine(r.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                      <TrashIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create another routine button */}
          <button onClick={() => setShowCreateRoutine(true)}
            style={{
              width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid rgba(148,148,172,0.08)',
              background: '#141420', color: '#9494AC', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              marginTop: '12px',
            }}>
            + Criar outra rotina
          </button>

          {/* Create routine inline form */}
          {showCreateRoutine && (
            <div style={{
              background: '#141420', borderRadius: '14px', border: '1px solid rgba(148,148,172,0.08)',
              padding: '16px', marginTop: '8px',
            }}>
              <input
                type="text" placeholder="Nome da rotina"
                value={newRoutineName} onChange={e => setNewRoutineName(e.target.value)}
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  border: '1px solid rgba(148,148,172,0.1)', background: '#0E0E16',
                  color: '#F0F0F8', fontSize: '14px', outline: 'none', marginBottom: '10px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setShowCreateRoutine(false); setNewRoutineName(''); }}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid rgba(148,148,172,0.1)', background: 'transparent', color: '#9494AC', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={createRoutine} disabled={!newRoutineName.trim()}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                    background: newRoutineName.trim() ? '#FF6B35' : '#1A1A28',
                    color: newRoutineName.trim() ? '#fff' : '#5C5C72',
                    fontSize: '12px', fontWeight: 700, cursor: newRoutineName.trim() ? 'pointer' : 'default',
                  }}>Criar e Ativar</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
