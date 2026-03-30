import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { WorkoutStackParamList } from '../../navigation/types';
import api from '../../api/client';
import Button from '../../components/common/Button';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'RoutineDetail'>;
type Route = RouteProp<WorkoutStackParamList, 'RoutineDetail'>;

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
}

interface RoutineSet {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  order: number;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
  weightHint?: number;
  rpe?: number;
}

interface Routine {
  id: string;
  name: string;
  description?: string;
  days: string[];
  isPublic: boolean;
  sets: RoutineSet[];
  createdAt: string;
}

const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

export default function RoutineDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { id } = route.params;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingWorkout, setStartingWorkout] = useState(false);

  const fetchRoutine = useCallback(async () => {
    try {
      const { data } = await api.get(`/routines/${id}`);
      setRoutine(data);
    } catch (err) {
      console.error('Failed to fetch routine:', err);
      Alert.alert('Error', 'Failed to load routine');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchRoutine();
    }, [fetchRoutine]),
  );

  const handleDeleteSet = (setId: string, exerciseName: string) => {
    Alert.alert(
      'Remove Exercise',
      `Remove ${exerciseName} from this routine?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/routines/${id}/sets/${setId}`);
              fetchRoutine();
            } catch (err) {
              Alert.alert('Error', 'Failed to remove exercise');
            }
          },
        },
      ],
    );
  };

  const handleDeleteRoutine = () => {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routine?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/routines/${id}`);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete routine');
            }
          },
        },
      ],
    );
  };

  const handleStartWorkout = async () => {
    setStartingWorkout(true);
    try {
      const { data } = await api.post('/workouts/start', { routineId: id });
      navigation.navigate('ActiveWorkout', { workoutId: data.id });
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Failed to start workout';
      Alert.alert('Error', message);
    } finally {
      setStartingWorkout(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>Routine not found</Text>
      </View>
    );
  }

  const renderSetItem = ({ item }: { item: RoutineSet }) => (
    <TouchableOpacity
      style={styles.setCard}
      activeOpacity={0.7}
      onLongPress={() => handleDeleteSet(item.id, item.exercise.name)}
    >
      <View style={styles.setInfo}>
        <Text style={styles.exerciseName}>{item.exercise.name}</Text>
        <View style={styles.setDetails}>
          <Text style={styles.setDetailText}>
            {item.sets} x {item.reps}
          </Text>
          {item.restSeconds > 0 && (
            <Text style={styles.setDetailMuted}>
              {item.restSeconds}s rest
            </Text>
          )}
          {item.weightHint != null && item.weightHint > 0 && (
            <Text style={styles.setDetailAccent}>
              {item.weightHint} kg
            </Text>
          )}
          {item.rpe != null && item.rpe > 0 && (
            <Text style={styles.setDetailMuted}>RPE {item.rpe}</Text>
          )}
        </View>
        {item.notes ? (
          <Text style={styles.setNotes} numberOfLines={1}>
            {item.notes}
          </Text>
        ) : null}
      </View>
      <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={routine.sets}
        keyExtractor={(item) => item.id}
        renderItem={renderSetItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>{routine.name}</Text>

            <View style={styles.infoCard}>
              {routine.description ? (
                <Text style={styles.description}>{routine.description}</Text>
              ) : null}
              <View style={styles.infoRow}>
                {routine.days.length > 0 && (
                  <View style={styles.daysRow}>
                    {routine.days.map((day) => (
                      <View key={day} style={styles.dayBadge}>
                        <Text style={styles.dayBadgeText}>
                          {DAY_SHORT[day] || day}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.visibilityBadge}>
                  <Ionicons
                    name={routine.isPublic ? 'globe-outline' : 'lock-closed-outline'}
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={styles.visibilityText}>
                    {routine.isPublic ? 'Public' : 'Private'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Exercises ({routine.sets.length})
              </Text>
            </View>

            {routine.sets.length === 0 && (
              <View style={styles.emptyExercises}>
                <Ionicons
                  name="barbell-outline"
                  size={40}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyText}>
                  No exercises added yet. Tap below to add some.
                </Text>
              </View>
            )}
          </>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Button
              title="Add Exercise"
              onPress={() =>
                navigation.navigate('ExerciseList', { routineId: id })
              }
              variant="outline"
              fullWidth
              icon={<Ionicons name="add" size={20} color={colors.text} />}
            />
            <View style={{ height: spacing.md }} />
            <Button
              title="Delete Routine"
              onPress={handleDeleteRoutine}
              variant="ghost"
              fullWidth
              icon={<Ionicons name="trash-outline" size={18} color={colors.primary} />}
            />
          </View>
        }
      />

      <View style={styles.fab}>
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.8}
          onPress={handleStartWorkout}
          disabled={startingWorkout}
        >
          {startingWorkout ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <>
              <Ionicons name="flash" size={22} color={colors.text} />
              <Text style={styles.fabText}>Start Workout</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginTop: spacing.md,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.xl,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  dayBadge: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
  },
  dayBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  visibilityText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  emptyExercises: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  setCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  setInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  exerciseName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  setDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  setDetailText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '600',
  },
  setDetailMuted: {
    ...typography.caption,
    color: colors.textMuted,
  },
  setDetailAccent: {
    ...typography.caption,
    color: colors.primary,
  },
  setNotes: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: spacing.xl,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    ...typography.button,
    color: colors.text,
    fontSize: 17,
  },
});
