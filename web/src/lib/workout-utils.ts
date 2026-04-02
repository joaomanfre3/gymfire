import type { WorkoutExercise, WorkoutSummaryData } from './workout-types';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function calcTotalVolume(exercises: WorkoutExercise[]): number {
  return exercises.reduce((total, ex) => {
    return total + ex.sets
      .filter(s => s.completed && s.weight && s.reps)
      .reduce((sum, s) => sum + (s.weight! * s.reps!), 0);
  }, 0);
}

export function calcTotalSets(exercises: WorkoutExercise[]): number {
  return exercises.reduce((total, ex) => {
    return total + ex.sets.filter(s => s.completed).length;
  }, 0);
}

export function calcTotalReps(exercises: WorkoutExercise[]): number {
  return exercises.reduce((total, ex) => {
    return total + ex.sets
      .filter(s => s.completed && s.reps)
      .reduce((sum, s) => sum + (s.reps || 0), 0);
  }, 0);
}

export function calcCalories(durationSecs: number, totalVolume: number): number {
  // Rough estimate: base rate + volume-based
  const minutes = durationSecs / 60;
  return Math.round(minutes * 5 + totalVolume / 200);
}

export function calcXP(totalSets: number, totalVolume: number): number {
  return Math.round(totalSets * 5 + totalVolume / 100);
}

export function generateSummary(exercises: WorkoutExercise[], startTime: number): WorkoutSummaryData {
  const duration = Math.floor((Date.now() - startTime) / 1000);
  const totalVolume = calcTotalVolume(exercises);
  const totalSets = calcTotalSets(exercises);
  const totalReps = calcTotalReps(exercises);
  const exerciseCount = exercises.filter(e => e.sets.some(s => s.completed)).length;
  const calories = calcCalories(duration, totalVolume);
  const xpEarned = calcXP(totalSets, totalVolume);

  return {
    duration,
    totalVolume,
    totalSets,
    totalReps,
    exerciseCount,
    calories,
    xpEarned,
    personalRecords: [],
  };
}

export function formatWorkoutTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatVolume(kg: number): string {
  if (kg >= 1000) return (kg / 1000).toFixed(1).replace('.0', '') + 't';
  return kg + 'kg';
}
