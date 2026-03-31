export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 3.0;
  if (streak >= 14) return 2.0;
  if (streak >= 7) return 1.5;
  if (streak >= 3) return 1.25;
  return 1.0;
}

export function calculateWorkoutPoints(
  totalVolume: number,
  prCount: number,
  streakMultiplier: number
): number {
  const base = 100;
  const volumePoints = totalVolume / 100;
  const prPoints = 250 * prCount;
  return Math.round((base + volumePoints + prPoints) * streakMultiplier);
}
