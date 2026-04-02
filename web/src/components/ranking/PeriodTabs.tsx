'use client';

import type { RankingPeriod } from '@/lib/ranking-types';

interface Props {
  active: RankingPeriod;
  onChange: (period: RankingPeriod) => void;
}

const tabs: { key: RankingPeriod; label: string }[] = [
  { key: 'weekly', label: 'Semanal' },
  { key: 'monthly', label: 'Mensal' },
  { key: 'alltime', label: 'Geral' },
];

export default function PeriodTabs({ active, onChange }: Props) {
  const activeIndex = tabs.findIndex(t => t.key === active);

  return (
    <div style={{
      display: 'flex',
      background: '#141420',
      borderRadius: '12px',
      padding: '4px',
      marginBottom: '12px',
      border: '1px solid rgba(148, 148, 172, 0.08)',
      position: 'relative',
    }}>
      {/* Sliding indicator */}
      <div style={{
        position: 'absolute',
        top: '4px',
        left: `calc(${activeIndex * (100 / 3)}% + 4px)`,
        width: `calc(${100 / 3}% - 8px)`,
        height: 'calc(100% - 8px)',
        background: '#FF6B35',
        borderRadius: '9px',
        transition: 'left 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 0,
      }} />

      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            flex: 1,
            padding: '10px 0',
            border: 'none',
            background: 'transparent',
            color: active === t.key ? '#0A0A0F' : '#9494AC',
            fontWeight: active === t.key ? 700 : 500,
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'color 200ms ease',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            position: 'relative',
            zIndex: 1,
            borderRadius: '9px',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
