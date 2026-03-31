'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Routine {
  id: string;
  name: string;
  description?: string;
  days?: string[];
  exercises?: { id: string }[];
  _count?: { exercises: number };
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'MON', TUESDAY: 'TUE', WEDNESDAY: 'WED', THURSDAY: 'THU',
  FRIDAY: 'FRI', SATURDAY: 'SAT', SUNDAY: 'SUN',
  MON: 'MON', TUE: 'TUE', WED: 'WED', THU: 'THU', FRI: 'FRI', SAT: 'SAT', SUN: 'SUN',
};

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 rounded-full"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Routines</h1>
        <Link href="/routines/new"
          className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
          style={{ background: 'var(--primary)' }}>
          + New Routine
        </Link>
      </div>

      {routines.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>No routines yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Create your first routine to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {routines.map((routine) => {
            const exerciseCount = routine._count?.exercises ?? routine.exercises?.length ?? 0;
            return (
              <Link key={routine.id} href={`/routines/${routine.id}`}
                className="block rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h3 className="font-bold text-lg mb-1">{routine.name}</h3>
                {routine.description && (
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {routine.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: 'rgba(255, 107, 53, 0.12)', color: 'var(--primary)' }}>
                    {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {routine.days && routine.days.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {routine.days.map((day) => (
                      <span key={day} className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>
                        {DAY_LABELS[day] || day}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
