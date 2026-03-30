import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography, fontSize } from '../../theme/typography';

interface XPBarProps {
  points: number;
  label?: string;
}

function formatPoints(pts: number): string {
  if (pts >= 1_000_000) return `${(pts / 1_000_000).toFixed(1)}M`;
  if (pts >= 10_000) return `${(pts / 1_000).toFixed(1)}K`;
  if (pts >= 1_000) return `${(pts / 1_000).toFixed(1)}K`;
  return pts.toLocaleString();
}

export default function XPBar({ points, label }: XPBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.points}>{formatPoints(points)}</Text>
      <Text style={styles.label}>{label || 'Total Points'}</Text>
      {/* Decorative thin bar */}
      <View style={styles.barBg}>
        <View style={styles.barFill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  points: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.primary,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  barBg: {
    width: '100%',
    height: 3,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  barFill: {
    width: '60%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});
