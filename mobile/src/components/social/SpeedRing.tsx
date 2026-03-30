import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface SpeedRingProps {
  hasActiveSpeed: boolean;
  size?: number;
  children: React.ReactNode;
}

export default function SpeedRing({
  hasActiveSpeed,
  size = 48,
  children,
}: SpeedRingProps) {
  const borderWidth = hasActiveSpeed ? 2.5 : 1.5;
  const padding = hasActiveSpeed ? 2 : 0;
  const outerSize = size + (borderWidth + padding) * 2;

  if (!hasActiveSpeed) {
    return (
      <View
        style={[
          styles.ring,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            borderWidth: 1.5,
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.ring,
        styles.activeRing,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          borderWidth,
          padding,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRing: {
    borderColor: colors.primary,
    // Gradient effect simulated with solid orange-to-red color
    // For a real gradient border, use react-native-svg or similar
    borderTopColor: '#FF6B35',
    borderRightColor: '#FF4500',
    borderBottomColor: '#EF4444',
    borderLeftColor: '#FF6B35',
  },
});
