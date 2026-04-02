import type { WorkoutState, WorkoutAction } from './workout-types';
import { generateId, generateSummary } from './workout-utils';

export const initialWorkoutState: WorkoutState = {
  status: 'idle',
  startTime: null,
  exercises: [],
  restTimerActive: false,
  restTimerDuration: 90,
  restTimerRemaining: 0,
  summary: null,
  exercisePickerOpen: false,
};

export function workoutReducer(state: WorkoutState, action: WorkoutAction): WorkoutState {
  switch (action.type) {
    case 'START_EMPTY':
      return {
        ...state,
        status: 'active',
        startTime: Date.now(),
        exercises: [],
        summary: null,
      };

    case 'START_WITH_EXERCISES':
      return {
        ...state,
        status: 'active',
        startTime: Date.now(),
        exercises: action.exercises,
        summary: null,
      };

    case 'ADD_EXERCISE': {
      const newExercise = {
        id: generateId(),
        exerciseId: action.exercise.id,
        name: action.exercise.name,
        muscleGroup: action.exercise.muscleGroup,
        sets: [
          { id: generateId(), setNumber: 1, weight: null, reps: null, completed: false, isWarmup: false, isPR: false },
          { id: generateId(), setNumber: 2, weight: null, reps: null, completed: false, isWarmup: false, isPR: false },
          { id: generateId(), setNumber: 3, weight: null, reps: null, completed: false, isWarmup: false, isPR: false },
        ],
      };
      return {
        ...state,
        exercises: [...state.exercises, newExercise],
        exercisePickerOpen: false,
      };
    }

    case 'REMOVE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.filter(e => e.id !== action.exerciseId),
      };

    case 'ADD_SET': {
      return {
        ...state,
        exercises: state.exercises.map(e => {
          if (e.id !== action.exerciseId) return e;
          const lastSet = e.sets[e.sets.length - 1];
          return {
            ...e,
            sets: [...e.sets, {
              id: generateId(),
              setNumber: e.sets.length + 1,
              weight: lastSet?.weight ?? null,
              reps: null,
              completed: false,
              isWarmup: false,
              isPR: false,
            }],
          };
        }),
      };
    }

    case 'UPDATE_SET':
      return {
        ...state,
        exercises: state.exercises.map(e => {
          if (e.id !== action.exerciseId) return e;
          return {
            ...e,
            sets: e.sets.map(s => {
              if (s.id !== action.setId) return s;
              return { ...s, [action.field]: action.value };
            }),
          };
        }),
      };

    case 'COMPLETE_SET':
      return {
        ...state,
        exercises: state.exercises.map(e => {
          if (e.id !== action.exerciseId) return e;
          return {
            ...e,
            sets: e.sets.map(s => {
              if (s.id !== action.setId) return s;
              return { ...s, completed: !s.completed };
            }),
          };
        }),
        restTimerActive: true,
        restTimerRemaining: state.restTimerDuration,
      };

    case 'REMOVE_SET':
      return {
        ...state,
        exercises: state.exercises.map(e => {
          if (e.id !== action.exerciseId) return e;
          return {
            ...e,
            sets: e.sets.filter(s => s.id !== action.setId).map((s, i) => ({ ...s, setNumber: i + 1 })),
          };
        }),
      };

    case 'START_REST':
      return { ...state, restTimerActive: true, restTimerDuration: action.duration, restTimerRemaining: action.duration };

    case 'TICK_REST':
      if (state.restTimerRemaining <= 1) {
        return { ...state, restTimerActive: false, restTimerRemaining: 0 };
      }
      return { ...state, restTimerRemaining: state.restTimerRemaining - 1 };

    case 'SKIP_REST':
      return { ...state, restTimerActive: false, restTimerRemaining: 0 };

    case 'ADD_REST_TIME':
      return { ...state, restTimerRemaining: state.restTimerRemaining + action.seconds };

    case 'FINISH_WORKOUT':
      if (!state.startTime) return state;
      return {
        ...state,
        status: 'summary',
        summary: generateSummary(state.exercises, state.startTime),
        restTimerActive: false,
      };

    case 'CANCEL_WORKOUT':
      return initialWorkoutState;

    case 'OPEN_EXERCISE_PICKER':
      return { ...state, exercisePickerOpen: true };

    case 'CLOSE_EXERCISE_PICKER':
      return { ...state, exercisePickerOpen: false };

    case 'RESET':
      return initialWorkoutState;

    case 'RESTORE':
      return action.state;

    default:
      return state;
  }
}
