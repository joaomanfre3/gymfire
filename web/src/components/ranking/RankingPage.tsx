'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { usePusherChannel } from '@/hooks/usePusher';
import type { RankingUser, RankingPeriod, RankingCategory } from '@/lib/ranking-types';
import { getUserStatValue } from '@/lib/ranking-types';
import { TrophyIcon } from './RankingIcons';
import PeriodTabs from './PeriodTabs';
import CategoryFilters from './CategoryFilters';
import TopThreePodium from './TopThreePodium';
import YourPosition from './YourPosition';
import LeaderboardList from './LeaderboardList';
import RankingSkeleton from './RankingSkeleton';

export default function RankingPage() {
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<RankingPeriod>('weekly');
  const [category, setCategory] = useState<RankingCategory>('xp');

  useEffect(() => {
    loadRanking();
  }, [period]);

  async function loadRanking() {
    setLoading(true);
    try {
      const type = period === 'weekly' ? 'weekly' : period === 'monthly' ? 'weekly' : 'alltime';
      const res = await apiFetch(`/api/ranking?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const mapped: RankingUser[] = data.map((entry: Record<string, unknown>, i: number) => {
            const totalPts = (entry.totalPoints as number) || 0;
            const level = Math.max(1, Math.floor(totalPts / 500));
            return {
              id: (entry.id as string) || `api-${i}`,
              name: (entry.displayName as string) || 'Usuário',
              username: (entry.username as string) || 'user',
              avatar: (entry.avatarUrl as string) || '',
              isVerified: (entry.isVerified as boolean) || false,
              level,
              levelProgress: Math.round((totalPts % 500) / 5),
              position: (entry.rank as number) || i + 1,
              positionChange: 0,
              stats: {
                xp: ((period === 'weekly' ? entry.weeklyPoints : entry.totalPoints) as number) || 0,
                workouts: (entry.workoutsCount as number) || 0,
                volume: 0,
                distance: 0,
                streak: (entry.currentStreak as number) || 0,
                prs: 0,
              },
            };
          });
          setUsers(mapped);
          setLoading(false);
          return;
        }
      }
    } catch { /* fallthrough */ }
    setUsers([]);
    setLoading(false);
  }

  // Real-time: listen for ranking updates
  const handleRankingUpdate = useCallback(() => {
    loadRanking();
  }, []);
  usePusherChannel('ranking', 'ranking-update', handleRankingUpdate, !loading);

  // Sort by selected category
  const sortedUsers = useMemo(() => {
    const sorted = [...users].sort((a, b) => getUserStatValue(b, category) - getUserStatValue(a, category));
    return sorted.map((u, i) => ({ ...u, position: i + 1 }));
  }, [users, category]);

  // Simulate "your position" (pick a user in the middle)
  const yourUser = sortedUsers.length > 7 ? sortedUsers[7] : null;

  return (
    <div style={{
      maxWidth: '640px',
      margin: '0 auto',
      padding: '20px 16px',
      minHeight: 'calc(100vh - 64px)',
    }}>
      {/* Page Header */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <TrophyIcon size={24} />
        <div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#F0F0F8',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>Ranking</h1>
          <p style={{
            fontSize: '13px',
            color: '#9494AC',
            margin: 0,
            marginTop: '2px',
          }}>
            Veja quem está dominando a competição
          </p>
        </div>
      </div>

      {loading ? (
        <RankingSkeleton />
      ) : (
        <>
          <PeriodTabs active={period} onChange={setPeriod} />
          <CategoryFilters active={category} onChange={setCategory} />
          <TopThreePodium users={sortedUsers} category={category} />
          <YourPosition user={yourUser} category={category} />
          <LeaderboardList users={sortedUsers} category={category} />
        </>
      )}
    </div>
  );
}
