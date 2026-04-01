'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken } from '@/lib/api';

export default function NewRoutinePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('O nome da rotina é obrigatório');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/api/routines', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/routines/${data.id}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Falha ao criar rotina');
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.8rem 1rem',
    background: 'var(--surface-light)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <main style={{ maxWidth: '500px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <Link href="/routines" style={{
          color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem',
          textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
          transition: 'color 0.2s',
        }}>
          &larr; Voltar às Rotinas
        </Link>
        <h1 style={{
          fontSize: '1.4rem', fontWeight: 900, margin: '0.75rem 0 1.25rem',
          fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          <span className="gradient-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>Nova Rotina</span>
        </h1>

        <form onSubmit={handleSubmit} className="animate-in" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div>
            <label style={{
              display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.4rem',
              fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              Nome da Rotina
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="ex. Dia de Peito, Dia de Perna" required style={inputStyle} />
          </div>
          <div>
            <label style={{
              display: 'block', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.4rem',
              fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              Descrição (opcional)
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva sua rotina..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--error)',
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} className={loading ? '' : 'btn-glow'} style={{
            padding: '0.8rem',
            background: loading ? 'var(--surface-light)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            boxShadow: loading ? 'none' : '0 0 20px rgba(255, 107, 53, 0.2)',
            transition: 'all 0.3s',
          }}>
            {loading ? 'Criando...' : 'Criar Rotina'}
          </button>
        </form>
      </main>
    </div>
  );
}
