'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
  equipment?: string;
}

const MUSCLE_GROUPS = [
  'All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Cardio',
];

const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#FF6B35',
  Back: '#4ECDC4',
  Shoulders: '#FACC15',
  Biceps: '#22C55E',
  Triceps: '#A855F7',
  Legs: '#3B82F6',
  Glutes: '#EC4899',
  Core: '#F97316',
  Cardio: '#EF4444',
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/exercises');
        if (res.ok) {
          const data = await res.json();
          setExercises(Array.isArray(data) ? data : data.exercises || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const filtered = exercises.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === 'All' ||
      (e.muscleGroup && e.muscleGroup.toLowerCase() === selectedGroup.toLowerCase());
    return matchesSearch && matchesGroup;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Exercises</h1>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        placeholder="Search exercises..."
      />

      {/* Muscle group filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {MUSCLE_GROUPS.map((group) => (
          <button
            key={group}
            onClick={() => setSelectedGroup(group)}
            className="px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0"
            style={{
              background: selectedGroup === group ? 'var(--primary)' : 'var(--surface)',
              color: selectedGroup === group ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${selectedGroup === group ? 'var(--primary)' : 'var(--border)'}`,
            }}
          >
            {group}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-3 rounded-full"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">💪</p>
          <p style={{ color: 'var(--text-muted)' }}>No exercises found</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exercise) => {
            const color = MUSCLE_COLORS[exercise.muscleGroup || ''] || 'var(--accent)';
            return (
              <div key={exercise.id} className="rounded-xl p-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="font-semibold text-sm mb-2">{exercise.name}</p>
                <div className="flex gap-2 flex-wrap">
                  {exercise.muscleGroup && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={{ background: `${color}18`, color }}>
                      {exercise.muscleGroup}
                    </span>
                  )}
                  {exercise.equipment && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={{ background: 'var(--surface-light)', color: 'var(--text-muted)' }}>
                      {exercise.equipment}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
