'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiFetch, getToken } from '@/lib/api';
import { timeAgo } from '@/lib/format';

interface Group {
  id: string;
  name: string;
  avatar: string | null;
  memberCount: number;
  lastMessage: { content: string; createdAt: string } | null;
}

function TrophyIcon() { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth={1.5}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-.85-3.25-2.03-3.79A1.07 1.07 0 0 1 14 17v-2.34" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>; }
function GroupIcon() { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#9494AC" strokeWidth={1.5}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function PlusIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }

export default function RankingPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const loggedIn = !!getToken();

  useEffect(() => {
    if (loggedIn) {
      apiFetch('/api/groups').then(r => r.ok ? r.json() : []).then(setGroups).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [loggedIn]);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrophyIcon />
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F0F0F8', margin: 0 }}>Ranking</h1>
              <p style={{ fontSize: '13px', color: '#9494AC', margin: 0 }}>Compete nos seus grupos</p>
            </div>
          </div>
          {loggedIn && (
            <Link href="/groups" style={{
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
              background: '#FF6B35', color: '#0A0A0F', padding: '10px 16px', borderRadius: '10px',
              fontWeight: 700, fontSize: '13px',
            }}>
              <PlusIcon /> Grupos
            </Link>
          )}
        </div>

        {/* Info card */}
        <div style={{
          background: '#141420', borderRadius: '16px', border: '1px solid rgba(148,148,172,0.08)',
          padding: '20px', marginBottom: '20px', textAlign: 'center',
        }}>
          <TrophyIcon />
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#F0F0F8', margin: '10px 0 6px' }}>
            Ranking por Grupos
          </p>
          <p style={{ fontSize: '13px', color: '#9494AC', margin: 0, lineHeight: 1.5 }}>
            O ranking agora funciona dentro de cada grupo. Crie um grupo, adicione seus amigos e vejam quem treina mais!
          </p>
        </div>

        {!loggedIn ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px', background: '#141420', borderRadius: '16px',
            border: '1px solid rgba(148,148,172,0.08)',
          }}>
            <p style={{ color: '#9494AC', fontSize: '14px', margin: '0 0 16px' }}>Entre para ver seus grupos e rankings.</p>
            <Link href="/login" style={{
              textDecoration: 'none', background: '#FF6B35', color: '#0A0A0F',
              padding: '12px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
            }}>Entrar</Link>
          </div>
        ) : loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shimmer" style={{ height: '80px', borderRadius: '14px', marginBottom: '8px', background: '#141420' }} />
          ))
        ) : groups.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '32px 20px', background: '#141420', borderRadius: '16px',
            border: '1px solid rgba(148,148,172,0.08)',
          }}>
            <GroupIcon />
            <p style={{ color: '#9494AC', fontSize: '14px', margin: '12px 0' }}>Você ainda não tem grupos.</p>
            <Link href="/groups" style={{
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#FF6B35', color: '#0A0A0F', padding: '12px 24px', borderRadius: '10px',
              fontWeight: 700, fontSize: '14px',
            }}>
              <PlusIcon /> Criar Grupo
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              Seus Grupos
            </div>
            {groups.map(g => (
              <Link key={g.id} href={`/groups/${g.id}`} style={{
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px',
                background: '#141420', borderRadius: '14px', border: '1px solid rgba(148,148,172,0.08)',
                padding: '14px 16px',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #FF6B35, #E05520)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: '18px', flexShrink: 0,
                }}>{g.name[0].toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#F0F0F8' }}>{g.name}</span>
                  <div style={{ fontSize: '12px', color: '#5C5C72', marginTop: '2px' }}>
                    {g.memberCount} membros
                    {g.lastMessage && ` · ${timeAgo(g.lastMessage.createdAt)}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FFB800' }}>
                  <TrophyIcon />
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={2}><polyline points="9 18 15 12 9 6" /></svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
