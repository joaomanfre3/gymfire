'use client';

import { useReducer, useEffect } from 'react';
import { workoutReducer, initialWorkoutState } from '@/lib/workout-reducer';
import { useWorkoutPersistence, loadWorkoutState } from '@/hooks/useSessionStorage';
import IdleView from './idle/IdleView';
import ActiveView from './active/ActiveView';
import SummaryView from './summary/SummaryView';

export default function WorkoutPage() {
  const [state, dispatch] = useReducer(workoutReducer, initialWorkoutState);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    const saved = loadWorkoutState();
    if (saved) {
      dispatch({ type: 'RESTORE', state: saved });
    }
  }, []);

  // Persist state changes
  useWorkoutPersistence(state);

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#0A0A0F' }}>
      {state.status === 'idle' && <IdleView dispatch={dispatch} />}
      {state.status === 'active' && <ActiveView state={state} dispatch={dispatch} />}
      {state.status === 'summary' && state.summary && (
        <SummaryView summary={state.summary} dispatch={dispatch} />
      )}
    </div>
  );
}
