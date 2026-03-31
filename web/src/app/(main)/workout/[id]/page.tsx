'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  isPR?: boolean;
  order: number;
}

interface WorkoutExercise {
  id: string;
  exercise: { id: string; name: string; muscleGroup?: string };
  sets: WorkoutSet[];
  order: number;
}

interface Workout {
  id: string;
  startedAt: string;
  status: string;
  exercises: WorkoutExercise[];
  routine?: { name: string };
}

interface ExerciseOption {
  id: string;
  name: string;
  muscleGroup?: string;
}

interface FinishSummary {
  totalVolume?: number;
  totalSets?: number;
  totalReps?: number;
  totalExercises?: number;
  pointsEarned?: number;
  prs?: number;
  duration?: number;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function WorkoutPage() {
  const params = useParams();
  const router = useRouter();
  const workoutId = params.id as string;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<FinishSummary | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [setInputs, setSetInputs] = useState<Record<string, { weight: string; reps: string }>>({});
  const [addingSet, setAddingSet] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchWorkout = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/workouts/${workoutId}`);
      if (res.ok) {
        const data = await res.json();
        setWorkout(data);
        // Start timer from workout start time
        const start = new Date(data.startedAt).getTime();
        const now = Date.now();
        setElapsed(Math.floor((now - start) / 1000));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [workoutId]);

  useEffect(() => { fetchWorkout(); }, [fetchWorkout]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

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

  const addExerciseToWorkout = async (exerciseId: string) => {
    try {
      await apiFetch(`/api/workouts/${workoutId}/sets`, {
        method: 'POST',
        body: JSON.stringify({ exerciseId, weight: 0, reps: 0 }),
      });
      setShowAddExercise(false);
      setSearchQuery('');
      fetchWorkout();
    } catch { /* ignore */ }
  };

  const addSet = async (exerciseId: string) => {
    const input = setInputs[exerciseId];
    if (!input) return;
    const weight = parseFloat(input.weight) || 0;
    const reps = parseInt(input.reps) || 0;
    if (reps === 0) return;

    setAddingSet(exerciseId);
    try {
      const res = await apiFetch(`/api/workouts/${workoutId}/sets`, {
        method: 'POST',
        body: JSON.stringify({ exerciseId, weight, reps }),
      });
      if (res.ok) {
        setSetInputs(prev => ({ ...prev, [exerciseId]: { weight: '', reps: '' } }));
        fetchWorkout();
      }
    } catch { /* ignore */ }
    setAddingSet(null);
  };

  const finishWorkout = async () => {
    if (!confirm('Finish this workout?')) return;
    setFinishing(true);
    try {
      const res = await apiFetch(`/api/workouts/${workoutId}/finish`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        setShowSummary(true);
        clearInterval(timerRef.current);
      }
    } catch { /* ignore */ }
    setFinishing(false);
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

  if (!workout) {
    return (
      <div className="text-center py-20">
        <p style={{ color: 'var(--text-secondary)' }}>Workout not found</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {workout.routine?.name || 'Quick Workout'}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>In progress</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold" style={{ color: 'var(--primary)' }}>
            {formatTime(elapsed)}
          </p>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {workout.exercises && workout.exercises
          .sort((a, b) => a.order - b.order)
          .map((wExercise) => (
            <div key={wExercise.id} className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {/* Exercise header */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <p className="font-bold text-sm">{wExercise.exercise.name}</p>
                {wExercise.exercise.muscleGroup && (
                  <span className="text-xs" style={{ color: 'var(--accent)' }}>{wExercise.exercise.muscleGroup}</span>
                )}
              </div>

              {/* Sets table */}
              {wExercise.sets && wExercise.sets.length > 0 && (
                <div className="px-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: 'var(--text-muted)' }}>
                        <th className="py-2 text-left font-medium text-xs w-12">#</th>
                        <th className="py-2 text-left font-medium text-xs">Weight (kg)</th>
                        <th className="py-2 text-left font-medium text-xs">Reps</th>
                        <th className="py-2 text-right font-medium text-xs w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {wExercise.sets
                        .filter(s => s.reps > 0 || s.weight > 0)
                        .sort((a, b) => a.order - b.order)
                        .map((set, idx) => (
                          <tr key={set.id} style={{ borderTop: '1px solid var(--border)' }}>
                            <td className="py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                            <td className="py-2">{set.weight}</td>
                            <td className="py-2">{set.reps}</td>
                            <td className="py-2 text-right">
                              {set.isPR && <span title="Personal Record">🏆</span>}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add set input row */}
              <div className="px-4 py-3 flex gap-2 items-center" style={{ borderTop: '1px solid var(--border)' }}>
                <input
                  type="number"
                  placeholder="Weight"
                  value={setInputs[wExercise.exercise.id]?.weight || ''}
                  onChange={(e) => setSetInputs(prev => ({
                    ...prev,
                    [wExercise.exercise.id]: { ...prev[wExercise.exercise.id], weight: e.target.value, reps: prev[wExercise.exercise.id]?.reps || '' },
                  }))}
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
                <input
                  type="number"
                  placeholder="Reps"
                  value={setInputs[wExercise.exercise.id]?.reps || ''}
                  onChange={(e) => setSetInputs(prev => ({
                    ...prev,
                    [wExercise.exercise.id]: { ...prev[wExercise.exercise.id], reps: e.target.value, weight: prev[wExercise.exercise.id]?.weight || '' },
                  }))}
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  onKeyDown={(e) => e.key === 'Enter' && addSet(wExercise.exercise.id)}
                />
                <button
                  onClick={() => addSet(wExercise.exercise.id)}
                  disabled={addingSet === wExercise.exercise.id}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-white shrink-0 disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}>
                  {addingSet === wExercise.exercise.id ? '...' : '+ Set'}
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-16 md:bottom-4 left-0 md:left-60 right-0 p-4 flex gap-3 z-40"
        style={{ background: 'linear-gradient(transparent, var(--background) 30%)' }}>
        <button onClick={openAddExercise}
          className="flex-1 py-3.5 rounded-xl text-sm font-medium transition-colors"
          style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          + Add Exercise
        </button>
        <button onClick={finishWorkout} disabled={finishing}
          className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'var(--success)' }}>
          {finishing ? 'Finishing...' : 'Finish Workout'}
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
                className="text-xl" style={{ color: 'var(--text-muted)' }}>✕</button>
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
                <button key={ex.id} onClick={() => addExerciseToWorkout(ex.id)}
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
                <p className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>No exercises found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Finish summary modal */}
      {showSummary && summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-sm rounded-2xl p-8 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-5xl mb-4">🎉</p>
            <h2 className="text-2xl font-bold mb-1">Workout Complete!</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Great job! Here are your stats:</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {summary.duration != null && (
                <div className="rounded-xl p-3" style={{ background: 'var(--surface-light)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Duration</p>
                  <p className="font-bold text-lg">{Math.round(summary.duration / 60)}min</p>
                </div>
              )}
              {summary.totalVolume != null && (
                <div className="rounded-xl p-3" style={{ background: 'var(--surface-light)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Volume</p>
                  <p className="font-bold text-lg">{summary.totalVolume.toLocaleString()} kg</p>
                </div>
              )}
              {summary.totalSets != null && (
                <div className="rounded-xl p-3" style={{ background: 'var(--surface-light)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sets</p>
                  <p className="font-bold text-lg">{summary.totalSets}</p>
                </div>
              )}
              {summary.totalReps != null && (
                <div className="rounded-xl p-3" style={{ background: 'var(--surface-light)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Reps</p>
                  <p className="font-bold text-lg">{summary.totalReps}</p>
                </div>
              )}
              {summary.pointsEarned != null && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(255, 107, 53, 0.12)' }}>
                  <p className="text-xs" style={{ color: 'var(--primary)' }}>Points</p>
                  <p className="font-bold text-lg" style={{ color: 'var(--primary)' }}>+{summary.pointsEarned}</p>
                </div>
              )}
              {summary.prs != null && summary.prs > 0 && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(250, 204, 21, 0.12)' }}>
                  <p className="text-xs" style={{ color: 'var(--warning)' }}>PRs</p>
                  <p className="font-bold text-lg">🏆 {summary.prs}</p>
                </div>
              )}
            </div>

            <button onClick={() => router.push('/feed')}
              className="w-full py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: 'var(--primary)' }}>
              Back to Feed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
