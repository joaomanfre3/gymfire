'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { apiFetch } from '@/lib/api';

interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
  equipment?: string;
  category?: string;
  difficulty?: string;
  instructions?: string[];
}

const muscleLabels: Record<string, string> = {
  CHEST: 'Peito', BACK: 'Costas', SHOULDERS: 'Ombros', BICEPS: 'Bíceps',
  TRICEPS: 'Tríceps', FOREARMS: 'Antebraços', CORE: 'Core', ABS: 'Abdômen',
  QUADS: 'Quadríceps', HAMSTRINGS: 'Posteriores', GLUTES: 'Glúteos',
  CALVES: 'Panturrilhas', FULL_BODY: 'Corpo Inteiro', CARDIO: 'Cardio',
};

const equipLabels: Record<string, string> = {
  BARBELL: 'Barra', DUMBBELL: 'Halter', CABLE: 'Cabo', MACHINE: 'Máquina',
  BODYWEIGHT: 'Peso Corporal', KETTLEBELL: 'Kettlebell', SMITH_MACHINE: 'Smith',
  PULL_UP_BAR: 'Barra Fixa', DIP_BAR: 'Paralela', OTHER: 'Outro',
};

const diffLabels: Record<string, { label: string; color: string }> = {
  BEGINNER: { label: 'Iniciante', color: '#10B981' },
  INTERMEDIATE: { label: 'Intermediário', color: '#F59E0B' },
  ADVANCED: { label: 'Avançado', color: '#FF4D6A' },
};

