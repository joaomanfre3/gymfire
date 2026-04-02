'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getToken, getUser, logout } from '@/lib/api';

// SVG Icons
function FireLogo() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 0 8px rgba(255,107,53,0.4))' }}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.4-2.15 1-3 .22.65.84 1.3 1.5 1.5z" fill="url(#fGrad2)" />
      <defs><linearGradient id="fGrad2" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#FFB800" /><stop offset="1" stopColor="#FF6B35" /></linearGradient></defs>
    </svg>
  );
}
function HomeIcon({ active }: { active: boolean }) {
  return active
    ? <svg width={24} height={24} viewBox="0 0 24 24" fill="#F0F0F8" stroke="none"><path d="M3 9.5L12 2l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" /></svg>
    : <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
}
function SearchIcon({ active }: { active: boolean }) {
  const c = active ? '#F0F0F8' : 'currentColor';
  return <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={active ? 2 : 1.5}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
function DumbbellIcon({ active }: { active: boolean }) {
  const c = active ? '#F0F0F8' : 'currentColor';
  return <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5}><path d="M6.5 6.5h11M6 12H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2m0 8H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2m0-4v8m12-8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2m0-8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2m0 4V8" /></svg>;
}
function TrophyIcon({ active }: { active: boolean }) {
  const c = active ? '#F0F0F8' : 'currentColor';
  return <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-.85-3.25-2.03-3.79A1.07 1.07 0 0 1 14 17v-2.34" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>;
}
function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? '#F0F0F8' : 'currentColor';
  return <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
function PlusIcon() {
  return <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="4" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
}
function SettingsIcon() {
  return <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
}

const navItems = [
  { href: '/', label: 'Feed', icon: (a: boolean) => <HomeIcon active={a} /> },
  { href: '/explore', label: 'Explorar', icon: (a: boolean) => <SearchIcon active={a} /> },
  { href: '/reels', label: 'Reels', icon: (a: boolean) => <DumbbellIcon active={a} /> },
  { href: '/ranking', label: 'Ranking', icon: (a: boolean) => <TrophyIcon active={a} /> },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ displayName?: string; username?: string } | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getToken());
    setUser(getUser());
  }, [pathname]);

  if (pathname === '/login' || pathname === '/register' || pathname?.startsWith('/admin')) return null;

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname?.startsWith(href);

  return (
    <aside className="sidebar-nav" style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: '220px', background: '#0A0A0F',
      borderRight: '1px solid rgba(148,148,172,0.08)',
      display: 'none', // shown via CSS for desktop
      flexDirection: 'column',
      padding: '20px 12px',
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link href="/" style={{
        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 12px', marginBottom: '24px',
      }}>
        <FireLogo />
        <span style={{ fontSize: '18px', fontWeight: 900, color: '#FF6B35', fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.04em' }}>
          GYMFIRE
        </span>
      </Link>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {navItems.map(item => {
          const active = !!isActive(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px',
              padding: '12px 14px', borderRadius: '12px',
              color: active ? '#F0F0F8' : '#9494AC',
              background: active ? 'rgba(255,107,53,0.08)' : 'transparent',
              fontWeight: active ? 700 : 500, fontSize: '15px',
              transition: 'all 200ms',
            }}>
              {item.icon(active)}
              {item.label}
            </Link>
          );
        })}

        {/* Create post */}
        <Link href="/workout" style={{
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px',
          padding: '12px 14px', borderRadius: '12px',
          color: '#9494AC', fontSize: '15px', fontWeight: 500,
          transition: 'all 200ms', marginTop: '4px',
        }}>
          <PlusIcon /> Criar
        </Link>
      </nav>

      {/* Bottom: Profile + Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <Link href="/settings" style={{
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px',
          padding: '12px 14px', borderRadius: '12px',
          color: pathname === '/settings' ? '#F0F0F8' : '#9494AC',
          background: pathname === '/settings' ? 'rgba(255,107,53,0.08)' : 'transparent',
          fontWeight: pathname === '/settings' ? 700 : 500, fontSize: '15px',
          transition: 'all 200ms',
        }}>
          <SettingsIcon /> Configurações
        </Link>

        {loggedIn && user ? (
          <Link href="/profile" style={{
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px',
            padding: '12px 14px', borderRadius: '12px',
            color: pathname === '/profile' ? '#F0F0F8' : '#9494AC',
            background: pathname === '/profile' ? 'rgba(255,107,53,0.08)' : 'transparent',
            fontWeight: pathname === '/profile' ? 700 : 500, fontSize: '15px',
            transition: 'all 200ms',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6B35, #E05520)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '12px',
            }}>
              {(user.displayName || user.username || '?')[0].toUpperCase()}
            </div>
            {user.displayName || user.username}
          </Link>
        ) : (
          <Link href="/login" style={{
            textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px', borderRadius: '12px', background: '#FF6B35',
            color: '#0A0A0F', fontWeight: 700, fontSize: '14px',
          }}>
            Entrar
          </Link>
        )}
      </div>
    </aside>
  );
}
