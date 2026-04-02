'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch, getToken, getUser, logout } from '@/lib/api';
import type { ProfileData, WorkoutHistory, PersonalRecordEntry, AchievementEntry } from '@/lib/profile-types';
import { getTier } from '@/lib/profile-types';
import { mockProfile } from '@/lib/profile-mock-data';

// ======== SVG ICONS ========
function FlameIcon({ size = 16, color = '#FF6B35' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.4-2.15 1-3 .22.65.84 1.3 1.5 1.5z" /></svg>;
}
function ZapIcon({ size = 14, color = '#CCFF00' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
}
function TrophyIcon({ size = 16, color = '#FFB800' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 22V14a2 2 0 0 1-2-2V4h8v8a2 2 0 0 1-2 2v8" /></svg>;
}
function StarIcon({ size = 16, color = '#A855F7' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.5 5.8 21 7 14 2 9.3 9 8.5 12 2" /></svg>;
}
function TargetIcon({ size = 16, color = '#10B981' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
}
function MountainIcon({ size = 16, color = '#FF6B35' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M8 3l4 8 5-5 5 15H2L8 3z" /></svg>;
}
function TrendUpIcon({ size = 16, color = '#10B981' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
}
function CheckIcon({ size = 12, color = '#0A0A0F' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}
function LogoutIcon({ size = 16, color = '#FF4D6A' }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>;
}

const achievementIcons: Record<string, (s: number, c: string) => React.ReactNode> = {
  flame: (s, c) => <FlameIcon size={s} color={c} />,
  trophy: (s, c) => <TrophyIcon size={s} color={c} />,
  zap: (s, c) => <ZapIcon size={s} color={c} />,
  star: (s, c) => <StarIcon size={s} color={c} />,
  medal: (s, c) => <TrophyIcon size={s} color={c} />,
  crown: (s, c) => <StarIcon size={s} color={c} />,
  target: (s, c) => <TargetIcon size={s} color={c} />,
  mountain: (s, c) => <MountainIcon size={s} color={c} />,
};

const rarityColors: Record<string, string> = {
  common: '#9494AC', rare: '#3B82F6', epic: '#A855F7', legendary: '#FFB800',
};

// ======== ACTIVITY RING ========
function ActivityRing({ label, current, goal, color, size = 64 }: { label: string; current: number; goal: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(current / goal, 1);
  const offset = circ * (1 - pct);

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1A1A28" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ fontSize: '12px', fontWeight: 700, color, marginTop: '4px' }}>{Math.round(pct * 100)}%</div>
      <div style={{ fontSize: '10px', color: '#5C5C72', marginTop: '1px' }}>{label}</div>
    </div>
  );
}

// ======== MAIN COMPONENT ========
export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'records' | 'achievements'>('history');

  useEffect(() => {
    loadProfile();
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
            id: data.id,
            username: data.username,
            displayName: data.displayName,
            bio: data.bio || mockProfile.bio,
            isVerified: false,
            level,
            xp: data.totalPoints || 0,
            xpToNext: 500 - ((data.totalPoints || 0) % 500),
            tier: getTier(level),
            stats: {
              ...mockProfile.stats,
              workouts: data.workoutsCount || mockProfile.stats.workouts,
              streak: data.currentStreak || mockProfile.stats.streak,
              streakRecord: data.longestStreak || mockProfile.stats.streakRecord,
            },
            social: {
              followers: data.followersCount || 0,
              following: data.followingCount || 0,
              posts: mockProfile.social.posts,
            },
            memberSince: data.createdAt,
          });
          setLoading(false);
          return;
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

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 16px 40px' }}>

      {/* ===== 1. HERO CARD ===== */}
      <div style={{
        background: '#141420', borderRadius: '20px', border: '1px solid rgba(148,148,172,0.08)',
        padding: '28px 20px 24px', marginBottom: '16px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', background: `radial-gradient(ellipse at 50% 0%, ${p.tier.color}10, transparent 60%)`, pointerEvents: 'none' }} />

        {/* Avatar */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '14px' }}>
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
            position: 'absolute', bottom: '-2px', right: '-2px', width: '26px', height: '26px', borderRadius: '50%',
            background: p.tier.color, color: '#0A0A0F', fontSize: '11px', fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2.5px solid #141420',
          }}>{p.level}</div>
        </div>

        {/* Name + badges */}
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F0F8', margin: '0 0 2px' }}>{p.displayName}</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
          <span style={{ fontSize: '13px', color: '#9494AC' }}>@{p.username}</span>
          {p.isVerified && <span style={{ background: '#FF6B35', color: '#0A0A0F', fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>PRO</span>}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '6px', background: `${p.tier.color}15`, marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: p.tier.color }}>{p.tier.name}</span>
        </div>
        <p style={{ fontSize: '13px', color: '#9494AC', margin: '0 0 16px', lineHeight: 1.5 }}>{p.bio}</p>

        {/* XP Bar */}
        <div style={{ margin: '0 auto', maxWidth: '280px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: '#5C5C72' }}>Lv.{p.level}</span>
            <span style={{ fontSize: '11px', color: '#CCFF00', fontWeight: 700 }}>{xpPct}%</span>
            <span style={{ fontSize: '11px', color: '#5C5C72' }}>Lv.{p.level + 1}</span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: '#1A1A28' }}>
            <div style={{ height: '100%', width: `${xpPct}%`, borderRadius: '3px', background: 'linear-gradient(90deg, #CCFF00, rgba(204,255,0,0.6))', transition: 'width 800ms ease' }} />
          </div>
          <div style={{ fontSize: '10px', color: '#5C5C72', marginTop: '4px' }}>{p.xpToNext.toLocaleString()} XP para Level {p.level + 1}</div>
        </div>

        {/* Social */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
          {[
            { v: p.social.followers, l: 'Seguidores' },
            { v: p.social.following, l: 'Seguindo' },
            { v: p.social.posts, l: 'Posts' },
          ].map(s => (
            <div key={s.l}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#F0F0F8' }}>{s.v}</div>
              <div style={{ fontSize: '11px', color: '#5C5C72' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 2. STATS OVERVIEW ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Treinos', value: String(p.stats.workouts), sub: `+${p.stats.workoutsThisWeek} na semana`, icon: <FlameIcon size={18} />, color: '#FF6B35' },
          { label: 'Streak', value: `${p.stats.streak} dias`, sub: p.stats.streak >= p.stats.streakRecord ? 'recorde!' : `recorde: ${p.stats.streakRecord}`, icon: <ZapIcon size={18} color="#CCFF00" />, color: '#CCFF00' },
          { label: 'Volume Total', value: `${(p.stats.totalVolume / 1000).toFixed(0)}t`, sub: 'acumulado', icon: <MountainIcon size={18} />, color: '#FF6B35' },
          { label: 'Recordes', value: String(p.stats.prs), sub: 'pessoais', icon: <TrophyIcon size={18} />, color: '#FFB800' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#141420', borderRadius: '14px', border: '1px solid rgba(148,148,172,0.08)',
            padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#F0F0F8' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#5C5C72' }}>{s.label} · {s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== 3. ACTIVITY RINGS ===== */}
      <div style={{
        background: '#141420', borderRadius: '16px', border: '1px solid rgba(148,148,172,0.08)',
        padding: '20px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
          Atividade Semanal
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <ActivityRing label="Calorias" current={p.activityRings.calories.current} goal={p.activityRings.calories.goal} color="#FF6B35" />
          <ActivityRing label="Treinos" current={p.activityRings.workouts.current} goal={p.activityRings.workouts.goal} color="#00D4FF" />
          <ActivityRing label="Tempo" current={p.activityRings.activeTime.current} goal={p.activityRings.activeTime.goal} color="#A855F7" />
          <ActivityRing label="Hidratação" current={p.activityRings.hydration.current} goal={p.activityRings.hydration.goal} color="#10B981" />
        </div>
      </div>

      {/* ===== 4. WEEKLY HEATMAP ===== */}
      <div style={{
        background: '#141420', borderRadius: '16px', border: '1px solid rgba(148,148,172,0.08)',
        padding: '16px 20px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
          Esta Semana
        </div>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between' }}>
          {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: '100%', aspectRatio: '1', borderRadius: '8px', marginBottom: '4px',
                background: p.weeklyActivity[i] ? '#FF6B35' : 'transparent',
                border: p.weeklyActivity[i] ? 'none' : '1.5px dashed rgba(148,148,172,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {p.weeklyActivity[i] && <CheckIcon size={14} color="#0A0A0F" />}
              </div>
              <span style={{ fontSize: '10px', color: p.weeklyActivity[i] ? '#FF6B35' : '#5C5C72', fontWeight: 600 }}>{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 5. TABS (Histórico / Recordes / Conquistas) ===== */}
      <div style={{
        display: 'flex', background: '#141420', borderRadius: '12px', padding: '4px',
        marginBottom: '16px', border: '1px solid rgba(148,148,172,0.08)',
      }}>
        {(['history', 'records', 'achievements'] as const).map(t => {
          const labels = { history: 'Histórico', records: 'Recordes', achievements: 'Conquistas' };
          const isActive = activeTab === t;
          return (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: '9px', cursor: 'pointer',
              background: isActive ? '#FF6B35' : 'transparent',
              color: isActive ? '#0A0A0F' : '#9494AC',
              fontWeight: isActive ? 700 : 500, fontSize: '13px', transition: 'all 200ms',
            }}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ marginBottom: '16px' }}>
        {activeTab === 'history' && (
          <div style={{ background: '#141420', borderRadius: '16px', border: '1px solid rgba(148,148,172,0.08)', overflow: 'hidden' }}>
            {p.history.map((h, i) => (
              <div key={h.id} style={{
                padding: '14px 16px', borderBottom: i < p.history.length - 1 ? '1px solid rgba(148,148,172,0.08)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8' }}>{h.name}</span>
                  <span style={{ fontSize: '12px', color: '#5C5C72' }}>{new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9494AC', marginBottom: '6px' }}>
                  <span>{h.duration}</span><span>{h.volume}</span><span>{h.sets} séries</span><span>{h.calories} cal</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {h.exercises.slice(0, 3).map(e => (
                    <span key={e} style={{ fontSize: '10px', background: 'rgba(255,107,53,0.08)', color: '#FF8050', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>{e}</span>
                  ))}
                  {h.exercises.length > 3 && <span style={{ fontSize: '10px', color: '#5C5C72', padding: '2px 4px' }}>+{h.exercises.length - 3}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'records' && (
          <div style={{ background: '#141420', borderRadius: '16px', border: '1px solid rgba(148,148,172,0.08)', overflow: 'hidden' }}>
            {p.records.map((r, i) => (
              <div key={r.id} style={{
                padding: '14px 16px', borderBottom: i < p.records.length - 1 ? '1px solid rgba(148,148,172,0.08)' : 'none',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,184,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TrophyIcon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8' }}>{r.exercise}</span>
                    {r.isNew && <span style={{ fontSize: '9px', fontWeight: 800, background: '#CCFF00', color: '#0A0A0F', padding: '1px 6px', borderRadius: '3px' }}>NOVO</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9494AC', marginTop: '2px' }}>
                    {r.previousValue} → <span style={{ color: '#CCFF00', fontWeight: 600 }}>{r.currentValue}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <TrendUpIcon size={14} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>{r.improvement}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {p.achievements.map(a => {
              const color = rarityColors[a.rarity];
              const iconFn = achievementIcons[a.icon];
              return (
                <div key={a.id} style={{
                  background: '#141420', borderRadius: '14px', border: `1px solid ${a.unlocked ? `${color}30` : 'rgba(148,148,172,0.08)'}`,
                  padding: '16px', opacity: a.unlocked ? 1 : 0.6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {iconFn ? iconFn(16, color) : <StarIcon size={16} color={color} />}
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{a.rarity}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#F0F0F8', marginBottom: '3px' }}>{a.title}</div>
                  <div style={{ fontSize: '11px', color: '#5C5C72', lineHeight: 1.4 }}>{a.description}</div>
                  {!a.unlocked && a.progress !== undefined && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ height: '4px', borderRadius: '2px', background: '#1A1A28' }}>
                        <div style={{ height: '100%', width: `${a.progress}%`, borderRadius: '2px', background: color, transition: 'width 500ms' }} />
                      </div>
                      <div style={{ fontSize: '10px', color: '#5C5C72', marginTop: '3px' }}>{a.progress}%</div>
                    </div>
                  )}
                  {a.unlocked && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckIcon size={10} color={color} />
                      <span style={{ fontSize: '10px', fontWeight: 600, color }}>Desbloqueado</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== 6. EVOLUTION CHART ===== */}
      <div style={{
        background: '#141420', borderRadius: '16px', border: '1px solid rgba(148,148,172,0.08)',
        padding: '20px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
          Evolução Mensal (Volume)
        </div>
        {(() => {
          const maxVal = Math.max(...p.monthlyVolume.map(m => m.value));
          return (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
              {p.monthlyVolume.map((m, i) => {
                const h = maxVal > 0 ? (m.value / maxVal) * 100 : 0;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#9494AC', marginBottom: '4px' }}>{(m.value / 1000).toFixed(0)}t</div>
                    <div className="podium-bar" style={{
                      width: '100%', maxWidth: '36px', height: `${h}%`, borderRadius: '6px 6px 0 0',
                      background: i === p.monthlyVolume.length - 1 ? 'linear-gradient(180deg, #FF6B35, #E05520)' : 'linear-gradient(180deg, rgba(255,107,53,0.3), rgba(255,107,53,0.1))',
                      animationDelay: `${i * 80}ms`,
                    }} />
                    <div style={{ fontSize: '10px', color: '#5C5C72', marginTop: '6px' }}>{m.month}</div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* ===== 7. ACTIONS ===== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link href={`/profile/${p.username}`} style={{
          textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          padding: '14px', borderRadius: '12px', background: '#141420', border: '1px solid rgba(148,148,172,0.08)',
          color: '#F0F0F8', fontSize: '14px', fontWeight: 600,
        }}>
          Ver Perfil Público
        </Link>
        <button
          onClick={() => { if (confirm('Tem certeza que deseja sair?')) logout(); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '14px', borderRadius: '12px', background: 'transparent',
            border: '1px solid rgba(255,77,106,0.2)', color: '#FF4D6A',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <LogoutIcon />
          Sair da Conta
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#5C5C72' }}>
        Membro desde {new Date(p.memberSince).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
}
