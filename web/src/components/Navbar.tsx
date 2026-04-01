'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getToken, getUser, logout } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ displayName?: string; username?: string } | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    const u = getUser();
    setLoggedIn(!!token);
    setUser(u);
  }, [pathname]);

  const handleLogout = () => {
    setLoggedIn(false);
    setUser(null);
    logout();
  };

  const isActive = (href: string) => pathname === href;

  const linkStyle = (href: string): React.CSSProperties => ({
    color: isActive(href) ? 'var(--primary)' : 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: isActive(href) ? 700 : 500,
    padding: '0.45rem 0.85rem',
    borderRadius: '0.5rem',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    background: isActive(href) ? 'rgba(255, 107, 53, 0.08)' : 'transparent',
    letterSpacing: '0.02em',
    position: 'relative' as const,
    textTransform: 'uppercase' as const,
  });

  return (
    <>
      <header className="glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(5, 5, 10, 0.8)',
        borderBottom: '1px solid rgba(255, 107, 53, 0.08)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          height: '64px',
        }}>
          {/* Logo */}
          <Link href="/" style={{
            textDecoration: 'none',
            fontSize: '1.35rem',
            fontWeight: 900,
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: "'Orbitron', sans-serif",
            letterSpacing: '0.05em',
            textShadow: '0 0 20px rgba(255, 107, 53, 0.3)',
          }}>
            <span style={{
              fontSize: '1.5rem',
              filter: 'drop-shadow(0 0 8px rgba(255, 107, 53, 0.5))',
            }} role="img" aria-label="fire">&#x1F525;</span>
            GYMFIRE
          </Link>

          {/* Desktop nav */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.15rem',
          }} className="desktop-nav">
            <Link href="/" style={linkStyle('/')}>Feed</Link>
            <Link href="/exercises" style={linkStyle('/exercises')}>Exercícios</Link>
            <Link href="/ranking" style={linkStyle('/ranking')}>Ranking</Link>
            {loggedIn && (
              <>
                <Link href="/routines" style={linkStyle('/routines')}>Rotinas</Link>
                <Link href="/workout/start" className="btn-glow" style={{
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  color: '#fff',
                  fontWeight: 700,
                  padding: '0.5rem 1.1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 15px rgba(255, 107, 53, 0.2)',
                  marginLeft: '0.35rem',
                }}>&#x26A1; Treinar</Link>
              </>
            )}
          </nav>

          {/* Desktop auth area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="desktop-nav">
            {loggedIn && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Link href="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    boxShadow: '0 0 12px rgba(255, 107, 53, 0.25)',
                    border: '2px solid rgba(255, 107, 53, 0.3)',
                  }}>
                    {(user.displayName || user.username || '?')[0].toUpperCase()}
                  </div>
                  <span style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600 }}>
                    {user.displayName || user.username}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    transition: 'all 0.2s',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  Sair
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href="/login" style={{
                  textDecoration: 'none',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  padding: '0.45rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}>
                  Entrar
                </Link>
                <Link href="/register" className="btn-glow" style={{
                  textDecoration: 'none',
                  color: '#fff',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  padding: '0.45rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 15px rgba(255, 107, 53, 0.15)',
                }}>
                  Criar Conta
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            {menuOpen ? '\u2715' : '\u2630'}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="glass" style={{
            background: 'rgba(5, 5, 10, 0.95)',
            borderTop: '1px solid rgba(255, 107, 53, 0.08)',
            padding: '0.75rem 1.25rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}>
            <Link href="/" onClick={() => setMenuOpen(false)} style={linkStyle('/')}>Feed</Link>
            <Link href="/exercises" onClick={() => setMenuOpen(false)} style={linkStyle('/exercises')}>Exercícios</Link>
            <Link href="/ranking" onClick={() => setMenuOpen(false)} style={linkStyle('/ranking')}>Ranking</Link>
            {loggedIn && (
              <>
                <Link href="/routines" onClick={() => setMenuOpen(false)} style={linkStyle('/routines')}>Rotinas</Link>
                <Link href="/workout/start" onClick={() => setMenuOpen(false)} className="btn-glow" style={{
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  color: '#fff',
                  fontWeight: 700,
                  textAlign: 'center' as const,
                  marginTop: '0.25rem',
                  padding: '0.6rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase' as const,
                }}>&#x26A1; Treinar</Link>
              </>
            )}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
              {loggedIn ? (
                <>
                  <Link href="/profile" onClick={() => setMenuOpen(false)} style={linkStyle('/profile')}>Meu Perfil</Link>
                  <button onClick={() => { handleLogout(); setMenuOpen(false); }} style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--error)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    padding: '0.5rem 0.75rem',
                    width: '100%',
                    textAlign: 'left',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    fontWeight: 600,
                  }}>Sair</button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href="/login" onClick={() => setMenuOpen(false)} style={{
                    flex: 1,
                    textDecoration: 'none',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}>Entrar</Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)} className="btn-glow" style={{
                    flex: 1,
                    textDecoration: 'none',
                    color: '#fff',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}>Criar Conta</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
