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
    padding: '0.6rem 0.75rem',
    background: 'var(--surface-light)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    color: 'var(--text)',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <Link href="/routines" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
          &larr; Voltar às Rotinas
        </Link>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando...</div>
        ) : error ? (
          <div style={{
            textAlign: 'center', padding: '3rem',
            background: 'var(--surface)', borderRadius: '1rem', border: '1px solid var(--border)',
            marginTop: '1rem', color: 'var(--text-secondary)',
          }}>{error}</div>
        ) : routine && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.75rem 0 1rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{routine.name}</h1>
              <button onClick={handleStartWorkout} style={{
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                padding: '0.55rem 1.1rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}>Iniciar Treino</button>
            </div>

            {routine.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {routine.description}
              </p>
            )}

            {/* Exercise list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              {routine.sets.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '2rem',
                  background: 'var(--surface)', borderRadius: '0.75rem', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}>
                  Nenhum exercício adicionado ainda.
                </div>
              ) : routine.sets.map((s, idx) => (
                <div key={s.id} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <span style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                  }}>{idx + 1}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>{s.exercise.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.15rem 0 0' }}>
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
                    width: '100%', padding: '0.7rem',
                    background: 'var(--surface)', border: '1px dashed var(--border)',
                    borderRadius: '0.75rem', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '0.9rem',
                  }}>+ Adicionar Exercício</button>
                ) : (
                  <form onSubmit={handleAddExercise} style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '0.75rem', padding: '1rem',
                    display: 'flex', flexDirection: 'column', gap: '0.75rem',
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
                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Séries</label>
                        <input type="number" min={1} value={addSets} onChange={(e) => setAddSets(+e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Reps</label>
                        <input type="number" min={1} value={addReps} onChange={(e) => setAddReps(+e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Descanso (s)</label>
                        <input type="number" min={0} value={addRest} onChange={(e) => setAddRest(+e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" style={{
                        flex: 1, padding: '0.6rem', background: 'var(--primary)', color: '#fff',
                        border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer',
                      }}>Adicionar</button>
                      <button type="button" onClick={() => setShowAdd(false)} style={{
                        padding: '0.6rem 1rem', background: 'none', border: '1px solid var(--border)',
                        borderRadius: '0.5rem', color: 'var(--text-muted)', cursor: 'pointer',
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
