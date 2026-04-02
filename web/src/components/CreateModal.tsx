'use client';

import { useRouter } from 'next/navigation';

interface Props {
  open: boolean;
  onClose: () => void;
}

function ImageIcon() {
  return <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
}
function FilmIcon() {
  return <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /><line x1="17" y1="17" x2="22" y2="17" /></svg>;
}
function DumbbellIcon() {
  return <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#CCFF00" strokeWidth={1.5} strokeLinecap="round"><path d="M6.5 6.5h11M6 12H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2m0 8H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2m0-4v8m12-8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2m0-8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2m0 4V8" /></svg>;
}

export default function CreateModal({ open, onClose }: Props) {
  const router = useRouter();

  if (!open) return null;

  const options = [
    {
      icon: <ImageIcon />,
      title: 'Post',
      description: 'Compartilhar foto ou texto',
      color: '#FF6B35',
      borderColor: 'rgba(255, 107, 53, 0.25)',
      onClick: () => { onClose(); router.push('/'); },
    },
    {
      icon: <FilmIcon />,
      title: 'Cut',
      description: 'Gravar video curto',
      color: '#00D4FF',
      borderColor: 'rgba(0, 212, 255, 0.25)',
      onClick: () => { onClose(); router.push('/cuts/create'); },
    },
    {
      icon: <DumbbellIcon />,
      title: 'Treino',
      description: 'Iniciar um treino',
      color: '#CCFF00',
      borderColor: 'rgba(204, 255, 0, 0.25)',
      onClick: () => { onClose(); router.push('/workout'); },
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(10, 10, 15, 0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#141420', borderRadius: '20px',
          border: '1px solid rgba(148, 148, 172, 0.12)',
          padding: '24px', maxWidth: '400px', width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F0F0F8', margin: 0 }}>Criar</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#5C5C72', fontSize: '20px', cursor: 'pointer', padding: '4px',
          }}>&times;</button>
        </div>
        <p style={{ fontSize: '13px', color: '#9494AC', margin: '0 0 20px' }}>
          Escolha o que deseja criar
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          {options.map(opt => (
            <button
              key={opt.title}
              onClick={opt.onClick}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '10px', padding: '20px 12px', borderRadius: '14px',
                background: '#0E0E16', border: `1.5px solid rgba(148, 148, 172, 0.08)`,
                cursor: 'pointer', transition: 'all 200ms',
                textAlign: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = opt.borderColor; e.currentTarget.style.background = `${opt.color}08`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148, 148, 172, 0.08)'; e.currentTarget.style.background = '#0E0E16'; }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: `${opt.color}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {opt.icon}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8' }}>{opt.title}</div>
                <div style={{ fontSize: '11px', color: '#5C5C72', marginTop: '2px' }}>{opt.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
