'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken } from '@/lib/api';

interface RoutineSet {
  id: string;
  exercise: { name: string };
  sets: number;
  reps: number;
}

interface Routine {
  id: string;
  name: string;
  description?: string;
  sets: RoutineSet[];
  updatedAt: string;
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = getToken();
    setLoggedIn(!!token);
    if (token) {
      loadRoutines();
    } else {
      setLoading(false);
    }
  }, []);

  async function loadRoutines() {
    try {
      const res = await apiFetch('/api/routines');
      if (res.ok) {
        setRoutines(await res.json());
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta rotina?')) return;
    try {
      const res = await apiFetch(`/api/routines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRoutines(prev => prev.filter(r => r.id !== id));
      }
    } catch { /* ignore */ }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h1 style={{
            fontSize: '1.4rem',
            fontWeight: 900,
            fontFamily: "'Orbitron', sans-serif",
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            <span className="gradient-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>Rotinas</span>
          </h1>
          {loggedIn && (
            <Link href="/routines/new" className="btn-glow" style={{
              textDecoration: 'none',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: '#fff',
              padding: '0.55rem 1.1rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              boxShadow: '0 0 15px rgba(255, 107, 53, 0.15)',
            }}>+ Nova Rotina</Link>
          )}
        </div>

        {!loggedIn ? (
          <div className="animate-in" style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#x1F4CB;</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Entre para gerenciar suas rotinas de treino.
            </p>
            <Link href="/login" className="btn-glow" style={{
              textDecoration: 'none',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: '#fff',
              padding: '0.6rem 1.5rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>Entrar</Link>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Carregando rotinas...</span>
          </div>
        ) : routines.length === 0 ? (
          <div className="animate-in" style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#x1F4CB;</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Nenhuma rotina ainda. Crie sua primeira rotina para começar!
            </p>
            <Link href="/routines/new" className="btn-glow" style={{
              textDecoration: 'none',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: '#fff',
              padding: '0.6rem 1.5rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>Criar Rotina</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {routines.map((routine, idx) => (
              <div key={routine.id} className="card-hover animate-in" style={{
                background: 'var(--gradient-card)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                animationDelay: `${idx * 0.05}s`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <Link href={`/routines/${routine.id}`} style={{
                    textDecoration: 'none',
                    color: 'var(--text)',
                    fontSize: '1rem',
                    fontWeight: 700,
                  }}>{routine.name}</Link>
                  <button onClick={() => handleDelete(routine.id)} style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'color 0.2s',
                  }}>&#x1F5D1;</button>
                </div>
                {routine.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                    {routine.description}
                  </p>
                )}
                {routine.sets.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {routine.sets.map(s => (
                      <span key={s.id} style={{
                        background: 'rgba(255,107,53,0.08)',
                        color: 'var(--primary-light)',
                        padding: '0.18rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        border: '1px solid rgba(255,107,53,0.06)',
                        letterSpacing: '0.02em',
                      }}>
                        {s.exercise.name} ({s.sets}x{s.reps})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
