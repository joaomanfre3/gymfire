import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { WorkoutStackParamList } from '../../navigation/types';
import api from '../../api/client';
import RestTimer from '../../components/workout/RestTimer';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'ActiveWorkout'>;

interface Workout {
  id: string;
  userId: string;
  routineId?: string;
  title?: string;
  notes?: string;
  startedAt: string;
  finishedAt?: string;
  durationSecs?: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  pointsEarned: number;
  mood?: string;
  sets: WorkoutSet[];
  routine?: { id: string; name: string; sets: { exercise: Exercise }[] };
  personalRecords: PersonalRecord[];
}

interface WorkoutSet {
  id: string;
  workoutId: string;
  exerciseId: string;
  exercise: Exercise;
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number;
  rpe?: number;
  isWarmup: boolean;
  isDropset: boolean;
  isFailure: boolean;
  isPR: boolean;
  notes?: string;
  completedAt: string;
}

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
}

interface PersonalRecord {
  id: string;
  type: string;
  value: number;
  previousValue?: number;
  exercise: Exercise;
}

export default function ActiveWorkoutScreen({ route, navigation }: Props) {
  const { workoutId } = route.params;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [exerciseInputs, setExerciseInputs] = useState<
    Record<string, { weight: string; reps: string }>
  >({});
  const [addedExercises, setAddedExercises] = useState<Exercise[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingSet, setAddingSet] = useState<string | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [recentPRSetId, setRecentPRSetId] = useState<string | null>(null);

  const startTimeRef = useRef<number>(Date.now());

  // Fetch workout on mount
  useEffect(() => {
    fetchWorkout();
  }, []);

  // Elapsed time timer
  useEffect(() => {
    if (!workout) return;
    startTimeRef.current =
      new Date(workout.startedAt).getTime();

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - startTimeRef.current) / 1000,
      );
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [workout?.startedAt]);

  // Clear PR highlight after 3s
  useEffect(() => {
    if (!recentPRSetId) return;
    const t = setTimeout(() => setRecentPRSetId(null), 3000);
    return () => clearTimeout(t);
  }, [recentPRSetId]);

  const fetchWorkout = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/workouts/${workoutId}`);
      setWorkout(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load workout');
    } finally {
      setLoading(false);
    }
  };

  const formatElapsed = useCallback((secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  // Build grouped exercise list
  const getExerciseGroups = useCallback(() => {
    if (!workout) return [];

    const exerciseMap = new Map<
      string,
      { exercise: Exercise; sets: WorkoutSet[] }
    >();

    // 1. Routine exercises (if any)
    if (workout.routine?.sets) {
      for (const rs of workout.routine.sets) {
        if (!exerciseMap.has(rs.exercise.id)) {
          exerciseMap.set(rs.exercise.id, {
            exercise: rs.exercise,
            sets: [],
          });
        }
      }
    }

    // 2. Sets already completed
    for (const set of workout.sets) {
      if (!exerciseMap.has(set.exerciseId)) {
        exerciseMap.set(set.exerciseId, {
          exercise: set.exercise,
          sets: [],
        });
      }
      exerciseMap.get(set.exerciseId)!.sets.push(set);
    }

    // 3. Manually added exercises
    for (const ex of addedExercises) {
      if (!exerciseMap.has(ex.id)) {
        exerciseMap.set(ex.id, { exercise: ex, sets: [] });
      }
    }

    return Array.from(exerciseMap.values());
  }, [workout, addedExercises]);

  const handleAddSet = async (exerciseId: string) => {
    const input = exerciseInputs[exerciseId];
    if (!input?.weight && !input?.reps) return;

    const weight = input.weight ? parseFloat(input.weight) : undefined;
    const reps = input.reps ? parseInt(input.reps, 10) : undefined;

    if (weight !== undefined && isNaN(weight)) return;
    if (reps !== undefined && isNaN(reps)) return;

    try {
      setAddingSet(exerciseId);
      const { data: newSet } = await api.post(
        `/workouts/${workoutId}/sets`,
        { exerciseId, weight, reps },
      );

      setWorkout((prev) => {
        if (!prev) return prev;
        return { ...prev, sets: [...prev.sets, newSet] };
      });

      // Clear inputs
      setExerciseInputs((prev) => ({
        ...prev,
        [exerciseId]: { weight: '', reps: '' },
      }));

      // PR celebration
      if (newSet.isPR) {
        setRecentPRSetId(newSet.id);
      }

      // Start rest timer
      setShowRestTimer(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to add set');
    } finally {
      setAddingSet(null);
    }
  };

  const handleOpenExerciseSelector = async () => {
    try {
      const { data } = await api.get('/exercises');
      setExercises(data);
    } catch {
      // ignore
    }
    setSelectorOpen(true);
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setAddedExercises((prev) => {
      if (prev.find((e) => e.id === exercise.id)) return prev;
      return [...prev, exercise];
    });
    setSelectorOpen(false);
    setExerciseSearch('');
  };

  const handleFinishWorkout = () => {
    Alert.alert(
      'Finish Workout',
      'Are you sure you want to finish this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          style: 'default',
          onPress: async () => {
            try {
              await api.post(`/workouts/${workoutId}/finish`, {
                mood: 'GOOD',
              });
              navigation.replace('WorkoutSummary', { workoutId });
            } catch (err) {
              Alert.alert('Error', 'Failed to finish workout');
            }
          },
        },
      ],
    );
  };

  const updateInput = (
    exerciseId: string,
    field: 'weight' | 'reps',
    value: string,
  ) => {
    setExerciseInputs((prev) => ({
      ...prev,
      [exerciseId]: {
        weight: prev[exerciseId]?.weight ?? '',
        reps: prev[exerciseId]?.reps ?? '',
        [field]: value,
      },
    }));
  };

  const filteredExercises = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      e.muscleGroup.toLowerCase().includes(exerciseSearch.toLowerCase()),
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const exerciseGroups = getExerciseGroups();

  return (
    <View style={styles.container}>
      {/* Rest Timer Banner */}
      {showRestTimer && (
        <RestTimer
          durationSeconds={90}
          onDismiss={() => setShowRestTimer(false)}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.timerText}>{formatElapsed(elapsedTime)}</Text>
          <Text style={styles.workoutTitle}>
            {workout?.title || workout?.routine?.name || 'Workout'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {exerciseGroups.map(({ exercise, sets }) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              {/* Exercise Header */}
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.muscleBadge}>
                  <Text style={styles.muscleBadgeText}>
                    {exercise.muscleGroup}
                  </Text>
                </View>
              </View>

              {/* Set Table Header */}
              {sets.length > 0 && (
                <View style={styles.setHeaderRow}>
                  <Text style={[styles.setHeaderCell, styles.setNumCol]}>
                    #
                  </Text>
                  <Text style={[styles.setHeaderCell, styles.weightCol]}>
                    Weight
                  </Text>
                  <Text style={[styles.setHeaderCell, styles.repsCol]}>
                    Reps
                  </Text>
                  <View style={styles.prCol} />
                </View>
              )}

              {/* Completed Sets */}
              {sets.map((set, idx) => {
                const isHighlighted = set.id === recentPRSetId;
                return (
                  <View
                    key={set.id}
                    style={[
                      styles.setRow,
                      idx % 2 === 1 && styles.setRowAlt,
                      set.isWarmup && styles.setRowWarmup,
                      isHighlighted && styles.setRowPR,
                    ]}
                  >
                    <Text
                      style={[
                        styles.setCell,
                        styles.setNumCol,
                        set.isWarmup && styles.warmupText,
                      ]}
                    >
                      {set.isWarmup ? 'W' : idx + 1}
                    </Text>
                    <Text style={[styles.setCell, styles.weightCol]}>
                      {set.weight != null ? `${set.weight} kg` : '-'}
                    </Text>
                    <Text style={[styles.setCell, styles.repsCol]}>
                      {set.reps != null ? set.reps : '-'}
                    </Text>
                    <View style={styles.prCol}>
                      {set.isPR && (
                        <Ionicons
                          name="flame"
                          size={16}
                          color={isHighlighted ? colors.warning : colors.accent}
                        />
                      )}
                      {set.isDropset && (
                        <Ionicons
                          name="arrow-down"
                          size={14}
                          color={colors.textMuted}
                        />
                      )}
                      {set.isFailure && (
                        <Ionicons
                          name="alert-circle"
                          size={14}
                          color={colors.error}
                        />
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Input Row */}
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.weightInput]}
                  placeholder="kg"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={exerciseInputs[exercise.id]?.weight ?? ''}
                  onChangeText={(v) => updateInput(exercise.id, 'weight', v)}
                />
                <TextInput
                  style={[styles.input, styles.repsInput]}
                  placeholder="reps"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={exerciseInputs[exercise.id]?.reps ?? ''}
                  onChangeText={(v) => updateInput(exercise.id, 'reps', v)}
                />
                <TouchableOpacity
                  style={[
                    styles.addSetButton,
                    addingSet === exercise.id && styles.addSetButtonDisabled,
                  ]}
                  onPress={() => handleAddSet(exercise.id)}
                  disabled={addingSet === exercise.id}
                >
                  {addingSet === exercise.id ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Ionicons name="add" size={22} color={colors.text} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Add Exercise Button */}
          <TouchableOpacity
            style={styles.addExerciseButton}
            onPress={handleOpenExerciseSelector}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </TouchableOpacity>

          {/* Bottom spacer for floating button */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Finish Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinishWorkout}
        >
          <Ionicons name="checkmark-circle" size={22} color={colors.text} />
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </TouchableOpacity>
      </View>

      {/* Exercise Selector Modal */}
      <Modal
        visible={selectorOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectorOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            <TouchableOpacity onPress={() => setSelectorOpen(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={18}
              color={colors.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={colors.textMuted}
              value={exerciseSearch}
              onChangeText={setExerciseSearch}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exerciseListItem}
                onPress={() => handleSelectExercise(item)}
              >
                <View style={styles.exerciseListInfo}>
                  <Text style={styles.exerciseListName}>{item.name}</Text>
                  <Text style={styles.exerciseListMeta}>
                    {item.muscleGroup} {item.equipment ? `· ${item.equipment}` : ''}
                  </Text>
                </View>
                <Ionicons
                  name="add-circle"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>No exercises found</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  headerLeft: {
    flex: 1,
  },
  timerText: {
    ...typography.h2,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  workoutTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Scroll
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  // Exercise Card
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  exerciseName: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  muscleBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    marginLeft: spacing.sm,
  },
  muscleBadgeText: {
    ...typography.caption,
    color: colors.accent,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  // Set Table
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  setHeaderCell: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  setNumCol: {
    width: 32,
    textAlign: 'center',
  },
  weightCol: {
    flex: 1,
    textAlign: 'center',
  },
  repsCol: {
    flex: 1,
    textAlign: 'center',
  },
  prCol: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  setRowAlt: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  setRowWarmup: {
    opacity: 0.6,
  },
  setRowPR: {
    backgroundColor: 'rgba(78,205,196,0.12)',
  },
  setCell: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
  },
  warmupText: {
    color: colors.textMuted,
  },
  // Input Row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    ...typography.body,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  weightInput: {
    flex: 1,
  },
  repsInput: {
    flex: 1,
  },
  addSetButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSetButtonDisabled: {
    opacity: 0.6,
  },
  // Add Exercise
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderStyle: 'dashed',
  },
  addExerciseText: {
    ...typography.button,
    color: colors.primary,
  },
  // Floating Finish Button
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  finishButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  finishButtonText: {
    ...typography.button,
    color: colors.text,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.text,
    ...typography.body,
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  exerciseListInfo: {
    flex: 1,
  },
  exerciseListName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  exerciseListMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyList: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyListText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
