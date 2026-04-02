'use client';

import type { RankingCategory } from '@/lib/ranking-types';

interface Props {
  active: RankingCategory;
  onChange: (cat: RankingCategory) => void;
}

const categories: { key: RankingCategory; label: string }[] = [
  { key: 'xp', label: 'XP Total' },
  { key: 'workouts', label: 'Treinos' },
  { key: 'volume', label: 'Volume' },
  { key: 'distance', label: 'Distância' },
  { key: 'streak', label: 'Streak' },
];

export default function CategoryFilters({ active, onChange }: Props) {
  return (
    <div
      className="hide-scrollbar"
      style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        marginBottom: '16px',
        paddingBottom: '2px',
        scrollbarWidth: 'none',
      }}
    >
      {categories.map(c => {
        const isActive = active === c.key;
        return (
          <button
            key={c.key}
            onClick={() => onChange(c.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: isActive ? 700 : 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              border: '1px solid transparent',
              background: isActive ? 'rgba(255, 107, 53, 0.12)' : '#1A1A28',
              color: isActive ? '#FF6B35' : '#9494AC',
              borderColor: isActive ? 'rgba(255, 107, 53, 0.25)' : 'rgba(148, 148, 172, 0.08)',
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
