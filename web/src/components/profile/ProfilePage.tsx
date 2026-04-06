'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch, getToken, getUser, logout } from '@/lib/api';
import AdminPanel from './AdminPanel';
import RoutineTab from './RoutineTab';
import type { ProfileData } from '@/lib/profile-types';
import { getTier } from '@/lib/profile-types';

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
function TrendUpIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
}
function CheckIcon({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0A0A0F" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>;
}

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

function CalendarIcon({ active }: { active: boolean }) {
  const c = active ? '#F0F0F8' : '#5C5C72';
  return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.5}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><rect x="7" y="14" width="3" height="3" rx="0.5" fill={active ? c : 'none'} /><rect x="14" y="14" width="3" height="3" rx="0.5" fill={active ? c : 'none'} /></svg>;
}

type ProfileTab = 'posts' | 'cuts' | 'records' | 'routine';

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}min`;
}

function formatVolume(vol: number): string {
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}t`;
  return `${vol}kg`;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [posts, setPosts] = useState<Array<{ id: string; mediaUrls: string[]; type: string }>>([]);
  const [cuts, setCuts] = useState<Array<{ id: string; mediaUrls: string[]; caption: string }>>([]);

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
    if (!user?.username) {
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch(`/api/users/${user.username}`);
      if (res.ok) {
        const data = await res.json();
        const level = Math.max(1, Math.floor((data.totalPoints || 0) / 500));
        const totalPoints = data.totalPoints || 0;

        // Build workout history from API data
        const history = (data.recentWorkouts || []).map((w: { id: string; title: string; date: string; durationSecs: number; totalVolume: number; totalSets: number; totalReps: number; exercises: string[] }) => ({
          id: w.id,
          name: w.title || 'Treino',
          date: w.date,
          duration: formatDuration(w.durationSecs || 0),
          volume: formatVolume(w.totalVolume || 0),
          sets: w.totalSets || 0,
          calories: 0,
          exercises: w.exercises || [],
        }));

        // Build personal records from API data
        const records = (data.personalRecords || []).map((pr: { id: string; exercise: string; value: number; previousValue: number | null; type: string; date: string }) => {
          const typeLabel = pr.type === 'MAX_WEIGHT' ? 'kg' : pr.type === 'MAX_REPS' ? ' reps' : pr.type === 'MAX_DISTANCE' ? 'km' : '';
          return {
            id: pr.id,
            exercise: pr.exercise,
            currentValue: `${pr.value}${typeLabel}`,
            previousValue: pr.previousValue ? `${pr.previousValue}${typeLabel}` : '-',
            improvement: pr.previousValue ? `+${(pr.value - pr.previousValue).toFixed(1)}${typeLabel}` : 'Novo',
            isNew: !pr.previousValue,
            date: pr.date,
          };
        });

        // Compute weekly activity from recent workouts
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
        weekStart.setHours(0, 0, 0, 0);
        const weeklyActivity = [false, false, false, false, false, false, false];
        (data.recentWorkouts || []).forEach((w: { date: string }) => {
          const d = new Date(w.date);
          if (d >= weekStart) {
            const dayIdx = (d.getDay() + 6) % 7; // Mon=0, Sun=6
            weeklyActivity[dayIdx] = true;
          }
        });

        // Count workouts this week
        const workoutsThisWeek = weeklyActivity.filter(Boolean).length;

        setProfile({
          id: data.id,
          username: data.username,
          displayName: data.displayName,
          bio: data.bio || '',
          avatar: data.avatarUrl || '',
          isVerified: data.isVerified || false,
          level,
          xp: totalPoints,
          xpToNext: 500 - (totalPoints % 500),
          tier: getTier(level),
          stats: {
            workouts: data.workoutsCount || 0,
            workoutsThisWeek,
            streak: data.currentStreak || 0,
            streakRecord: data.longestStreak || 0,
            totalVolume: 0,
            prs: records.length,
          },
          social: {
            followers: data.followersCount || 0,
            following: data.followingCount || 0,
            posts: data.postsCount || 0,
          },
          weeklyActivity,
          activityRings: {
            calories: { current: 0, goal: 2500 },
            workouts: { current: workoutsThisWeek, goal: 5 },
            activeTime: { current: 0, goal: 360 },
            hydration: { current: 0, goal: 3000 },
          },
          history,
          records,
          monthlyVolume: [],
          memberSince: data.createdAt,
        });

        // Load user posts
        loadPosts(data.id);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function loadPosts(userId: string) {
    try {
      const res = await apiFetch(`/api/feed?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const allPosts = data || [];
        setPosts(allPosts.filter((p: { type: string }) => p.type !== 'CUT'));
        setCuts(allPosts.filter((p: { type: string }) => p.type === 'CUT'));
      }
    } catch { /* ignore */ }
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
{ key: 'routine', icon: (a) => <CalendarIcon active={a} />, label: 'Rotina' },
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
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8' }}>{p.social.posts}</span>
              <span style={{ fontSize: '13px', color: '#9494AC', marginLeft: '4px' }}>posts</span>
            </div>
            <Link href={`/profile/${p.username}/followers`} style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8' }}>{p.social.followers}</span>
              <span style={{ fontSize: '13px', color: '#9494AC', marginLeft: '4px' }}>seguidores</span>
            </Link>
            <Link href={`/profile/${p.username}/following`} style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8' }}>{p.social.following}</span>
              <span style={{ fontSize: '13px', color: '#9494AC', marginLeft: '4px' }}>seguindo</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Display name + bio */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8' }}>{p.displayName}</div>
        {p.bio && <div style={{ fontSize: '13px', color: '#9494AC', lineHeight: 1.5, marginTop: '2px' }}>{p.bio}</div>}
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

      {/* Admin shield button */}
      {isAdmin && (
        <Link href="/admin-panel" style={{
          textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '10px', borderRadius: '10px', marginBottom: '8px',
          background: 'rgba(255, 77, 106, 0.06)', border: '1px solid rgba(255, 77, 106, 0.15)',
          color: '#FF4D6A', fontSize: '13px', fontWeight: 700,
        }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FF4D6A" strokeWidth={1.5}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          Painel Admin
        </Link>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Link href="/settings/edit-profile" style={{
          flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
          background: '#141420', color: '#F0F0F8', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          textDecoration: 'none', textAlign: 'center', display: 'block',
        }}>Editar perfil</Link>
        <button style={{
          flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
          background: '#141420', color: '#F0F0F8', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        }}>Compartilhar</button>
      </div>

      {/* Treinos button */}
      <Link href="/workout" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        padding: '12px', borderRadius: '12px', marginBottom: '16px',
        background: 'linear-gradient(135deg, #FF6B35, #E05520)',
        color: '#fff', fontSize: '14px', fontWeight: 700,
        textDecoration: 'none', border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
      }}>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round"><path d="M6.5 6.5h11M6 12H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2m0 8H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2m0-4v8m12-8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2m0-8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2m0 4V8" /></svg>
        Treinos
      </Link>

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
        posts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {posts.map((post) => (
              <div key={post.id} style={{
                aspectRatio: '1',
                background: '#141420',
                backgroundImage: post.mediaUrls?.[0] ? `url(${post.mediaUrls[0]})` : undefined,
                backgroundSize: 'cover', backgroundPosition: 'center',
                cursor: 'pointer', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {!post.mediaUrls?.[0] && (
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#5C5C72" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5C5C72' }}>
            <GridIcon active={false} />
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Nenhum post ainda.</p>
          </div>
        )
      )}

      {/* Cuts grid (reels-style vertical) */}
      {activeTab === 'cuts' && (
        cuts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {cuts.map((cut) => (
              <div key={cut.id} style={{
                aspectRatio: '9/16',
                background: '#141420',
                backgroundImage: cut.mediaUrls?.[0] ? `url(${cut.mediaUrls[0]})` : undefined,
                backgroundSize: 'cover', backgroundPosition: 'center',
                borderRadius: '4px', cursor: 'pointer', position: 'relative', overflow: 'hidden',
              }}>
                {cut.caption && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  }}>
                    <span style={{ fontSize: '11px', color: '#fff', fontWeight: 500 }}>{cut.caption}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5C5C72' }}>
            <FilmIcon active={false} />
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Nenhum cut ainda.</p>
          </div>
        )
      )}

      {/* Records */}
      {activeTab === 'records' && (
        p.records.length > 0 ? (
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
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5C5C72' }}>
            <TrophySmIcon active={false} />
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Nenhum recorde pessoal ainda.</p>
          </div>
        )
      )}

      {/* Routine tab */}
      {activeTab === 'routine' && <RoutineTab />}

      {/* Member since */}
      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#5C5C72' }}>
        Membro desde {new Date(p.memberSince).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
      </div>

      {showAdmin && isAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
