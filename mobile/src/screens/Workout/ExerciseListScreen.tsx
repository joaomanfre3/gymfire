import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontSize } from '../../theme/typography';
import { WorkoutStackParamList } from '../../navigation/types';
import api from '../../api/client';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'ExerciseList'>;
type Route = RouteProp<WorkoutStackParamList, 'ExerciseList'>;

interface Exercise {
  id: string;
  name: string;
  slug: string;
  muscleGroup: string;
  equipment: string;
  difficulty: string;
  category: string;
}

const MUSCLE_GROUPS = [
  'ALL',
  'CHEST',
  'BACK',
  'SHOULDERS',
  'BICEPS',
  'TRICEPS',
  'LEGS',
  'CORE',
  'CARDIO',
];

const DIFFICULTY_COLOR: Record<string, string> = {
  BEGINNER: colors.success,
  INTERMEDIATE: colors.primary,
  ADVANCED: colors.error,
};

export default function ExerciseListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const routineId = route.params?.routineId;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('ALL');
  const [addingId, setAddingId] = useState<string | null>(null);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (muscleGroup !== 'ALL') params.muscleGroup = muscleGroup;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/exercises', { params });
      setExercises(data);
    } catch (err) {
      console.error('Failed to fetch exercises:', err);
    } finally {
      setLoading(false);
    }
  }, [muscleGroup, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExercises();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchExercises]);

  const handleAddToRoutine = async (exercise: Exercise) => {
    if (!routineId) return;
    setAddingId(exercise.id);
    try {
      await api.post(`/routines/${routineId}/sets`, {
        exerciseId: exercise.id,
        order: 0,
        sets: 3,
        reps: '10',
        restSeconds: 90,
      });
      navigation.goBack();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Failed to add exercise';
      Alert.alert('Error', message);
    } finally {
      setAddingId(null);
    }
  };

  const handlePress = (exercise: Exercise) => {
    if (routineId) {
      handleAddToRoutine(exercise);
    } else {
      navigation.navigate('ExerciseDetail', { id: exercise.id });
    }
  };

  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => handlePress(item)}
      disabled={addingId === item.id}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.muscleGroup}</Text>
          </View>
          <View style={[styles.badge, styles.badgeEquipment]}>
            <Text style={styles.badgeTextEquipment}>{item.equipment}</Text>
          </View>
          <Text
            style={[
              styles.difficulty,
              { color: DIFFICULTY_COLOR[item.difficulty] || colors.textMuted },
            ]}
          >
            {item.difficulty}
          </Text>
        </View>
      </View>
      {addingId === item.id ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : routineId ? (
        <Ionicons name="add-circle" size={24} color={colors.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={18}
          color={colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {MUSCLE_GROUPS.map((mg) => {
            const isActive = muscleGroup === mg;
            return (
              <TouchableOpacity
                key={mg}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setMuscleGroup(mg)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.chipText, isActive && styles.chipTextActive]}
                >
                  {mg}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : exercises.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="body-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No exercises found</Text>
          <Text style={styles.emptySubtext}>
            Try a different search or filter
          </Text>
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExercise}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  filtersContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  filtersContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.text,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  cardName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
  },
  badgeText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  badgeEquipment: {
    backgroundColor: colors.surfaceLight,
  },
  badgeTextEquipment: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  difficulty: {
    ...typography.caption,
    fontWeight: '600',
  },
});
