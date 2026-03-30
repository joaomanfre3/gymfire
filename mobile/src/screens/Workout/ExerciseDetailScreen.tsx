import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { WorkoutStackParamList } from '../../navigation/types';
import api from '../../api/client';

type Nav = NativeStackNavigationProp<WorkoutStackParamList, 'ExerciseDetail'>;
type Route = RouteProp<WorkoutStackParamList, 'ExerciseDetail'>;

interface Exercise {
  id: string;
  name: string;
  slug: string;
  description?: string;
  instructions: string[];
  muscleGroup: string;
  equipment: string;
  difficulty: string;
  category: string;
  gifUrl?: string;
  thumbnailUrl?: string;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  BEGINNER: colors.success,
  INTERMEDIATE: colors.primary,
  ADVANCED: colors.error,
};

export default function ExerciseDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { id } = route.params;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/exercises/${id}`);
        setExercise(data);
      } catch (err) {
        console.error('Failed to fetch exercise:', err);
        Alert.alert('Error', 'Failed to load exercise details');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>Exercise not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {exercise.gifUrl ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: exercise.gifUrl }}
            style={styles.gif}
            resizeMode="contain"
          />
        </View>
      ) : exercise.thumbnailUrl ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: exercise.thumbnailUrl }}
            style={styles.gif}
            resizeMode="contain"
          />
        </View>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="barbell-outline" size={64} color={colors.textMuted} />
        </View>
      )}

      <Text style={styles.name}>{exercise.name}</Text>

      <View style={styles.badges}>
        <View style={styles.badge}>
          <Ionicons name="body-outline" size={14} color={colors.accent} />
          <Text style={styles.badgeText}>{exercise.muscleGroup}</Text>
        </View>
        <View style={[styles.badge, styles.badgeSecondary]}>
          <Ionicons name="barbell-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.badgeTextSecondary}>{exercise.equipment}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Difficulty</Text>
          <Text
            style={[
              styles.infoValue,
              {
                color:
                  DIFFICULTY_COLOR[exercise.difficulty] || colors.textSecondary,
              },
            ]}
          >
            {exercise.difficulty}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Category</Text>
          <Text style={styles.infoValue}>{exercise.category}</Text>
        </View>
      </View>

      {exercise.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{exercise.description}</Text>
        </View>
      ) : null}

      {exercise.instructions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {exercise.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
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
  imageContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  gif: {
    width: '100%',
    height: 250,
  },
  imagePlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  name: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  badgeText: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '600',
  },
  badgeSecondary: {
    backgroundColor: colors.surfaceLight,
  },
  badgeTextSecondary: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  descriptionText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  instructionNumberText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
  },
  instructionText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
});
