'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch, getToken, getUser, logout } from '@/lib/api';
import AdminPanel from './AdminPanel';
import type { ProfileData, AchievementEntry } from '@/lib/profile-types';
import { getTier } from '@/lib/profile-types';
import { mockProfile } from '@/lib/profile-mock-data';

// ======== ICONS ========
function SettingsIcon({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#F0F0F8" strokeWidth={1.5}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
}
function GridIcon({ active }: { active: boolean }) {
  const c = active ? '#F0F0F8' : '#5C5C72';
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
}
function FilmIcon({ active }: { active: boolean }) {
  const c = active ? '#F0F0F8' : '#5C5C72';
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5}><rect x="2" y="2" width="20" height="20" rx="2" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /><line x1="17" y1="17" x2="22" y2="17" /></svg>;
}
function TrophySmIcon({ active }: { active: boolean }) {
  const c = active ? '#F0F0F8' : '#5C5C72';
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-.85-3.25-2.03-3.79A1.07 1.07 0 0 1 14 17v-2.34" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>;
}
function MedalIcon({ active }: { active: boolean }) {
  const c = active ? '#F0F0F8' : '#5C5C72';
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5}><polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.5 5.8 21 7 14 2 9.3 9 8.5 12 2" /></svg>;
}
function TrendUpIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
}
function CheckIcon({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0A0A0F" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>;
}

// Achievement icons mapping
const achieveIcons: Record<string, React.ReactNode> = {
  flame: <svg width={16} height={16} viewBox="0 0 24 24" fill="#FF6B35" stroke="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.4-2.15 1-3 .22.65.84 1.3 1.5 1.5z" /></svg>,
  trophy: <TrophySmIcon active={false} />,
  zap: <svg width={16} height={16} viewBox="0 0 24 24" fill="#CCFF00" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  star: <MedalIcon active={false} />,
  medal: <TrophySmIcon active={false} />,
  crown: <MedalIcon active={false} />,
  target: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  mountain: <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth={1.5}><path d="M8 3l4 8 5-5 5 15H2L8 3z" /></svg>,
};
const rarityColors: Record<string, string> = { common: '#9494AC', rare: '#3B82F6', epic: '#A855F7', legendary: '#FFB800' };

// Activity Ring
function ActivityRing({ label, current, goal, color, size = 58 }: { label: string; current: number; goal: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(current / goal, 1);
  const offset = circ * (1 - pct);
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1A1A28" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ fontSize: '11px', fontWeight: 700, color, marginTop: '3px' }}>{Math.round(pct * 100)}%</div>
      <div style={{ fontSize: '9px', color: '#5C5C72' }}>{label}</div>
    </div>
  );
}

// Mock post images for grid
const mockPostImages = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1461896836934-bd45ba448c52?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300&h=300&fit=crop',
];

const mockCutThumbnails = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&h=500&fit=crop',
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=300&h=500&fit=crop',
];

