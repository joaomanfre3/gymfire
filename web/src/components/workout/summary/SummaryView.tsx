'use client';

import type { WorkoutSummaryData, WorkoutAction } from '@/lib/workout-types';
import { formatWorkoutTimer, formatVolume } from '@/lib/workout-utils';
import { CheckCircleIcon, ZapIcon, FlameIcon, ShareIcon, DumbbellIcon } from '../shared/WorkoutIcons';

interface Props {
  summary: WorkoutSummaryData;
  dispatch: React.Dispatch<WorkoutAction>;
}

export default function SummaryView({ summary, dispatch }: Props) {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 16px', textAlign: 'center' }}>
      {/* Success icon */}
      <div style={{ marginBottom: '16px', animation: 'slide-up 0.5s ease both' }}>
        <CheckCircleIcon size={64} color="#CCFF00" />
      </div>

      <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F0F0F8', margin: '0 0 6px' }}>
        Treino Concluído!
      </h1>
      <p style={{ fontSize: '14px', color: '#9494AC', margin: '0 0 24px' }}>
        Ótimo trabalho! Aqui está o resumo do seu treino.
      </p>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1px',
        background: 'rgba(148, 148, 172, 0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '16px',
      }}>
        {[
          { label: 'Duração', value: formatWorkoutTimer(summary.duration), icon: <DumbbellIcon size={16} color="#FF6B35" /> },
          { label: 'Volume', value: formatVolume(summary.totalVolume), icon: <FlameIcon size={16} /> },
          { label: 'Séries', value: String(summary.totalSets), icon: null },
          { label: 'Calorias', value: String(summary.calories), icon: <FlameIcon size={16} color="#FF4D6A" /> },
        ].map((s, i) => (
          <div key={i} style={{ background: '#141420', padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#F0F0F8' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* XP Card */}
      <div style={{
        background: '#141420',
        borderRadius: '14px',
        border: '1px solid rgba(204, 255, 0, 0.15)',
        padding: '20px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
      }}>
        <ZapIcon size={22} />
        <span style={{ fontSize: '20px', fontWeight: 800, color: '#CCFF00' }}>
          +{summary.xpEarned} XP
        </span>
        <span style={{ fontSize: '13px', color: '#9494AC' }}>ganhos neste treino</span>
      </div>

      {/* Exercise summary */}
      <div style={{
        background: '#141420',
        borderRadius: '14px',
        border: '1px solid rgba(148, 148, 172, 0.08)',
        padding: '16px',
        marginBottom: '24px',
        textAlign: 'left',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#5C5C72', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
          Resumo
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(148,148,172,0.06)' }}>
          <span style={{ fontSize: '14px', color: '#9494AC' }}>Exercícios realizados</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8' }}>{summary.exerciseCount}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(148,148,172,0.06)' }}>
          <span style={{ fontSize: '14px', color: '#9494AC' }}>Total de repetições</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8' }}>{summary.totalReps}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
          <span style={{ fontSize: '14px', color: '#9494AC' }}>Séries completas</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8' }}>{summary.totalSets}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          style={{
            flex: 1, padding: '14px', borderRadius: '12px',
            border: '1px solid rgba(148, 148, 172, 0.12)', background: 'transparent',
            color: '#9494AC', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Voltar ao Início
        </button>
        <button
          style={{
            flex: 1, padding: '14px', borderRadius: '12px',
            border: 'none', background: '#FF6B35',
            color: '#0A0A0F', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          <ShareIcon size={16} color="#0A0A0F" />
          Compartilhar
        </button>
      </div>
    </div>
  );
}
