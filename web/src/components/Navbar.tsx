'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getToken, getUser, logout, apiFetch } from '@/lib/api';

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

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

function BellIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

const notifIconMap: Record<string, { icon: string; color: string }> = {
  NEW_FOLLOWER: { icon: '👤', color: '#3B82F6' },
  LIKE: { icon: '❤️', color: '#FF4D6A' },
  FIRE_REACTION: { icon: '🔥', color: '#FF6B35' },
  COMMENT: { icon: '💬', color: '#10B981' },
  MENTION: { icon: '@', color: '#A855F7' },
  PR_ACHIEVED: { icon: '🏆', color: '#FFB800' },
  STREAK_MILESTONE: { icon: '⚡', color: '#CCFF00' },
  STREAK_REMINDER: { icon: '⏰', color: '#FF6B35' },
  STREAK_BROKEN: { icon: '💔', color: '#FF4D6A' },
  FRIEND_WORKOUT: { icon: '💪', color: '#FF6B35' },
  FRIEND_PR: { icon: '🥇', color: '#FFB800' },
  BADGE_EARNED: { icon: '🎖️', color: '#A855F7' },
  CHALLENGE_INVITE: { icon: '🎯', color: '#10B981' },
  CHALLENGE_COMPLETE: { icon: '✅', color: '#10B981' },
  SPEED_VIEW: { icon: '👁️', color: '#9494AC' },
  SPEED_REACTION: { icon: '🔥', color: '#FF6B35' },
  SPEED_COMMENT: { icon: '💬', color: '#10B981' },
  SPEED_MENTION: { icon: '@', color: '#A855F7' },
  SPEED_REPOST: { icon: '🔄', color: '#3B82F6' },
  WEEKLY_SUMMARY: { icon: '📊', color: '#00D4FF' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}sem`;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ displayName?: string; username?: string; role?: string } | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [aiAlertLevel, setAiAlertLevel] = useState<string>('ok');
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    const u = getUser();
    setLoggedIn(!!token);
    setUser(u);
    if (token) loadNotifications();
    // Admin AI alert polling
    if (u?.role === 'ADMIN' && token) {
      const loadAlert = async () => {
        try {
          const res = await apiFetch('/api/admin/ai/usage');
          if (res.ok) {
            const data = await res.json();
            setAiAlertLevel(data.alert?.level || 'ok');
          }
        } catch { /* ignore */ }
      };
      loadAlert();
      const interval = setInterval(loadAlert, 30000);
      return () => clearInterval(interval);
    }
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await apiFetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* ignore */ }
  }, []);

  async function markAllRead() {
    try {
      await apiFetch('/api/notifications', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  }

  function handleBellClick() {
    setNotifOpen(prev => !prev);
    if (!notifOpen && unreadCount > 0) {
      markAllRead();
    }
  }

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
  ];

  const loggedInLinks = [
    { href: '/routines', label: 'Rotinas' },
  ];

  return (
    <>
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
        {/* Left: Plus button + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {loggedIn && (
            <Link href="/create" style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6B35, #E05520)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', flexShrink: 0,
              boxShadow: '0 0 12px rgba(255, 107, 53, 0.3)',
              transition: 'transform 200ms, box-shadow 200ms',
            }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#0A0A0F" strokeWidth={2.5} strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Link>
          )}
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
        </div>

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
              {/* Notification bell */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  onClick={handleBellClick}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: notifOpen ? 'rgba(255, 107, 53, 0.1)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: notifOpen ? '#FF6B35' : '#9494AC',
                    transition: 'all 200ms', position: 'relative',
                  }}
                  onMouseEnter={e => { if (!notifOpen) e.currentTarget.style.color = '#F0F0F8'; }}
                  onMouseLeave={e => { if (!notifOpen) e.currentTarget.style.color = '#9494AC'; }}
                >
                  <BellIcon size={20} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '2px', right: '2px',
                      width: unreadCount > 9 ? '18px' : '16px', height: '16px',
                      borderRadius: '8px',
                      background: '#FF4D6A', color: '#fff',
                      fontSize: '9px', fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid #0A0A0F',
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                {notifOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: '-40px',
                    width: '360px', maxHeight: '480px',
                    background: '#141420', borderRadius: '16px',
                    border: '1px solid rgba(148, 148, 172, 0.1)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    zIndex: 200,
                  }}>
                    {/* Header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderBottom: '1px solid rgba(148, 148, 172, 0.08)',
                    }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F8' }}>Notificações</span>
                      {notifications.some(n => !n.isRead) && (
                        <button onClick={markAllRead} style={{
                          background: 'none', border: 'none', color: '#FF6B35',
                          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        }}>Marcar tudo como lido</button>
                      )}
                    </div>

                    {/* List */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                      {notifications.length === 0 ? (
                        <div style={{
                          padding: '40px 20px', textAlign: 'center', color: '#5C5C72',
                        }}>
                          <BellIcon size={32} />
                          <p style={{ fontSize: '13px', marginTop: '10px' }}>Nenhuma notificação ainda.</p>
                        </div>
                      ) : (
                        notifications.map(n => {
                          const iconInfo = notifIconMap[n.type] || { icon: '🔔', color: '#9494AC' };
                          return (
                            <div
                              key={n.id}
                              style={{
                                display: 'flex', gap: '12px', padding: '12px 16px',
                                background: n.isRead ? 'transparent' : 'rgba(255, 107, 53, 0.03)',
                                borderBottom: '1px solid rgba(148, 148, 172, 0.05)',
                                cursor: 'pointer', transition: 'background 200ms',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(148, 148, 172, 0.04)')}
                              onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(255, 107, 53, 0.03)')}
                            >
                              <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: `${iconInfo.color}15`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '16px', flexShrink: 0,
                              }}>
                                {iconInfo.icon}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: '13px', fontWeight: n.isRead ? 500 : 600,
                                  color: '#F0F0F8', lineHeight: 1.4,
                                }}>
                                  {n.title}
                                </div>
                                <div style={{
                                  fontSize: '12px', color: '#9494AC',
                                  lineHeight: 1.4, marginTop: '1px',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {n.body}
                                </div>
                                <div style={{ fontSize: '11px', color: '#5C5C72', marginTop: '3px' }}>
                                  {timeAgo(n.createdAt)}
                                </div>
                              </div>
                              {!n.isRead && (
                                <div style={{
                                  width: '8px', height: '8px', borderRadius: '50%',
                                  background: '#FF6B35', flexShrink: 0, marginTop: '6px',
                                }} />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/profile" style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div style={{ position: 'relative' }}>
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
                  {user.role === 'ADMIN' && aiAlertLevel !== 'ok' && (
                    <div style={{
                      position: 'absolute',
                      top: '-1px',
                      left: '-1px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: aiAlertLevel === 'exhausted' ? '#FF4D6A' : aiAlertLevel === 'critical' ? '#FF6B35' : '#FFB800',
                      border: '1.5px solid #0A0A0F',
                      boxShadow: `0 0 6px ${aiAlertLevel === 'exhausted' ? 'rgba(255,77,106,0.6)' : aiAlertLevel === 'critical' ? 'rgba(255,107,53,0.6)' : 'rgba(255,184,0,0.6)'}`,
                      animation: aiAlertLevel === 'exhausted' ? 'aiDotPulse 1s ease infinite' : 'none',
                    }} />
                  )}
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

        {/* Mobile right side: bell + hamburger */}
        <div className="mobile-menu-btn" style={{ display: 'none', alignItems: 'center', gap: '4px' }}>
          {loggedIn && (
            <div ref={!notifRef.current ? notifRef : undefined} style={{ position: 'relative' }}>
              <button
                onClick={handleBellClick}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#9494AC', position: 'relative',
                }}
              >
                <BellIcon size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '2px', right: '2px',
                    width: '16px', height: '16px', borderRadius: '8px',
                    background: '#FF4D6A', color: '#fff',
                    fontSize: '9px', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #0A0A0F',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
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
    {user?.role === 'ADMIN' && <style>{`@keyframes aiDotPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }`}</style>}
    </>
  );
}
