'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken } from '@/lib/api';

interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
}

interface RoutineSetEntry {
  id: string;
  exercise: Exercise;
  sets: number;
  reps: number;
  restSeconds: number;
  order: number;
}

interface Routine {
  id: string;
  name: string;
  description?: string;
  userId: string;
  sets: RoutineSetEntry[];
}

export default function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  // Add exercise form
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selExercise, setSelExercise] = useState('');
  const [addSets, setAddSets] = useState(3);
  const [addReps, setAddReps] = useState(10);
  const [addRest, setAddRest] = useState(90);

  useEffect(() => {
    setLoggedIn(!!getToken());
    loadRoutine();
  }, [id]);

  async function loadRoutine() {
    try {
      const res = await apiFetch(`/api/routines/${id}`);
      if (res.ok) {
        setRoutine(await res.json());
      } else {
        setError('Rotina não encontrada ou sem permissão de acesso.');
      }
    } catch {
      setError('Falha ao carregar rotina');
    } finally {
      setLoading(false);
    }
  }

  async function loadExercises() {
    try {
      const res = await apiFetch('/api/exercises');
      if (res.ok) setExercises(await res.json());
    } catch { /* ignore */ }
  }

  function handleShowAdd() {
    setShowAdd(true);
    if (exercises.length === 0) loadExercises();
  }

  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!selExercise) return;
    const order = (routine?.sets.length ?? 0) + 1;
    try {
      const res = await apiFetch(`/api/routines/${id}/sets`, {
        method: 'POST',
        body: JSON.stringify({
          exerciseId: selExercise,
          order,
          sets: addSets,
          reps: addReps,
          restSeconds: addRest,
        }),
      });
      if (res.ok) {
        const newSet = await res.json();
        setRoutine(prev => prev ? { ...prev, sets: [...prev.sets, newSet] } : prev);
        setShowAdd(false);
        setSelExercise('');
      }
    } catch { /* ignore */ }
  }

  async function handleStartWorkout() {
    if (!getToken()) {
      alert('Faça login para iniciar um treino');
      return;
    }
    try {
      const res = await apiFetch('/api/workouts/start', {
        method: 'POST',
        body: JSON.stringify({ routineId: id, title: routine?.name }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/workout/${data.id}`);
      }
    } catch { /* ignore */ }
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
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <Link href="/routines" style={{
          color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem',
          textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
        }}>
          &larr; Voltar às Rotinas
        </Link>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Carregando...</span>
          </div>
        ) : error ? (
          <div className="animate-in" style={{
            textAlign: 'center', padding: '3rem',
            background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
            marginTop: '1rem', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-card)',
          }}>{error}</div>
        ) : routine && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.75rem 0 1rem' }}>
              <h1 style={{
                fontSize: '1.4rem', fontWeight: 900,
                fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.03em',
              }}>{routine.name}</h1>
              <button onClick={handleStartWorkout} className="btn-glow" style={{
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                color: '#fff',
                border: 'none',
                padding: '0.55rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                boxShadow: '0 0 15px rgba(255, 107, 53, 0.2)',
              }}>&#x26A1; Iniciar</button>
            </div>

            {routine.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                {routine.description}
              </p>
            )}

            {/* Exercise list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              {routine.sets.length === 0 ? (
                <div className="animate-in" style={{
                  textAlign: 'center', padding: '2rem',
                  background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', boxShadow: 'var(--shadow-card)',
                }}>
                  Nenhum exercício adicionado ainda.
                </div>
              ) : routine.sets.map((s, idx) => (
                <div key={s.id} className="card-hover animate-in" style={{
                  background: 'var(--gradient-card)',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.9rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  animationDelay: `${idx * 0.04}s`,
                }}>
                  <span style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,107,53,0.06))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0,
                    border: '1px solid rgba(255,107,53,0.1)',
                    fontFamily: "'Orbitron', sans-serif",
                  }}>{idx + 1}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.92rem', margin: 0 }}>{s.exercise.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0.15rem 0 0' }}>
                      {s.sets} séries x {s.reps} reps | {s.restSeconds}s descanso
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add exercise */}
            {loggedIn && (
              <>
                {!showAdd ? (
                  <button onClick={handleShowAdd} style={{
                    width: '100%', padding: '0.75rem',
                    background: 'var(--surface)', border: '1px dashed rgba(255, 107, 53, 0.15)',
                    borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '0.82rem',
                    transition: 'all 0.2s',
                    fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase',
                  }}>+ Adicionar Exercício</button>
                ) : (
                  <form onSubmit={handleAddExercise} className="animate-in" style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', padding: '1.1rem',
                    display: 'flex', flexDirection: 'column', gap: '0.75rem',
                    boxShadow: 'var(--shadow-card)',
                  }}>
                    <select value={selExercise} onChange={(e) => setSelExercise(e.target.value)}
                      required style={{ ...inputStyle, width: '100%' }}>
                      <option value="">Selecione um exercício...</option>
                      {exercises.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Séries</label>
                        <input type="number" min={1} value={addSets} onChange={(e) => setAddSets(+e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Reps</label>
                        <input type="number" min={1} value={addReps} onChange={(e) => setAddReps(+e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Descanso</label>
                        <input type="number" min={0} value={addRest} onChange={(e) => setAddRest(+e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" className="btn-glow" style={{
                        flex: 1, padding: '0.65rem',
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                        color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
                        fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem',
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>Adicionar</button>
                      <button type="button" onClick={() => setShowAdd(false)} style={{
                        padding: '0.65rem 1rem', background: 'none', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer',
                        fontSize: '0.82rem', letterSpacing: '0.03em', textTransform: 'uppercase',
                        transition: 'all 0.2s',
                      }}>Cancelar</button>
                    </div>
                  </form>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
