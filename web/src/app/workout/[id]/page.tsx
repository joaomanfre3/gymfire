'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken } from '@/lib/api';

interface WorkoutSet {
  id: string;
  setNumber: number;
  exerciseId: string;
  exercise: { id: string; name: string };
  reps?: number;
  weight?: number;
  isPR: boolean;
  isWarmup: boolean;
}

interface Workout {
  id: string;
  title?: string;
  startedAt: string;
  finishedAt?: string;
  durationSecs?: number;
  totalVolume?: number;
  totalSets?: number;
  totalReps?: number;
  pointsEarned?: number;
  sets: WorkoutSet[];
  personalRecords?: Array<{ exercise: { name: string }; type: string; value: number }>;
  routine?: { name: string };
}

interface Exercise {
  id: string;
  name: string;
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function ActiveWorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [finished, setFinished] = useState(false);

  // Add set form
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selExercise, setSelExercise] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newReps, setNewReps] = useState('');
  const [addingSet, setAddingSet] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    loadWorkout();
    loadExercises();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [id, router]);

  async function loadWorkout() {
    try {
      const res = await apiFetch(`/api/workouts/${id}`);
      if (res.ok) {
        const data: Workout = await res.json();
        setWorkout(data);
        if (data.finishedAt) {
          setFinished(true);
        } else {
          // Start timer
          const startTime = new Date(data.startedAt).getTime();
          const updateTimer = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
          updateTimer();
          timerRef.current = setInterval(updateTimer, 1000);
        }
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function loadExercises() {
    try {
      const res = await apiFetch('/api/exercises');
      if (res.ok) setExercises(await res.json());
    } catch { /* ignore */ }
  }

  async function handleAddSet(e: React.FormEvent) {
    e.preventDefault();
    if (!selExercise) return;
    setAddingSet(true);
    try {
      const res = await apiFetch(`/api/workouts/${id}/sets`, {
        method: 'POST',
        body: JSON.stringify({
          exerciseId: selExercise,
          weight: newWeight ? parseFloat(newWeight) : null,
          reps: newReps ? parseInt(newReps) : null,
        }),
      });
      if (res.ok) {
        const newSet = await res.json();
        setWorkout(prev => prev ? { ...prev, sets: [...prev.sets, newSet] } : prev);
        setNewWeight('');
        setNewReps('');
      }
    } catch { /* ignore */ } finally {
      setAddingSet(false);
    }
  }

  async function handleFinish() {
    if (!confirm('Finalizar este treino?')) return;
    setFinishing(true);
    try {
      const res = await apiFetch(`/api/workouts/${id}/finish`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setWorkout(data);
        setFinished(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch { /* ignore */ } finally {
      setFinishing(false);
    }
  }

  // Group sets by exercise
  const groupedSets: Record<string, WorkoutSet[]> = {};
  workout?.sets.forEach(s => {
    const key = s.exercise.name;
    if (!groupedSets[key]) groupedSets[key] = [];
    groupedSets[key].push(s);
  });

  const inputStyle: React.CSSProperties = {
    padding: '0.6rem 0.75rem',
    background: 'var(--surface-light)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    color: 'var(--text)',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando treino...</div>
        ) : !workout ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Treino não encontrado.</div>
        ) : finished ? (
          /* Summary */
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>&#x1F3C6;</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Treino Finalizado!</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {workout.title || 'Workout'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {workout.durationSecs != null && (
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Duração</p>
                  <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--accent)' }}>{formatTimer(workout.durationSecs)}</p>
                </div>
              )}
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Séries</p>
                <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>{workout.totalSets ?? workout.sets.length}</p>
              </div>
              {workout.totalVolume != null && workout.totalVolume > 0 && (
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Volume</p>
                  <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)' }}>{workout.totalVolume.toLocaleString()} kg</p>
                </div>
              )}
              {workout.pointsEarned != null && (
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pontos</p>
                  <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--success)' }}>+{workout.pointsEarned}</p>
                </div>
              )}
            </div>
            {workout.personalRecords && workout.personalRecords.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--warning, #FACC15)' }}>Recordes Pessoais!</p>
                {workout.personalRecords.map((pr, i) => (
                  <p key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {pr.exercise.name}: {pr.type === 'MAX_WEIGHT' ? `${pr.value} kg` : `${pr.value} reps`}
                  </p>
                ))}
              </div>
            )}
            <Link href="/" style={{
              textDecoration: 'none',
              background: 'var(--primary)',
              color: '#fff',
              padding: '0.65rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
            }}>Voltar ao Feed</Link>
          </div>
        ) : (
          /* Active workout */
          <>
            {/* Timer header */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '1.25rem',
              textAlign: 'center',
              marginBottom: '1rem',
            }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                {workout.title || 'Workout'}
              </p>
              <p style={{
                fontSize: '2.25rem',
                fontWeight: 800,
                fontFamily: 'monospace',
                color: 'var(--accent)',
                margin: 0,
              }}>
                {formatTimer(elapsed)}
              </p>
            </div>

            {/* Sets by exercise */}
            {Object.entries(groupedSets).map(([exName, sets]) => (
              <div key={exName} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginBottom: '0.75rem',
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{exName}</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)' }}>
                      <th style={{ textAlign: 'left', padding: '0.25rem 0', fontWeight: 500 }}>Série</th>
                      <th style={{ textAlign: 'center', padding: '0.25rem 0', fontWeight: 500 }}>Peso</th>
                      <th style={{ textAlign: 'center', padding: '0.25rem 0', fontWeight: 500 }}>Reps</th>
                      <th style={{ textAlign: 'center', padding: '0.25rem 0', fontWeight: 500 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sets.map(s => (
                      <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.4rem 0', color: 'var(--text-secondary)' }}>
                          {s.isWarmup ? 'W' : s.setNumber}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.4rem 0' }}>
                          {s.weight != null ? `${s.weight} kg` : '-'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.4rem 0' }}>
                          {s.reps ?? '-'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.4rem 0' }}>
                          {s.isPR && (
                            <span style={{
                              background: 'rgba(250,204,21,0.15)',
                              color: '#FACC15',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                            }}>PR</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {/* Add set form */}
            <form onSubmit={handleAddSet} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1rem',
            }}>
              <p style={{ fontWeight: 600, marginBottom: '0.65rem', fontSize: '0.95rem' }}>Registrar Série</p>
              <select value={selExercise} onChange={(e) => setSelExercise(e.target.value)}
                required style={{ ...inputStyle, marginBottom: '0.5rem' }}>
                <option value="">Selecione um exercício...</option>
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Peso (kg)</label>
                  <input type="number" step="0.5" min="0" value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)} style={inputStyle}
                    placeholder="0" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Reps</label>
                  <input type="number" min="0" value={newReps}
                    onChange={(e) => setNewReps(e.target.value)} style={inputStyle}
                    placeholder="0" />
                </div>
              </div>
              <button type="submit" disabled={addingSet} style={{
                width: '100%',
                padding: '0.6rem',
                background: 'var(--accent)',
                color: '#000',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: addingSet ? 'not-allowed' : 'pointer',
              }}>
                {addingSet ? 'Adicionando...' : '+ Adicionar Série'}
              </button>
            </form>

            {/* Finish button */}
            <button
              onClick={handleFinish}
              disabled={finishing}
              style={{
                width: '100%',
                padding: '0.85rem',
                background: finishing ? 'var(--surface-light)' : 'var(--success)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: finishing ? 'not-allowed' : 'pointer',
              }}
            >
              {finishing ? 'Finalizando...' : 'Finalizar Treino'}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
