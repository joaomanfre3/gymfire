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
        <h1 style={{
          fontSize: '1.4rem',
          fontWeight: 900,
          marginBottom: '1rem',
          fontFamily: "'Orbitron', sans-serif",
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          <span className="gradient-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>Exercícios</span>
        </h1>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar exercícios..."
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text)',
              fontSize: '0.95rem',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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
                padding: '0.4rem 0.9rem',
                borderRadius: '999px',
                border: selectedMuscle === mg ? '1px solid rgba(255, 107, 53, 0.3)' : '1px solid transparent',
                background: selectedMuscle === mg ? 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,53,0.08))' : 'var(--surface-light)',
                color: selectedMuscle === mg ? 'var(--primary)' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: selectedMuscle === mg ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                boxShadow: selectedMuscle === mg ? '0 0 10px rgba(255, 107, 53, 0.1)' : 'none',
              }}
            >{muscleGroupLabels[mg] || mg}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Carregando exercícios...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="animate-in" style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow-card)',
          }}>
            Nenhum exercício encontrado. Tente uma busca ou filtro diferente.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.75rem',
          }}>
            {filtered.map((ex, idx) => (
              <div key={ex.id} className="card-hover animate-in" style={{
                background: 'var(--gradient-card)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem',
                animationDelay: `${idx * 0.02}s`,
              }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.6rem', letterSpacing: '0.01em' }}>{ex.name}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {ex.muscleGroup && (
                    <span style={{
                      background: 'rgba(255,107,53,0.1)',
                      color: 'var(--primary-light)',
                      padding: '0.18rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      border: '1px solid rgba(255,107,53,0.08)',
                      letterSpacing: '0.02em',
                    }}>{ex.muscleGroup}</span>
                  )}
                  {ex.equipment && (
                    <span style={{
                      background: 'rgba(0,240,212,0.08)',
                      color: 'var(--accent)',
                      padding: '0.18rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      border: '1px solid rgba(0,240,212,0.06)',
                      letterSpacing: '0.02em',
                    }}>{ex.equipment}</span>
                  )}
                  {ex.category && (
                    <span style={{
                      background: 'rgba(168,85,247,0.08)',
                      color: '#C084FC',
                      padding: '0.18rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      border: '1px solid rgba(168,85,247,0.06)',
                      letterSpacing: '0.02em',
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
