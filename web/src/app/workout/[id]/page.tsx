'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken } from '@/lib/api';
import { formatTimer } from '@/lib/format';

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

const inputStyle: React.CSSProperties = {
  padding: '0.65rem 0.75rem',
  background: 'var(--surface-light)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
  width: '100%',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
};

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

  const groupedSets = useMemo(() => {
    const groups: Record<string, WorkoutSet[]> = {};
    workout?.sets.forEach(s => {
      const key = s.exercise.name;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [workout?.sets]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Carregando treino...</span>
          </div>
        ) : !workout ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Treino não encontrado.</div>
        ) : finished ? (
          /* Summary */
          <div className="animate-in" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative glow */}
            <div style={{
              position: 'absolute',
              top: '-30px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(255, 107, 53, 0.08), transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{
              fontSize: '3.5rem',
              marginBottom: '0.5rem',
              filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.3))',
              position: 'relative',
            }}>&#x1F3C6;</div>
            <h1 style={{
              fontSize: '1.4rem',
              fontWeight: 900,
              marginBottom: '0.25rem',
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: '0.05em',
            }}>
              <span className="gradient-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>TREINO FINALIZADO!</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
              {workout.title || 'Workout'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.75rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
              {workout.durationSecs != null && (
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.15rem' }}>Duração</p>
                  <p className="accent-gradient-text" style={{
                    fontWeight: 800, fontSize: '1.3rem', fontFamily: "'Orbitron', sans-serif",
                  }}>{formatTimer(workout.durationSecs)}</p>
                </div>
              )}
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.15rem' }}>Séries</p>
                <p style={{ fontWeight: 800, fontSize: '1.3rem', fontFamily: "'Orbitron', sans-serif" }}>{workout.totalSets ?? workout.sets.length}</p>
              </div>
              {workout.totalVolume != null && workout.totalVolume > 0 && (
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.15rem' }}>Volume</p>
                  <p className="gradient-text" style={{
                    fontWeight: 800, fontSize: '1.3rem', fontFamily: "'Orbitron', sans-serif",
                  }}>{workout.totalVolume.toLocaleString()} kg</p>
                </div>
              )}
              {workout.pointsEarned != null && (
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.15rem' }}>Pontos</p>
                  <p style={{
                    color: 'var(--success)', fontWeight: 800, fontSize: '1.3rem', fontFamily: "'Orbitron', sans-serif",
                    textShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
                  }}>+{workout.pointsEarned}</p>
                </div>
              )}
            </div>
            {workout.personalRecords && workout.personalRecords.length > 0 && (
              <div style={{
                marginBottom: '1.75rem',
                background: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
              }}>
                <p style={{
                  fontWeight: 700, marginBottom: '0.5rem', color: 'var(--warning)',
                  textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem',
                }}>Recordes Pessoais!</p>
                {workout.personalRecords.map((pr, i) => (
                  <p key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {pr.exercise.name}: {pr.type === 'MAX_WEIGHT' ? `${pr.value} kg` : `${pr.value} reps`}
                  </p>
                ))}
              </div>
            )}
            <Link href="/" className="btn-glow" style={{
              textDecoration: 'none',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: '#fff',
              padding: '0.7rem 2rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              boxShadow: '0 0 20px rgba(255, 107, 53, 0.2)',
            }}>Voltar ao Feed</Link>
          </div>
        ) : (
          /* Active workout */
          <>
            {/* Timer header */}
            <div className="animate-in" style={{
              background: 'var(--surface)',
              border: '1px solid rgba(0, 240, 212, 0.1)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              textAlign: 'center',
              marginBottom: '1rem',
              boxShadow: '0 0 30px rgba(0, 240, 212, 0.05)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                top: '-30px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(0,240,212,0.06), transparent 70%)',
                pointerEvents: 'none',
              }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {workout.title || 'Workout'}
              </p>
              <p className="accent-gradient-text" style={{
                fontSize: '2.5rem',
                fontWeight: 900,
                fontFamily: "'Orbitron', sans-serif",
                margin: 0,
                letterSpacing: '0.05em',
                textShadow: '0 0 20px rgba(0, 240, 212, 0.15)',
              }}>
                {formatTimer(elapsed)}
              </p>
            </div>

            {/* Sets by exercise */}
            {Object.entries(groupedSets).map(([exName, sets], idx) => (
              <div key={exName} className="card-hover animate-in" style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '0.75rem',
                animationDelay: `${idx * 0.05}s`,
              }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.01em' }}>{exName}</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)' }}>
                      <th style={{ textAlign: 'left', padding: '0.25rem 0', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Série</th>
                      <th style={{ textAlign: 'center', padding: '0.25rem 0', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Peso</th>
                      <th style={{ textAlign: 'center', padding: '0.25rem 0', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reps</th>
                      <th style={{ textAlign: 'center', padding: '0.25rem 0', fontWeight: 600, fontSize: '0.7rem' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sets.map(s => (
                      <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.45rem 0', color: 'var(--text-secondary)' }}>
                          {s.isWarmup ? 'W' : s.setNumber}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.45rem 0', fontWeight: 600 }}>
                          {s.weight != null ? `${s.weight} kg` : '-'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.45rem 0', fontWeight: 600 }}>
                          {s.reps ?? '-'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.45rem 0' }}>
                          {s.isPR && (
                            <span style={{
                              background: 'rgba(245,158,11,0.12)',
                              color: 'var(--warning)',
                              padding: '0.12rem 0.5rem',
                              borderRadius: '999px',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              letterSpacing: '0.05em',
                              border: '1px solid rgba(245,158,11,0.15)',
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
            <form onSubmit={handleAddSet} className="animate-in" style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.1rem',
              marginBottom: '1rem',
            }}>
              <p style={{
                fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.85rem',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>Registrar Série</p>
              <select value={selExercise} onChange={(e) => setSelExercise(e.target.value)}
                required style={{ ...inputStyle, marginBottom: '0.5rem' }}>
                <option value="">Selecione um exercício...</option>
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Peso (kg)</label>
                  <input type="number" step="0.5" min="0" value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)} style={inputStyle}
                    placeholder="0" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Reps</label>
                  <input type="number" min="0" value={newReps}
                    onChange={(e) => setNewReps(e.target.value)} style={inputStyle}
                    placeholder="0" />
                </div>
              </div>
              <button type="submit" disabled={addingSet} className="btn-glow" style={{
                width: '100%',
                padding: '0.65rem',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                color: '#000',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                cursor: addingSet ? 'not-allowed' : 'pointer',
                fontSize: '0.82rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                boxShadow: '0 0 15px rgba(0, 240, 212, 0.15)',
              }}>
                {addingSet ? 'Adicionando...' : '+ Adicionar Série'}
              </button>
            </form>

            {/* Finish button */}
            <button
              onClick={handleFinish}
              disabled={finishing}
              className={finishing ? '' : 'btn-glow'}
              style={{
                width: '100%',
                padding: '0.9rem',
                background: finishing ? 'var(--surface-light)' : 'linear-gradient(135deg, var(--success), #059669)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: finishing ? 'not-allowed' : 'pointer',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                boxShadow: finishing ? 'none' : '0 0 20px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.3s',
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
