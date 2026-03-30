import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { WorkoutStackParamList } from '../../navigation/types';
import api from '../../api/client';

type Props = NativeStackScreenProps<WorkoutStackParamList, 'WorkoutSummary'>;

interface Workout {
  id: string;
  title?: string;
  startedAt: string;
  finishedAt?: string;
  durationSecs?: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  pointsEarned: number;
  mood?: string;
  sets: WorkoutSet[];
  routine?: { id: string; name: string };
  personalRecords: PersonalRecord[];
}

interface WorkoutSet {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  setNumber: number;
  reps?: number;
  weight?: number;
  isPR: boolean;
  isWarmup: boolean;
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

const MOOD_LABELS: Record<string, { icon: string; label: string }> = {
  GREAT: { icon: 'happy', label: 'Great' },
  GOOD: { icon: 'happy-outline', label: 'Good' },
  OKAY: { icon: 'remove-circle-outline', label: 'Okay' },
  BAD: { icon: 'sad-outline', label: 'Bad' },
  TERRIBLE: { icon: 'sad', label: 'Terrible' },
};

export default function WorkoutSummaryScreen({ route, navigation }: Props) {
  const { workoutId } = route.params;
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkout();
  }, []);

  const fetchWorkout = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/workouts/${workoutId}`);
      setWorkout(data);
    } catch {
      Alert.alert('Error', 'Failed to load workout summary');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (secs?: number): string => {
    if (!secs) return '0 min';
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  };

  const formatVolume = (vol: number): string => {
    if (vol >= 1000) {
      return `${(vol / 1000).toFixed(1).replace(/\.0$/, '')}k kg`;
    }
    return `${vol.toLocaleString()} kg`;
  };

  const formatPRType = (type: string): string => {
    switch (type) {
      case 'MAX_WEIGHT':
        return 'Max Weight';
      case 'MAX_REPS':
        return 'Max Reps';
      case 'MAX_VOLUME':
        return 'Max Volume';
      case 'MAX_DURATION':
        return 'Max Duration';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  const getExerciseBreakdown = () => {
    if (!workout) return [];
    const map = new Map<string, { exercise: Exercise; count: number }>();
    for (const set of workout.sets) {
      const existing = map.get(set.exerciseId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(set.exerciseId, { exercise: set.exercise, count: 1 });
      }
    }
    return Array.from(map.values());
  };

  const handleDone = () => {
    navigation.getParent()?.navigate('HomeTab');
  };

  const handleShare = () => {
    Alert.alert('Share', 'Sharing feature coming soon!');
  };

  if (loading || !workout) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const exerciseBreakdown = getExerciseBreakdown();
  const moodInfo = workout.mood ? MOOD_LABELS[workout.mood] : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Celebration Header */}
      <View style={styles.celebrationHeader}>
        <Ionicons name="flame" size={48} color={colors.primary} />
        <Text style={styles.celebrationTitle}>Workout Complete!</Text>
        <Text style={styles.celebrationSubtitle}>
          {workout.title || workout.routine?.name || 'Great session'}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={22} color={colors.accent} />
          <Text style={styles.statValue}>
            {formatDuration(workout.durationSecs)}
          </Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="barbell-outline" size={22} color={colors.accent} />
          <Text style={styles.statValue}>
            {formatVolume(workout.totalVolume)}
          </Text>
          <Text style={styles.statLabel}>Volume</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="layers-outline" size={22} color={colors.accent} />
          <Text style={styles.statValue}>{workout.totalSets}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="repeat-outline" size={22} color={colors.accent} />
          <Text style={styles.statValue}>{workout.totalReps}</Text>
          <Text style={styles.statLabel}>Reps</Text>
        </View>
      </View>

      {/* Points Earned */}
      <View style={styles.pointsCard}>
        <View style={styles.pointsRow}>
          <Ionicons name="star" size={28} color={colors.primary} />
          <Text style={styles.pointsValue}>
            +{workout.pointsEarned}
          </Text>
          <Text style={styles.pointsUnit}>pts</Text>
        </View>
        <Text style={styles.pointsNote}>
          Keep your streak going for bonus points!
        </Text>
      </View>

      {/* Personal Records */}
      {workout.personalRecords.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={20} color={colors.warning} />
            <Text style={styles.sectionTitle}>Personal Records</Text>
          </View>
          {workout.personalRecords.map((pr) => (
            <View key={pr.id} style={styles.prCard}>
              <View style={styles.prIcon}>
                <Ionicons name="trophy" size={20} color={colors.accent} />
              </View>
              <View style={styles.prInfo}>
                <Text style={styles.prExercise}>{pr.exercise.name}</Text>
                <Text style={styles.prType}>{formatPRType(pr.type)}</Text>
              </View>
              <View style={styles.prValues}>
                <Text style={styles.prNewValue}>{pr.value}</Text>
                {pr.previousValue != null && (
                  <Text style={styles.prOldValue}>
                    was {pr.previousValue}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Exercise Breakdown */}
      {exerciseBreakdown.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="list-outline"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.sectionTitle}>Exercise Breakdown</Text>
          </View>
          {exerciseBreakdown.map(({ exercise, count }) => (
            <View key={exercise.id} style={styles.breakdownRow}>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownName}>{exercise.name}</Text>
                <Text style={styles.breakdownMuscle}>
                  {exercise.muscleGroup}
                </Text>
              </View>
              <Text style={styles.breakdownCount}>
                {count} {count === 1 ? 'set' : 'sets'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Mood */}
      {moodInfo && (
        <View style={styles.moodCard}>
          <Ionicons
            name={moodInfo.icon as any}
            size={24}
            color={colors.primary}
          />
          <Text style={styles.moodText}>Feeling {moodInfo.label}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={20} color={colors.text} />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.text}
          />
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Celebration Header
  celebrationHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  celebrationTitle: {
    ...typography.h1,
    color: colors.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  celebrationSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  // Points
  pointsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  pointsValue: {
    ...typography.title,
    color: colors.primary,
  },
  pointsUnit: {
    ...typography.h3,
    color: colors.primary,
    opacity: 0.7,
  },
  pointsNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  // PR Cards
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  prIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(78,205,196,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  prInfo: {
    flex: 1,
  },
  prExercise: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  prType: {
    ...typography.caption,
    color: colors.accent,
    marginTop: 2,
  },
  prValues: {
    alignItems: 'flex-end',
  },
  prNewValue: {
    ...typography.h3,
    color: colors.text,
  },
  prOldValue: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Breakdown
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  breakdownMuscle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  breakdownCount: {
    ...typography.label,
    color: colors.textSecondary,
  },
  // Mood
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  moodText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  // Actions
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  shareButtonText: {
    ...typography.button,
    color: colors.text,
  },
  doneButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  doneButtonText: {
    ...typography.button,
    color: colors.text,
  },
});
