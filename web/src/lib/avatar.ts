const AVATAR_COLORS = ['#FF6B35', '#4ECDC4', '#22C55E', '#6366F1', '#EC4899', '#F59E0B', '#8B5CF6'];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
