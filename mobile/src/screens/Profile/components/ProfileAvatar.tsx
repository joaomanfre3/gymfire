import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface Props {
  avatarUrl?: string | null;
  name: string;
  size?: number;
}

export default function ProfileAvatar({ avatarUrl, name, size = 86 }: Props) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const radius = size / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: radius }} resizeMode="cover" />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.35 }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  initial: { color: '#fff', fontWeight: '600' },
});
