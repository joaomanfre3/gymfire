import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import FoguinhoIcon from './FoguinhoIcon';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  multiplier: number;
  nextMilestone?: number;
}

const MILESTONES = [7, 14, 30, 90];

function getFireBorderColor(streak: number): string {
  if (streak >= 90) return colors.fireLegendary;
  if (streak >= 30) return colors.fireIntense;
  if (streak >= 14) return colors.fireStrong;
  if (streak >= 7) return colors.fireMedium;
  if (streak >= 1) return colors.fireWeak;
  return colors.surfaceBorder;
}

function getNextMilestone(streak: number): number {
  for (const m of MILESTONES) {
    if (streak < m) return m;
  }
  return MILESTONES[MILESTONES.length - 1];
}

function getPreviousMilestone(streak: number): number {
  let prev = 0;
  for (const m of MILESTONES) {
    if (streak < m) return prev;
    prev = m;
  }
  return prev;
}

export default function StreakCard({
  currentStreak,
  longestStreak,
  multiplier,
  nextMilestone,
}: StreakCardProps) {
  const borderColor = getFireBorderColor(currentStreak);
  const target = nextMilestone ?? getNextMilestone(currentStreak);
  const prevMilestone = getPreviousMilestone(currentStreak);
  const range = target - prevMilestone;
  const progress = range > 0 ? Math.min((currentStreak - prevMilestone) / range, 1) : 1;

  return (
    <View style={[styles.card, { borderColor }]}>
      <View style={styles.topRow}>
        {/* Left: Fire icon */}
        <FoguinhoIcon streak={currentStreak} size={40} />

        {/* Center: Streak info */}
        <View style={styles.centerContent}>
          <Text style={styles.streakTitle}>
            {currentStreak} day streak
          </Text>
          <Text style={styles.longestText}>
            Longest: {longestStreak} days
          </Text>
        </View>

        {/* Right: Multiplier badge */}
        <View style={styles.multiplierBadge}>
          <Text style={styles.multiplierText}>x{multiplier}</Text>
        </View>
      </View>

      {/* Bottom: Progress bar to next milestone */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Next milestone</Text>
          <Text style={styles.progressValue}>{target} days</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: borderColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  centerContent: {
    flex: 1,
  },
  streakTitle: {
    ...typography.h3,
    color: colors.text,
  },
  longestText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  multiplierBadge: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  multiplierText: {
    ...typography.h3,
    color: colors.primary,
  },
  progressSection: {
    gap: spacing.sm,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  progressValue: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
