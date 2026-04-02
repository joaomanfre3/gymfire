'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  _count?: { sets: number };
}

// SVG Icons
function ListIcon() {
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth={1.5} strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;
}
function PlusIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function PlayIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="#0A0A0F" stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}
function TrashIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FF4D6A" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>;
}
function TimerIcon() {
  return <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#9494AC" strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M10 2h4" /></svg>;
}
function DumbbellSmallIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#9494AC" strokeWidth={1.5} strokeLinecap="round"><path d="M6.5 6.5h11M6 12H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2m0 8H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2m0-4v8m12-8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2m0-8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2m0 4V8" /></svg>;
}

export default function RoutinesPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = getToken();
    setLoggedIn(!!token);
    if (token) loadRoutines();
    else setLoading(false);
  }, []);

  async function loadRoutines() {
    try {
      const res = await apiFetch('/api/routines');
      if (res.ok) setRoutines(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await apiFetch(`/api/routines/${id}`, { method: 'DELETE' });
      if (res.ok) setRoutines(prev => prev.filter(r => r.id !== id));
    } catch { /* ignore */ }
  }

  const mockTemplates = [
    { name: 'Push Pull Legs (Push)', exercises: 6, est: '55min' },
    { name: 'Push Pull Legs (Pull)', exercises: 5, est: '50min' },
    { name: 'Push Pull Legs (Legs)', exercises: 7, est: '60min' },
    { name: 'Full Body Iniciante', exercises: 4, est: '45min' },
    { name: 'Upper/Lower A', exercises: 6, est: '55min' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ListIcon />
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F0F8', margin: 0 }}>Rotinas</h1>
              <p style={{ fontSize: '13px', color: '#9494AC', margin: 0 }}>
                {loggedIn ? `${routines.length} rotinas salvas` : 'Gerencie seus treinos'}
              </p>
            </div>
          </div>
          {loggedIn && (
            <Link href="/routines/new" style={{
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
              background: '#FF6B35', color: '#0A0A0F', padding: '10px 18px',
              borderRadius: '10px', fontWeight: 700, fontSize: '13px',
              boxShadow: '0 0 15px rgba(255, 107, 53, 0.2)',
            }}>
              <PlusIcon /> Nova Rotina
            </Link>
          )}
        </div>

        {/* Not logged in */}
        {!loggedIn ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            background: '#141420', borderRadius: '16px',
            border: '1px solid rgba(148, 148, 172, 0.08)',
          }}>
            <ListIcon />
            <p style={{ color: '#9494AC', margin: '12px 0 16px', fontSize: '14px' }}>
              Entre para gerenciar suas rotinas de treino.
            </p>
            <Link href="/login" style={{
              textDecoration: 'none', background: '#FF6B35', color: '#0A0A0F',
              padding: '12px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
              display: 'inline-block',
            }}>Entrar</Link>
          </div>
        ) : loading ? (
          <div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shimmer" style={{
                height: '120px', borderRadius: '14px', marginBottom: '10px', background: '#141420',
              }} />
            ))}
          </div>
        ) : (
          <>
            {/* User routines */}
            {routines.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '12px', fontWeight: 700, color: '#5C5C72',
                  textTransform: 'uppercase', letterSpacing: '0.8px',
                  marginBottom: '10px',
                }}>Minhas Rotinas</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {routines.map(routine => {
                    const exerciseNames = [...new Set(routine.sets.map(s => s.exercise.name))];
                    const estMin = exerciseNames.length * 8 + 10;
                    return (
                      <div key={routine.id} style={{
                        background: '#141420', borderRadius: '14px',
                        border: '1px solid rgba(148, 148, 172, 0.08)',
                        padding: '16px', transition: 'all 200ms',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <Link href={`/routines/${routine.id}`} style={{
                            textDecoration: 'none', fontSize: '16px', fontWeight: 700,
                            color: '#F0F0F8',
                          }}>{routine.name}</Link>
                          <button onClick={() => handleDelete(routine.id)} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '4px', opacity: 0.5, transition: 'opacity 200ms',
                          }}>
                            <TrashIcon />
                          </button>
                        </div>

                        {routine.description && (
                          <p style={{ fontSize: '13px', color: '#9494AC', margin: '0 0 10px', lineHeight: 1.4 }}>
                            {routine.description}
                          </p>
                        )}

                        {/* Stats */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9494AC' }}>
                            <DumbbellSmallIcon /> {exerciseNames.length} exerc.
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9494AC' }}>
                            <TimerIcon /> ~{estMin}min
                          </span>
                          <span style={{ fontSize: '12px', color: '#5C5C72' }}>
                            {routine.sets.length} séries
                          </span>
                        </div>

                        {/* Exercise pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                          {exerciseNames.slice(0, 4).map(name => (
                            <span key={name} style={{
                              fontSize: '11px', background: 'rgba(255,107,53,0.08)',
                              color: '#FF8050', padding: '3px 10px', borderRadius: '6px', fontWeight: 500,
                            }}>{name}</span>
                          ))}
                          {exerciseNames.length > 4 && (
                            <span style={{ fontSize: '11px', color: '#5C5C72', padding: '3px 6px' }}>
                              +{exerciseNames.length - 4}
                            </span>
                          )}
                        </div>

                        {/* Start button */}
                        <button onClick={() => router.push('/workout')} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
                          background: '#FF6B35', color: '#0A0A0F', fontSize: '13px',
                          fontWeight: 700, cursor: 'pointer', transition: 'opacity 200ms',
                        }}>
                          <PlayIcon /> Iniciar Treino
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {routines.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '40px 20px', marginBottom: '24px',
                background: '#141420', borderRadius: '16px',
                border: '1px solid rgba(148, 148, 172, 0.08)',
              }}>
                <ListIcon />
                <p style={{ color: '#9494AC', margin: '12px 0 16px', fontSize: '14px' }}>
                  Nenhuma rotina ainda. Crie sua primeira!
                </p>
                <Link href="/routines/new" style={{
                  textDecoration: 'none', background: '#FF6B35', color: '#0A0A0F',
                  padding: '12px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}>
                  <PlusIcon /> Criar Rotina
                </Link>
              </div>
            )}

            {/* Templates */}
            <div>
              <div style={{
                fontSize: '12px', fontWeight: 700, color: '#5C5C72',
                textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px',
              }}>Templates Populares</div>

              <div style={{
                background: '#141420', borderRadius: '14px',
                border: '1px solid rgba(148, 148, 172, 0.08)',
                overflow: 'hidden',
              }}>
                {mockTemplates.map((t, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '12px',
                    borderBottom: i < mockTemplates.length - 1 ? '1px solid rgba(148,148,172,0.06)' : 'none',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'rgba(255,107,53,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <ListIcon />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8' }}>{t.name}</div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
                        <span style={{ fontSize: '12px', color: '#9494AC', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <DumbbellSmallIcon /> {t.exercises} exerc.
                        </span>
                        <span style={{ fontSize: '12px', color: '#9494AC', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <TimerIcon /> {t.est}
                        </span>
                      </div>
                    </div>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={2} strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
