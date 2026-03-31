'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';

interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
  equipment?: string;
  category?: string;
  difficulty?: string;
}

const muscleGroupLabels: Record<string, string> = {
  'All': 'Todos', 'Chest': 'Peito', 'Back': 'Costas', 'Shoulders': 'Ombros',
  'Biceps': 'Bíceps', 'Triceps': 'Tríceps', 'Forearms': 'Antebraços',
  'Core': 'Core', 'Quads': 'Quadríceps', 'Hamstrings': 'Posteriores',
  'Glutes': 'Glúteos', 'Calves': 'Panturrilhas', 'Full Body': 'Corpo Inteiro',
};

const muscleGroups = [
  'All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Core', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Full Body',
];

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');

  useEffect(() => {
    loadExercises();
  }, [selectedMuscle]);

  async function loadExercises() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMuscle !== 'All') params.set('muscleGroup', selectedMuscle);
      if (search) params.set('search', search);
      const res = await apiFetch(`/api/exercises?${params}`);
      if (res.ok) {
        setExercises(await res.json());
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadExercises();
  }

  const filtered = search
    ? exercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()))
    : exercises;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Biblioteca de Exercícios</h1>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar exercícios..."
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              color: 'var(--text)',
              fontSize: '0.95rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </form>

        {/* Muscle group chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
          {muscleGroups.map(mg => (
            <button
              key={mg}
              onClick={() => setSelectedMuscle(mg)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '999px',
                border: 'none',
                background: selectedMuscle === mg ? 'var(--primary)' : 'var(--surface-light)',
                color: selectedMuscle === mg ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: selectedMuscle === mg ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >{muscleGroupLabels[mg] || mg}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando exercícios...</div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'var(--surface)',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}>
            Nenhum exercício encontrado. Tente uma busca ou filtro diferente.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.75rem',
          }}>
            {filtered.map(ex => (
              <div key={ex.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '1rem',
                transition: 'border-color 0.2s',
              }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>{ex.name}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {ex.muscleGroup && (
                    <span style={{
                      background: 'rgba(255,107,53,0.12)',
                      color: 'var(--primary-light)',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                    }}>{ex.muscleGroup}</span>
                  )}
                  {ex.equipment && (
                    <span style={{
                      background: 'rgba(78,205,196,0.12)',
                      color: 'var(--accent)',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                    }}>{ex.equipment}</span>
                  )}
                  {ex.category && (
                    <span style={{
                      background: 'rgba(99,102,241,0.12)',
                      color: '#818CF8',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                    }}>{ex.category}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
