export interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  isVerified: boolean;
  level: number;
  xp: number;
  xpToNext: number;
  tier: TierInfo;
  stats: {
    workouts: number;
    workoutsThisWeek: number;
    streak: number;
    streakRecord: number;
    totalVolume: number;
    prs: number;
  };
  social: {
    followers: number;
    following: number;
    posts: number;
  };
  weeklyActivity: boolean[]; // 7 days, Mon-Sun
  activityRings: {
    calories: { current: number; goal: number };
    workouts: { current: number; goal: number };
    activeTime: { current: number; goal: number };
    hydration: { current: number; goal: number };
  };
  history: WorkoutHistory[];
  records: PersonalRecordEntry[];
  monthlyVolume: { month: string; value: number }[];
  memberSince: string;
}

export interface WorkoutHistory {
  id: string;
  name: string;
  date: string;
  duration: string;
  volume: string;
  sets: number;
  calories: number;
  exercises: string[];
}

export interface PersonalRecordEntry {
  id: string;
  exercise: string;
  currentValue: string;
  previousValue: string;
  improvement: string;
  isNew: boolean;
  date: string;
}

export interface TierInfo {
  name: string;
  color: string;
  borderColor: string;
}

const tiers: { maxLevel: number; info: TierInfo }[] = [
  { maxLevel: 5, info: { name: 'Novato', color: '#9494AC', borderColor: '#9494AC' } },
  { maxLevel: 10, info: { name: 'Iniciante', color: '#10B981', borderColor: '#10B981' } },
  { maxLevel: 20, info: { name: 'Regular', color: '#3B82F6', borderColor: '#3B82F6' } },
  { maxLevel: 30, info: { name: 'Dedicado', color: '#8B5CF6', borderColor: '#8B5CF6' } },
  { maxLevel: 40, info: { name: 'Avançado', color: '#EC4899', borderColor: '#EC4899' } },
  { maxLevel: 50, info: { name: 'Veterano', color: '#F59E0B', borderColor: '#F59E0B' } },
  { maxLevel: 65, info: { name: 'Elite', color: '#FF6B35', borderColor: '#FF6B35' } },
  { maxLevel: 80, info: { name: 'Mestre', color: '#00D4FF', borderColor: '#00D4FF' } },
  { maxLevel: Infinity, info: { name: 'Lenda', color: '#FFD700', borderColor: '#FFD700' } },
];

export function getTier(level: number): TierInfo {
  return (tiers.find(t => level <= t.maxLevel) || tiers[tiers.length - 1]).info;
}
