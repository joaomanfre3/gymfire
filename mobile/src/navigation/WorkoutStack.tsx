import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkoutStackParamList } from './types';
import { colors } from '../theme';
import RoutinesListScreen from '../screens/Workout/RoutinesListScreen';
import RoutineDetailScreen from '../screens/Workout/RoutineDetailScreen';
import RoutineFormScreen from '../screens/Workout/RoutineFormScreen';
import WorkoutSelectorScreen from '../screens/Workout/WorkoutSelectorScreen';
import ActiveWorkoutScreen from '../screens/Workout/ActiveWorkoutScreen';
import WorkoutSummaryScreen from '../screens/Workout/WorkoutSummaryScreen';
import ExerciseListScreen from '../screens/Workout/ExerciseListScreen';
import ExerciseDetailScreen from '../screens/Workout/ExerciseDetailScreen';

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

export default function WorkoutStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="RoutinesList"
        component={RoutinesListScreen}
        options={{ title: 'Workout' }}
      />
      <Stack.Screen
        name="RoutineDetail"
        component={RoutineDetailScreen}
        options={{ title: 'Routine' }}
      />
      <Stack.Screen
        name="RoutineForm"
        component={RoutineFormScreen}
        options={{ title: 'New Routine' }}
      />
      <Stack.Screen
        name="WorkoutSelector"
        component={WorkoutSelectorScreen}
        options={{ title: 'Start Workout' }}
      />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ title: 'Workout', headerBackVisible: false }}
      />
      <Stack.Screen
        name="WorkoutSummary"
        component={WorkoutSummaryScreen}
        options={{ title: 'Summary' }}
      />
      <Stack.Screen
        name="ExerciseList"
        component={ExerciseListScreen}
        options={{ title: 'Exercises' }}
      />
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreen}
        options={{ title: 'Exercise' }}
      />
    </Stack.Navigator>
  );
}
