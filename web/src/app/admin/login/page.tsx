'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Falha no login');
        return;
      }

      if (data.user?.role !== 'ADMIN') {
        setError('Acesso negado. Esta área é exclusiva para administradores.');
        return;
      }

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_info', JSON.stringify(data.user));
      router.push('/admin');
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Register the user
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, displayName }),
      });
      const regData = await regRes.json();

      if (!regRes.ok) {
        setError(regData.error || 'Falha no cadastro');
        return;
      }

      // Now login to get tokens
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        setError('Conta criada, mas falha no login. Tente fazer login.');
        return;
      }

      // Promote to admin via API
      localStorage.setItem('access_token', loginData.access_token);

      const promoteRes = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.access_token}`,
        },
        body: JSON.stringify({ userId: regData.id }),
      });

      if (promoteRes.ok) {
        const updatedUser = { ...loginData.user, role: 'ADMIN' };
        localStorage.setItem('user_info', JSON.stringify(updatedUser));
        localStorage.setItem('refresh_token', loginData.refresh_token);
        router.push('/admin');
      } else {
        localStorage.setItem('refresh_token', loginData.refresh_token);
        localStorage.setItem('user_info', JSON.stringify(loginData.user));
        setError('Conta criada! Faça login novamente.');
        setMode('login');
      }
    } catch {
      setError('Erro de conexão.');
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
    transition: 'all 0.25s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    marginBottom: '0.4rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
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
    }}>
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '20%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(168,85,247,0.05), transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      <div className="animate-in" style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--surface)',
        border: '1px solid rgba(168,85,247,0.15)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem 2rem',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 30px rgba(168,85,247,0.05)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#x1F6E1;&#xFE0F;</div>
          <h1 style={{
            fontSize: '1.3rem',
            fontWeight: 900,
            fontFamily: "'Orbitron', sans-serif",
            letterSpacing: '0.05em',
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>ADMIN PANEL</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.4rem' }}>
            Painel de controle GymFire
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--surface-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.2rem',
          marginBottom: '1.5rem',
        }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '0.5rem', borderRadius: '0.3rem', border: 'none',
                background: mode === m ? 'linear-gradient(135deg, #A855F7, #7C3AED)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-muted)',
                fontWeight: mode === m ? 700 : 500, cursor: 'pointer',
                fontSize: '0.78rem', letterSpacing: '0.05em', textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}
            >
              {m === 'login' ? 'Entrar' : 'Criar Admin'}
            </button>
          ))}
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

          {mode === 'register' && (
            <>
              <div>
                <label style={labelStyle}>Nome de Exibição</label>
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="Admin GymFire" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Usuário</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="admin" required style={inputStyle} />
              </div>
            </>
          )}

          <div>
            <label style={labelStyle}>Email</label>
            <input type={mode === 'register' ? 'email' : 'text'} value={email} onChange={e => setEmail(e.target.value)}
              placeholder={mode === 'login' ? 'Email ou usuário' : 'admin@gymfire.com'}
              required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Senha" required style={inputStyle} />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--error)',
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%',
            padding: '0.8rem',
            background: loading ? 'var(--surface-light)' : 'linear-gradient(135deg, #A855F7, #7C3AED)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            boxShadow: loading ? 'none' : '0 0 20px rgba(168,85,247,0.2)',
            transition: 'all 0.3s',
            marginTop: '0.25rem',
          }}>
            {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar Conta Admin'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem' }}>
            &larr; Voltar ao GymFire
          </Link>
        </div>
      </div>
    </div>
  );
}
