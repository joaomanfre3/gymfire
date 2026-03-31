'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface ExerciseInRoutine {
  id: string;
  exercise: { id: string; name: string; muscleGroup?: string };
  sets: number;
  reps: number;
  restSeconds?: number;
  order: number;
}

interface Routine {
  id: string;
  name: string;
  description?: string;
  days?: string[];
  exercises: ExerciseInRoutine[];
}

interface ExerciseOption {
  id: string;
  name: string;
  muscleGroup?: string;
}

export default function RoutineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const routineId = params.id as string;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [starting, setStarting] = useState(false);

  const fetchRoutine = async () => {
    try {
      const res = await apiFetch(`/api/routines/${routineId}`);
      if (res.ok) setRoutine(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchRoutine(); }, [routineId]);

  const openAddExercise = async () => {
    setShowAddExercise(true);
    try {
      const res = await apiFetch('/api/exercises');
      if (res.ok) {
        const data = await res.json();
        setExerciseOptions(Array.isArray(data) ? data : data.exercises || []);
      }
    } catch { /* ignore */ }
  };

  const addExercise = async (exerciseId: string) => {
    try {
      await apiFetch(`/api/routines/${routineId}`, {
        method: 'PUT',
        body: JSON.stringify({
          exercises: [
            ...(routine?.exercises || []).map(e => ({
              exerciseId: e.exercise.id,
              sets: e.sets,
              reps: e.reps,
              restSeconds: e.restSeconds,
            })),
            { exerciseId, sets: 3, reps: 10, restSeconds: 90 },
          ],
        }),
      });
      setShowAddExercise(false);
      setSearchQuery('');
      fetchRoutine();
    } catch { /* ignore */ }
  };

  const startWorkout = async () => {
    setStarting(true);
    try {
      const res = await apiFetch('/api/workouts/start', {
        method: 'POST',
        body: JSON.stringify({ routineId }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/workout/${data.id}`);
      }
    } catch { /* ignore */ }
    setStarting(false);
  };

  const deleteRoutine = async () => {
    if (!confirm('Delete this routine?')) return;
    try {
      await apiFetch(`/api/routines/${routineId}`, { method: 'DELETE' });
      router.push('/routines');
    } catch { /* ignore */ }
  };

  const filteredExercises = exerciseOptions.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 rounded-full"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="text-center py-20">
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Routine not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{routine.name}</h1>
          {routine.description && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{routine.description}</p>
          )}
          {routine.days && routine.days.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {routine.days.map(d => (
                <span key={d} className="text-xs px-2 py-0.5 rounded font-medium"
                  style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>
        <button onClick={deleteRoutine} className="text-sm px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)' }}>
          Delete
        </button>
      </div>

      {/* Exercises list */}
      <div className="space-y-3 mb-6">
        {routine.exercises && routine.exercises.length > 0 ? (
          routine.exercises
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <div key={item.id} className="rounded-xl p-4 flex items-center justify-between"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="font-semibold text-sm">{item.exercise.name}</p>
                  {item.exercise.muscleGroup && (
                    <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                      style={{ background: 'rgba(78, 205, 196, 0.12)', color: 'var(--accent)' }}>
                      {item.exercise.muscleGroup}
                    </span>
                  )}
                </div>
                <div className="text-right text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <p>{item.sets} x {item.reps}</p>
                  {item.restSeconds && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.restSeconds}s rest</p>
                  )}
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-10 rounded-xl" style={{ background: 'var(--surface)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No exercises added yet</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={openAddExercise}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
          style={{ background: 'var(--surface-light)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          + Add Exercise
        </button>
        <button onClick={startWorkout} disabled={starting}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'var(--primary)' }}>
          {starting ? 'Starting...' : 'Start Workout'}
        </button>
      </div>

      {/* Add exercise modal */}
      {showAddExercise && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md max-h-[70vh] rounded-2xl flex flex-col"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-bold">Add Exercise</h3>
              <button onClick={() => { setShowAddExercise(false); setSearchQuery(''); }}
                className="text-xl" style={{ color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>
            <div className="p-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', color: 'var(--text)' }}
                placeholder="Search exercises..."
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
              {filteredExercises.map((ex) => (
                <button key={ex.id} onClick={() => addExercise(ex.id)}
                  className="w-full text-left px-4 py-3 rounded-lg text-sm transition-colors"
                  style={{ color: 'var(--text)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-light)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <p className="font-medium">{ex.name}</p>
                  {ex.muscleGroup && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{ex.muscleGroup}</p>
                  )}
                </button>
              ))}
              {filteredExercises.length === 0 && (
                <p className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                  No exercises found
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
