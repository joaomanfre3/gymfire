import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
}

export function CrownIcon({ size = 28, color = '#FFD700' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"
      style={{ filter: `drop-shadow(0 2px 4px ${color}4D)` }}>
      <path d="M2.5 19h19l-2.3-9.3L15 13l-3-6-3 6-4.2-3.3L2.5 19zM12 2l1 2-1 1-1-1 1-2z" />
    </svg>
  );
}

export function MedalSilverIcon({ size = 24, color = '#C0C0C0' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="6" fill={`${color}20`} stroke={color} />
      <path d="M12 4v-2M8 16l-2 6 4-2 2 2M16 16l2 6-4-2-2 2" />
      <text x="12" y="13" textAnchor="middle" fill={color} fontSize="8" fontWeight="900" stroke="none">2</text>
    </svg>
  );
}

export function MedalBronzeIcon({ size = 22, color = '#CD7F32' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="6" fill={`${color}20`} stroke={color} />
      <path d="M12 4v-2M8 16l-2 6 4-2 2 2M16 16l2 6-4-2-2 2" />
      <text x="12" y="13" textAnchor="middle" fill={color} fontSize="8" fontWeight="900" stroke="none">3</text>
    </svg>
  );
}

export function ChevronUpIcon({ size = 12, color = '#10B981' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 12, color = '#FF4D6A' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function TrophyIcon({ size = 22, color = '#FF6B35' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-0.85-3.25-2.03-3.79A1.07 1.07 0 0 1 14 17v-2.34" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

export function FlameRankIcon({ size = 16, color = '#FF6B35' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.4-2.15 1-3 .22.65.84 1.3 1.5 1.5z" />
    </svg>
  );
}

export function ZapRankIcon({ size = 14, color = '#CCFF00' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function ChevronRightSmallIcon({ size = 14, color = '#FF6B35' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
