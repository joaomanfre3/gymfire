'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises?: { id: string }[];
  _count?: { exercises: number };
}

export default function StartWorkoutPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/routines');
        if (res.ok) {
          const data = await res.json();
          setRoutines(Array.isArray(data) ? data : data.routines || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const startWorkout = async (routineId?: string) => {
    setStarting(routineId || 'quick');
    try {
      const body = routineId ? { routineId } : {};
      const res = await apiFetch('/api/workouts/start', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/workout/${data.id}`);
      }
    } catch { /* ignore */ }
    setStarting(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Start Workout</h1>

      {/* Quick workout */}
      <button onClick={() => startWorkout()}
        disabled={starting === 'quick'}
        className="w-full rounded-2xl p-6 mb-6 text-left transition-all duration-200 hover:scale-[1.01]"
        style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: '#fff' }}>
        <div className="flex items-center gap-4">
          <span className="text-3xl">⚡</span>
          <div>
            <p className="font-bold text-lg">Quick Workout</p>
            <p className="text-sm opacity-80">Start an empty workout and add exercises as you go</p>
          </div>
        </div>
      </button>

      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
        Or choose a routine
      </h2>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-8 h-8 border-3 rounded-full"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
        </div>
      ) : routines.length === 0 ? (
        <div className="text-center py-10 rounded-xl" style={{ background: 'var(--surface)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No routines yet. Create one first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => {
            const count = routine._count?.exercises ?? routine.exercises?.length ?? 0;
            return (
              <button key={routine.id}
                onClick={() => startWorkout(routine.id)}
                disabled={starting === routine.id}
                className="w-full rounded-xl p-4 text-left transition-all duration-200 hover:scale-[1.01]"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{routine.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {count} exercise{count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {starting === routine.id ? (
                    <div className="animate-spin w-5 h-5 border-2 rounded-full"
                      style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
                  ) : (
                    <span style={{ color: 'var(--primary)' }}>Start →</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
