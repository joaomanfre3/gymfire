import { useEffect } from 'react';
import type { WorkoutState } from '@/lib/workout-types';

const STORAGE_KEY = 'gymfire_active_workout';

export function saveWorkoutState(state: WorkoutState) {
  if (typeof window === 'undefined') return;
  if (state.status === 'active') {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function loadWorkoutState(): WorkoutState | null {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    const state = JSON.parse(stored) as WorkoutState;
    if (state.status === 'active' && state.startTime) {
      return state;
    }
  } catch { /* ignore */ }
  return null;
}

export function useWorkoutPersistence(state: WorkoutState) {
  useEffect(() => {
    saveWorkoutState(state);
  }, [state]);
}
