import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace('.', ',')}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')}k`;
  return String(n);
}

export default function ProfileInlineStats({
  postsCount,
  followersCount,
  followingCount,
  onPressFollowers,
  onPressFollowing,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.col}>
        <Text style={styles.num}>{formatCount(postsCount)}</Text>
        <Text style={styles.label}>posts</Text>
      </View>
      <Pressable style={styles.col} onPress={onPressFollowers ?? (() => {})}>
        <Text style={styles.num}>{formatCount(followersCount)}</Text>
        <Text style={styles.label}>seguidores</Text>
      </Pressable>
      <Pressable style={styles.col} onPress={onPressFollowing ?? (() => {})}>
        <Text style={styles.num}>{formatCount(followingCount)}</Text>
        <Text style={styles.label}>seguindo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  col: { flex: 1, alignItems: 'center' },
  num: { fontSize: 17, fontWeight: '600', color: '#fff' },
  label: { fontSize: 13, fontWeight: '400', color: '#fff', marginTop: 2 },
});
