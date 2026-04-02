'use client';

import { useRouter } from 'next/navigation';
import { getToken, getUser } from '@/lib/api';
import { DumbbellIcon, RunningIcon, BarChartIcon, CameraIcon } from './FeedIcons';

export default function CreatePostBox() {
  const router = useRouter();
  const user = getUser();

  const handleAction = () => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
  };

  return (
    <div style={{
      background: '#141420',
      borderBottom: '1px solid rgba(148, 148, 172, 0.08)',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: user ? 'linear-gradient(135deg, #FF6B35, #E05520)' : '#1A1A28',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: '14px',
          flexShrink: 0,
        }}>
          {user ? (user.displayName || user.username)[0].toUpperCase() : ''}
        </div>

        <div
          onClick={handleAction}
          style={{
            flex: 1,
            background: '#1A1A28',
            border: '1px solid rgba(148, 148, 172, 0.08)',
            borderRadius: '24px',
            padding: '10px 16px',
            fontSize: '14px',
            color: '#5C5C72',
            cursor: 'pointer',
            transition: 'border-color 200ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(148, 148, 172, 0.12)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(148, 148, 172, 0.08)')}
        >
          O que você treinou hoje?
        </div>

        <button
          onClick={handleAction}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#FF6B35',
            transition: 'background 200ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 107, 53, 0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <CameraIcon size={20} color="#FF6B35" />
        </button>
      </div>

      <div className="hide-scrollbar-mobile" style={{
        marginTop: '10px',
        display: 'flex',
        gap: '8px',
      }}>
        {[
          { icon: <DumbbellIcon size={14} color="#9494AC" />, label: 'Treino' },
          { icon: <RunningIcon size={14} color="#9494AC" />, label: 'Corrida' },
          { icon: <BarChartIcon size={14} color="#9494AC" />, label: 'Progresso' },
          { icon: <CameraIcon size={14} color="#9494AC" />, label: 'Foto' },
        ].map(action => (
          <button
            key={action.label}
            onClick={handleAction}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#1A1A28',
              border: '1px solid rgba(148, 148, 172, 0.08)',
              fontSize: '12px',
              fontWeight: 600,
              color: '#9494AC',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 107, 53, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.25)';
              e.currentTarget.style.color = '#FF6B35';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#1A1A28';
              e.currentTarget.style.borderColor = 'rgba(148, 148, 172, 0.08)';
              e.currentTarget.style.color = '#9494AC';
            }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
