'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: login, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Falha no login');
        return;
      }

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_info', JSON.stringify(data.user));
      router.push('/');
    } catch {
      setError('Erro de conexão. Tente novamente.');
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
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255, 107, 53, 0.06), transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '15%',
        width: '250px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(0, 240, 212, 0.04), transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      <div className="animate-in" style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem 2rem',
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 107, 53, 0.04)',
        position: 'relative',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontSize: '2.5rem',
              display: 'block',
              filter: 'drop-shadow(0 0 15px rgba(255,107,53,0.4))',
            }}>&#x1F525;</span>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              margin: '0.25rem 0 0',
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: '0.05em',
            }}>
              <span className="gradient-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>GYMFIRE</span>
            </h1>
          </Link>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.6rem' }}>
            Bem-vindo de volta! Entre na sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              marginBottom: '0.4rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Usuário ou Email
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Digite seu usuário ou email"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              marginBottom: '0.4rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--error)',
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={loading ? '' : 'btn-glow'}
            style={{
              width: '100%',
              padding: '0.8rem',
              background: loading ? 'var(--surface-light)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              boxShadow: loading ? 'none' : '0 0 20px rgba(255, 107, 53, 0.2)',
              transition: 'all 0.3s',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Não tem conta?{' '}
          <Link href="/register" className="gradient-text" style={{ textDecoration: 'none', fontWeight: 700 }}>
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
