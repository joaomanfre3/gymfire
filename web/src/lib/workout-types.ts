export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: string;
  sets: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  isWarmup: boolean;
  isPR: boolean;
}

export interface WorkoutSummaryData {
  duration: number; // seconds
  totalVolume: number; // kg
  totalSets: number;
  totalReps: number;
  exerciseCount: number;
  calories: number;
  xpEarned: number;
  personalRecords: { exercise: string; value: string }[];
}

export type WorkoutStatus = 'idle' | 'active' | 'summary';

export interface WorkoutState {
  status: WorkoutStatus;
  startTime: number | null; // Date.now() timestamp
  exercises: WorkoutExercise[];
  restTimerActive: boolean;
  restTimerDuration: number; // seconds
  restTimerRemaining: number;
  summary: WorkoutSummaryData | null;
  exercisePickerOpen: boolean;
}

export type WorkoutAction =
  | { type: 'START_EMPTY' }
  | { type: 'START_WITH_EXERCISES'; exercises: WorkoutExercise[] }
  | { type: 'ADD_EXERCISE'; exercise: { id: string; name: string; muscleGroup: string } }
  | { type: 'REMOVE_EXERCISE'; exerciseId: string }
  | { type: 'ADD_SET'; exerciseId: string }
  | { type: 'UPDATE_SET'; exerciseId: string; setId: string; field: 'weight' | 'reps'; value: number | null }
  | { type: 'COMPLETE_SET'; exerciseId: string; setId: string }
  | { type: 'REMOVE_SET'; exerciseId: string; setId: string }
  | { type: 'START_REST'; duration: number }
  | { type: 'TICK_REST' }
  | { type: 'SKIP_REST' }
  | { type: 'ADD_REST_TIME'; seconds: number }
  | { type: 'FINISH_WORKOUT' }
  | { type: 'CANCEL_WORKOUT' }
  | { type: 'OPEN_EXERCISE_PICKER' }
  | { type: 'CLOSE_EXERCISE_PICKER' }
  | { type: 'RESET' }
  | { type: 'RESTORE'; state: WorkoutState };
