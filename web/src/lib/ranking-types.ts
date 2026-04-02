export interface RankingUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isVerified: boolean;
  level: number;
  levelProgress: number; // 0-100
  position: number;
  positionChange: number; // positive = up, negative = down, 0 = same
  stats: {
    xp: number;
    workouts: number;
    volume: number; // kg
    distance: number; // km
    streak: number; // days
    prs: number;
  };
}

export type RankingPeriod = 'weekly' | 'monthly' | 'alltime';
export type RankingCategory = 'xp' | 'workouts' | 'volume' | 'distance' | 'streak';

export function getCategoryLabel(cat: RankingCategory): string {
  const labels: Record<RankingCategory, string> = {
    xp: 'XP Total',
    workouts: 'Treinos',
    volume: 'Volume (kg)',
    distance: 'Distância (km)',
    streak: 'Streak',
  };
  return labels[cat];
}

export function getCategoryUnit(cat: RankingCategory): string {
  const units: Record<RankingCategory, string> = {
    xp: 'XP',
    workouts: 'TREINOS',
    volume: 'KG',
    distance: 'KM',
    streak: 'DIAS',
  };
  return units[cat];
}

export function getUserStatValue(user: RankingUser, cat: RankingCategory): number {
  const map: Record<RankingCategory, number> = {
    xp: user.stats.xp,
    workouts: user.stats.workouts,
    volume: user.stats.volume,
    distance: user.stats.distance,
    streak: user.stats.streak,
  };
  return map[cat];
}

export function formatStatValue(value: number, cat: RankingCategory): string {
  if (cat === 'volume' && value >= 1000) {
    return (value / 1000).toFixed(1).replace('.0', '') + 't';
  }
  if (value >= 10000) {
    return (value / 1000).toFixed(1).replace('.0', '') + 'k';
  }
  return value.toLocaleString('pt-BR');
}
