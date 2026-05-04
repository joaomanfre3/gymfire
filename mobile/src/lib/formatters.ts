export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return k >= 10
      ? `${Math.floor(k)}k`
      : `${k.toFixed(1).replace('.', ',').replace(',0', '')}k`;
  }
  const m = n / 1_000_000;
  return m >= 10
    ? `${Math.floor(m)}M`
    : `${m.toFixed(1).replace('.', ',').replace(',0', '')}M`;
}

export function formatLikesLabel(n: number): string {
  if (n === 0) return '';
  if (n === 1) return '1 curtida';
  return `${formatCount(n)} curtidas`;
}

export function formatCommentsLabel(n: number): string {
  if (n === 0) return '';
  if (n === 1) return 'Ver 1 comentário';
  return `Ver todos os ${formatCount(n)} comentários`;
}

export function formatRelativeTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m`;
  return `${Math.floor(months / 12)}a`;
}

export function formatRelativeTimeUpper(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'AGORA';
  if (mins < 60) return `${mins} MINUTOS ATRÁS`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} HORAS ATRÁS`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} DIAS ATRÁS`;
  const weeks = Math.floor(days / 7);
  return `${weeks} SEMANAS ATRÁS`;
}