type ProfileTab = 'posts' | 'cuts' | 'records' | 'achievements';

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user?.role === 'ADMIN') setIsAdmin(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); if (user?.role === 'ADMIN') setShowAdmin(prev => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    loadProfile();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function loadProfile() {
    const user = getUser();
    if (user?.username) {
      try {
        const res = await apiFetch(`/api/users/${user.username}`);
        if (res.ok) {
          const data = await res.json();
          const level = Math.max(1, Math.floor((data.totalPoints || 0) / 500));
          setProfile({
            ...mockProfile,
            id: data.id, username: data.username, displayName: data.displayName,
            bio: data.bio || mockProfile.bio, isVerified: data.isVerified || false,
            level, xp: data.totalPoints || 0, xpToNext: 500 - ((data.totalPoints || 0) % 500), tier: getTier(level),
            stats: { ...mockProfile.stats, workouts: data.workoutsCount || mockProfile.stats.workouts, streak: data.currentStreak || mockProfile.stats.streak, streakRecord: data.longestStreak || mockProfile.stats.streakRecord },
            social: { followers: data.followersCount || 0, following: data.followingCount || 0, posts: data.postsCount || mockProfile.social.posts },
            memberSince: data.createdAt,
          });
          setLoading(false); return;
        }
      } catch { /* fallthrough */ }
    }
    setProfile(mockProfile);
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <div className="shimmer" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px', background: '#1A1A28' }} />
        <div className="shimmer" style={{ width: '160px', height: '20px', borderRadius: '6px', margin: '0 auto 8px', background: '#1A1A28' }} />
        <div className="shimmer" style={{ width: '100px', height: '14px', borderRadius: '4px', margin: '0 auto', background: '#1A1A28' }} />
      </div>
    );
  }

  if (!profile) return <div style={{ textAlign: 'center', padding: '40px', color: '#5C5C72' }}>Não foi possível carregar o perfil.</div>;

  const p = profile;
  const xpPct = Math.round((p.xp / (p.xp + p.xpToNext)) * 100);

  const tabs: { key: ProfileTab; icon: (a: boolean) => React.ReactNode; label: string }[] = [
    { key: 'posts', icon: (a) => <GridIcon active={a} />, label: 'Posts' },
    { key: 'cuts', icon: (a) => <FilmIcon active={a} />, label: 'Cuts' },
    { key: 'records', icon: (a) => <TrophySmIcon active={a} />, label: 'Records' },
    { key: 'achievements', icon: (a) => <MedalIcon active={a} />, label: 'Conquistas' },
  ];

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 80px' }}>

      {/* ===== INSTAGRAM-STYLE HEADER ===== */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '16px' }}>
        {/* Avatar (left) */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            border: `3px solid ${p.tier.borderColor}`,
            boxShadow: `0 0 20px ${p.tier.color}33`,
            background: p.avatar ? 'transparent' : 'linear-gradient(135deg, #FF6B35, #E05520)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '28px', overflow: 'hidden',
          }}>
            {p.avatar ? <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.displayName[0].toUpperCase()}
          </div>
          <div style={{
            position: 'absolute', bottom: '-2px', right: '-2px', width: '24px', height: '24px', borderRadius: '50%',
            background: p.tier.color, color: '#0A0A0F', fontSize: '10px', fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2.5px solid #0A0A0F',
          }}>{p.level}</div>
        </div>

        {/* Stats (right) */}
        <div style={{ flex: 1 }}>
          {/* Username row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#F0F0F8' }}>{p.username}</span>
            {p.isVerified && <span style={{ fontSize: '10px', fontWeight: 800, background: '#FF6B35', color: '#0A0A0F', padding: '2px 6px', borderRadius: '4px' }}>PRO</span>}
            <span style={{ fontSize: '10px', fontWeight: 700, color: p.tier.color, background: `${p.tier.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{p.tier.name}</span>
            <Link href="/settings" style={{ marginLeft: 'auto', textDecoration: 'none' }}>
              <SettingsIcon />
            </Link>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '8px' }}>
            {[
              { v: p.social.posts, l: 'posts' },
              { v: p.social.followers, l: 'seguidores' },
              { v: p.social.following, l: 'seguindo' },
            ].map(s => (
              <div key={s.l} style={{ cursor: 'pointer' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8' }}>{s.v}</span>
                <span style={{ fontSize: '13px', color: '#9494AC', marginLeft: '4px' }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Display name + bio */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8' }}>{p.displayName}</div>
        <div style={{ fontSize: '13px', color: '#9494AC', lineHeight: 1.5, marginTop: '2px' }}>{p.bio}</div>
      </div>

      {/* XP Progress bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ fontSize: '10px', color: '#5C5C72' }}>Lv.{p.level}</span>
          <span style={{ fontSize: '10px', color: '#CCFF00', fontWeight: 700 }}>{p.xp.toLocaleString()} XP</span>
          <span style={{ fontSize: '10px', color: '#5C5C72' }}>Lv.{p.level + 1}</span>
        </div>
        <div style={{ height: '4px', borderRadius: '2px', background: '#1A1A28' }}>
          <div style={{ height: '100%', width: `${xpPct}%`, borderRadius: '2px', background: 'linear-gradient(90deg, #CCFF00, rgba(204,255,0,0.6))', transition: 'width 800ms ease' }} />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button style={{
          flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
          background: '#141420', color: '#F0F0F8', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        }}>Editar perfil</button>
        <button style={{
          flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
          background: '#141420', color: '#F0F0F8', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        }}>Compartilhar</button>
      </div>

      {/* Activity rings + weekly heatmap (compact row) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        {/* Rings */}
        <div style={{ flex: 1, background: '#141420', borderRadius: '14px', border: '1px solid rgba(148,148,172,0.08)', padding: '12px 8px', display: 'flex', justifyContent: 'space-around' }}>
          <ActivityRing label="Cal" current={p.activityRings.calories.current} goal={p.activityRings.calories.goal} color="#FF6B35" size={48} />
          <ActivityRing label="Treino" current={p.activityRings.workouts.current} goal={p.activityRings.workouts.goal} color="#00D4FF" size={48} />
          <ActivityRing label="Tempo" current={p.activityRings.activeTime.current} goal={p.activityRings.activeTime.goal} color="#A855F7" size={48} />
          <ActivityRing label="Água" current={p.activityRings.hydration.current} goal={p.activityRings.hydration.goal} color="#10B981" size={48} />
        </div>

        {/* Weekly heatmap compact */}
        <div style={{ background: '#141420', borderRadius: '14px', border: '1px solid rgba(148,148,172,0.08)', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Semana</div>
          <div style={{ display: 'flex', gap: '3px' }}>
            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
              <div key={i} style={{
                width: '18px', height: '18px', borderRadius: '4px',
                background: p.weeklyActivity[i] ? '#FF6B35' : 'transparent',
                border: p.weeklyActivity[i] ? 'none' : '1px dashed rgba(148,148,172,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '7px', color: p.weeklyActivity[i] ? '#0A0A0F' : '#5C5C72', fontWeight: 700,
              }}>
                {p.weeklyActivity[i] ? <CheckIcon size={8} /> : d}
              </div>
            ))}
          </div>
          <div style={{ fontSize: '10px', color: '#FF6B35', fontWeight: 700 }}>{p.stats.streak} dias</div>
        </div>
      </div>

      {/* ===== CONTENT TABS (Instagram-style) ===== */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(148,148,172,0.08)', marginBottom: '2px',
      }}>
        {tabs.map(t => {
          const isActive = activeTab === t.key;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '12px 0', background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: isActive ? '2px solid #F0F0F8' : '2px solid transparent',
              transition: 'all 200ms',
            }}>
              {t.icon(isActive)}
            </button>
          );
        })}
      </div>

      {/* ===== TAB CONTENT ===== */}

      {/* Posts grid */}
      {activeTab === 'posts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
          {mockPostImages.map((img, i) => (
            <div key={i} style={{
              aspectRatio: '1', backgroundImage: `url(${img})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              cursor: 'pointer', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', inset: 0, background: 'transparent',
                transition: 'background 200ms',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              />
            </div>
          ))}
        </div>
      )}

      {/* Cuts grid (reels-style vertical) */}
      {activeTab === 'cuts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
          {mockCutThumbnails.map((img, i) => (
            <div key={i} style={{
              aspectRatio: '9/16', backgroundImage: `url(${img})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              borderRadius: '4px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="#fff" stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>{(Math.random() * 5 + 1).toFixed(1)}k</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Records */}
      {activeTab === 'records' && (
        <div style={{ background: '#141420', borderRadius: '14px', border: '1px solid rgba(148,148,172,0.08)', overflow: 'hidden', marginTop: '8px' }}>
          {p.records.map((r, i) => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              borderBottom: i < p.records.length - 1 ? '1px solid rgba(148,148,172,0.06)' : 'none',
            }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,184,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrophySmIcon active={false} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{r.exercise}</span>
                  {r.isNew && <span style={{ fontSize: '8px', fontWeight: 800, background: '#CCFF00', color: '#0A0A0F', padding: '1px 5px', borderRadius: '3px' }}>NOVO</span>}
                </div>
                <div style={{ fontSize: '11px', color: '#9494AC', marginTop: '1px' }}>
                  {r.previousValue} → <span style={{ color: '#CCFF00', fontWeight: 600 }}>{r.currentValue}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <TrendUpIcon />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>{r.improvement}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Achievements grid */}
      {activeTab === 'achievements' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
          {p.achievements.map(a => {
            const color = rarityColors[a.rarity];
            return (
              <div key={a.id} style={{
                background: '#141420', borderRadius: '12px', border: `1px solid ${a.unlocked ? `${color}30` : 'rgba(148,148,172,0.08)'}`,
                padding: '14px', opacity: a.unlocked ? 1 : 0.6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {achieveIcons[a.icon] || <MedalIcon active={false} />}
                  </div>
                  <span style={{ fontSize: '8px', fontWeight: 700, color, textTransform: 'uppercase' }}>{a.rarity}</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#F0F0F8', marginBottom: '2px' }}>{a.title}</div>
                <div style={{ fontSize: '10px', color: '#5C5C72', lineHeight: 1.4 }}>{a.description}</div>
                {!a.unlocked && a.progress !== undefined && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ height: '3px', borderRadius: '2px', background: '#1A1A28' }}>
                      <div style={{ height: '100%', width: `${a.progress}%`, borderRadius: '2px', background: color }} />
                    </div>
                    <div style={{ fontSize: '9px', color: '#5C5C72', marginTop: '2px' }}>{a.progress}%</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Member since */}
      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#5C5C72' }}>
        Membro desde {new Date(p.memberSince).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
      </div>

      {showAdmin && isAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
