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
    padding: '0.75rem 1rem',
    background: 'var(--surface-light)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    color: 'var(--text)',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <main style={{ maxWidth: '500px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        <Link href="/routines" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
          &larr; Voltar às Rotinas
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.75rem 0 1.25rem' }}>Nova Rotina</h1>

        <form onSubmit={handleSubmit} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 500 }}>
              Nome da Rotina
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="ex. Dia de Peito, Dia de Perna" required style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 500 }}>
              Descrição (opcional)
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva sua rotina..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--error)',
              padding: '0.65rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            padding: '0.75rem',
            background: loading ? 'var(--surface-light)' : 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Criando...' : 'Criar Rotina'}
          </button>
        </form>
      </main>
    </div>
  );
}
