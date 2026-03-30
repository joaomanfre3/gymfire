import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors, fontSize } from '../../theme';
import { User } from '../../types';

interface AvatarProps {
  user?: Pick<User, 'avatarUrl' | 'displayName' | 'currentStreak'>;
  url?: string;
  name?: string;
  size?: number;
  showStreakRing?: boolean;
}

function getStreakColor(streak: number): string {
  if (streak >= 90) return colors.fireLegendary;
  if (streak >= 30) return colors.fireIntense;
  if (streak >= 14) return colors.fireStrong;
  if (streak >= 7) return colors.fireMedium;
  if (streak >= 1) return colors.fireWeak;
  return colors.surfaceBorder;
}

export default function Avatar({
  user,
  url,
  name,
  size = 40,
  showStreakRing = false,
}: AvatarProps) {
  const avatarUrl = user?.avatarUrl || url;
  const displayName = user?.displayName || name || '?';
  const streak = user?.currentStreak || 0;
  const initial = displayName.charAt(0).toUpperCase();

  const ringWidth = Math.max(2, size * 0.06);
  const ringPadding = showStreakRing ? ringWidth + 2 : 0;
  const totalSize = size + ringPadding * 2;

  const ringColor = getStreakColor(streak);

  const containerStyle: ViewStyle = {
    width: totalSize,
    height: totalSize,
    borderRadius: totalSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: showStreakRing ? ringWidth : 0,
    borderColor: showStreakRing ? ringColor : 'transparent',
  };

  const avatarStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const textSize = size * 0.4;

  return (
    <View style={containerStyle}>
      <View style={avatarStyle}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Text
            style={[
              styles.initial,
              { fontSize: textSize },
            ]}
          >
            {initial}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  initial: {
    color: colors.text,
    fontWeight: '700',
  },
});
