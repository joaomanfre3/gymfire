'use client';

interface Props {
  active: string;
  onChange: (filter: string) => void;
}

const filters = [
  { key: 'all', label: 'Todos' },
  { key: 'workout', label: 'Treinos' },
  { key: 'run', label: 'Corridas' },
  { key: 'personal_record', label: 'PRs' },
  { key: 'challenge', label: 'Desafios' },
];

export default function FeedFilters({ active, onChange }: Props) {
  return (
    <div
      className="hide-scrollbar"
      style={{
        padding: '12px 16px',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        borderBottom: '1px solid rgba(148, 148, 172, 0.08)',
        background: '#0A0A0F',
        position: 'sticky',
        top: '64px',
        zIndex: 40,
        scrollbarWidth: 'none',
      }}
    >
      {filters.map(f => {
        const isActive = active === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            style={{
              padding: '7px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: isActive ? 700 : 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              border: '1px solid transparent',
              background: isActive ? '#FF6B35' : '#1A1A28',
              color: isActive ? '#0A0A0F' : '#9494AC',
              borderColor: isActive ? '#FF6B35' : 'rgba(148, 148, 172, 0.08)',
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