const filters = ['Todos', 'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'CORE', 'FULL_BODY'];

// SVG Icons
function SearchIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
function DumbbellIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth={1.5} strokeLinecap="round"><path d="M6.5 6.5h11M6 12H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2m0 8H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2m0-4v8m12-8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2m0-8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2m0 4V8" /></svg>;
}
function ChevronDownIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>;
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadExercises = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMuscle !== 'Todos') params.set('muscleGroup', selectedMuscle);
      if (search) params.set('search', search);
      const res = await apiFetch(`/api/exercises?${params}`);
      if (res.ok) setExercises(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [selectedMuscle, search]);

  useEffect(() => { loadExercises(); }, [selectedMuscle]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadExercises(), 300);
  };

  const filtered = search
    ? exercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()))
    : exercises;

  // Group by first letter
  const grouped = filtered.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const letter = ex.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(ex);
    return acc;
  }, {});
  const sortedLetters = Object.keys(grouped).sort();

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <DumbbellIcon />
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F0F8', margin: 0 }}>Exercícios</h1>
            <p style={{ fontSize: '13px', color: '#9494AC', margin: 0 }}>
              {exercises.length} exercícios disponíveis
            </p>
          </div>
        </div>

        {/* Sticky search */}
        <div style={{
          position: 'sticky', top: '64px', zIndex: 40,
          background: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(12px)',
          padding: '12px 0', marginBottom: '4px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#141420', borderRadius: '12px',
            border: '1px solid rgba(148, 148, 172, 0.08)',
            padding: '10px 14px',
          }}>
            <SearchIcon />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar exercício..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#F0F0F8', fontSize: '14px',
              }}
            />
            {search && (
              <button onClick={() => { setSearch(''); loadExercises(); }} style={{
                background: 'none', border: 'none', color: '#5C5C72', cursor: 'pointer', fontSize: '16px',
              }}>&times;</button>
            )}
          </div>
        </div>

        {/* Muscle filters */}
        <div className="hide-scrollbar" style={{
          display: 'flex', gap: '6px', overflowX: 'auto', padding: '8px 0 16px',
          scrollbarWidth: 'none',
        }}>
          {filters.map(f => {
            const isActive = selectedMuscle === f;
            return (
              <button key={f} onClick={() => setSelectedMuscle(f)} style={{
                padding: '7px 14px', borderRadius: '20px', fontSize: '12px',
                fontWeight: isActive ? 700 : 600, whiteSpace: 'nowrap', cursor: 'pointer',
                transition: 'all 200ms', border: '1px solid transparent',
                background: isActive ? '#FF6B35' : '#141420',
                color: isActive ? '#0A0A0F' : '#9494AC',
                borderColor: isActive ? '#FF6B35' : 'rgba(148, 148, 172, 0.08)',
              }}>
                {f === 'Todos' ? 'Todos' : (muscleLabels[f] || f)}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shimmer" style={{
                height: '64px', borderRadius: '12px', marginBottom: '8px', background: '#141420',
              }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: '#141420', borderRadius: '16px',
            border: '1px solid rgba(148, 148, 172, 0.08)',
            color: '#5C5C72', fontSize: '14px',
          }}>
            Nenhum exercício encontrado.
          </div>
        ) : (
          <div>
            {sortedLetters.map(letter => (
              <div key={letter} style={{ marginBottom: '8px' }}>
                <div style={{
                  fontSize: '12px', fontWeight: 700, color: '#FF6B35',
                  padding: '8px 4px 4px', textTransform: 'uppercase',
                  borderBottom: '1px solid rgba(255, 107, 53, 0.1)',
                  marginBottom: '4px',
                }}>{letter}</div>

                <div style={{
                  background: '#141420', borderRadius: '14px',
                  border: '1px solid rgba(148, 148, 172, 0.08)',
                  overflow: 'hidden',
                }}>
                  {grouped[letter].map((ex, i) => {
                    const isExpanded = expandedId === ex.id;
                    const diff = diffLabels[ex.difficulty || ''];
                    return (
                      <div key={ex.id} style={{
                        borderBottom: i < grouped[letter].length - 1 ? '1px solid rgba(148, 148, 172, 0.06)' : 'none',
                      }}>
                        <button onClick={() => setExpandedId(isExpanded ? null : ex.id)} style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 16px', background: isExpanded ? 'rgba(255, 107, 53, 0.03)' : 'transparent',
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                          transition: 'background 150ms',
                        }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'rgba(255, 107, 53, 0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <DumbbellIcon />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '14px', fontWeight: 600, color: '#F0F0F8',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{ex.name}</div>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', color: '#FF8050', background: 'rgba(255,107,53,0.08)', padding: '1px 8px', borderRadius: '4px', fontWeight: 500 }}>
                                {muscleLabels[ex.muscleGroup || ''] || ex.muscleGroup}
                              </span>
                              {ex.equipment && (
                                <span style={{ fontSize: '11px', color: '#00D4FF', background: 'rgba(0,212,255,0.08)', padding: '1px 8px', borderRadius: '4px', fontWeight: 500 }}>
                                  {equipLabels[ex.equipment] || ex.equipment}
                                </span>
                              )}
                              {diff && (
                                <span style={{ fontSize: '11px', color: diff.color, background: `${diff.color}15`, padding: '1px 8px', borderRadius: '4px', fontWeight: 500 }}>
                                  {diff.label}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ color: '#5C5C72', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>
                            <ChevronDownIcon />
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div style={{ padding: '0 16px 14px', animation: 'expandIn 200ms ease' }}>
                            {ex.category && (
                              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                                <span style={{ fontSize: '11px', color: '#A855F7', background: 'rgba(168,85,247,0.08)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                  {ex.category}
                                </span>
                              </div>
                            )}
                            {ex.instructions && ex.instructions.length > 0 && (
                              <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                  Instruções
                                </div>
                                <ol style={{ margin: 0, paddingLeft: '18px' }}>
                                  {ex.instructions.slice(0, 5).map((inst, j) => (
                                    <li key={j} style={{ fontSize: '13px', color: '#9494AC', lineHeight: 1.6, marginBottom: '4px' }}>
                                      {inst}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                            {(!ex.instructions || ex.instructions.length === 0) && (
                              <p style={{ fontSize: '13px', color: '#5C5C72', margin: 0 }}>
                                Instruções não disponíveis para este exercício.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
