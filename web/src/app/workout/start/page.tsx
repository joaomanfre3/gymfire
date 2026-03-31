'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken } from '@/lib/api';

interface Routine {
  id: string;
  name: string;
  description?: string;
  sets: Array<{ exercise: { name: string } }>;
}

export default function StartWorkoutPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    loadRoutines();
  }, [router]);

  async function loadRoutines() {
    try {
      const res = await apiFetch('/api/routines');
      if (res.ok) setRoutines(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function handleStart(routineId?: string, title?: string) {
    setStarting(true);
    try {
      const res = await apiFetch('/api/workouts/start', {
        method: 'POST',
        body: JSON.stringify({
          routineId: routineId || undefined,
          title: title || 'Quick Workout',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/workout/${data.id}`);
      }
    } catch { /* ignore */ } finally {
      setStarting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.25rem' }}>Start Workout</h1>

        {/* Quick start */}
        <button
          onClick={() => handleStart()}
          disabled={starting}
          style={{
            width: '100%',
            padding: '1.25rem',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            color: '#fff',
            border: 'none',
            borderRadius: '1rem',
            fontSize: '1.1rem',
            fontWeight: 700,
            cursor: starting ? 'not-allowed' : 'pointer',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          &#x26A1; Quick Start (Empty Workout)
        </button>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Or choose a routine:
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading routines...</div>
        ) : routines.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '2rem',
            background: 'var(--surface)', borderRadius: '1rem', border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}>
            <p>No routines yet.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Create routines to quickly start structured workouts.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {routines.map(r => (
              <button
                key={r.id}
                onClick={() => handleStart(r.id, r.name)}
                disabled={starting}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  padding: '1rem 1.25rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'border-color 0.2s',
                }}
              >
                <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', margin: 0 }}>{r.name}</p>
                {r.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>{r.description}</p>
                )}
                {r.sets.length > 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.35rem 0 0' }}>
                    {r.sets.map(s => s.exercise.name).join(', ')}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
