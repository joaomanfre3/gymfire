'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getToken, getUser, logout } from '@/lib/api';

interface Exercise {
  id: string;
  name: string;
  slug: string;
  muscleGroup: string;
  equipment: string;
  category: string;
  difficulty: string;
  isFromLibrary: boolean;
  instructions: string[];
}

export default function AdminExercisesPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [importing, setImporting] = useState(false);
  const [libraryStats, setLibraryStats] = useState<{ totalLibrary: number; totalInDb: number; pending: number } | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!getToken() || user?.role !== 'ADMIN') { router.push('/admin/login'); return; }
    loadExercises();
    loadLibraryStats();
  }, [router]);

  async function loadExercises() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await apiFetch(`/api/exercises?${params}`);
      if (res.ok) setExercises(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function loadLibraryStats() {
    try {
      const res = await apiFetch('/api/admin/exercises/import');
      if (res.ok) setLibraryStats(await res.json());
    } catch { /* ignore */ }
  }

  async function handleImport() {
    setImporting(true);
    setImportStatus('');
    try {
      const res = await apiFetch('/api/admin/exercises/import', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setImportStatus(`${data.imported} exercícios importados!`);
        loadExercises();
        loadLibraryStats();
      }
    } catch { setImportStatus('Erro ao importar.'); }
    finally { setImporting(false); }
  }

  const muscleLabels: Record<string, string> = {
    CHEST: 'Peito', BACK: 'Costas', SHOULDERS: 'Ombros', BICEPS: 'Bíceps', TRICEPS: 'Tríceps',
    FOREARMS: 'Antebraços', CORE: 'Core', ABS: 'Abs', GLUTES: 'Glúteos', QUADS: 'Quadríceps',
    HAMSTRINGS: 'Posteriores', CALVES: 'Panturrilhas', FULL_BODY: 'Corpo Inteiro', CARDIO: 'Cardio',
  };

  const equipLabels: Record<string, string> = {
    BARBELL: 'Barra', DUMBBELL: 'Halter', MACHINE: 'Máquina', CABLE: 'Cabo', BODYWEIGHT: 'Corporal',
    KETTLEBELL: 'Kettlebell', RESISTANCE_BAND: 'Elástico', SMITH_MACHINE: 'Smith', EZ_BAR: 'Barra EZ',
    PULL_UP_BAR: 'Barra Fixa', DIP_BAR: 'Paralelas', OTHER: 'Outro',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <header className="glass" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,5,10,0.8)',
        borderBottom: '1px solid rgba(168,85,247,0.1)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: '64px' }}>
          <Link href="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.05em' }}>
            <span>&#x1F6E1;&#xFE0F;</span>
            <span style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GYMFIRE ADMIN</span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link href="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, padding: '0.4rem 0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dashboard</Link>
            <Link href="/admin/users" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, padding: '0.4rem 0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuários</Link>
            <Link href="/admin/exercises" style={{ color: '#A855F7', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, padding: '0.4rem 0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exercícios</Link>
            <button onClick={() => logout()} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem', textTransform: 'uppercase' }}>Sair</button>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em', marginBottom: '1rem' }}>
          <span style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>BIBLIOTECA DE EXERCÍCIOS</span>
        </h1>

        {/* Library Stats & Import */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              {libraryStats ? (
                <>
                  <strong style={{ color: 'var(--text)' }}>{libraryStats.totalInDb}</strong> exercícios no banco ·
                  <strong style={{ color: 'var(--accent)' }}> {libraryStats.totalLibrary}</strong> na biblioteca ·
                  <strong style={{ color: 'var(--warning)' }}> {libraryStats.pending}</strong> pendentes
                </>
              ) : 'Carregando estatísticas...'}
            </p>
          </div>
          <button onClick={handleImport} disabled={importing} style={{
            padding: '0.6rem 1.5rem',
            background: importing ? 'var(--surface-light)' : 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
            color: '#000', border: 'none', borderRadius: 'var(--radius-sm)',
            fontWeight: 700, cursor: importing ? 'not-allowed' : 'pointer',
            fontSize: '0.78rem', letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            {importing ? 'Importando...' : 'Importar Biblioteca Completa'}
          </button>
        </div>

        {importStatus && (
          <div style={{
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            color: 'var(--success)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem', marginBottom: '1rem',
          }}>{importStatus}</div>
        )}

        <form onSubmit={e => { e.preventDefault(); loadExercises(); }} style={{ marginBottom: '1rem' }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar exercícios..."
            style={{
              width: '100%', padding: '0.75rem 1rem',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '0.9rem',
              outline: 'none', boxSizing: 'border-box', transition: 'all 0.25s',
            }}
          />
        </form>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.65rem' }}>
            {exercises.map((ex, idx) => (
              <div key={ex.id} className="card-hover animate-in" style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '1rem',
                animationDelay: `${idx * 0.015}s`,
              }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>{ex.name}</h3>
                  {ex.isFromLibrary && <span style={{ background: 'rgba(0,240,212,0.08)', color: 'var(--accent)', padding: '0.1rem 0.35rem', borderRadius: '999px', fontSize: '0.55rem', fontWeight: 700, flexShrink: 0 }}>LIB</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
                  <span style={{ background: 'rgba(255,107,53,0.08)', color: 'var(--primary-light)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 600 }}>
                    {muscleLabels[ex.muscleGroup] || ex.muscleGroup}
                  </span>
                  <span style={{ background: 'rgba(0,240,212,0.06)', color: 'var(--accent)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 600 }}>
                    {equipLabels[ex.equipment] || ex.equipment}
                  </span>
                  <span style={{ background: 'rgba(168,85,247,0.06)', color: '#C084FC', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 600 }}>
                    {ex.difficulty}
                  </span>
                </div>
                {ex.instructions.length > 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0, lineHeight: 1.4 }}>
                    {ex.instructions[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
