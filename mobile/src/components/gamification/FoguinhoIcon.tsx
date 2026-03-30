import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface FoguinhoIconProps {
  streak: number;
  size?: number;
}

function getFireTier(streak: number) {
  if (streak >= 90) {
    return {
      emoji: '\u{1F525}\u{1F525}\u{1F525}',
      color: colors.fireLegendary,
      bgColor: 'rgba(255, 215, 0, 0.15)',
      borderColor: colors.fireLegendary,
      glowing: true,
      label: 'Legendary',
    };
  }
  if (streak >= 30) {
    return {
      emoji: '\u{1F525}\u{1F525}',
      color: colors.fireIntense,
      bgColor: 'rgba(220, 38, 38, 0.15)',
      borderColor: colors.fireIntense,
      glowing: false,
      label: 'Intense',
    };
  }
  if (streak >= 14) {
    return {
      emoji: '\u{1F525}',
      color: colors.fireStrong,
      bgColor: 'rgba(239, 68, 68, 0.12)',
      borderColor: colors.fireStrong,
      glowing: false,
      label: 'Strong',
    };
  }
  if (streak >= 7) {
    return {
      emoji: '\u{1F525}',
      color: colors.fireMedium,
      bgColor: 'rgba(251, 146, 60, 0.12)',
      borderColor: colors.fireMedium,
      glowing: false,
      label: 'Medium',
    };
  }
  if (streak >= 1) {
    return {
      emoji: '\u{1F525}',
      color: colors.fireWeak,
      bgColor: 'rgba(156, 163, 175, 0.10)',
      borderColor: colors.fireWeak,
      glowing: false,
      label: 'Weak',
    };
  }
  return {
    emoji: '',
    color: colors.fireWeak,
    bgColor: 'rgba(156, 163, 175, 0.08)',
    borderColor: colors.surfaceBorder,
    glowing: false,
    label: 'None',
  };
}

export default function FoguinhoIcon({ streak, size = 24 }: FoguinhoIconProps) {
  const tier = getFireTier(streak);
  const containerSize = size * 1.8;
  const emojiSize = streak >= 90 ? size * 0.5 : streak >= 30 ? size * 0.6 : size * 0.7;

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
          backgroundColor: tier.bgColor,
          borderWidth: tier.glowing ? 2 : 1.5,
          borderColor: tier.borderColor,
          shadowColor: tier.glowing ? colors.fireLegendary : 'transparent',
          shadowOpacity: tier.glowing ? 0.6 : 0,
          shadowRadius: tier.glowing ? 12 : 0,
          shadowOffset: { width: 0, height: 0 },
          elevation: tier.glowing ? 8 : 0,
        },
      ]}
    >
      {streak === 0 ? (
        <Text style={[styles.noFireText, { fontSize: emojiSize, color: tier.color }]}>
          --
        </Text>
      ) : (
        <Text style={[styles.emoji, { fontSize: emojiSize }]}>
          {tier.emoji}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
  noFireText: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
