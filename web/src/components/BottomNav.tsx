'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Nav icons as inline SVGs
function HomeIcon({ active }: { active: boolean }) {
  return active ? (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="#FF6B35" stroke="none"><path d="M3 9.5L12 2l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" /></svg>
  ) : (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
  );
}

function ExerciseIcon({ active }: { active: boolean }) {
  const color = active ? '#FF6B35' : 'currentColor';
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function WorkoutIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#0A0A0F" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function RankingIcon({ active }: { active: boolean }) {
  const color = active ? '#FF6B35' : 'currentColor';
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-0.85-3.25-2.03-3.79A1.07 1.07 0 0 1 14 17v-2.34" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function MessageIcon({ active }: { active: boolean }) {
  const color = active ? '#FF6B35' : 'currentColor';
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const color = active ? '#FF6B35' : 'currentColor';
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const navItems = [
  { href: '/', label: 'Feed', icon: (a: boolean) => <HomeIcon active={a} /> },
  { href: '/explore', label: 'Explorar', icon: (a: boolean) => <ExerciseIcon active={a} /> },
  { href: '/workout', label: 'Treinar', icon: (_a: boolean) => <WorkoutIcon />, isCenter: true },
  { href: '/messages', label: 'Mensagens', icon: (a: boolean) => <MessageIcon active={a} /> },
  { href: '/profile', label: 'Perfil', icon: (a: boolean) => <ProfileIcon active={a} /> },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on login/register pages
  if (pathname === '/login' || pathname === '/register' || pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="bottom-nav" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(10, 10, 15, 0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(148, 148, 172, 0.08)',
      height: '56px',
      display: 'none', // shown via CSS media query
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: '100%',
        maxWidth: '500px',
        margin: '0 auto',
        padding: '0 8px',
      }}>
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

          if (item.isCenter) {
            return (
              <Link key={item.href} href={item.href} style={{
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: '#FF6B35',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
                  marginTop: '-12px',
                }}>
                  {item.icon(false)}
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href} style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              color: isActive ? '#FF6B35' : '#5C5C72',
              transition: 'color 200ms ease',
              padding: '4px 8px',
            }}>
              {item.icon(!!isActive)}
              <span style={{
                fontSize: '10px',
                fontWeight: isActive ? 700 : 500,
              }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
