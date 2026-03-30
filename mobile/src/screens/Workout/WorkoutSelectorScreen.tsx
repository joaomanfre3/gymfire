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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { WorkoutStackParamList } from '../../navigation/types';
import api from '../../api/client';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'WorkoutSelector'>;

interface Routine {
  id: string;
  name: string;
  description?: string;
  days: string[];
  sets: any[];
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

export default function WorkoutSelectorScreen() {
  const navigation = useNavigation<Nav>();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);

  const fetchRoutines = useCallback(async () => {
    try {
      const { data } = await api.get('/routines');
      setRoutines(data);
    } catch (err) {
      console.error('Failed to fetch routines:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRoutines();
    }, [fetchRoutines]),
  );

  const startWorkout = async (routineId?: string) => {
    const id = routineId || '__quick__';
    setStartingId(id);
    try {
      const body: Record<string, any> = {};
      if (routineId) {
        body.routineId = routineId;
      } else {
        body.title = 'Quick Workout';
      }
      const { data } = await api.post('/workouts/start', body);
      navigation.navigate('ActiveWorkout', { workoutId: data.id });
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Failed to start workout';
      Alert.alert('Error', message);
    } finally {
      setStartingId(null);
    }
  };

  const renderRoutineCard = ({ item }: { item: Routine }) => {
    const isStarting = startingId === item.id;
    return (
      <TouchableOpacity
        style={styles.routineCard}
        activeOpacity={0.7}
        onPress={() => startWorkout(item.id)}
        disabled={startingId !== null}
      >
        <View style={styles.routineInfo}>
          <Text style={styles.routineName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.routineMeta}>
            <Text style={styles.routineExercises}>
              {item.sets.length} exercise{item.sets.length !== 1 ? 's' : ''}
            </Text>
            {item.days.length > 0 && (
              <Text style={styles.routineDays}>
                {item.days.map((d) => DAY_SHORT[d] || d).join(', ')}
              </Text>
            )}
          </View>
        </View>
        {isStarting ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name="play-circle" size={28} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        renderItem={renderRoutineCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Start Workout 🔥</Text>

            <TouchableOpacity
              style={styles.quickCard}
              activeOpacity={0.7}
              onPress={() => startWorkout()}
              disabled={startingId !== null}
            >
              <View style={styles.quickIconContainer}>
                {startingId === '__quick__' ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Ionicons name="flash" size={28} color={colors.text} />
                )}
              </View>
              <View style={styles.quickInfo}>
                <Text style={styles.quickTitle}>Quick Workout</Text>
                <Text style={styles.quickSubtitle}>
                  Start an empty workout and add exercises as you go
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={22}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {routines.length > 0 && (
              <Text style={styles.sectionTitle}>From Your Routines</Text>
            )}
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="barbell-outline"
                size={40}
                color={colors.textMuted}
              />
              <Text style={styles.emptyText}>No routines yet</Text>
              <Text style={styles.emptySubtext}>
                Create a routine to start training with a plan
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    paddingTop: spacing.md,
    marginBottom: spacing.xl,
  },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quickIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  quickInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  quickTitle: {
    ...typography.h3,
    color: colors.text,
  },
  quickSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  routineInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  routineName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  routineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  routineExercises: {
    ...typography.caption,
    color: colors.accent,
  },
  routineDays: {
    ...typography.caption,
    color: colors.textMuted,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl * 2,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
