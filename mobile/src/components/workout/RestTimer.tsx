import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface RestTimerProps {
  durationSeconds?: number;
  onDismiss: () => void;
}

export default function RestTimer({
  durationSeconds = 90,
  onDismiss,
}: RestTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: durationSeconds * 1000,
      useNativeDriver: false,
    }).start();
  }, [durationSeconds, progressAnim]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onDismiss]);

  const formatTime = useCallback((secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onDismiss}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          <Ionicons name="timer-outline" size={18} color={colors.primary} />
          <Text style={styles.label}>Rest</Text>
          <Text style={styles.time}>{formatTime(remaining)}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.dismiss}>Tap to skip</Text>
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </View>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressBar, { width: progressWidth }]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.primary,
  },
  time: {
    ...typography.h3,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  dismiss: {
    ...typography.caption,
    color: colors.textMuted,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.surfaceBorder,
    width: '100%',
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.primary,
  },
});
