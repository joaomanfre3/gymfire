'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getToken, getUser } from '@/lib/api';

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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    setLoggedIn(false);
    setUser(null);
    router.push('/');
  };

  const isActive = (href: string) => pathname === href;

  const linkStyle = (href: string): React.CSSProperties => ({
    color: isActive(href) ? 'var(--primary)' : 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: isActive(href) ? 700 : 500,
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    transition: 'color 0.2s',
  });

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem',
          height: '60px',
        }}>
          {/* Logo */}
          <Link href="/" style={{
            textDecoration: 'none',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <span role="img" aria-label="fire">&#x1F525;</span> GymFire
          </Link>

          {/* Desktop nav */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }} className="desktop-nav">
            <Link href="/" style={linkStyle('/')}>Feed</Link>
            <Link href="/exercises" style={linkStyle('/exercises')}>Exercícios</Link>
            <Link href="/ranking" style={linkStyle('/ranking')}>Ranking</Link>
            {loggedIn && (
              <>
                <Link href="/routines" style={linkStyle('/routines')}>Rotinas</Link>
                <Link href="/workout/start" style={{
                  ...linkStyle('/workout/start'),
                  background: 'var(--primary)',
                  color: '#fff',
                  fontWeight: 600,
                  padding: '0.5rem 1rem',
                }}>Iniciar Treino</Link>
              </>
            )}
          </nav>

          {/* Desktop auth area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="desktop-nav">
            {loggedIn && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Link href="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}>
                    {(user.displayName || user.username || '?')[0].toUpperCase()}
                  </div>
                  <span style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: 500 }}>
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
                    fontSize: '0.8rem',
                  }}
                >
                  Sair
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href="/login" style={{
                  textDecoration: 'none',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  padding: '0.45rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}>
                  Entrar
                </Link>
                <Link href="/register" style={{
                  textDecoration: 'none',
                  color: '#fff',
                  background: 'var(--primary)',
                  padding: '0.45rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
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
          <div className="mobile-dropdown" style={{
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
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
                <Link href="/workout/start" onClick={() => setMenuOpen(false)} style={{
                  ...linkStyle('/workout/start'),
                  background: 'var(--primary)',
                  color: '#fff',
                  fontWeight: 600,
                  textAlign: 'center' as const,
                  marginTop: '0.25rem',
                }}>Iniciar Treino</Link>
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
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    padding: '0.5rem 0.75rem',
                    width: '100%',
                    textAlign: 'left',
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
                    fontSize: '0.85rem',
                  }}>Entrar</Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)} style={{
                    flex: 1,
                    textDecoration: 'none',
                    color: '#fff',
                    background: 'var(--primary)',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}>Criar Conta</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <style>{`
        .desktop-nav { display: flex !important; }
        .mobile-menu-btn { display: none !important; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </>
  );
}
