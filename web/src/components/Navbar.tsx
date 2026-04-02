'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getToken, getUser, logout } from '@/lib/api';

// Fire logo SVG (not emoji)
function FireLogo() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 107, 53, 0.4))' }}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.4-2.15 1-3 .22.65.84 1.3 1.5 1.5z"
        fill="url(#fireGrad)" />
      <defs>
        <linearGradient id="fireGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB800" />
          <stop offset="1" stopColor="#FF6B35" />
        </linearGradient>
      </defs>
    </svg>
  );
}

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

  // Hide on login/register
  if (pathname === '/login' || pathname === '/register') return null;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const navLinks = [
    { href: '/', label: 'Feed' },
    { href: '/exercises', label: 'Exercícios' },
    { href: '/ranking', label: 'Ranking' },
  ];

  const loggedInLinks = [
    { href: '/routines', label: 'Rotinas' },
  ];

  return (
    <header className="glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(10, 10, 15, 0.9)',
      borderBottom: '1px solid rgba(148, 148, 172, 0.08)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        height: '64px',
      }}>
        {/* Logo */}
        <Link href="/" style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <FireLogo />
          <span style={{
            fontSize: '1.2rem',
            fontWeight: 900,
            color: '#FF6B35',
            fontFamily: "'Orbitron', sans-serif",
            letterSpacing: '0.04em',
          }}>GYMFIRE</span>
        </Link>

        {/* Desktop nav */}
        <nav className="desktop-nav" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
        }}>
          {[...navLinks, ...(loggedIn ? loggedInLinks : [])].map(link => (
            <Link key={link.href} href={link.href} style={{
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: isActive(link.href) ? 700 : 500,
              color: isActive(link.href) ? '#FF6B35' : '#9494AC',
              padding: '8px 14px',
              borderRadius: '8px',
              background: isActive(link.href) ? 'rgba(255, 107, 53, 0.08)' : 'transparent',
              transition: 'all 200ms ease',
              letterSpacing: '0.02em',
              textTransform: 'uppercase' as const,
            }}>
              {link.label}
            </Link>
          ))}
          {loggedIn && (
            <Link href="/workout" style={{
              textDecoration: 'none',
              background: '#FF6B35',
              color: '#0A0A0F',
              fontWeight: 700,
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '12px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
              marginLeft: '6px',
              boxShadow: '0 0 15px rgba(255, 107, 53, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'opacity 200ms ease',
            }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0A0A0F" strokeWidth={2.5} strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              Treinar
            </Link>
          )}
        </nav>

        {/* Desktop auth */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {loggedIn && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link href="/profile" style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF6B35, #E05520)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: '2px solid rgba(255, 107, 53, 0.25)',
                }}>
                  {(user.displayName || user.username || '?')[0].toUpperCase()}
                </div>
                <span style={{ color: '#F0F0F8', fontSize: '13px', fontWeight: 600 }}>
                  {user.displayName || user.username}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: '1px solid rgba(148, 148, 172, 0.12)',
                  color: '#5C5C72',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 200ms',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.03em',
                }}
              >
                Sair
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/login" style={{
                textDecoration: 'none',
                color: '#9494AC',
                border: '1px solid rgba(148, 148, 172, 0.12)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.03em',
                transition: 'all 200ms',
              }}>
                Entrar
              </Link>
              <Link href="/register" style={{
                textDecoration: 'none',
                color: '#0A0A0F',
                background: '#FF6B35',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.03em',
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
            color: '#F0F0F8',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          {menuOpen ? '\u2715' : '\u2630'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          background: 'rgba(10, 10, 15, 0.98)',
          borderTop: '1px solid rgba(148, 148, 172, 0.08)',
          padding: '12px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          {[...navLinks, ...(loggedIn ? loggedInLinks : [])].map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} style={{
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive(link.href) ? 700 : 500,
              color: isActive(link.href) ? '#FF6B35' : '#9494AC',
              padding: '10px 12px',
              borderRadius: '8px',
              background: isActive(link.href) ? 'rgba(255, 107, 53, 0.08)' : 'transparent',
            }}>
              {link.label}
            </Link>
          ))}
          {loggedIn && (
            <Link href="/workout" onClick={() => setMenuOpen(false)} style={{
              textDecoration: 'none',
              background: '#FF6B35',
              color: '#0A0A0F',
              fontWeight: 700,
              textAlign: 'center',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              marginTop: '4px',
            }}>
              Treinar
            </Link>
          )}
          <div style={{ borderTop: '1px solid rgba(148, 148, 172, 0.08)', marginTop: '8px', paddingTop: '8px' }}>
            {loggedIn ? (
              <>
                <Link href="/profile" onClick={() => setMenuOpen(false)} style={{
                  textDecoration: 'none',
                  color: '#9494AC',
                  fontSize: '14px',
                  padding: '10px 12px',
                  display: 'block',
                  borderRadius: '8px',
                }}>
                  Meu Perfil
                </Link>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} style={{
                  background: 'none', border: 'none', color: '#FF4D6A',
                  fontSize: '14px', cursor: 'pointer', padding: '10px 12px',
                  width: '100%', textAlign: 'left', fontWeight: 600,
                }}>Sair</button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href="/login" onClick={() => setMenuOpen(false)} style={{
                  flex: 1, textDecoration: 'none', color: '#F0F0F8',
                  border: '1px solid rgba(148, 148, 172, 0.12)',
                  padding: '10px', borderRadius: '8px', textAlign: 'center',
                  fontSize: '13px', fontWeight: 600,
                }}>Entrar</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} style={{
                  flex: 1, textDecoration: 'none', color: '#0A0A0F',
                  background: '#FF6B35', padding: '10px', borderRadius: '8px',
                  textAlign: 'center', fontSize: '13px', fontWeight: 700,
                }}>Criar Conta</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
