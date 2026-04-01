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
          title: title || 'Treino Livre',
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
        <h1 style={{
          fontSize: '1.4rem',
          fontWeight: 900,
          marginBottom: '1.25rem',
          fontFamily: "'Orbitron', sans-serif",
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          <span className="gradient-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>Iniciar Treino</span>
        </h1>

        {/* Quick start */}
        <button
          onClick={() => handleStart()}
          disabled={starting}
          className="btn-glow"
          style={{
            width: '100%',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark), var(--primary))',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 3s ease infinite',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            fontSize: '1.1rem',
            fontWeight: 800,
            cursor: starting ? 'not-allowed' : 'pointer',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            boxShadow: '0 0 30px rgba(255, 107, 53, 0.25), 0 4px 20px rgba(0,0,0,0.3)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontFamily: "'Orbitron', sans-serif",
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <span style={{ fontSize: '1.3rem', filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.3))' }}>&#x26A1;</span>
          Início Rápido
        </button>

        <h2 style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          Ou escolha uma rotina
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Carregando rotinas...</span>
          </div>
        ) : routines.length === 0 ? (
          <div className="animate-in" style={{
            textAlign: 'center', padding: '2rem',
            background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <p>Nenhuma rotina ainda.</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Crie rotinas para iniciar treinos estruturados rapidamente.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {routines.map((r, idx) => (
              <button
                key={r.id}
                onClick={() => handleStart(r.id, r.name)}
                disabled={starting}
                className="card-hover animate-in"
                style={{
                  background: 'var(--gradient-card)',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.1rem 1.25rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  animationDelay: `${idx * 0.05}s`,
                }}
              >
                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', margin: 0 }}>{r.name}</p>
                {r.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>{r.description}</p>
                )}
                {r.sets.length > 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: '0.4rem 0 0' }}>
                    {r.sets.map(s => s.exercise.name).join(' · ')}
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
