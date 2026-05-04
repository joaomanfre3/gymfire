import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSheetsStore } from '../../store/sheetsStore';
import type { Post } from '../../../../components/Post/types';

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}sem`;
}

interface Props {
  post: Post;
}

export default function PostHeader({ post }: Props) {
  const open = useSheetsStore((s) => s.open);
  const { author, createdAt } = post;
  const initial = (author.name || author.username)[0].toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.username}>{author.username}</Text>
        <Text style={styles.time}>{formatRelativeTime(createdAt)}</Text>
      </View>
      <TouchableOpacity
        onPress={() => open({ type: 'postMenu', post })}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  username: { fontSize: 14, fontWeight: '600', color: '#fff' },
  time: { fontSize: 12, color: '#a8a8a8' },
});
