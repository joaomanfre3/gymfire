import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useOpenProfile } from '../../../hooks/useOpenProfile';
import type { Notification } from '../types';

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}sem`;
}

function renderText(n: Notification): string {
  switch (n.type) {
    case 'like_post': return 'curtiu seu post.';
    case 'comment_post': return `comentou: "${(n.comment?.text ?? '').slice(0, 40)}"`;
    case 'reply_comment': return 'respondeu seu comentário.';
    case 'like_comment': return 'curtiu seu comentário.';
    case 'mention_post': return 'mencionou você em um post.';
    case 'mention_comment': return 'mencionou você em um comentário.';
    case 'follow': return 'começou a te seguir.';
    case 'share_post': return 'compartilhou seu post.';
    default: return '';
  }
}

interface Props {
  notification: Notification;
  onPress: () => void;
}

export default function NotificationItem({ notification: n, onPress }: Props) {
  const openProfile = useOpenProfile();
  const initial = (n.actor.name || n.actor.username)[0].toUpperCase();

  return (
    <Pressable
      style={[styles.row, !n.isRead && styles.unread]}
      onPress={onPress}
    >
      <Pressable onPress={() => openProfile(n.actor.id)}>
        {n.actor.avatarUrl ? (
          <Image source={{ uri: n.actor.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>
          <Text style={{ fontWeight: '600' }}>{n.actor.name}</Text>
          {' '}{renderText(n)}
        </Text>
        <Text style={styles.time}>{formatTime(n.createdAt)}</Text>
      </View>
      {n.post?.thumbnailUrl && (
        <Image source={{ uri: n.post.thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  unread: { backgroundColor: 'rgba(255,107,53,0.06)' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  text: { fontSize: 14, color: '#fff', lineHeight: 20 },
  time: { fontSize: 12, color: '#a8a8a8', marginTop: 2 },
  thumb: { width: 44, height: 44, borderRadius: 4 },
});
