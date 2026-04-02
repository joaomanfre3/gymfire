import React from 'react';

interface P { size?: number; color?: string; }

export function PlayIcon({ size = 20, color = 'currentColor' }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}
export function PauseIcon({ size = 20, color = 'currentColor' }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"><line x1="6" y1="4" x2="6" y2="20" /><line x1="18" y1="4" x2="18" y2="20" /></svg>;
}
export function CheckIcon({ size = 18, color = 'currentColor' }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}
export function PlusIcon({ size = 18, color = 'currentColor' }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
export function XIcon({ size = 18, color = 'currentColor' }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
export function SearchIcon({ size = 18, color = 'currentColor' }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
export function TimerIcon({ size = 18, color = 'currentColor' }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M10 2h4" /></svg>;
}
export function DumbbellIcon({ size = 22, color = 'currentColor' }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round"><path d="M6.5 6.5h11M6 12H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2m0 8H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2m0-4v8m12-8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2m0-8h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2m0 4V8" /></svg>;
}
export function FlameIcon({ size = 18, color = '#FF6B35' }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.4-2.15 1-3 .22.65.84 1.3 1.5 1.5z" /></svg>;
}
export function ZapIcon({ size = 14, color = '#CCFF00' }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
}
export function MoreIcon({ size = 20, color = '#5C5C72' }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>;
}
export function TrashIcon({ size = 16, color = '#FF4D6A' }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
}
export function ShareIcon({ size = 18, color = 'currentColor' }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
}
export function ChevronRightIcon({ size = 16, color = 'currentColor' }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>;
}
export function CheckCircleIcon({ size = 48, color = '#CCFF00' }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="9 12 11.5 14.5 16 9" /></svg>;
}
