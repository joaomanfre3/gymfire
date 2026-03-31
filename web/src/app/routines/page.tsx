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
    if (!confirm('Are you sure you want to delete this routine?')) return;
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>My Routines</h1>
          {loggedIn && (
            <Link href="/routines/new" style={{
              textDecoration: 'none',
              background: 'var(--primary)',
              color: '#fff',
              padding: '0.55rem 1.1rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}>+ New Routine</Link>
          )}
        </div>

        {!loggedIn ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'var(--surface)',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#x1F4CB;</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Login to manage your workout routines.
            </p>
            <Link href="/login" style={{
              textDecoration: 'none',
              background: 'var(--primary)',
              color: '#fff',
              padding: '0.6rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
            }}>Login</Link>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading routines...</div>
        ) : routines.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'var(--surface)',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#x1F4CB;</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              No routines yet. Create your first routine to get started!
            </p>
            <Link href="/routines/new" style={{
              textDecoration: 'none',
              background: 'var(--primary)',
              color: '#fff',
              padding: '0.6rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
            }}>Create Routine</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {routines.map(routine => (
              <div key={routine.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '1rem 1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <Link href={`/routines/${routine.id}`} style={{
                    textDecoration: 'none',
                    color: 'var(--text)',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                  }}>{routine.name}</Link>
                  <button onClick={() => handleDelete(routine.id)} style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}>&#x1F5D1;</button>
                </div>
                {routine.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    {routine.description}
                  </p>
                )}
                {routine.sets.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {routine.sets.map(s => (
                      <span key={s.id} style={{
                        background: 'rgba(255,107,53,0.1)',
                        color: 'var(--primary-light)',
                        padding: '0.15rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 500,
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
